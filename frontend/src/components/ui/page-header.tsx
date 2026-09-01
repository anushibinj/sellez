import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[28px]">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
