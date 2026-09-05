import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Identifiant de vitrine manquant." }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("showcases")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Vitrine introuvable ou déjà supprimée." }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("[admin/showcases] suppression échouée", { error: error?.message || String(error) });
    return NextResponse.json({ error: error.message || "Suppression impossible." }, { status: 400 });
  }
}


