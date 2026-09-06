import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { merchantBusinessIdFromRequest } from "../../../../../lib/ticket/merchantSession";

function unauthorized() { return NextResponse.json({ error: "Session Lehnova Attente requise." }, { status: 401 }); }

async function activeBusiness(request) {
  const id = merchantBusinessIdFromRequest(request);
  if (!id) return null;
  const admin = getSupabaseAdmin();
  const { data: business } = await admin.from("ticket_businesses").select("id, name, slug").eq("id", id).eq("is_active", true).maybeSingle();
  if (!business) return null;
  const { data: queue } = await admin.from("ticket_queues").select("queue_mode").eq("business_id", id).maybeSingle();
  return queue?.queue_mode === "manual" ? business : null;
}

export async function GET(request) {
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const { data: queue, error } = await getSupabaseAdmin().from("ticket_queues").select("id, estimated_minutes_per_client, manual_waiting_count, public_wait_display_enabled").eq("business_id", business.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ queue: { business_id: business.id, business_name: business.name, business_slug: business.slug, ...queue } });
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const { action, minutes, enabled, delta } = await request.json();
  const admin = getSupabaseAdmin();
  if (action === "estimate") {
    const value = minutes === null || minutes === "" ? null : Number(minutes);
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 180)) return NextResponse.json({ error: "L’estimation doit être comprise entre 1 et 180 minutes." }, { status: 400 });
    const { error } = await admin.from("ticket_queues").update({ estimated_minutes_per_client: value, updated_at: new Date().toISOString() }).eq("business_id", business.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  if (action === "public-display") {
    const { error } = await admin.from("ticket_queues").update({ public_wait_display_enabled: Boolean(enabled), updated_at: new Date().toISOString() }).eq("business_id", business.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  if (action === "manual-count") {
    if (![1, -1].includes(Number(delta))) return NextResponse.json({ error: "Variation invalide." }, { status: 400 });
    const { data, error: readError } = await admin.from("ticket_queues").select("manual_waiting_count").eq("business_id", business.id).single();
    if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
    const nextCount = Math.max(0, Math.min(999, (data.manual_waiting_count || 0) + Number(delta)));
    const { error } = await admin.from("ticket_queues").update({ manual_waiting_count: nextCount, updated_at: new Date().toISOString() }).eq("business_id", business.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, manual_waiting_count: nextCount });
  }
  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}

