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
  const { data, error } = await requireSupabase().rpc("ticket_merchant_queues");
  if (error) throw error;
  return data || [];
}

export function callNextTicket(businessId) {
  return rpc("ticket_call_next", { p_business_id: businessId });
}

export function callPreviousTicket(businessId) {
  return rpc("ticket_call_previous", { p_business_id: businessId });
}

export function setQueueOpen(businessId, isOpen) {
  return rpc("ticket_set_queue_open", { p_business_id: businessId, p_is_open: isOpen });
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

export async function signInMerchant(email, password) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutMerchant() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export async function getMerchantSession() {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

