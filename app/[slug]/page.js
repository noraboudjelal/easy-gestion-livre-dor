"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const INKS = ["#1E2A3A", "#8B3A2B", "#355E3B", "#5B4636"];

function randomRotation() {
  return +(Math.random() * 6 - 3).toFixed(2);
}
function randomInk() {
  return INKS[Math.floor(Math.random() * INKS.length)];
}
function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function GuestbookPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [justSent, setJustSent] = useState(false);

  const loadAll = useCallback(async () => {
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
    loadAll();
    const interval = setInterval(loadAll, 4000);
    return () => clearInterval(interval);
  }, [loadAll]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !event) {
      setError("Écris un petit mot avant d'envoyer.");
      return;
    }
    setError("");
    setSending(true);

    const optimisticEntry = {
      id: "temp-" + Date.now(),
      name: name.trim() || "Anonyme",
      message: text.trim().slice(0, 400),
      ink: randomInk(),
      rotation: randomRotation(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticEntry]);
    setText("");
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2500);

    const { error: insertError } = await supabase.from("messages").insert({
      event_id: event.id,
      name: optimisticEntry.name,
      message: optimisticEntry.message,
      ink: optimisticEntry.ink,
      rotation: optimisticEntry.rotation,
    });

    if (insertError) {
      setError("Le message est affiché ici mais n'a pas pu être sauvegardé : " + insertError.message);
    } else {
      loadAll();
    }
    setSending(false);
  }

  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#F6F0E2", fontFamily: "system-ui, sans-serif" }}>
          Ce livre d'or n'existe pas ou plus.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Special+Elite&display=swap');
        * { box-sizing: border-box; }
        .ld-hole { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fdfaf0, #d8cead 70%, #b9ad84); box-shadow: inset 0 1px 2px rgba(0,0,0,0.35); }
        .ld-entry { transition: transform 0.15s ease; }
        .ld-entry:hover { transform: translateY(-2px) rotate(0deg) !important; }
        textarea:focus, input:focus, button:focus-visible { outline: 3px solid #A6792B; outline-offset: 2px; }
      `}</style>

      <div style={styles.binding}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div className="ld-hole" key={i} />
        ))}
      </div>

      <div style={styles.content}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>LIVRE D'OR NUMÉRIQUE</p>
          <h1 style={styles.title}>{loading ? "…" : event?.event_title}</h1>
          <p style={styles.sub}>
           Laissez un petit mot qui restera gravé dans nos souvenirs.

          </p>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Ton prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            style={styles.input}
          />
          <textarea
            placeholder="Ton message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={400}
            rows={3}
            style={styles.textarea}
          />
          <div style={styles.formRow}>
            <span style={styles.counter}>{text.length}/400</span>
            <button type="submit" disabled={sending || !event} style={styles.button}>
              {sending ? "Envoi…" : "Laisser mon mot"}
            </button>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {justSent && <p style={styles.successText}>Merci, ton message a été ajouté ✓</p>}
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>
            {loading ? "Chargement…" : messages.length === 0 ? "Aucun message pour l'instant" : `${messages.length} message${messages.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={styles.entries}>
          {!loading && messages.length === 0 && (
            <div style={styles.empty}>
              <p style={{ fontSize: "1.1rem" }}>La première page est blanche.</p>
              <p style={{ opacity: 0.7 }}>Sois le ou la premier·ère à écrire un mot !</p>
            </div>
          )}

          {!loading &&
            [...messages].reverse().map((m) => (
              <article
                className="ld-entry"
                key={m.id}
                style={{ ...styles.entry, transform: `rotate(${m.rotation}deg)`, color: m.ink }}
              >
                <p style={styles.entryText}>{m.message}</p>
                <p style={{ ...styles.entrySignature, color: m.ink }}>
                  — {m.name}
                  <span style={styles.entryDate}>{formatDate(m.created_at)}</span>
                </p>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#3a3027", display: "flex", justifyContent: "center", padding: "24px 12px", fontFamily: "'Special Elite', 'Courier New', monospace" },
  binding: { display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", width: "28px", marginRight: "-4px", background: "#2c241d", borderRadius: "10px 0 0 10px", padding: "20px 0" },
  content: { width: "100%", maxWidth: "560px", background: "#F6F0E2", backgroundImage: "repeating-linear-gradient(#F6F0E2 0px, #F6F0E2 27px, #E6DCC2 28px)", borderRadius: "0 10px 10px 0", padding: "28px 24px 24px 36px", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" },
  header: { borderBottom: "2px solid #B5402D", paddingBottom: "16px", marginBottom: "20px" },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", color: "#A6792B", margin: "0 0 6px 0" },
  title: { fontFamily: "'Caveat', cursive", fontSize: "2.6rem", fontWeight: 700, color: "#1E2A3A", margin: 0, lineHeight: 1.1 },
  sub: { fontSize: "0.85rem", color: "#5B4636", marginTop: "10px", lineHeight: 1.4 },
  form: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  input: { fontFamily: "'Special Elite', monospace", fontSize: "0.9rem", padding: "10px 12px", border: "1px solid #C9BD9C", borderRadius: "4px", background: "#FCFAF2", color: "#2A241D" },
  textarea: { fontFamily: "'Caveat', cursive", fontSize: "1.3rem", padding: "10px 12px", border: "1px solid #C9BD9C", borderRadius: "4px", background: "#FCFAF2", color: "#2A241D", resize: "vertical" },
  formRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  counter: { fontSize: "0.7rem", color: "#8A7F66" },
  button: { fontFamily: "'Special Elite', monospace", fontSize: "0.85rem", padding: "10px 18px", background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "4px" },
  errorText: { color: "#8B3A2B", fontSize: "0.8rem", margin: 0 },
  successText: { color: "#355E3B", fontSize: "0.8rem", margin: 0 },
  divider: { textAlign: "center", margin: "8px 0 18px 0" },
  dividerText: { fontSize: "0.7rem", letterSpacing: "0.12em", color: "#A6792B", background: "#F6F0E2", padding: "0 10px" },
  entries: { display: "flex", flexDirection: "column", gap: "18px" },
  empty: { textAlign: "center", color: "#5B4636", fontFamily: "'Caveat', cursive", fontSize: "1.2rem", padding: "20px 0" },
  entry: { background: "#FCFAF2", border: "1px solid #E6DCC2", borderLeft: "3px solid currentColor", borderRadius: "2px", padding: "14px 16px", boxShadow: "0 3px 8px rgba(0,0,0,0.08)" },
  entryText: { fontFamily: "'Caveat', cursive", fontSize: "1.4rem", lineHeight: 1.3, margin: "0 0 8px 0" },
  entrySignature: { fontFamily: "'Caveat', cursive", fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  entryDate: { fontFamily: "'Special Elite', monospace", fontSize: "0.65rem", fontWeight: 400, opacity: 0.55 },
};
