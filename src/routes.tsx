import {
  IconAlertTriangle,
  IconChartBar,
  IconClipboardText,
  IconHome,
  IconLayoutDashboard,
  IconNotebook,
  IconSettings,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { staffApi } from "@/api/endpoints";
import type { Role } from "@/api/types";
import { useAuth, useMe } from "@/auth/AuthProvider";
import {
  PlainLayout,
  TabLayout,
  type TabDef,
} from "@/components/layout/TabLayout";
import layoutClasses from "@/components/layout/AppLayout.module.css";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { PageLoader } from "@/components/ui";
import { ROLE_HOME } from "@/lib/roles";
import { AccountPage, StaffAccountPage } from "@/features/account/AccountPage";
import {
  GoogleCallbackPage,
  LoginPage,
  StaffLoginPage,
} from "@/features/auth/LoginPages";
import { CoordinatorPanelPage } from "@/features/coordinator/CoordinatorPanelPage";
import { ReviewReportPage } from "@/features/coordinator/ReviewReportPage";
import { JournalFormPage } from "@/features/mentee/JournalFormPage";
import { JournalListPage } from "@/features/mentee/JournalListPage";
import { JournalViewPage } from "@/features/mentee/JournalViewPage";
import { MenteeHomePage } from "@/features/mentee/MenteeHomePage";
import { GroupDashboardPage } from "@/features/mentor/GroupDashboardPage";
import { ReportListPage } from "@/features/mentor/ReportListPage";
import { ReportPage } from "@/features/mentor/ReportPage";
import { RespondPage } from "@/features/mentor/RespondPage";
import {
  MenteeProfilePage,
  MyProfilePage,
} from "@/features/shared/ProfilePages";
import { NotEnrolledPage } from "@/features/auth/NotEnrolledPage";
import { NotFoundPage } from "@/features/shared/NotFoundPage";
import { AddParticipantPage } from "@/features/staff/AddParticipantPage";
import { FollowupsPage } from "@/features/staff/FollowupsPage";
import { ImportPage } from "@/features/staff/ImportPage";
import { ParticipantDetailPage } from "@/features/staff/ParticipantDetailPage";
import { ParticipantsPage } from "@/features/staff/ParticipantsPage";
import { StaffDashboardPage } from "@/features/staff/StaffDashboardPage";
import { StaffJournalPage } from "@/features/staff/StaffJournalPage";

function FullScreenLoader() {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <PageLoader />
    </div>
  );
}

function RequireParticipant() {
  const { hasParticipant, participantBlocked, me, meLoading } = useAuth();
  if (participantBlocked) return <NotEnrolledPage kind="participant" />;
  if (!hasParticipant) return <Navigate to="/masuk" replace />;
  if (meLoading || !me) return <FullScreenLoader />;
  return <Outlet />;
}

function RequireStaff() {
  const { hasStaff, staff, staffLoading } = useAuth();
  if (!hasStaff) return <Navigate to="/staf/masuk" replace />;
  if (staffLoading || !staff) return <FullScreenLoader />;
  if (!staff.permissions.some((p) => p.startsWith("perintis.")))
    return (
      <NotEnrolledPage
        kind="staff"
        message="Akun admin ini belum punya peran Pengelola Perintis."
      />
    );
  return <Outlet />;
}

/** Deep links switch the active role when the person holds it (PRD §2.1). */
function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: ReactNode;
}) {
  const me = useMe();
  const { activeRole, setActiveRole } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];
  const held = allowed.filter((r) => me.roles.includes(r));
  const switchTo =
    activeRole && held.includes(activeRole) ? null : (held[0] ?? null);
  useEffect(() => {
    if (switchTo) setActiveRole(switchTo);
  }, [switchTo, setActiveRole]);
  if (!held.length) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleHome() {
  const { activeRole } = useAuth();
  if (!activeRole)
    return (
      <NotEnrolledPage
        kind="participant"
        message="Kepesertaanmu di program pembinaan sedang nonaktif."
      />
    );
  return <Navigate to={ROLE_HOME[activeRole]} replace />;
}

