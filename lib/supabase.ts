import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
} as const;

function projectUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function publishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function secretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(projectUrl() && publishableKey());
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(projectUrl() && secretKey());
}

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (publicClient) return publicClient;

  const url = projectUrl();
  const key = publishableKey();
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquante. Ajoutez-les dans .env.local (voir .env.example).",
    );
  }

  publicClient = createClient(url, key, clientOptions);
  return publicClient;
}

export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() est réservé au serveur.");
  }
  if (adminClient) return adminClient;

  const url = projectUrl();
  const key = secretKey();
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquante. Ajoutez-les dans .env.local (voir .env.example).",
    );
  }

  adminClient = createClient(url, key, clientOptions);
  return adminClient;
}
