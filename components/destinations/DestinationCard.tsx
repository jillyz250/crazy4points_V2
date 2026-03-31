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

export default function DestinationCard(_props: DestinationCardProps) {
  return (
    <div className="rg-placeholder h-48">
      Destination Card Placeholder
    </div>
  );
}
