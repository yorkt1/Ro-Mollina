import { Link } from "react-router-dom";
import { Bath, BedDouble, Car, MapPin, Maximize, Tag } from "lucide-react";
import { Property, formatPropertyPrice, propertyTypeLabel, purposeLabel } from "@/data/properties";
import { cloudinaryUrl } from "@/lib/cloudinary";

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to={`/imovel/${property.id}`}
      className="group block overflow-hidden rounded-sm bg-card card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.images[0] ? cloudinaryUrl(property.images[0], { width: 640, height: 480 }) : property.images[0]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-sm bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-deep">
            {purposeLabel(property.purpose)}
          </span>
          <span className="rounded-sm bg-primary/78 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {propertyTypeLabel(property.type)}
          </span>
        </div>

        {property.tag && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-md">
            <Tag size={14} /> {property.tag}
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="space-y-1.5">
          <p className="text-base font-serif font-semibold leading-snug text-foreground line-clamp-2">
            {property.title}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{property.neighborhood} - {property.location}</span>
          </div>
        </div>

        {property.type !== "terreno" && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BedDouble size={14} />
              {property.bedrooms} quarto{property.bedrooms > 1 ? "s" : ""}
            </span>
            {property.suites > 0 && (
              <span className="inline-flex items-center gap-1">
                <BedDouble size={14} className="text-accent" />
                {property.suites} suíte{property.suites > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms}
            </span>
            {property.area > 0 && (
              <span className="inline-flex items-center gap-1">
                <Maximize size={14} /> {property.area} m²
              </span>
            )}
            {property.parkingSpots > 0 && (
              <span className="inline-flex items-center gap-1">
                <Car size={14} /> {property.parkingSpots}
              </span>
            )}
          </div>
        )}

        {property.type === "terreno" && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Maximize size={14} /> {property.area} m²</span>
          </div>
        )}

        <div className="flex items-end justify-between gap-4 pt-1">
          <p className="text-lg font-serif font-semibold text-navy">{formatPropertyPrice(property)}</p>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-accent">
            Ver detalhes
          </span>
        </div>
      </div>
    </Link>
  );
}
