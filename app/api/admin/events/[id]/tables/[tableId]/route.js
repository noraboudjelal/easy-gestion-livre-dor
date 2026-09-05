import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../../../lib/supabaseAdmin";

function blocked(request) {
  if (!requestHasAdminSession(request)) return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  return null;
}

function cleanGuests(value) {
  const names = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
  return names.map((name) => String(name).trim()).filter(Boolean).slice(0, 100);
}

export async function PATCH(request, { params }) {
  const denied = blocked(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const tableNumber = typeof body.table_number === "string" ? body.table_number.trim() : "";
    const tableName = typeof body.table_name === "string" ? body.table_name.trim() : "";
    if (!tableNumber) return NextResponse.json({ error: "Le numéro de table est obligatoire." }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from("event_table_cards")
      .update({
        table_number: tableNumber.slice(0, 40),
        table_name: tableName ? tableName.slice(0, 100) : null,
        guest_names: cleanGuests(body.guest_names),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.tableId)
      .eq("event_id", params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Modification impossible." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const denied = blocked(request);
  if (denied) return denied;

  try {
    const { error } = await getSupabaseAdmin()
      .from("event_table_cards")
      .delete()
      .eq("id", params.tableId)
      .eq("event_id", params.id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Suppression impossible." }, { status: 500 });
  }
}

