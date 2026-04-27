import type { LucideIcon } from "lucide-react";

export default function CrmStatCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
          <p className="font-serif text-3xl text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-sm bg-secondary p-3 text-accent">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
