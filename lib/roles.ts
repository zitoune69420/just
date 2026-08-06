export type Role = "user" | "gold" | "platinum" | "admin";

export const ROLES: Role[] = ["user", "gold", "platinum", "admin"];

export const ROLE_LABELS: Record<Role, string> = {
  user: "Gratuit",
  gold: "Gold",
  platinum: "Platine",
  admin: "Administrateur",
};

export const ROLE_SUMMARIES: Record<Role, string> = {
  user: "3 visionnages de films et 1 série complète. Prends l'abonnement non ?",
  gold: "Toutes les séries, 5 films par mois. Merci pour le coup de main !",
  platinum: "Tout le catalogue, sans limite. Merci pour votre soutien !",
  admin: "Tout le catalogue, plus l’administration.",
};

export const FREE_MOVIE_LIMIT = 3;

export const FREE_SERIES_LIMIT = 1;

export const GOLD_MOVIES_PER_MONTH = 5;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export function toRole(value: unknown): Role {
  return isRole(value) ? value : "user";
}

export function isAdmin(role: Role): boolean {
  return role === "admin";
}
