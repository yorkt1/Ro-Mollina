import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cloudinaryUrl } from "@/lib/cloudinary";

interface LifestyleCardProps {
  image: string;
  title: string;
  description: string;
  to: string;
}

export default function LifestyleCard({ image, title, description, to }: LifestyleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      to={to}
      className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-sm p-6"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-secondary transition-opacity duration-500 ${
          imageLoaded ? "pointer-events-none opacity-0" : "animate-pulse opacity-100"
        }`}
      />
      <img
        src={cloudinaryUrl(image, { width: 800, crop: "limit" })}
        alt={title}
        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-105 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--navy-deep)/0.85)] via-[hsl(var(--navy-deep)/0.35)] to-transparent" />
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-serif text-white">{title}</h3>
        <p className="text-sm text-white/90 line-clamp-3">{description}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent transition-transform group-hover:translate-x-1">
          Saiba mais <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
