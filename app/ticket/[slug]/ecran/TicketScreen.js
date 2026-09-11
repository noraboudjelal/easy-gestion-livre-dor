"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicTicketState, subscribeToQueue } from "../../../../lib/ticket/ticketApi";
import { formatTicketNumber } from "../../../../lib/ticket/formatTicketNumber";
import { ticketBase, ticketColors } from "../../ticketStyles";

export default function TicketScreen() {
  const { slug } = useParams();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const next = await getPublicTicketState(slug, null);
      if (!next) throw new Error("Commerce introuvable.");
      setState(next);
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de charger la file.");
    }
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!state?.business_id) return;
    const unsubscribe = subscribeToQueue(state.business_id, refresh);
    const fallback = window.setInterval(refresh, 15000);
    return () => { unsubscribe(); window.clearInterval(fallback); };
  }, [state?.business_id, refresh]);

  const waiting = state?.public_waiting_count ?? Math.max(0, (state?.last_issued_number || 0) - (state?.current_number || 0));
  const estimate = state?.estimated_minutes_per_client ? waiting * state.estimated_minutes_per_client : null;

  return (
    <main style={styles.page}>
      <section style={styles.shell} aria-live="polite">
        <header style={styles.header}>
          <p style={styles.brand}>LEHNOVA TICKET</p>
          <h1 style={styles.business}>{state?.business_name || "Votre commerce"}</h1>
        </header>

        {error && !state ? <p style={styles.error}>{error}</p> : (
          <>
            <div style={styles.current}>
              <p style={styles.label}>TICKET APPELÉ</p>
              <div style={styles.number}># {formatTicketNumber(state?.current_number || 0)}</div>
              <p style={styles.instruction}>Merci de vous présenter au comptoir</p>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <strong style={styles.infoNumber}>{waiting}</strong>
                <span>{waiting === 1 ? "personne en attente" : "personnes en attente"}</span>
              </div>
              <div style={styles.infoCard}>
                <strong style={styles.infoNumber}>{estimate != null ? `~ ${estimate} min` : "—"}</strong>
                <span>attente estimée</span>
              </div>
            </div>

            <div style={styles.joinBox}>
              <div>
                <strong style={styles.joinTitle}>Vous n’avez pas encore de ticket ?</strong>
                <p style={styles.joinText}>Scannez le QR code du commerce ou rendez-vous sur la page de prise de ticket.</p>
              </div>
              <div style={styles.url}>lehnova.fr/ticket/{slug}</div>
            </div>

            {!state?.is_open && <div style={styles.closed}>FILE FERMÉE AUX NOUVEAUX TICKETS</div>}
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: { ...ticketBase, minHeight: "100vh", padding: "clamp(22px, 4vw, 58px)", display: "grid", placeItems: "center", background: ticketColors.background },
  shell: { width: "100%", maxWidth: "1500px" },
  header: { textAlign: "center", marginBottom: "clamp(24px, 5vh, 60px)" },
  brand: { margin: 0, color: ticketColors.accent, fontSize: "clamp(14px, 1.5vw, 24px)", fontWeight: 900, letterSpacing: ".2em" },
  business: { margin: "12px 0 0", color: ticketColors.ink, fontSize: "clamp(28px, 4vw, 64px)" },
  current: { background: "#FFF", border: `1px solid ${ticketColors.border}`, borderRadius: "36px", padding: "clamp(30px, 5vw, 72px)", textAlign: "center", boxShadow: "0 28px 70px -50px rgba(34,29,24,.55)" },
  label: { margin: 0, color: ticketColors.gold, fontSize: "clamp(18px, 2vw, 32px)", fontWeight: 900, letterSpacing: ".16em" },
  number: { margin: "18px 0", color: ticketColors.ink, fontSize: "clamp(130px, 25vw, 360px)", fontWeight: 950, lineHeight: .9, letterSpacing: "-.07em" },
  instruction: { margin: 0, color: ticketColors.accent, fontSize: "clamp(20px, 2.4vw, 38px)", fontWeight: 800 },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px", marginTop: "18px" },
  infoCard: { minHeight: "150px", padding: "22px", borderRadius: "26px", background: "#FFF", border: `1px solid ${ticketColors.border}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "6px", color: ticketColors.muted, textAlign: "center", fontSize: "clamp(16px, 1.5vw, 24px)" },
  infoNumber: { color: ticketColors.ink, fontSize: "clamp(38px, 5vw, 76px)", lineHeight: 1 },
  joinBox: { marginTop: "18px", padding: "24px 28px", borderRadius: "24px", background: ticketColors.ink, color: "#FFF", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" },
  joinTitle: { fontSize: "clamp(18px, 2vw, 28px)" },
  joinText: { margin: "6px 0 0", opacity: .78, fontSize: "clamp(14px, 1.2vw, 19px)" },
  url: { padding: "12px 18px", borderRadius: "14px", background: "rgba(255,255,255,.1)", fontWeight: 800, fontSize: "clamp(15px, 1.4vw, 21px)" },
  closed: { marginTop: "18px", padding: "18px", borderRadius: "18px", background: ticketColors.accent, color: "#FFF", textAlign: "center", fontWeight: 900, letterSpacing: ".08em" },
  error: { color: ticketColors.accent, textAlign: "center", fontSize: "22px", fontWeight: 700 },
};
