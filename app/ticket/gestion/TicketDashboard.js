"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { callNextTicket, callPreviousTicket, changeManualWaitingCount, getMerchantQueues, getMerchantSession, resetQueue, setEstimatedMinutes, setPublicWaitDisplay, setQueueOpen, setTicketMode, signOutMerchant, subscribeToQueue } from "../../../lib/ticket/ticketApi";
import { formatTicketNumber } from "../../../lib/ticket/formatTicketNumber";
import { ticketBase, ticketColors } from "../ticketStyles";

export default function TicketDashboard() {
  const router = useRouter();
  const [queues, setQueues] = useState([]);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [estimatedMinutes, setEstimatedMinutesValue] = useState("");

  const load = useCallback(async () => {
    try {
      const rows = await getMerchantQueues();
      setQueues(rows);
      setBusinessId((current) => current || rows[0]?.business_id || "");
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de charger la file.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMerchantSession().then((session) => {
      if (!session) router.replace("/ticket/connexion");
      else load();
    }).catch(() => router.replace("/ticket/connexion"));
  }, [load, router]);

  useEffect(() => {
    if (!businessId) return;
    return subscribeToQueue(businessId, load);
  }, [businessId, load]);

  const queue = queues.find((item) => item.business_id === businessId) || queues[0];

  useEffect(() => {
    setEstimatedMinutesValue(queue?.estimated_minutes_per_client ?? "");
  }, [queue?.business_id, queue?.estimated_minutes_per_client]);

  async function run(action) {
    if (!queue || busy) return;
    setBusy(true);
    try {
      await action(queue.business_id);
      await load();
    } catch (err) {
      setError(err.message || "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOutMerchant().catch(() => {});
    router.replace("/ticket/connexion");
  }

  function handleResetQueue() {
    if (!window.confirm("Remettre la file à zéro ? Tous les tickets seront supprimés.")) return;
    run(resetQueue);
  }

  if (loading) return <main style={{ ...styles.page, placeItems: "center" }}>Chargement…</main>;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div><p style={styles.brand}>LEHNOVA TICKET</p><h1 style={styles.business}>{queue?.business_name || "Espace commerçant"}</h1></div>
          <button onClick={logout} style={styles.logout}>Déconnexion</button>
        </header>

        {queues.length > 1 && <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} style={styles.select}>{queues.map((item) => <option key={item.business_id} value={item.business_id}>{item.business_name}</option>)}</select>}

        {!queue ? (
          <div style={styles.empty}>Aucun commerce Ticket n’est associé à ce compte.</div>
        ) : (
          <div style={styles.panel} aria-live="polite">
            <div style={styles.modeBox}>
              <p style={styles.modeTitle}>MODE DE FONCTIONNEMENT</p>
              <div style={styles.modeButtons}>
                <button disabled={busy} onClick={() => run(() => setTicketMode("tickets"))} style={queue.queue_mode !== "manual" ? styles.modeActive : styles.modeButton}>AVEC TICKETS</button>
                <button disabled={busy} onClick={() => run(() => setTicketMode("manual"))} style={queue.queue_mode === "manual" ? styles.modeActive : styles.modeButton}>SANS TICKETS</button>
              </div>
            </div>
            {queue.queue_mode === "manual" ? <>
              <p style={styles.label}>PERSONNES EN ATTENTE</p>
              <div style={styles.manualCounter}>
                <button disabled={busy || queue.manual_waiting_count === 0} onClick={() => run(() => changeManualWaitingCount(-1))} style={styles.counterButton}>−</button>
                <strong style={styles.manualNumber}>{queue.manual_waiting_count || 0}</strong>
                <button disabled={busy} onClick={() => run(() => changeManualWaitingCount(1))} style={styles.counterButton}>+</button>
              </div>
            </> : <>
              <p style={styles.label}>TICKET EN COURS</p>
              <div style={styles.number}># {formatTicketNumber(queue.current_number)}</div>
              <p style={styles.waiting}>{queue.waiting_count} {queue.waiting_count === 1 ? "personne" : "personnes"} en attente</p>
            </>}
            <div style={styles.estimateBox}>
              <label htmlFor="estimated-minutes" style={styles.estimateLabel}>Temps estimé par client</label>
              <div style={styles.estimateRow}>
                <input id="estimated-minutes" type="number" min="1" max="180" inputMode="numeric" value={estimatedMinutes} onChange={(event) => setEstimatedMinutesValue(event.target.value)} placeholder="ex. 15" style={styles.estimateInput} />
                <span style={styles.minutesLabel}>minutes</span>
                <button disabled={busy} onClick={() => run(() => setEstimatedMinutes(estimatedMinutes === "" ? null : Number(estimatedMinutes)))} style={styles.estimateSave}>ENREGISTRER</button>
              </div>
              <p style={styles.estimateHelp}>Cette durée permet d’indiquer automatiquement une attente approximative aux clients.</p>
            </div>
            {queue.queue_mode !== "manual" && <><div style={styles.actions}>
              <button disabled={busy} onClick={() => run(callPreviousTicket)} style={styles.secondary}>← TICKET PRÉCÉDENT</button>
              <button disabled={busy || queue.waiting_count === 0} onClick={() => run(callNextTicket)} style={styles.primary}>TICKET SUIVANT →</button>
            </div>
            <button disabled={busy} onClick={() => run((id) => setQueueOpen(id, !queue.is_open))} style={queue.is_open ? styles.close : styles.open}>
              {queue.is_open ? "FERMER LA FILE" : "ROUVRIR LA FILE"}
            </button>
            <button disabled={busy} onClick={handleResetQueue} style={styles.reset}>REMETTRE LA FILE À ZÉRO</button>
            <p style={{ ...styles.queueState, color: queue.is_open ? ticketColors.success : ticketColors.accent }}>{queue.is_open ? "● File ouverte" : "● File fermée"}</p></>}
            <button disabled={busy} onClick={() => run(() => setPublicWaitDisplay(!queue.public_wait_display_enabled))} style={queue.public_wait_display_enabled ? styles.visibilityOn : styles.visibilityOff}>
              {queue.public_wait_display_enabled ? "● ATTENTE PUBLIQUE ACTIVÉE" : "○ ATTENTE PUBLIQUE MASQUÉE"}
            </button>
          </div>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </section>
    </main>
  );
}

const styles = {
  page: { ...ticketBase, display: "grid", padding: "22px 16px" },
  shell: { width: "100%", maxWidth: "760px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" },
  brand: { margin: 0, color: ticketColors.accent, fontSize: "11px", fontWeight: 800, letterSpacing: ".18em" },
  business: { margin: "5px 0 0", fontSize: "22px" },
  logout: { border: 0, background: "transparent", color: ticketColors.muted, fontWeight: 650 },
  select: { width: "100%", padding: "12px", marginBottom: "14px", border: `1px solid ${ticketColors.border}`, borderRadius: "12px", background: "#FFF" },
  panel: { background: "#FFF", border: `1px solid ${ticketColors.border}`, borderRadius: "28px", padding: "34px 24px 26px", textAlign: "center", boxShadow: "0 24px 60px -42px rgba(34,29,24,.45)" },
  modeBox: { margin: "0 0 28px", paddingBottom: "20px", borderBottom: `1px solid ${ticketColors.border}` },
  modeTitle: { margin: "0 0 10px", color: ticketColors.muted, fontSize: "11px", fontWeight: 800, letterSpacing: ".12em" },
  modeButtons: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  modeButton: { minHeight: "44px", border: `1px solid ${ticketColors.border}`, borderRadius: "12px", background: "#FFF", color: ticketColors.muted, fontSize: "12px", fontWeight: 800 },
  modeActive: { minHeight: "44px", border: 0, borderRadius: "12px", background: ticketColors.ink, color: "#FFF", fontSize: "12px", fontWeight: 800 },
  label: { margin: 0, color: ticketColors.gold, fontSize: "14px", fontWeight: 800, letterSpacing: ".16em" },
  number: { margin: "12px 0 8px", fontSize: "clamp(88px, 25vw, 160px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.07em" },
  waiting: { margin: "0 0 32px", color: ticketColors.muted, fontSize: "20px", fontWeight: 650 },
  manualCounter: { display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", margin: "14px 0 28px" },
  counterButton: { width: "64px", height: "64px", border: `2px solid ${ticketColors.ink}`, borderRadius: "50%", background: "#FFF", color: ticketColors.ink, fontSize: "34px", lineHeight: 1 },
  manualNumber: { minWidth: "100px", color: ticketColors.ink, fontSize: "76px", lineHeight: 1 },
  estimateBox: { margin: "0 0 24px", padding: "16px", borderRadius: "16px", background: ticketColors.background, textAlign: "left" },
  estimateLabel: { display: "block", marginBottom: "9px", color: ticketColors.ink, fontSize: "14px", fontWeight: 800 },
  estimateRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  estimateInput: { width: "90px", minHeight: "44px", padding: "8px 10px", border: `1px solid ${ticketColors.border}`, borderRadius: "10px", background: "#FFF", color: ticketColors.ink, fontSize: "17px", fontWeight: 750 },
  minutesLabel: { color: ticketColors.muted, fontSize: "14px" },
  estimateSave: { minHeight: "44px", marginLeft: "auto", padding: "0 14px", border: 0, borderRadius: "10px", background: ticketColors.ink, color: "#FFF", fontSize: "12px", fontWeight: 800 },
  estimateHelp: { margin: "10px 0 0", color: ticketColors.muted, fontSize: "12px", lineHeight: 1.45 },
  actions: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  primary: { minHeight: "72px", border: 0, borderRadius: "16px", background: ticketColors.accent, color: "#FFF", fontSize: "16px", fontWeight: 850 },
  secondary: { minHeight: "72px", border: `2px solid ${ticketColors.ink}`, borderRadius: "16px", background: "#FFF", color: ticketColors.ink, fontSize: "16px", fontWeight: 850 },
  close: { width: "100%", minHeight: "54px", marginTop: "14px", border: `1px solid ${ticketColors.accent}`, borderRadius: "14px", background: "#FFF", color: ticketColors.accent, fontWeight: 800 },
  open: { width: "100%", minHeight: "54px", marginTop: "14px", border: 0, borderRadius: "14px", background: ticketColors.success, color: "#FFF", fontWeight: 800 },
  reset: { width: "100%", minHeight: "48px", marginTop: "10px", border: 0, background: "transparent", color: ticketColors.muted, fontWeight: 750 },
  queueState: { margin: "18px 0 0", fontSize: "13px", fontWeight: 700 },
  visibilityOn: { width: "100%", minHeight: "48px", marginTop: "16px", border: `1px solid ${ticketColors.success}`, borderRadius: "14px", background: "#FFF", color: ticketColors.success, fontWeight: 800 },
  visibilityOff: { width: "100%", minHeight: "48px", marginTop: "16px", border: `1px solid ${ticketColors.muted}`, borderRadius: "14px", background: "#FFF", color: ticketColors.muted, fontWeight: 800 },
  empty: { background: "#FFF", border: `1px solid ${ticketColors.border}`, borderRadius: "20px", padding: "30px", textAlign: "center", color: ticketColors.muted },
  error: { color: ticketColors.accent, textAlign: "center", fontSize: "13px" },
};

