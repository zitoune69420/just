import { ROLE_LABELS, type Role } from "@/lib/roles";

const PLAIN_STYLES: Record<Role, string> = {
  user: "border-border/70 text-foreground-muted",
  gold: "border-warning/45 text-warning",
  platinum: "",
  admin: "border-border-strong text-foreground-strong",
};

const BASE =
  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-tight";

const SPARKLES = [
  { className: "badge-twinkle -top-1.5 -right-1 size-2.5", delay: "0ms" },
  { className: "badge-twinkle -bottom-1 -left-1 size-1.5", delay: "260ms" },
  { className: "badge-twinkle -top-0.5 left-1.5 size-1", delay: "520ms" },
];

function Sparkle({
  className,
  delay,
}: {
  className: string;
  delay: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ animationDelay: delay }}
    >
      <path
        fill="currentColor"
        d="M12 1c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z"
      />
    </svg>
  );
}

export function RoleBadge({
  role,
  className = "",
}: {
  role: Role;
  className?: string;
}) {
  if (role === "platinum") {
    return (
      <span
        className={`badge-glass ${BASE} text-foreground-strong ${className}`}
      >
        {ROLE_LABELS.platinum}
        {SPARKLES.map((sparkle) => (
          <Sparkle
            key={sparkle.className}
            className={sparkle.className}
            delay={sparkle.delay}
          />
        ))}
      </span>
    );
  }

  return (
    <span className={`${BASE} border ${PLAIN_STYLES[role]} ${className}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