function ParticipantShell() {
  const me = useMe();
  const { activeRole } = useAuth();
  const m = me.markers;
  const tabsByRole: Record<Role, TabDef[]> = {
    mentee: [
      { to: "/beranda", label: "Beranda", icon: IconHome },
      {
        to: "/lapbul",
        label: "Lapbul",
        icon: IconNotebook,
        badge: m.lapbulPending || m.responseUnread,
      },
      { to: "/profil", label: "Profil", icon: IconUser },
      { to: "/akun", label: "Akun", icon: IconSettings },
    ],
    mentor: [
      {
        to: "/kelompok",
        label: "Kelompok",
        icon: IconUsersGroup,
        badge: m.journalsToRespond + m.openFlags,
      },
      {
        to: "/laporan",
        label: "Laporan",
        icon: IconClipboardText,
        badge: m.reportPending || m.reportReviewUnread,
      },
      { to: "/profil", label: "Profil", icon: IconUser },
      { to: "/akun", label: "Akun", icon: IconSettings },
    ],
    coordinator: [
      {
        to: "/koordinator",
        label: "Panel",
        icon: IconLayoutDashboard,
        badge: m.reportsToVerify,
      },
      { to: "/profil", label: "Profil", icon: IconUser },
      { to: "/akun", label: "Akun", icon: IconSettings },
    ],
  };
  return (
    <TabLayout
      tabs={activeRole ? tabsByRole[activeRole] : tabsByRole.mentee.slice(2)}
      subtitle="Pembinaan Perintis"
      sidebarFooter={<RoleSwitcher placement="sidebar" />}
    />
  );
}

function StaffShell() {
  const { staff } = useAuth();
  const followups = useQuery({
    queryKey: ["staff", "followups", { status: "open" }],
    queryFn: () => staffApi.followups({ status: "open" }),
  });
  const tabs: TabDef[] = [
    { to: "/kelola", label: "Dasbor", icon: IconChartBar, end: true },
    {
      to: "/kelola/tindak-lanjut",
      label: "Tindak lanjut",
      icon: IconAlertTriangle,
      badge: followups.data?.length ?? 0,
    },
    { to: "/kelola/peserta", label: "Peserta", icon: IconUsers },
    { to: "/kelola/akun", label: "Akun", icon: IconSettings },
  ];
  return (
    <TabLayout
      tabs={tabs}
      subtitle="Pengelola Perintis"
      sidebarFooter={
        <div className={layoutClasses.sideAccount}>
          <span className={layoutClasses.sideLabel}>
            <Text size="sm" fw={700} truncate>
              {staff?.name}
            </Text>
            <Text size="xs" opacity={0.8} truncate>
              {staff?.email}
            </Text>
          </span>
        </div>
      }
    />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PlainLayout />}>
        <Route path="/masuk" element={<LoginPage />} />
        <Route path="/staf/masuk" element={<StaffLoginPage />} />
        <Route path="/masuk/google" element={<GoogleCallbackPage />} />
      </Route>

      <Route element={<RequireParticipant />}>
        <Route element={<ParticipantShell />}>
          <Route index element={<RoleHome />} />
          <Route
            path="beranda"
            element={
              <RequireRole role="mentee">
                <MenteeHomePage />
              </RequireRole>
            }
          />
          <Route
            path="lapbul"
            element={
              <RequireRole role="mentee">
                <JournalListPage />
              </RequireRole>
            }
          />
          <Route
            path="lapbul/:month"
            element={
              <RequireRole role="mentee">
                <JournalViewPage />
              </RequireRole>
            }
          />
          <Route
            path="lapbul/:month/isi"
            element={
              <RequireRole role="mentee">
                <JournalFormPage />
              </RequireRole>
            }
          />
          <Route path="profil" element={<MyProfilePage />} />
          <Route
            path="kelompok"
            element={
              <RequireRole role="mentor">
                <GroupDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="kelompok/lapbul/:id"
            element={
              <RequireRole role="mentor">
                <RespondPage />
              </RequireRole>
            }
          />
          <Route
            path="kelompok/mentee/:userId"
            element={
              <RequireRole role="mentor">
                <MenteeProfilePage back="/kelompok" />
              </RequireRole>
            }
          />
          <Route
            path="laporan"
            element={
              <RequireRole role="mentor">
                <ReportListPage />
              </RequireRole>
            }
          />
          <Route
            path="laporan/:month"
            element={
              <RequireRole role="mentor">
                <ReportPage />
              </RequireRole>
            }
          />
          <Route
            path="koordinator"
            element={
              <RequireRole role="coordinator">
                <CoordinatorPanelPage />
              </RequireRole>
            }
          />
          <Route
            path="koordinator/laporan/:mentorId/:month"
            element={
              <RequireRole role="coordinator">
                <ReviewReportPage />
              </RequireRole>
            }
          />
          <Route
            path="koordinator/mentee/:userId"
            element={
              <RequireRole role="coordinator">
                <MenteeProfilePage back="/koordinator" />
              </RequireRole>
            }
          />
          <Route path="akun" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="/kelola" element={<RequireStaff />}>
        <Route element={<StaffShell />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="tindak-lanjut" element={<FollowupsPage />} />
          <Route path="peserta" element={<ParticipantsPage />} />
          <Route path="peserta/tambah" element={<AddParticipantPage />} />
          <Route path="peserta/:userId" element={<ParticipantDetailPage />} />
          <Route path="lapbul/:id" element={<StaffJournalPage />} />
          <Route path="impor" element={<ImportPage />} />
          <Route path="akun" element={<StaffAccountPage />} />
        </Route>
      </Route>

      <Route element={<PlainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
