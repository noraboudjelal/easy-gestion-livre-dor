import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { hashAccessCode, normalizeAccessCode } from "../../../../../lib/ticket/merchantSession";

export async function POST(request) {
  const code = normalizeAccessCode(request.headers.get("x-ticket-code"));
  if (!code) return NextResponse.json({ error: "Code appareil requis." }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: business, error: businessError } = await admin
    .from("ticket_businesses")
    .select("id")
    .eq("access_code_hash", hashAccessCode(code))
    .eq("is_active", true)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "Code appareil invalide." }, { status: 401 });

  const { data: queue } = await admin
    .from("ticket_queues")
    .select("queue_mode")
    .eq("business_id", business.id)
    .maybeSingle();

  if (queue?.queue_mode !== "tickets") {
    return NextResponse.json({ error: "Ce commerce n'utilise pas le mode tickets." }, { status: 400 });
  }

  const { error } = await admin.rpc("ticket_server_call_next", { p_business_id: business.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
