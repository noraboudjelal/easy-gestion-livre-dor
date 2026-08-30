"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMerchantSession, signInMerchant } from "../../../lib/ticket/ticketApi";
import { ticketBase, ticketColors } from "../ticketStyles";

export default function TicketLoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMerchantSession().then((session) => {
      if (session) router.replace("/ticket/gestion");
    }).catch(() => {});
  }, [router]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInMerchant(code);
      router.replace("/ticket/gestion");
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={submit}>
        <p style={styles.brand}>LEHNOVA TICKET</p>
        <h1 style={styles.title}>Espace commerçant</h1>
        <label style={styles.label}>Code d’accès<input required autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={styles.input} maxLength={32} /></label>
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} disabled={loading}>{loading ? "CONNEXION…" : "SE CONNECTER"}</button>
      </form>
    </main>
  );
}

const styles = {
  page: { ...ticketBase, display: "grid", placeItems: "center", padding: "20px" },
  card: { width: "100%", maxWidth: "380px", background: "#FFF", border: `1px solid ${ticketColors.border}`, borderRadius: "24px", padding: "32px 26px", display: "flex", flexDirection: "column", gap: "18px" },
  brand: { margin: 0, color: ticketColors.accent, fontSize: "12px", fontWeight: 800, letterSpacing: ".18em" },
  title: { margin: "-6px 0 8px", fontSize: "28px" },
  label: { display: "flex", flexDirection: "column", gap: "7px", fontSize: "13px", fontWeight: 700 },
  input: { border: `1px solid ${ticketColors.border}`, borderRadius: "12px", padding: "13px", fontSize: "16px", background: ticketColors.background },
  button: { minHeight: "52px", border: 0, borderRadius: "13px", background: ticketColors.accent, color: "#FFF", fontWeight: 800, fontSize: "15px" },
  error: { margin: 0, color: ticketColors.accent, fontSize: "13px" },
};
