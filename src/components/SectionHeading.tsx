import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  isDark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
  isDark?: boolean;
}) {
  return (
    <div className={`space-y-4 ${align === "center" ? "text-center" : "text-left"}`}>
      <div className={`gold-divider ${align === "center" ? "mx-auto" : ""}`} />
      <p className={`text-sm uppercase tracking-[0.28em] font-semibold ${isDark ? "text-accent" : "text-navy"}`}>{eyebrow}</p>
      <div className={`flex flex-col gap-4 ${action ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}>
        <div className={`space-y-3 ${align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
          <h2 className={`text-3xl leading-tight md:text-4xl ${isDark ? "text-primary-foreground" : "text-foreground"}`}>{title}</h2>
          {description ? <p className={`text-base leading-relaxed ${isDark ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
