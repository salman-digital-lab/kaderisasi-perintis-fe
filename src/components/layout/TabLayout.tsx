import { Badge, Indicator } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router";
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

/** App frame with a bottom tab bar; screens can hide it while pushed. */
export function TabLayout({ tabs }: { tabs: TabDef[] }) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((h: boolean) => setHiddenState(h), []);
  const ctx = useMemo(() => ({ setHidden, hasTabs: true }), [setHidden]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={classes.frame}>
        <Outlet />
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
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <Badge
                    className={classes.tabBadge}
                    color="red"
                    size="xs"
                    circle={tab.badge < 10}
                    aria-label={`${tab.badge} perlu perhatian`}
                  >
                    {tab.badge}
                  </Badge>
                )}
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </TabsContext.Provider>
  );
}

/** Frame without tabs (login and other standalone screens). */
export function PlainLayout() {
  return (
    <div className={classes.frame}>
      <Outlet />
    </div>
  );
}
