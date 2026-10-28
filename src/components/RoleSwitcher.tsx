import { Button, Menu, Text, UnstyledButton } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconLogout,
  IconSelector,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { ROLE_LABEL } from "@/content/labels";
import { ROLE_HOME } from "@/lib/roles";
import classes from "./layout/AppLayout.module.css";

/**
 * Account menu: the roles the person holds, the staff area, and switching
 * accounts. `bar` sits in the phone header (hidden on desktop); `sidebar`
 * sits at the bottom of the desktop sidebar.
 */
export function RoleSwitcher({
  placement = "bar",
}: {
  placement?: "bar" | "sidebar";
}) {
  const { me, activeRole, setActiveRole, hasStaff, signOutParticipant } =
    useAuth();
  const navigate = useNavigate();
  const roles = me?.roles ?? [];
  const roleLabel = activeRole ? ROLE_LABEL[activeRole] : "Peran";
  const sidebar = placement === "sidebar";

  return (
    <Menu
      position={sidebar ? "top-start" : "bottom-end"}
      width={sidebar ? 236 : 220}
    >
      <Menu.Target>
        {sidebar ? (
          <UnstyledButton className={classes.sideAccount}>
            <span className={classes.sideLabel}>
              <Text size="sm" fw={700} truncate>
                {me?.profile.name}
              </Text>
              <Text size="xs" opacity={0.8}>
                {roleLabel}
              </Text>
            </span>
            <IconSelector size={18} aria-hidden="true" />
          </UnstyledButton>
        ) : (
          <Button
            variant="white"
            size="compact-md"
            hiddenFrom="md"
            rightSection={<IconChevronDown size={16} />}
            aria-label="Ganti peran"
          >
            {roleLabel}
          </Button>
        )}
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
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={() => {
            signOutParticipant();
            navigate("/masuk");
          }}
        >
          Ganti akun
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
