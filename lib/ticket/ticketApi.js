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

export function getPublicTicketState(slug, resumeToken) {
  return rpc("ticket_public_state", { p_slug: slug, p_resume_token: resumeToken || null });
}

export function takeOrResumeTicket(slug, resumeToken) {
  return rpc("ticket_take_or_resume", { p_slug: slug, p_resume_token: resumeToken });
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
