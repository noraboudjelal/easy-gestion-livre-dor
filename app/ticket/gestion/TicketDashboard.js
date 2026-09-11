"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { callNextTicket, callPreviousTicket, getMerchantQueues, getMerchantSession, resetQueue, setEstimatedMinutes, setPublicWaitDisplay, setQueueOpen, signOutMerchant, subscribeToQueue } from "../../../lib/ticket/ticketApi";
import { formatTicketNumber } from "../../../lib/ticket/formatTicketNumber";
import OfferEditor from "../OfferEditor";
import TicketAffluence from "./TicketAffluence";
import { ticketBase, ticketColors } from "../ticketStyles";

export default function TicketDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("queue");
  const [queues, setQueues] = useState([]);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [estimatedMinutes, setEstimatedMinutesValue] = useState("");
  const [walkInNumber, setWalkInNumber] = useState(null);

  const load = useCallback(async () => {
    try {
      const rows = await getMerchantQueues();
      setQueues(rows);
      setBusinessId((current) => current || rows[0]?.business_id || "");
      setError("");
    } catch (err) { setError(err.message || "Impossible de charger la file."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    getMerchantSession().then((session) => {
      if (!session?.authenticated || session.mode !== "tickets") router.replace("/ticket/connexion");
      else load();
    }).catch(() => router.replace("/ticket/connexion"));
  }, [load, router]);

  useEffect(() => {
    if (!businessId) return;
    return subscribeToQueue(businessId, load);
  }, [businessId, load]);

  const queue = queues.find((item) => item.business_id === businessId) || queues[0];
  useEffect(() => setEstimatedMinutesValue(queue?.estimated_minutes_per_client ?? ""), [queue?.business_id, queue?.estimated_minutes_per_client]);

  async function run(action) {
    if (!queue || busy) return;
    setBusy(true);
    try { await action(queue.business_id); await load(); }
    catch (err) { setError(err.message || "Action impossible."); }
    finally { setBusy(false); }
  }

  async function addWalkInTicket() {
    if (!queue || busy) return;
    setBusy(true); setWalkInNumber(null);
    try {
      const response = await fetch("/api/ticket/merchant/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "walk-in" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de créer le ticket.");
      setWalkInNumber(data.ticket_number);
      setError("");
      await load();
    } catch (err) { setError(err.message || "Impossible de créer le ticket."); }
    finally { setBusy(false); }
  }

  async function logout() { await signOutMerchant().catch(() => {}); router.replace("/ticket/connexion"); }
  function handleResetQueue() {
    if (!window.confirm("Remettre la file à zéro ? Les tickets actifs seront supprimés. L’historique d’affluence sera conservé.")) return;
    setWalkInNumber(null); run(resetQueue);
  }

  if (loading) return <main style={{ ...styles.page, placeItems: "center" }}>Chargement…</main>;

  return <main style={styles.page}><section style={styles.shell}>
    <header style={styles.header}><div><p style={styles.brand}>LEHNOVA TICKET</p><h1 style={styles.business}>{queue?.business_name || "Espace commerçant"}</h1></div><button onClick={logout} style={styles.logout}>Déconnexion</button></header>
    {queues.length > 1 && <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} style={styles.select}>{queues.map((item) => <option key={item.business_id} value={item.business_id}>{item.business_name}</option>)}</select>}
    {queue && <nav aria-label="Gestion Ticket" style={styles.nav}><button onClick={() => setTab("queue")} aria-pressed={tab === "queue"} style={{padding:12}}>File d’attente</button><button onClick={() => setTab("stats")} aria-pressed={tab === "stats"} style={{padding:12}}>Affluence</button><button onClick={() => setTab("offers")} aria-pressed={tab === "offers"} style={{padding:12}}>Offres</button><a href={`/ticket/${queue.business_slug}/ecran`} target="_blank" rel="noreferrer" style={{padding:12,color:"inherit"}}>Écran public ↗</a></nav>}
    {queue && tab === "offers" ? <OfferEditor key={queue.business_id}/> : queue && tab === "stats" ? <TicketAffluence businessId={queue.business_id}/> : !queue ? <div style={styles.empty}>Aucun commerce Ticket n’est associé à ce compte.</div> : <div style={styles.panel} aria-live="polite">
      <p style={styles.label}>TICKET EN COURS</p><div style={styles.number}># {formatTicketNumber(queue.current_number)}</div><p style={styles.waiting}>{queue.waiting_count} {queue.waiting_count === 1 ? "personne" : "personnes"} en attente</p>
      <div style={styles.walkInBox}><p style={styles.walkInTitle}>CLIENT SANS TÉLÉPHONE</p><button disabled={busy || !queue.is_open} onClick={addWalkInTicket} style={styles.walkInButton}>+ PRENDRE UN TICKET</button>{walkInNumber && <p style={styles.walkInResult}>Ticket attribué : <strong>#{formatTicketNumber(walkInNumber)}</strong></p>}<p style={styles.walkInHelp}>Le ticket rejoint la même file que les autres clients.</p></div>
      <div style={styles.estimateBox}><label htmlFor="estimated-minutes" style={styles.estimateLabel}>Temps estimé par client</label><div style={styles.estimateRow}><input id="estimated-minutes" type="number" min="1" max="180" inputMode="numeric" value={estimatedMinutes} onChange={(e) => setEstimatedMinutesValue(e.target.value)} placeholder="ex. 15" style={styles.estimateInput}/><span style={styles.minutesLabel}>minutes</span><button disabled={busy} onClick={() => run(() => setEstimatedMinutes(estimatedMinutes === "" ? null : Number(estimatedMinutes)))} style={styles.estimateSave}>ENREGISTRER</button></div><p style={styles.estimateHelp}>Cette durée permet d’indiquer automatiquement une attente approximative aux clients.</p></div>
      <div style={styles.actions}><button disabled={busy} onClick={() => run(callPreviousTicket)} style={styles.secondary}>← TICKET PRÉCÉDENT</button><button disabled={busy || queue.waiting_count === 0} onClick={() => run(callNextTicket)} style={styles.primary}>TICKET SUIVANT →</button></div>
      <button disabled={busy} onClick={() => run((id) => setQueueOpen(id, !queue.is_open))} style={queue.is_open ? styles.close : styles.open}>{queue.is_open ? "FERMER LA FILE" : "ROUVRIR LA FILE"}</button>
      <button disabled={busy} onClick={handleResetQueue} style={styles.reset}>REMETTRE LA FILE À ZÉRO</button>
      <p style={{...styles.queueState,color:queue.is_open ? ticketColors.success : ticketColors.accent}}>{queue.is_open ? "● File ouverte" : "● File fermée"}</p>
      <button disabled={busy} onClick={() => run(() => setPublicWaitDisplay(!queue.public_wait_display_enabled))} style={queue.public_wait_display_enabled ? styles.visibilityOn : styles.visibilityOff}>{queue.public_wait_display_enabled ? "● ATTENTE PUBLIQUE ACTIVÉE" : "○ ATTENTE PUBLIQUE MASQUÉE"}</button>
    </div>}
    {error && <p style={styles.error}>{error}</p>}
  </section></main>;
}

const styles = {
  page:{...ticketBase,boxSizing:"border-box",display:"grid",padding:"22px 16px"}, shell:{minWidth:0,width:"100%",maxWidth:"760px",margin:"0 auto"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:24}, brand:{margin:0,color:ticketColors.accent,fontSize:11,fontWeight:800,letterSpacing:".18em"}, business:{margin:"5px 0 0",fontSize:22}, logout:{border:0,background:"transparent",color:ticketColors.muted,fontWeight:650}, select:{width:"100%",padding:12,marginBottom:14,border:`1px solid ${ticketColors.border}`,borderRadius:12,background:"#FFF"}, nav:{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20},
  panel:{background:"#FFF",border:`1px solid ${ticketColors.border}`,borderRadius:28,padding:"34px 24px 26px",textAlign:"center",boxShadow:"0 24px 60px -42px rgba(34,29,24,.45)"}, label:{margin:0,color:ticketColors.gold,fontSize:14,fontWeight:800,letterSpacing:".16em"}, number:{margin:"12px 0 8px",fontSize:"clamp(88px, 25vw, 160px)",fontWeight:900,lineHeight:1,letterSpacing:"-.07em"}, waiting:{margin:"0 0 24px",color:ticketColors.muted,fontSize:20,fontWeight:650},
  walkInBox:{margin:"0 0 18px",padding:16,border:`1px solid ${ticketColors.border}`,borderRadius:16,background:"#FFF",textAlign:"left"}, walkInTitle:{margin:"0 0 10px",fontSize:12,fontWeight:850,letterSpacing:".08em"}, walkInButton:{width:"100%",minHeight:52,border:0,borderRadius:12,background:ticketColors.ink,color:"#FFF",fontSize:14,fontWeight:850}, walkInResult:{margin:"12px 0 0",fontSize:18,textAlign:"center"}, walkInHelp:{margin:"8px 0 0",color:ticketColors.muted,fontSize:12,textAlign:"center"},
  estimateBox:{margin:"0 0 24px",padding:16,borderRadius:16,background:ticketColors.background,textAlign:"left"}, estimateLabel:{display:"block",marginBottom:9,color:ticketColors.ink,fontSize:14,fontWeight:800}, estimateRow:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}, estimateInput:{width:90,minHeight:44,padding:"8px 10px",border:`1px solid ${ticketColors.border}`,borderRadius:10,background:"#FFF",color:ticketColors.ink,fontSize:17,fontWeight:750}, minutesLabel:{color:ticketColors.muted,fontSize:14}, estimateSave:{minHeight:44,marginLeft:"auto",padding:"0 14px",border:0,borderRadius:10,background:ticketColors.ink,color:"#FFF",fontSize:12,fontWeight:800}, estimateHelp:{margin:"10px 0 0",color:ticketColors.muted,fontSize:12,lineHeight:1.45},
  actions:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12}, primary:{minHeight:72,border:0,borderRadius:16,background:ticketColors.accent,color:"#FFF",fontSize:16,fontWeight:850}, secondary:{minHeight:72,border:`2px solid ${ticketColors.ink}`,borderRadius:16,background:"#FFF",color:ticketColors.ink,fontSize:16,fontWeight:850}, close:{width:"100%",minHeight:54,marginTop:14,border:`1px solid ${ticketColors.accent}`,borderRadius:14,background:"#FFF",color:ticketColors.accent,fontWeight:800}, open:{width:"100%",minHeight:54,marginTop:14,border:0,borderRadius:14,background:ticketColors.success,color:"#FFF",fontWeight:800}, reset:{width:"100%",minHeight:48,marginTop:10,border:0,background:"transparent",color:ticketColors.muted,fontWeight:750}, queueState:{margin:"18px 0 0",fontSize:13,fontWeight:700}, visibilityOn:{width:"100%",minHeight:48,marginTop:16,border:`1px solid ${ticketColors.success}`,borderRadius:14,background:"#FFF",color:ticketColors.success,fontWeight:800}, visibilityOff:{width:"100%",minHeight:48,marginTop:16,border:`1px solid ${ticketColors.muted}`,borderRadius:14,background:"#FFF",color:ticketColors.muted,fontWeight:800}, empty:{background:"#FFF",border:`1px solid ${ticketColors.border}`,borderRadius:20,padding:30,textAlign:"center",color:ticketColors.muted}, error:{color:ticketColors.accent,textAlign:"center",fontSize:13}
};
