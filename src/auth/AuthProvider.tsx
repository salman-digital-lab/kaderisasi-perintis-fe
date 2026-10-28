import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getToken, setToken } from "@/api/client";
import { participantApi, staffApi } from "@/api/endpoints";
import type { Me, Role, StaffUser } from "@/api/types";

const ROLE_KEY = "perintis.activeRole";

interface AuthValue {
  hasParticipant: boolean;
  hasStaff: boolean;
  me: Me | undefined;
  meLoading: boolean;
  staff: StaffUser | undefined;
  staffLoading: boolean;
  activeRole: Role | null;
  setActiveRole: (role: Role) => void;
  signInParticipant: (token: string) => void;
  signInStaff: (token: string) => void;
  signOutParticipant: () => void;
  signOutStaff: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readRole(): Role | null {
  try {
    return localStorage.getItem(ROLE_KEY) as Role | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [webToken, setWebToken] = useState(() => getToken("web"));
  const [adminToken, setAdminToken] = useState(() => getToken("admin"));
  const [storedRole, setStoredRole] = useState<Role | null>(readRole);

  const meQuery = useQuery({
    queryKey: ["me", webToken],
    queryFn: participantApi.me,
    enabled: !!webToken,
    retry: false,
  });
  const staffQuery = useQuery({
    queryKey: ["staff-me", adminToken],
    queryFn: staffApi.me,
    enabled: !!adminToken,
    retry: false,
  });

  // A 401 clears the stored token inside the client; mirror it here.
  const hasParticipant = !!webToken && !meQuery.isError;
  const hasStaff = !!adminToken && !staffQuery.isError;

  const roles = meQuery.data?.roles ?? [];
  const activeRole =
    storedRole && roles.includes(storedRole) ? storedRole : (roles[0] ?? null);

  const setActiveRole = useCallback((role: Role) => {
    setStoredRole(role);
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // Falls back to the first role on reload.
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      hasParticipant,
      hasStaff,
      me: meQuery.data,
      meLoading: !!webToken && meQuery.isLoading,
      staff: staffQuery.data,
      staffLoading: !!adminToken && staffQuery.isLoading,
      activeRole,
      setActiveRole,
      signInParticipant: (token) => {
        setToken("web", token);
        setWebToken(token);
      },
      signInStaff: (token) => {
        setToken("admin", token);
        setAdminToken(token);
      },
      signOutParticipant: () => {
        setToken("web", null);
        setWebToken(null);
        queryClient.removeQueries({
          predicate: (q) => !String(q.queryKey[0]).startsWith("staff"),
        });
      },
      signOutStaff: () => {
        setToken("admin", null);
        setAdminToken(null);
        queryClient.removeQueries({
          predicate: (q) => String(q.queryKey[0]).startsWith("staff"),
        });
      },
    }),
    [
      hasParticipant,
      hasStaff,
      meQuery.data,
      meQuery.isLoading,
      staffQuery.data,
      staffQuery.isLoading,
      webToken,
      adminToken,
      activeRole,
      setActiveRole,
      queryClient,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Use inside participant routes, where `me` is guaranteed by the guard. */
export function useMe(): Me {
  const { me } = useAuth();
  if (!me) throw new Error("useMe used outside a participant route");
  return me;
}
