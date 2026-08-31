import { NextResponse } from "next/server";

import { getMaisonByToken } from "../../../../../../lib/maison/maisonApi";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function DELETE(_request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return NextResponse.json({ error: "Maison introuvable." }, { status: 404 });

    const { data, error } = await getSupabaseAdmin()
      .from("maison_items")
      .delete()
      .eq("id", params.id)
      .eq("home_id", home.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Maison item DELETE:", error);
    return NextResponse.json({ error: "Impossible de terminer cet élément." }, { status: 500 });
  }
}
