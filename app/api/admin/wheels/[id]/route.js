import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { wheelBusinessInput } from "../../../../../lib/wheel/configuration.mjs";

export async function PATCH(request, { params }) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  if (!requestHasAdminSession(request)) return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: "Identifiant de roue invalide." }, { status: 400 });
  }
  let input;
  try { input = wheelBusinessInput(await request.json()); }
  catch (error) { return NextResponse.json({ error: error.message || "Configuration invalide." }, { status: 400 }); }
  try {
    const { data, error } = await getSupabaseAdmin().from("wheel_businesses")
      .update({ ...input, updated_at: new Date().toISOString() }).eq("id", params.id)
      .select("id,name,slug,lots,created_at,updated_at").maybeSingle();
    if (error?.code === "23505") return NextResponse.json({ error: "Ce slug est déjà utilisé par une autre roue." }, { status: 409 });
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Cette roue n’existe plus." }, { status: 404 });
    return NextResponse.json({ business: data });
  } catch {
    return NextResponse.json({ error: "Impossible d’enregistrer la roue. Réessayez." }, { status: 500 });
  }
}
