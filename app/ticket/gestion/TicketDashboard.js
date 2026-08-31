"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { callNextTicket, callPreviousTicket, getMerchantQueues, getMerchantSession, resetQueue, setQueueOpen, signOutMerchant, subscribeToQueue } from "../../../lib/ticket/ticketApi";
import { formatTicketNumber } from "../../../lib/ticket/formatTicketNumber";
import { ticketBase, ticketColors } from "../ticketStyles";

export default function TicketDashboard() {
  const router = useRouter();
  const [queues, setQueues] = useState([]);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
            <p style={styles.label}>TICKET EN COURS</p>
            <div style={styles.number}># {formatTicketNumber(queue.current_number)}</div>
            <p style={styles.waiting}>{queue.waiting_count} {queue.waiting_count === 1 ? "personne" : "personnes"} en attente</p>
            <div style={styles.actions}>
              <button disabled={busy} onClick={() => run(callPreviousTicket)} style={styles.secondary}>← TICKET PRÉCÉDENT</button>
              <button disabled={busy || queue.waiting_count === 0} onClick={() => run(callNextTicket)} style={styles.primary}>TICKET SUIVANT →</button>
            </div>
            <button disabled={busy} onClick={() => run((id) => setQueueOpen(id, !queue.is_open))} style={queue.is_open ? styles.close : styles.open}>
              {queue.is_open ? "FERMER LA FILE" : "ROUVRIR LA FILE"}
            </button>
            <button disabled={busy} onClick={handleResetQueue} style={styles.reset}>REMETTRE LA FILE À ZÉRO</button>
            <p style={{ ...styles.queueState, color: queue.is_open ? ticketColors.success : ticketColors.accent }}>{queue.is_open ? "● File ouverte" : "● File fermée"}</p>
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
  label: { margin: 0, color: ticketColors.gold, fontSize: "14px", fontWeight: 800, letterSpacing: ".16em" },
  number: { margin: "12px 0 8px", fontSize: "clamp(88px, 25vw, 160px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-.07em" },
  waiting: { margin: "0 0 32px", color: ticketColors.muted, fontSize: "20px", fontWeight: 650 },
  actions: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  primary: { minHeight: "72px", border: 0, borderRadius: "16px", background: ticketColors.accent, color: "#FFF", fontSize: "16px", fontWeight: 850 },
  secondary: { minHeight: "72px", border: `2px solid ${ticketColors.ink}`, borderRadius: "16px", background: "#FFF", color: ticketColors.ink, fontSize: "16px", fontWeight: 850 },
  close: { width: "100%", minHeight: "54px", marginTop: "14px", border: `1px solid ${ticketColors.accent}`, borderRadius: "14px", background: "#FFF", color: ticketColors.accent, fontWeight: 800 },
  open: { width: "100%", minHeight: "54px", marginTop: "14px", border: 0, borderRadius: "14px", background: ticketColors.success, color: "#FFF", fontWeight: 800 },
  reset: { width: "100%", minHeight: "48px", marginTop: "10px", border: 0, background: "transparent", color: ticketColors.muted, fontWeight: 750 },
  queueState: { margin: "18px 0 0", fontSize: "13px", fontWeight: 700 },
  empty: { background: "#FFF", border: `1px solid ${ticketColors.border}`, borderRadius: "20px", padding: "30px", textAlign: "center", color: ticketColors.muted },
  error: { color: ticketColors.accent, textAlign: "center", fontSize: "13px" },
};
