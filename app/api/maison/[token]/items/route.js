import { NextResponse } from "next/server";

import { getMaisonByToken, MAISON_KINDS } from "../../../../../lib/maison/maisonApi";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function response(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(_request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return response({ error: "Maison introuvable." }, 404);

    const { data, error } = await getSupabaseAdmin()
      .from("maison_items")
      .select("id, kind, label, created_at")
      .eq("home_id", home.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return response({ home: { name: home.name }, items: data || [] });
  } catch (error) {
    console.error("Maison items GET:", error);
    return response({ error: "Impossible de charger la maison." }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return response({ error: "Maison introuvable." }, 404);

    const body = await request.json();
    const kind = typeof body.kind === "string" ? body.kind : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";

    if (!MAISON_KINDS.has(kind) || !label || label.length > 120) {
      return response({ error: "Élément invalide." }, 400);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("maison_items")
      .insert({ home_id: home.id, kind, label })
      .select("id, kind, label, created_at")
      .single();

    if (error) throw error;
    return response({ item: data }, 201);
  } catch (error) {
    console.error("Maison items POST:", error);
    return response({ error: "Impossible d’ajouter cet élément." }, 500);
  }
}
