import { NextResponse } from "next/server";
import { requestHasAdminSession } from "../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { statisticsDate } from "../../../../../lib/ticket/publicSettings.mjs";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request) {
  const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!requestHasAdminSession(request)) return reply({ error: "Session administrateur requise." }, 401);
  try {
    const search = new URL(request.url).searchParams;
    const businessId = search.get("business_id");
    const day = search.get("day");
    const period = search.get("period");
    if (!businessId || !statisticsDate(day) || !["day", "week", "month"].includes(period)) return reply({ error: "Paramètres invalides." }, 400);
    const admin = getSupabaseAdmin();
    const { data: business, error } = await admin.from("ticket_businesses").select("id,ticket_queues(queue_mode)").eq("id", businessId).maybeSingle();
    if (error) throw error;
    const queue = Array.isArray(business?.ticket_queues) ? business.ticket_queues[0] : business?.ticket_queues;
    if (!business || queue?.queue_mode !== "tickets") return reply({ error: "Commerce Ticket introuvable." }, 404);
    const result = await admin.rpc("ticket_server_affluence", { p_business_id: businessId, p_day: day, p_period: period });
    if (result.error) throw result.error;
    return reply(result.data);
  } catch {
    return reply({ error: "Statistiques temporairement indisponibles." }, 503);
  }
}
