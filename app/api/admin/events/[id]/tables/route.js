import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function cleanGuests(value) {
  const names = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
  return names.map((name) => String(name).trim()).filter(Boolean).slice(0, 100);
}

export async function POST(request, { params }) {
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const tableNumber = typeof body.table_number === "string" ? body.table_number.trim() : "";
    const tableName = typeof body.table_name === "string" ? body.table_name.trim() : "";
    if (!tableNumber) return NextResponse.json({ error: "Le numéro de table est obligatoire." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: last } = await supabase
      .from("event_table_cards")
      .select("position")
      .eq("event_id", params.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("event_table_cards")
      .insert({
        event_id: params.id,
        table_number: tableNumber.slice(0, 40),
        table_name: tableName ? tableName.slice(0, 100) : null,
        guest_names: cleanGuests(body.guest_names),
        position: (last?.position ?? -1) + 1,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Création impossible." }, { status: 500 });
  }
}

