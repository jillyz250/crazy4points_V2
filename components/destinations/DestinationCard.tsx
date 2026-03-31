import Link from "next/link";

export interface DestinationCardProps {
  slug: string;
  name: string;
  region: string;
  country: string;
  pointsFrom: string;
  program: string;
  tag?: string;
  description: string;
}

export default function DestinationCard({
  slug,
  name,
  region,
  country,
  pointsFrom,
  program,
  tag,
  description,
}: DestinationCardProps) {
  return (
    <Link href={`/destinations/${slug}`} className="group block">
      <article className="rg-card h-full flex flex-col">

        {/* Image placeholder */}
        <div className="rg-img-placeholder h-52 relative">
          <span className="absolute inset-0 flex items-center justify-center z-10 opacity-20">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.75" aria-hidden="true">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </span>
          {tag && (
            <div className="absolute top-3 left-3 z-20">
              <span className="rg-badge">{tag}</span>
            </div>
          )}
          {/* Country label bottom */}
          <div className="absolute bottom-3 left-4 z-20">
            <p className="font-ui text-xs font-600 uppercase tracking-widest text-white opacity-80">
              {country}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-slate)] mb-1">
            {region}
          </p>
          <h3 className="font-display text-xl font-bold text-[var(--color-navy)] mb-2 group-hover:text-[var(--color-gold)] transition-colors">
            {name}
          </h3>
          <p className="font-body text-sm text-[var(--color-slate)] leading-relaxed mb-4 flex-1">
            {description}
          </p>

          {/* Points row */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-ivory-dark)]">
            <div>
              <p className="font-ui text-xs text-[var(--color-slate)]">Awards from</p>
              <p className="font-display text-xl font-bold text-[var(--color-gold)]">
                {pointsFrom}
                <span className="font-body text-xs text-[var(--color-slate)] ml-1">pts</span>
              </p>
            </div>
            <span className="font-ui text-xs bg-[var(--color-ivory-dark)] text-[var(--color-navy)] px-3 py-1.5 rounded-lg">
              {program}
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}
