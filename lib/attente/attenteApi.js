import { supabase } from "../supabaseClient";
import { getMerchantSession, signInMerchant, signOutMerchant } from "../ticket/ticketApi";

async function action(name, extra = {}) {
  const response = await fetch("/api/attente/merchant/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: name, ...extra }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Action impossible.");
  return data;
}

export async function getAttenteQueue() {
  const response = await fetch("/api/attente/merchant/queue", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Session Lehnova Attente requise.");
  return data.queue;
}

export const changeWaitingCount = (delta) => action("manual-count", { delta });
export const saveAverageMinutes = (minutes) => action("estimate", { minutes });
export const setPublicDisplay = (enabled) => action("public-display", { enabled });
export const signInAttente = (code) => signInMerchant(code, "manual");
export { getMerchantSession, signOutMerchant };

export function subscribeToAttente(businessId, onChange) {
  if (!supabase) return () => {};
  const channel = supabase.channel(`attente-${businessId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "ticket_queues", filter: `business_id=eq.${businessId}` }, onChange).subscribe();
  return () => supabase.removeChannel(channel);
}

