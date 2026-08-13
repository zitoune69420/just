import Image from "next/image";
import Link from "next/link";
import { UserOff } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import type { Person } from "@/lib/types";

interface PersonCardProps {
  person: Person;
  sizes?: string;
}

export function PersonCard({ person, sizes = "190px" }: PersonCardProps) {
  return (
    <Link
      href={`/person/${person.id}`}
      className="press group block rounded-xl sm:rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-xl sm:rounded-2xl bg-background-muted ring-1 ring-border/50">
        {person.profile ? (
          <Image
            src={tmdbImage(person.profile, "w342")}
            alt={person.name}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="grid size-full place-items-center text-foreground-subtle">
            <UserOff size={40} />
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="truncate text-sm font-medium text-foreground-strong">
          {person.name}
        </h3>
        {person.department && (
          <p className="mt-0.5 truncate text-xs text-foreground-muted">
            {person.department}
          </p>
        )}
      </div>
    </Link>
  );
}
