import { Instagram, Facebook, Youtube } from "lucide-react";

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/romolina.imoveis/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/roMolina", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/@roMolina", label: "YouTube" },
];

interface SocialIconsProps {
  className?: string;
  variant?: "dark" | "light";
}

export default function SocialIcons({ className = "", variant = "dark" }: SocialIconsProps) {
  const isLight = variant === "light";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={s.label}
          className={`flex h-9 w-9 items-center justify-center rounded-sm border transition-all duration-200 hover:scale-105 ${
            isLight
              ? "border-slate-300 bg-white/60 text-slate-500 shadow-sm hover:border-[#d4a84b]/60 hover:text-[#d4a84b] hover:shadow-md"
              : "border-white/20 text-white/60 hover:border-accent hover:text-accent"
          }`}
        >
          <s.icon size={16} />
        </a>
      ))}
    </div>
  );
}
