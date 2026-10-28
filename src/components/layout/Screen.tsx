import { ActionIcon } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import classes from "./AppLayout.module.css";

export const TabsContext = createContext<{
  setHidden: (hidden: boolean) => void;
  hasTabs: boolean;
}>({ setHidden: () => {}, hasTabs: false });

interface ScreenProps {
  title: string;
  subtitle?: string;
  /** Path to go back to; shows a back arrow and hides the tab bar. */
  back?: string;
  actions?: ReactNode;
  /** Sticky action bar at the bottom (hides the tab bar). */
  footer?: ReactNode;
  children: ReactNode;
}

/** One app screen: sticky top bar, content, optional sticky footer. */
export function Screen({
  title,
  subtitle,
  back,
  actions,
  footer,
  children,
}: ScreenProps) {
  const navigate = useNavigate();
  const { setHidden, hasTabs } = useContext(TabsContext);
  const hideTabs = !!back || !!footer;

  useLayoutEffect(() => {
    setHidden(hideTabs);
  }, [hideTabs, setHidden]);

  useLayoutEffect(() => {
    document.title = `${title} · Perintis`;
  }, [title]);

  const bottomSpace = footer
    ? "5rem"
    : hasTabs && !hideTabs
      ? "var(--tab-bar-height)"
      : "0px";

  return (
    <>
      <header className={classes.appBar}>
        {back && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Kembali"
            onClick={() =>
              window.history.state?.idx > 0 ? navigate(-1) : navigate(back)
            }
          >
            <IconArrowLeft size={22} />
          </ActionIcon>
        )}
        <div className={classes.appBarTitle}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </header>
      <main
        className={classes.content}
        style={{ "--bottom-space": bottomSpace } as CSSProperties}
      >
        {children}
      </main>
      {footer && <div className={classes.footer}>{footer}</div>}
    </>
  );
}
