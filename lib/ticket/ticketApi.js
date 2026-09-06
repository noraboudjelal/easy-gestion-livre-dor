import { supabase } from "../supabaseClient";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

async function rpc(name, params = {}) {
  const { data, error } = await requireSupabase().rpc(name, params);
  if (error) throw error;
  return Array.isArray(data) ? data[0] || null : data;
}

async function withEstimatedMinutes(state) {
  if (!state?.business_id) return state;
  const { data } = await requireSupabase().from("ticket_queues").select("estimated_minutes_per_client, queue_mode, manual_waiting_count, public_wait_display_enabled").eq("business_id", state.business_id).maybeSingle();
  const queueMode = data?.queue_mode || "tickets";
  const automaticCount = Math.max(0, (state.last_issued_number || 0) - (state.current_number || 0));
  return { ...state, estimated_minutes_per_client: data?.estimated_minutes_per_client ?? null, queue_mode: queueMode, public_wait_display_enabled: data?.public_wait_display_enabled !== false, public_waiting_count: queueMode === "manual" ? data?.manual_waiting_count || 0 : automaticCount };
}

export async function getPublicTicketState(slug, resumeToken) {
  return withEstimatedMinutes(await rpc("ticket_public_state", { p_slug: slug, p_resume_token: resumeToken || null }));
}

export async function takeOrResumeTicket(slug, resumeToken) {
  return withEstimatedMinutes(await rpc("ticket_take_or_resume", { p_slug: slug, p_resume_token: resumeToken }));
}

export async function getMerchantQueues() {
  const response = await fetch("/api/ticket/merchant/queue", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Session commerçant requise.");
  return data.queue ? [data.queue] : [];
}

export function callNextTicket(businessId) {
  return merchantQueueAction("next");
}

export function callPreviousTicket(businessId) {
  return merchantQueueAction("previous");
}

export function setQueueOpen(businessId, isOpen) {
  return merchantQueueAction("open", { isOpen });
}

export function resetQueue() {
  return merchantQueueAction("reset");
}

export function setEstimatedMinutes(minutes) {
  return merchantQueueAction("estimate", { minutes });
}

export function setTicketMode(mode) { return merchantQueueAction("mode", { mode }); }
export function setPublicWaitDisplay(enabled) { return merchantQueueAction("public-display", { enabled }); }
export function changeManualWaitingCount(delta) { return merchantQueueAction("manual-count", { delta }); }

async function merchantQueueAction(action, extra = {}) {
  const response = await fetch("/api/ticket/merchant/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Action impossible.");
  return data;
}

export function subscribeToQueue(businessId, onChange) {
  const client = requireSupabase();
  const channel = client
    .channel(`ticket-queue-${businessId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "ticket_queues", filter: `business_id=eq.${businessId}` },
      onChange
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

export async function signInMerchant(code) {
  const response = await fetch("/api/ticket/merchant/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Connexion impossible.");
  return data;
}

export async function signOutMerchant() {
  await fetch("/api/ticket/merchant/session", { method: "DELETE" });
}

export async function getMerchantSession() {
  const response = await fetch("/api/ticket/merchant/session", { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json();
  return data.authenticated ? data : null;
}

