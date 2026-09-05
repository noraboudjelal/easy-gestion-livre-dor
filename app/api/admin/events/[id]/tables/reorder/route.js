import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../../../lib/supabaseAdmin";

export async function PATCH(request, { params }) {
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
    if (!ids.length) return NextResponse.json({ error: "Ordre invalide." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: owned, error: ownedError } = await supabase
      .from("event_table_cards")
      .select("id")
      .eq("event_id", params.id)
      .in("id", ids);
    if (ownedError) throw ownedError;
    if ((owned || []).length !== ids.length) {
      return NextResponse.json({ error: "Une table n’appartient pas à cet événement." }, { status: 400 });
    }

    const results = await Promise.all(
      ids.map((id, position) =>
        supabase.from("event_table_cards").update({ position, updated_at: new Date().toISOString() }).eq("id", id).eq("event_id", params.id)
      )
    );
    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;
    return NextResponse.json({ reordered: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Réorganisation impossible." }, { status: 500 });
  }
}

