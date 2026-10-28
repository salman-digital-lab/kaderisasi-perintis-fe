import type { ReactNode } from "react";
import classes from "./brand.module.css";

/** Round navy "beasiswa perintis" mark with a white ring. */
export function PerintisMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className={classes.mark}
      style={{ width: size, height: size, fontSize: size / 5 }}
      role="img"
      aria-label="Beasiswa Perintis"
    >
      <span className={classes.markSmall}>beasiswa</span>
      <span className={classes.markBig}>perintis</span>
    </span>
  );
}

/** Montserrat 900 italic uppercase, the program's display voice. */
export function DisplayTitle({
  children,
  size = 26,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <span className={classes.display} style={{ fontSize: size }}>
      {children}
    </span>
  );
}

/** “ Program name ” with gold quote marks. */
export function Quoted({ children }: { children: ReactNode }) {
  return (
    <span className={classes.quoted}>
      <span className={classes.quote}>“</span> {children}{" "}
      <span className={classes.quote}>”</span>
    </span>
  );
}

/** Uppercase caption label (Plus Jakarta 600, tracked). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={classes.eyebrow}>{children}</span>;
}

/** Signature info pill: white capsule, gold outline, orange icon circle. */
export function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={classes.pill}>
      <span className={classes.pillIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={classes.pillText}>
        <span className={classes.pillLabel}>{label}</span>
        <span className={classes.pillValue}>{value}</span>
      </span>
    </div>
  );
}

/** Small gold rule used under stats and program titles. */
export function GoldRule({ width = 120 }: { width?: number }) {
  return <span className={classes.rule} style={{ width }} />;
}
