import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { wheelBusinessInput } from "../../../../lib/wheel/configuration.mjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }
  try {
    const { data, error } = await getSupabaseAdmin().from("wheel_businesses")
      .select("id,name,slug,lots,created_at,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ businesses: data || [] });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les roues." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  if (!requestHasAdminSession(request)) return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });

  let input;
  try { input = wheelBusinessInput(await request.json()); }
  catch (error) { return NextResponse.json({ error: error.message || "Configuration invalide." }, { status: 400 }); }
  try {
    const { data, error } = await getSupabaseAdmin().from("wheel_businesses").insert(input)
      .select("id,name,slug,lots,created_at,updated_at").single();
    if (error?.code === "23505") return NextResponse.json({ error: "Ce slug est déjà utilisé par une autre roue." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ business: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Impossible de créer la roue. Réessayez." }, { status: 500 });
  }
}
