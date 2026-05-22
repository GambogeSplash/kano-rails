import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xs uppercase tracking-wider text-muted font-mono",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div>
      <CardLabel>{label}</CardLabel>
      <div className="mt-1.5 text-2xl font-medium tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
