import { Button, Menu } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { ROLE_LABEL } from "@/content/labels";
import { ROLE_HOME } from "@/lib/roles";

/** Header role picker: only roles the person holds, plus the staff area when signed in. */
export function RoleSwitcher() {
  const { me, activeRole, setActiveRole, hasStaff } = useAuth();
  const navigate = useNavigate();
  const roles = me?.roles ?? [];
  if (roles.length < 2 && !hasStaff) return null;
  return (
    <Menu position="bottom-end" width={220}>
      <Menu.Target>
        <Button
          variant="white"
          size="compact-md"
          rightSection={<IconChevronDown size={16} />}
          aria-label="Ganti peran"
        >
          {activeRole ? ROLE_LABEL[activeRole] : "Peran"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Masuk sebagai</Menu.Label>
        {roles.map((role) => (
          <Menu.Item
            key={role}
            rightSection={role === activeRole ? <IconCheck size={16} /> : null}
            onClick={() => {
              setActiveRole(role);
              navigate(ROLE_HOME[role]);
            }}
          >
            {ROLE_LABEL[role]}
          </Menu.Item>
        ))}
        {hasStaff && (
          <>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconShieldCheck size={16} />}
              onClick={() => navigate("/kelola")}
            >
              Area pengelola
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
