import "server-only";

import { getSupabaseAdmin } from "../supabaseAdmin";

export const MAISON_KINDS = new Set(["groceries", "todos"]);

export function isMaisonToken(value) {
  return typeof value === "string" && /^[a-f0-9]{48}$/.test(value);
}

export async function getMaisonByToken(token) {
  if (!isMaisonToken(token)) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("maison_homes")
    .select("id, name")
    .eq("share_token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}
