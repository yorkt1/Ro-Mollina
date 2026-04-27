import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface LifestyleCardProps {
  image: string;
  title: string;
  description: string;
  to: string;
}

export default function LifestyleCard({ image, title, description, to }: LifestyleCardProps) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-sm p-6"
    >
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--navy-deep)/0.85)] via-[hsl(var(--navy-deep)/0.35)] to-transparent" />
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-serif text-primary-foreground">{title}</h3>
        <p className="text-sm text-primary-foreground/66 line-clamp-2">{description}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent transition-transform group-hover:translate-x-1">
          Saiba mais <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
