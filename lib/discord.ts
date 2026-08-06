const AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const TOKEN_URL = "https://discord.com/api/oauth2/token";
const USER_URL = "https://discord.com/api/users/@me";
const CDN_URL = "https://cdn.discordapp.com";
const SCOPE = "identify email";

export interface DiscordProfile {
  discordId: string;
  name: string;
  avatar: string | null;
  email: string | null;
}

export const OAUTH_STATE_COOKIE = "just_oauth_state";
export const OAUTH_RETURN_COOKIE = "just_oauth_return";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
  email?: string | null;
  verified?: boolean;
}

export function isDiscordConfigured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

function credentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "DISCORD_CLIENT_ID ou DISCORD_CLIENT_SECRET manquante. Ajoutez-les dans .env.local (voir .env.example).",
    );
  }
  return { clientId, clientSecret };
}

export const CALLBACK_PATH = "/api/auth/discord/callback";

export function callbackUrl(requestUrl: string): string {
  const fallback = new URL(CALLBACK_PATH, requestUrl);
  const configured = process.env.DISCORD_REDIRECT_URI;
  if (!configured) return fallback.toString();

  const url = new URL(configured, fallback);
  if (!url.pathname.endsWith(CALLBACK_PATH)) {
    url.pathname = `${url.pathname.replace(/\/+$/, "")}${CALLBACK_PATH}`;
  }
  return url.toString();
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const { clientId } = credentials();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "none");
  return url.toString();
}

async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord a répondu ${response.status} sur le jeton`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Discord n’a pas renvoyé de jeton d’accès");
  }
  return data.access_token;
}

function avatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    const animated = user.avatar.startsWith("a_");
    return `${CDN_URL}/avatars/${user.id}/${user.avatar}.${animated ? "gif" : "png"}?size=64`;
  }
  const index =
    user.discriminator === "0"
      ? Number((BigInt(user.id) >> BigInt(22)) % BigInt(6))
      : Number(user.discriminator) % 5;
  return `${CDN_URL}/embed/avatars/${index}.png`;
}

export async function signInWithCode(
  code: string,
  redirectUri: string,
): Promise<DiscordProfile> {
  const accessToken = await exchangeCode(code, redirectUri);
  const response = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord a répondu ${response.status} sur le profil`);
  }

  const user = (await response.json()) as DiscordUser;
  return {
    discordId: user.id,
    name: user.global_name ?? user.username,
    avatar: avatarUrl(user),
    email: user.verified && user.email ? user.email : null,
  };
}
