import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function PATCH(request, { params }) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }

  try {
    const { id } = params;
    const { is_active: isActive } = await request.json();
    if (typeof isActive !== "boolean") throw new Error("État invalide.");

    const admin = getSupabaseAdmin();
    const { data: business, error } = await admin
      .from("ticket_businesses")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;

    if (!isActive) {
      const { error: queueError } = await admin
        .from("ticket_queues")
        .update({ is_open: false, updated_at: new Date().toISOString() })
        .eq("business_id", business.id);
      if (queueError) throw queueError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Mise à jour impossible." }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  if (!requestHasAdminSession(request)) {
    return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
  }

  try {
    const { id } = params;
    const { data, error } = await getSupabaseAdmin()
      .from("ticket_businesses")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Suppression impossible." }, { status: 400 });
  }
}
