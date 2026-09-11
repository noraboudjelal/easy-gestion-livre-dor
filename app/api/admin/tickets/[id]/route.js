import { offersUrl } from "../../../../../lib/ticket/publicSettings.mjs";
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
    const body = await request.json();
    const isActive = body.is_active;
    const systemType = body.system_type;
    const hasOffers = Object.hasOwn(body, "offers_url");
    const hasScreen = Object.hasOwn(body, "public_screen_enabled");
    const hasQueueOpen = Object.hasOwn(body, "is_open");
    if (systemType !== undefined && !["tickets", "manual"].includes(systemType)) throw new Error("Système invalide.");
    if (hasScreen && typeof body.public_screen_enabled !== "boolean") throw new Error("Écran invalide.");
    if (hasQueueOpen && typeof body.is_open !== "boolean") throw new Error("État de file invalide.");
    if (typeof isActive !== "boolean" && !systemType && !hasOffers && !hasScreen && !hasQueueOpen) throw new Error("État invalide.");
    const changes = { updated_at: new Date().toISOString() };
    if (typeof isActive === "boolean") changes.is_active = isActive;
    if (hasOffers) changes.offers_url = offersUrl(body.offers_url);
    if (hasScreen) changes.public_screen_enabled = body.public_screen_enabled;

    const admin = getSupabaseAdmin();
    const { data: business, error } = await admin
      .from("ticket_businesses")
      .update(changes)
      .eq("id", id)
      .select("id, is_active")
      .single();
    if (error) throw error;

    if (systemType) {
      const { error: modeError } = await admin.from("ticket_queues").update({ queue_mode: systemType, updated_at: new Date().toISOString() }).eq("business_id", business.id);
      if (modeError) throw modeError;
    }

    if (hasQueueOpen) {
      if (body.is_open && business.is_active === false) {
        return NextResponse.json({ error: "Activez d’abord le commerce avant d’ouvrir la file." }, { status: 400 });
      }
      const { error: queueOpenError } = await admin
        .from("ticket_queues")
        .update({ is_open: body.is_open, updated_at: new Date().toISOString() })
        .eq("business_id", business.id);
      if (queueOpenError) throw queueOpenError;
    }

    if (isActive === false) {
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
