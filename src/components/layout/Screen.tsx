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
import { PerintisMark } from "@/components/brand";
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
  /** Blue header band under the bar; the first card overlaps it. */
  hero?: ReactNode;
  /** Sticky action bar at the bottom (hides the tab bar). */
  footer?: ReactNode;
  children: ReactNode;
}

/** One app screen: sky-blue top bar, optional hero band, content, optional sticky footer. */
export function Screen({
  title,
  subtitle,
  back,
  actions,
  hero,
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
    ? "5.5rem"
    : hasTabs && !hideTabs
      ? "var(--tab-bar-height)"
      : "0px";

  return (
    <>
      <header className={classes.appBar} data-hero={hero ? "" : undefined}>
        {back ? (
          <ActionIcon
            variant="transparent"
            className={classes.barIcon}
            aria-label="Kembali"
            onClick={() =>
              window.history.state?.idx > 0 ? navigate(-1) : navigate(back)
            }
          >
            <IconArrowLeft size={22} />
          </ActionIcon>
        ) : (
          <PerintisMark size={36} />
        )}
        <div className={classes.appBarTitle}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </header>
      {hero && <div className={classes.hero}>{hero}</div>}
      <main
        className={classes.content}
        data-overlap={hero ? "" : undefined}
        style={{ "--bottom-space": bottomSpace } as CSSProperties}
      >
        {children}
        {!footer && (
          <p className={classes.strip}>
            Merintis masa depan bersama <b>Beasiswa Perintis</b>
          </p>
        )}
      </main>
      {footer && <div className={classes.footer}>{footer}</div>}
    </>
  );
}
