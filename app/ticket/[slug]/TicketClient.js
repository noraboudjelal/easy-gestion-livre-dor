"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrCreateDeviceToken } from "../../../lib/ticket/deviceToken";
import { formatTicketNumber } from "../../../lib/ticket/formatTicketNumber";
import { getPublicTicketState, subscribeToQueue, takeOrResumeTicket } from "../../../lib/ticket/ticketApi";
import { ticketBase, ticketColors } from "../ticketStyles";

export default function TicketClient() {
  const { slug } = useParams();
  const [token, setToken] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async (knownToken = token) => {
    if (!slug || !knownToken) return;
    try {
      const next = await getPublicTicketState(slug, knownToken);
      if (!next) throw new Error("Commerce introuvable.");
      setState(next);
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de charger la file.");
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    if (!slug) return;
    const nextToken = getOrCreateDeviceToken(slug);
    setToken(nextToken);
    refresh(nextToken);
  }, [slug, refresh]);

  useEffect(() => {
    if (!state?.business_id || !token) return;
    const unsubscribe = subscribeToQueue(state.business_id, () => refresh(token));
    const fallback = window.setInterval(() => refresh(token), 15000);
    return () => {
      unsubscribe();
      window.clearInterval(fallback);
    };
  }, [state?.business_id, token, refresh]);

  async function takeTicket() {
    if (!token || taking) return;
    setTaking(true);
    try {
      const next = await takeOrResumeTicket(slug, token);
      setState(next);
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de prendre un ticket.");
      await refresh(token);
    } finally {
      setTaking(false);
    }
  }

  const hasTicket = state?.ticket_number != null;
  const isTurn = state?.ticket_status === "called";
  const isFinished = state?.ticket_status === "served";

  return (
    <main style={styles.page}>
      <section style={styles.card} aria-live="polite">
        <p style={styles.brand}>LEHNOVA TICKET</p>
        <h1 style={styles.business}>{state?.business_name || "Votre commerce"}</h1>

        {loading ? (
          <p style={styles.message}>Chargement…</p>
        ) : error && !state ? (
          <p style={styles.error}>{error}</p>
        ) : !state?.is_open && !hasTicket ? (
          <div style={styles.center}>
            <div style={styles.closedDot} />
            <h2 style={styles.closedTitle}>FILE FERMÉE</h2>
            <p style={styles.message}>Ce commerce ne prend pas de nouveaux tickets pour le moment.</p>
          </div>
        ) : !hasTicket ? (
          <button style={styles.takeButton} onClick={takeTicket} disabled={taking}>
            {taking ? "ATTRIBUTION…" : "PRENDRE UN TICKET"}
          </button>
        ) : (
          <div style={styles.center}>
            <p style={styles.label}>VOTRE TICKET</p>
            <div style={styles.number}># {formatTicketNumber(state.ticket_number)}</div>

            {isTurn ? (
              <div style={styles.turnBox}>
                <strong style={styles.turnTitle}>C&apos;EST VOTRE TOUR</strong>
                <span>Présentez-vous au comptoir.</span>
              </div>
            ) : isFinished ? (
              <div style={styles.finishedBox}>Ce ticket a déjà été appelé.</div>
            ) : (
              <div style={styles.statusBox}>
                <span>Ticket actuellement appelé</span>
                <strong># {formatTicketNumber(state.current_number)}</strong>
                <span style={styles.ahead}>
                  {state.people_ahead === 0
                    ? "Vous êtes le prochain"
                    : `${state.people_ahead} ${state.people_ahead === 1 ? "personne" : "personnes"} avant vous`}
                </span>
              </div>
            )}

            {!state.is_open && !isFinished && <p style={styles.closedNote}>La file est fermée aux nouveaux tickets. Le vôtre reste valable.</p>}
          </div>
        )}

        {error && state && <p style={styles.error}>{error}</p>}
      </section>
    </main>
  );
}

const styles = {
  page: { ...ticketBase, display: "grid", placeItems: "center", padding: "20px 14px" },
  card: { width: "100%", maxWidth: "440px", minHeight: "620px", background: ticketColors.paper, border: `1px solid ${ticketColors.border}`, borderRadius: "28px", padding: "28px 22px 20px", boxShadow: "0 22px 60px -40px rgba(34,29,24,.4)", display: "flex", flexDirection: "column" },
  brand: { margin: 0, color: ticketColors.accent, fontSize: "12px", fontWeight: 800, letterSpacing: ".18em", textAlign: "center" },
  business: { margin: "8px 0 30px", fontSize: "20px", textAlign: "center", fontWeight: 700 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
  takeButton: { margin: "auto 0", width: "100%", minHeight: "92px", border: 0, borderRadius: "20px", background: ticketColors.accent, color: "#FFF", fontSize: "20px", fontWeight: 800, letterSpacing: ".04em", boxShadow: "0 16px 30px -18px rgba(181,64,45,.7)" },
  label: { margin: 0, color: ticketColors.gold, fontSize: "13px", fontWeight: 800, letterSpacing: ".16em" },
  number: { margin: "8px 0 30px", color: ticketColors.ink, fontSize: "clamp(76px, 24vw, 112px)", lineHeight: 1, fontWeight: 900, letterSpacing: "-.06em" },
  statusBox: { width: "100%", padding: "22px", borderRadius: "18px", background: ticketColors.background, display: "flex", flexDirection: "column", gap: "8px", color: ticketColors.muted, fontSize: "14px" },
  ahead: { marginTop: "4px", color: ticketColors.ink, fontSize: "18px", fontWeight: 750 },
  turnBox: { width: "100%", padding: "24px 18px", borderRadius: "18px", color: "#FFF", background: ticketColors.success, display: "flex", flexDirection: "column", gap: "7px" },
  turnTitle: { fontSize: "24px", letterSpacing: ".04em" },
  finishedBox: { width: "100%", padding: "20px", borderRadius: "18px", background: ticketColors.background, color: ticketColors.muted },
  closedDot: { width: "12px", height: "12px", borderRadius: "50%", background: ticketColors.accent, marginBottom: "16px" },
  closedTitle: { margin: 0, fontSize: "30px" },
  closedNote: { margin: "18px 0 0", color: ticketColors.accent, fontSize: "13px", fontWeight: 650 },
  message: { color: ticketColors.muted, textAlign: "center", lineHeight: 1.55 },
  error: { color: ticketColors.accent, textAlign: "center", fontSize: "14px" },
  footer: { margin: "auto 0 0", paddingTop: "28px", color: ticketColors.muted, textAlign: "center", fontSize: "11px" },
};
