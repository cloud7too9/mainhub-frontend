import type { ReactNode } from "react";

/** Kleine, gemeinsame Bausteine für Tool-Ansichten. */

export function Row({ left, right, muted }: { left: ReactNode; right?: ReactNode; muted?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
      <span className={["min-w-0 truncate", muted ? "text-text-muted" : ""].join(" ")}>{left}</span>
      {right !== undefined && <span className="shrink-0 text-xs text-text-muted">{right}</span>}
    </li>
  );
}

export function StatBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface px-2 py-1.5">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function Progress({ value, label = "Fortschritt" }: { value: number; label?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-wide text-text-muted">{children}</div>;
}
