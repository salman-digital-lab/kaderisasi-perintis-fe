import { Badge, Indicator, Text } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { PerintisMark } from "@/components/brand";
import classes from "./AppLayout.module.css";
import { TabsContext } from "./Screen";

export interface TabDef {
  to: string;
  label: string;
  icon: Icon;
  /** Number shows a count; `true` shows a dot. */
  badge?: number | boolean;
  end?: boolean;
}

function TabBadge({ badge }: { badge: TabDef["badge"] }) {
  if (typeof badge !== "number" || badge <= 0) return null;
  return (
    <Badge
      className={classes.tabBadge}
      color="red"
      size="xs"
      circle={badge < 10}
      aria-label={`${badge} perlu perhatian`}
    >
      {badge}
    </Badge>
  );
}

/**
 * App frame. Phones get a bottom tab bar that screens can hide while pushed;
 * desktop gets a sidebar with the same items that always stays.
 */
export function TabLayout({
  tabs,
  subtitle,
  sidebarFooter,
}: {
  tabs: TabDef[];
  /** Line under the program name in the sidebar. */
  subtitle: string;
  /** Bottom of the sidebar (account or role menu). */
  sidebarFooter?: ReactNode;
}) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((h: boolean) => setHiddenState(h), []);
  const ctx = useMemo(() => ({ setHidden, hasTabs: true }), [setHidden]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={classes.frame} data-shell="">
        <aside className={classes.sidebar}>
          <div className={classes.sidebarBrand}>
            <PerintisMark size={44} />
            <div>
              <Text fw={800} ff="Montserrat, sans-serif" lh={1.2}>
                Beasiswa Perintis
              </Text>
              <Text size="xs" opacity={0.85}>
                {subtitle}
              </Text>
            </div>
          </div>
          <nav className={classes.sideNav} aria-label="Menu utama">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={classes.sideLink}
              >
                <tab.icon size={20} stroke={1.8} aria-hidden="true" />
                <span className={classes.sideLabel}>{tab.label}</span>
                {tab.badge === true && (
                  <span
                    className={classes.sideDot}
                    aria-label="Perlu perhatian"
                  />
                )}
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <Badge
                    color="red"
                    size="sm"
                    circle={tab.badge < 10}
                    aria-label={`${tab.badge} perlu perhatian`}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
          {sidebarFooter && (
            <div className={classes.sidebarFooter}>{sidebarFooter}</div>
          )}
        </aside>
        <div className={classes.column}>
          <Outlet />
        </div>
        {!hidden && (
          <nav className={classes.tabBar} aria-label="Menu utama">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={classes.tab}
              >
                <span className={classes.tabIcon}>
                  {tab.badge === true ? (
                    <Indicator color="red" size={9} offset={2}>
                      <tab.icon size={22} stroke={1.8} />
                    </Indicator>
                  ) : (
                    <tab.icon size={22} stroke={1.8} />
                  )}
                </span>
                <TabBadge badge={tab.badge} />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </TabsContext.Provider>
  );
}

/** Frame without tabs (login and other standalone screens); a centred card on desktop. */
export function PlainLayout() {
  return (
    <div className={classes.frame} data-plain="">
      <Outlet />
    </div>
  );
}
