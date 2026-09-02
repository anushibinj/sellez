import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--surface-2)] text-[var(--muted-foreground)]",
        accent: "bg-[var(--accent-tint)] text-[var(--accent)]",
        success: "bg-[var(--success-tint)] text-[var(--success)]",
        warning: "bg-[var(--warning-tint)] text-[var(--warning)]",
        danger: "bg-[var(--danger-tint)] text-[var(--danger)]",
        info: "bg-[var(--info-tint)] text-[var(--info)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const LISTING_STATUS_TONE: Record<string, VariantProps<typeof badgeVariants>["tone"]> = {
  ACTIVE: "success",
  UNDER_REVIEW: "warning",
  DRAFT: "neutral",
  SOLD: "info",
  REJECTED: "danger",
  REVOKED: "danger",
  TAKEN_DOWN: "danger",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = LISTING_STATUS_TONE[status] ?? "neutral";
  return (
    <Badge tone={tone} className={className}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}

const ROLE_TONE: Record<string, VariantProps<typeof badgeVariants>["tone"]> = {
  MEMBER: "neutral",
  COMMUNITY_ADMIN: "accent",
  SUPER_ADMIN: "warning",
};

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const tone = ROLE_TONE[role] ?? "neutral";
  return (
    <Badge tone={tone} className={className}>
      {role.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
