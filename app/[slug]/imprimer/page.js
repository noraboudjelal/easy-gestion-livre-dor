"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PrintPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (evErr || !ev) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(ev);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Ce livre d'or n'existe pas.</p>;
  }
  if (loading) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Chargement…</p>;
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Special+Elite&display=swap');
        * { box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
          .entry { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print" style={styles.toolbar}>
        <a href="/admin" style={styles.backLink}>
          ← Retour à l'admin
        </a>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#5B4636" }}>
          Aperçu du souvenir imprimable — clique pour l'enregistrer en PDF ou l'imprimer.
        </p>
        <button style={styles.printButton} onClick={() => window.print()}>
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="print-page" style={styles.sheet}>
        <p style={styles.eyebrow}>LIVRE D'OR</p>
        <h1 style={styles.title}>{event?.event_title}</h1>
        <p style={styles.meta}>
          {messages.length} message{messages.length > 1 ? "s" : ""} — édité le {formatDate(Date.now())}
        </p>
        <p style={styles.brandFooter}>Easy Gestion Toulouse</p>

        <div style={styles.entries}>
          {messages.length === 0 && <p style={{ color: "#8A7F66" }}>Aucun message.</p>}
          {messages.map((m) => (
            <div className="entry" key={m.id} style={{ ...styles.entry, color: m.ink }}>
              {m.photo_url && <img src={m.photo_url} alt="" style={styles.entryPhoto} />}
              <p style={styles.entryText}>{m.message}</p>
              <p style={{ ...styles.entrySignature, color: m.ink }}>
                — {m.name} <span style={styles.entryDate}>{formatDate(m.created_at)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EFE9DA",
    fontFamily: "'Special Elite', monospace",
    padding: "24px 12px 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  toolbar: {
    width: "100%",
    maxWidth: "640px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  backLink: {
    fontFamily: "'Special Elite', monospace",
    fontSize: "0.8rem",
    color: "#5B4636",
    textDecoration: "underline",
    width: "100%",
  },
  printButton: {
    fontFamily: "'Special Elite', monospace",
    fontSize: "0.85rem",
    padding: "10px 16px",
    background: "#B5402D",
    color: "#FCFAF2",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  sheet: {
    width: "100%",
    maxWidth: "640px",
    background: "#F6F0E2",
    borderRadius: "6px",
    padding: "40px 36px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", color: "#A6792B", margin: 0 },
  title: { fontFamily: "'Caveat', cursive", fontSize: "2.6rem", fontWeight: 700, color: "#1E2A3A", margin: "4px 0" },
  meta: { fontSize: "0.75rem", color: "#8A7F66", margin: "0 0 4px 0" },
  brandFooter: { fontSize: "0.7rem", color: "#A6792B", margin: "0 0 24px 0", borderBottom: "2px solid #B5402D", paddingBottom: "16px" },
  entries: { display: "flex", flexDirection: "column", gap: "22px" },
  entry: { borderLeft: "3px solid currentColor", paddingLeft: "14px" },
  entryPhoto: { width: "100%", maxWidth: "260px", maxHeight: "200px", objectFit: "cover", borderRadius: "4px", marginBottom: "8px", display: "block" },
  entryText: { fontFamily: "'Caveat', cursive", fontSize: "1.4rem", lineHeight: 1.3, margin: "0 0 6px 0" },
  entrySignature: { fontFamily: "'Caveat', cursive", fontSize: "1.05rem", fontWeight: 700, margin: 0 },
  entryDate: { fontFamily: "'Special Elite', monospace", fontSize: "0.65rem", fontWeight: 400, opacity: 0.6 },
};
