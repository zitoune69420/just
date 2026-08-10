import type { MessageKey } from "./i18n/messages/en";

export type Role = "user" | "gold" | "platinum" | "admin";

export const ROLES: Role[] = ["user", "gold", "platinum", "admin"];

export function roleLabelKey(role: Role): MessageKey {
  return `role.${role}` as MessageKey;
}

export function roleSummaryKey(role: Role): MessageKey {
  return `role.summary.${role}` as MessageKey;
}

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
