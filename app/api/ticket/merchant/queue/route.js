import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { merchantBusinessIdFromRequest } from "../../../../../lib/ticket/merchantSession";

function unauthorized() { return NextResponse.json({ error: "Session commerçant requise." }, { status: 401 }); }

async function activeBusiness(request) {
  const id = merchantBusinessIdFromRequest(request);
  if (!id) return null;
  const { data } = await getSupabaseAdmin().from("ticket_businesses").select("id, name, slug").eq("id", id).eq("is_active", true).maybeSingle();
  return data;
}

export async function GET(request) {
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const admin = getSupabaseAdmin();
  const [{ data: queue, error }, { count, error: countError }] = await Promise.all([
    admin.from("ticket_queues").select("id, is_open, current_number, last_issued_number").eq("business_id", business.id).single(),
    admin.from("ticket_entries").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "waiting"),
  ]);
  if (error || countError) return NextResponse.json({ error: error?.message || countError?.message }, { status: 500 });
  return NextResponse.json({ queue: { business_id: business.id, business_name: business.name, business_slug: business.slug, ...queue, waiting_count: count || 0 } });
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const business = await activeBusiness(request);
  if (!business) return unauthorized();
  const { action, isOpen } = await request.json();
  const functions = { next: ["ticket_server_call_next", { p_business_id: business.id }], previous: ["ticket_server_call_previous", { p_business_id: business.id }], open: ["ticket_server_set_queue_open", { p_business_id: business.id, p_is_open: Boolean(isOpen) }] };
  if (!functions[action]) return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  const [name, params] = functions[action];
  const { error } = await getSupabaseAdmin().rpc(name, params);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
