import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { merchantBusinessIdFromRequest } from "../../../../../lib/ticket/merchantSession";

function unauthorized() { return NextResponse.json({ error: "Session commerçant requise." }, { status: 401 }); }

async function activeBusiness(request) {
  const id = merchantBusinessIdFromRequest(request);
  if (!id) return null;
  const { data } = await getSupabaseAdmin().from("ticket_businesses").select("id, name, slug").eq("id", id).eq("is_active", true).maybeSingle();
  if (!data) return null;
  const { data: queue } = await getSupabaseAdmin().from("ticket_queues").select("queue_mode").eq("business_id", data.id).maybeSingle();
  return queue?.queue_mode === "tickets" ? data : null;
}

export async function GET(request) {
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const admin = getSupabaseAdmin();
  const [{ data: queue, error }, { count, error: countError }] = await Promise.all([
    admin.from("ticket_queues").select("id, is_open, current_number, last_issued_number, estimated_minutes_per_client, queue_mode, manual_waiting_count, public_wait_display_enabled").eq("business_id", business.id).single(),
    admin.from("ticket_entries").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "waiting"),
  ]);
  if (error || countError) return NextResponse.json({ error: error?.message || countError?.message }, { status: 500 });
  return NextResponse.json({ queue: { business_id: business.id, business_name: business.name, business_slug: business.slug, ...queue, waiting_count: count || 0 } });
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const { action, isOpen, minutes, enabled } = await request.json();

  if (action === "walk-in") {
    const token = `sans-telephone-${crypto.randomBytes(32).toString("hex")}`;
    const { data, error } = await getSupabaseAdmin().rpc("ticket_take_or_resume", { p_slug: business.slug, p_resume_token: token });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const ticket = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, ticket_number: ticket?.ticket_number ?? null });
  }
  if (action === "estimate") {
    const parsedMinutes = minutes === null || minutes === "" ? null : Number(minutes);
    if (parsedMinutes !== null && (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 180)) return NextResponse.json({ error: "L’estimation doit être comprise entre 1 et 180 minutes." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("ticket_queues").update({ estimated_minutes_per_client: parsedMinutes, updated_at: new Date().toISOString() }).eq("business_id", business.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  if (action === "public-display") {
    const { error } = await getSupabaseAdmin().from("ticket_queues").update({ public_wait_display_enabled: Boolean(enabled), updated_at: new Date().toISOString() }).eq("business_id", business.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  const functions = { next: ["ticket_server_call_next", { p_business_id: business.id }], previous: ["ticket_server_call_previous", { p_business_id: business.id }], open: ["ticket_server_set_queue_open", { p_business_id: business.id, p_is_open: Boolean(isOpen) }], reset: ["ticket_server_reset_queue", { p_business_id: business.id }] };
  if (!functions[action]) return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  const [name, params] = functions[action];
  const { error } = await getSupabaseAdmin().rpc(name, params);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
