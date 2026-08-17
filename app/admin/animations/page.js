"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminAnimationsPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openEventId, setOpenEventId] = useState(null);
  const [riddles, setRiddles] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ld-admin-ok") === "1") {
      setAuthed(true);
    }
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!expected) {
      setAuthError("Mot de passe admin non configuré.");
      return;
    }
    if (pwd === expected) {
      sessionStorage.setItem("ld-admin-ok", "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Mot de passe incorrect.");
    }
  }

  const loadEvents = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("events")
      .select("id, client, event_title, event_type, slug, riddles_enabled, word_cloud_enabled")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadEvents();
  }, [authed, loadEvents]);

  async function toggleWordCloud(ev) {
    if (!supabase) return;
    setSaving(`word-${ev.id}`);
    const next = !ev.word_cloud_enabled;
    const { error: updateError } = await supabase
      .from("events")
      .update({ word_cloud_enabled: next, wordcloud_enabled: next })
      .eq("id", ev.id);
    if (updateError) setError(updateError.message);
    else setEvents((current) => current.map((item) => item.id === ev.id ? { ...item, word_cloud_enabled: next } : item));
    setSaving(null);
  }

  async function loadRiddles(ev) {
    if (!supabase) return;
    setOpenEventId(ev.id);
    const { data, error: loadError } = await supabase
      .from("event_riddles")
      .select("*")
      .eq("event_id", ev.id)
      .order("position", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRiddles((current) => ({
      ...current,
      [ev.id]: (data || []).map((r) => ({ ...r, isNew: false })),
    }));
  }

  async function toggleRiddles(ev) {
    if (!supabase) return;
    const next = !ev.riddles_enabled;
    setSaving(`riddles-${ev.id}`);
    const { error: updateError } = await supabase
      .from("events")
      .update({ riddles_enabled: next })
      .eq("id", ev.id);
    if (updateError) setError(updateError.message);
    else {
      setEvents((current) => current.map((item) => item.id === ev.id ? { ...item, riddles_enabled: next } : item));
      if (next) await loadRiddles({ ...ev, riddles_enabled: next });
    }
    setSaving(null);
  }

  function addRiddle(eventId) {
    setRiddles((current) => {
      const list = current[eventId] || [];
      if (list.length >= 8) return current;
      return {
        ...current,
        [eventId]: [...list, { id: null, question: "", answer: "", hint: "", isNew: true }],
      };
    });
  }

  function updateRiddle(eventId, index, field, value) {
    setRiddles((current) => ({
      ...current,
      [eventId]: (current[eventId] || []).map((r, i) => i === index ? { ...r, [field]: value } : r),
    }));
  }

  async function saveRiddle(eventId, index) {
    if (!supabase) return;
    const riddle = (riddles[eventId] || [])[index];
    if (!riddle?.question?.trim() || !riddle?.answer?.trim()) {
      setError("La question et la réponse sont obligatoires.");
      return;
    }
    setSaving(`riddle-${eventId}-${index}`);
    const payload = {
      event_id: eventId,
      question: riddle.question.trim(),
      answer: riddle.answer.trim(),
      hint: riddle.hint?.trim() || "Essaie encore 😉",
      position: index,
    };
    let result;
    if (riddle.id) {
      result = await supabase.from("event_riddles").update(payload).eq("id", riddle.id).select().single();
    } else {
      result = await supabase.from("event_riddles").insert(payload).select().single();
    }
    if (result.error) setError(result.error.message);
    else {
      setRiddles((current) => ({
        ...current,
        [eventId]: (current[eventId] || []).map((r, i) => i === index ? { ...result.data, isNew: false } : r),
      }));
    }
    setSaving(null);
  }

  async function deleteRiddle(eventId, index) {
    if (!supabase) return;
    const riddle = (riddles[eventId] || [])[index];
    if (riddle?.id) await supabase.from("event_riddles").delete().eq("id", riddle.id);
    setRiddles((current) => ({
      ...current,
      [eventId]: (current[eventId] || []).filter((_, i) => i !== index),
    }));
  }

  const styles = {
    page: { minHeight: "100vh", background: "#F8F4ED", color: "#332C28", padding: "24px", fontFamily: "Inter, system-ui, sans-serif" },
    wrap: { maxWidth: "900px", margin: "0 auto" },
    card: { background: "#fff", border: "1px solid #E8DED0", borderRadius: "18px", padding: "18px", marginBottom: "14px", boxShadow: "0 8px 24px rgba(70,50,30,.05)" },
    row: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", flexWrap: "wrap" },
    button: { border: 0, borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontWeight: 700, background: "#3E4E7A", color: "#fff" },
    offButton: { border: "1px solid #D9CFC3", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontWeight: 700, background: "#fff", color: "#4B423D" },
    input: { width: "100%", border: "1px solid #DDD2C5", borderRadius: "10px", padding: "10px 12px", fontSize: "15px", marginTop: "8px" },
    small: { color: "#7D7067", fontSize: "13px" },
  };

  if (!authed) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.wrap, maxWidth: 420, paddingTop: 80 }}>
          <form onSubmit={handleLogin} style={styles.card}>
            <h1 style={{ marginTop: 0 }}>Admin · Animations</h1>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mot de passe admin" style={styles.input} />
            {authError && <p style={{ color: "#B5402D" }}>{authError}</p>}
            <button type="submit" style={{ ...styles.button, width: "100%", marginTop: 12 }}>Se connecter</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ marginBottom: 22 }}>
          <a href="/admin" style={{ color: "#3E4E7A", textDecoration: "none", fontWeight: 700 }}>← Retour à l’admin</a>
          <h1 style={{ marginBottom: 6 }}>Animations · Le Fil</h1>
          <p style={{ marginTop: 0, color: "#74675F" }}>Active ou désactive les devinettes et le nuage de mots pour chaque événement.</p>
        </div>

        {error && <div style={{ ...styles.card, borderColor: "#E2A49A", color: "#A13B2C" }}>{error}</div>}
        {loading && <p>Chargement…</p>}

        {events.map((ev) => {
          const eventRiddles = riddles[ev.id] || [];
          const isOpen = openEventId === ev.id;
          return (
            <section key={ev.id} style={styles.card}>
              <div style={styles.row}>
                <div>
                  <strong style={{ fontSize: 17 }}>{ev.event_title}</strong>
                  <div style={styles.small}>{ev.client} · {ev.event_type}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => toggleRiddles(ev)} disabled={saving === `riddles-${ev.id}`} style={ev.riddles_enabled ? styles.button : styles.offButton}>
                    {ev.riddles_enabled ? "✓ Devinettes" : "+ Devinettes"}
                  </button>
                  <button type="button" onClick={() => toggleWordCloud(ev)} disabled={saving === `word-${ev.id}`} style={ev.word_cloud_enabled ? styles.button : styles.offButton}>
                    {ev.word_cloud_enabled ? "✓ Nuage de mots" : "+ Nuage de mots"}
                  </button>
                </div>
              </div>

              {ev.riddles_enabled && (
                <div style={{ marginTop: 16, borderTop: "1px solid #EEE5DA", paddingTop: 14 }}>
                  {!isOpen ? (
                    <button type="button" style={styles.offButton} onClick={() => loadRiddles(ev)}>Configurer les devinettes</button>
                  ) : (
                    <>
                      {eventRiddles.length === 0 && <p style={styles.small}>Aucune devinette pour l’instant.</p>}
                      {eventRiddles.map((riddle, index) => (
                        <div key={riddle.id || `new-${index}`} style={{ background: "#FBF8F3", borderRadius: 12, padding: 12, marginTop: 10 }}>
                          <strong>Devinette {index + 1}</strong>
                          <input style={styles.input} value={riddle.question || ""} onChange={(e) => updateRiddle(ev.id, index, "question", e.target.value)} placeholder="Question" />
                          <input style={styles.input} value={riddle.answer || ""} onChange={(e) => updateRiddle(ev.id, index, "answer", e.target.value)} placeholder="Bonne réponse" />
                          <input style={styles.input} value={riddle.hint || ""} onChange={(e) => updateRiddle(ev.id, index, "hint", e.target.value)} placeholder="Indice (optionnel)" />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button type="button" style={styles.button} onClick={() => saveRiddle(ev.id, index)} disabled={saving === `riddle-${ev.id}-${index}`}>Enregistrer</button>
                            <button type="button" style={styles.offButton} onClick={() => deleteRiddle(ev.id, index)}>Supprimer</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" style={{ ...styles.offButton, marginTop: 12 }} onClick={() => addRiddle(ev.id)}>+ Ajouter une devinette</button>
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
