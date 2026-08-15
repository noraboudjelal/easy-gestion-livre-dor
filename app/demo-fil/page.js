"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const DEMO_SLUG = "sarah-karim-demo";

export default function DemoFilPage() {
  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [words, setWords] = useState([]);
  const [riddles, setRiddles] = useState([]);
  const [word, setWord] = useState("");
  const [wordSent, setWordSent] = useState(false);
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [riddleResult, setRiddleResult] = useState(null);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [requester, setRequester] = useState("");
  const [songSent, setSongSent] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data: ev } = await supabase.from("events").select("*").eq("slug", DEMO_SLUG).single();
    if (!ev) {
      setLoading(false);
      return;
    }
    setEvent(ev);
    const [m, p, w, r] = await Promise.all([
      supabase.from("messages").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
      supabase.from("poll_questions").select("*").eq("event_id", ev.id).order("position", { ascending: true }),
      supabase.from("word_cloud_entries").select("*").eq("event_id", ev.id).order("created_at", { ascending: true }),
      supabase.from("event_riddles").select("*").eq("event_id", ev.id).order("position", { ascending: true }),
    ]);
    setMessages(m.data || []);
    setPolls(p.data || []);
    setWords(w.data || []);
    setRiddles(r.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const wordCloud = useMemo(() => {
    const counts = {};
    words.forEach((entry) => {
      const normalized = (entry.word || "").trim().toLowerCase();
      if (normalized) counts[normalized] = (counts[normalized] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], index) => ({ label, count, size: Math.min(34, 15 + count * 5 + (index === 0 ? 4 : 0)) }));
  }, [words]);

  async function addWord(e) {
    e.preventDefault();
    const clean = word.trim().replace(/\s+/g, " ").slice(0, 28);
    if (!clean || !event || !supabase) return;
    const { error } = await supabase.from("word_cloud_entries").insert({ event_id: event.id, word: clean });
    if (!error) {
      setWord("");
      setWordSent(true);
      setTimeout(() => setWordSent(false), 1600);
      load();
    }
  }

  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
  }

  function checkRiddle(e) {
    e.preventDefault();
    const current = riddles[riddleIndex];
    if (!current || !riddleAnswer.trim()) return;
    const expected = normalize(current.answer);
    const got = normalize(riddleAnswer);
    setRiddleResult(got === expected || got.includes(expected) || expected.includes(got) ? "good" : "bad");
  }

  function nextRiddle() {
    if (!riddles.length) return;
    setRiddleIndex((i) => (i + 1) % riddles.length);
    setRiddleAnswer("");
    setRiddleResult(null);
  }

  async function sendSong(e) {
    e.preventDefault();
    if (!event || !songTitle.trim() || !supabase) return;
    const { error } = await supabase.from("playlist_requests").insert({
      event_id: event.id,
      song_title: songTitle.trim(),
      artist: artist.trim() || null,
      requester_name: requester.trim() || null,
    });
    if (!error) {
      setSongTitle(""); setArtist(""); setRequester(""); setSongSent(true);
      setTimeout(() => setSongSent(false), 1800);
    }
  }

  if (loading) return <main style={styles.loading}>Chargement de la démo…</main>;
  if (!event) return <main style={styles.loading}>Démo introuvable.</main>;

  const currentRiddle = riddles[riddleIndex];

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroShade} />
          <div style={styles.heroContent}>
            <div style={styles.kicker}>LE FIL · MARIAGE</div>
            <h1 style={styles.names}>Sarah <span style={styles.amp}>&</span> Karim</h1>
            <p style={styles.heroText}>Une soirée, vos mots, vos photos, leurs souvenirs.</p>
            <div style={styles.quickRow}>
              <a href="#souvenir" style={styles.quickBtn}>＋ Souvenir</a>
              <a href="#quiz" style={styles.quickBtn}>♡ Quiz</a>
              <a href="#dj" style={styles.quickBtn}>♫ DJ</a>
              <a href="#jeux" style={styles.quickBtn}>✦ Jeux</a>
            </div>
          </div>
        </header>

        <section id="souvenir" style={styles.introBlock}>
          <div style={styles.eyebrow}>CE SOIR</div>
          <h2 style={styles.sectionTitle}>Laissez une trace de la soirée</h2>
          <p style={styles.copy}>Photos, mots et messages vocaux restent au cœur de l’expérience. Le reste vient rythmer le Fil sans le transformer en menu.</p>
          <div style={styles.actionStrip}>
            <div style={styles.actionItem}><span>📷</span><b>Photo</b><small>Ajouter un souvenir</small></div>
            <div style={styles.actionItem}><span>✍️</span><b>Un mot</b><small>Écrire aux mariés</small></div>
            <div style={styles.actionItem}><span>🎙️</span><b>Vocal</b><small>Laisser sa voix</small></div>
          </div>
        </section>

        <section style={styles.feedSection}>
          <div style={styles.feedHeader}>
            <div><div style={styles.eyebrow}>EN DIRECT</div><h2 style={styles.feedTitle}>Le Fil de la soirée</h2></div>
            <span style={styles.livePill}>● ça vit</span>
          </div>
          <div style={styles.feedGrid}>
            {messages.slice(0, 6).map((m, i) => (
              <article key={m.id} style={i === 0 && m.photo_url ? styles.featurePost : styles.post}>
                {m.photo_url && <img src={m.photo_url} alt="Souvenir invité" style={styles.postPhoto} />}
                <div style={styles.postBody}>
                  <div style={styles.postMeta}><b>{m.name || "Invité"}</b><span>♡ {m.likes_count || 0}</span></div>
                  {m.message && <p style={styles.postText}>{m.message}</p>}
                  {m.audio_url && <audio controls src={m.audio_url} style={{ width: "100%" }} />}
                </div>
              </article>
            ))}
          </div>
        </section>

        {polls.length > 0 && (
          <section id="quiz" style={styles.interlude}>
            <div style={styles.interludeTop}><span style={styles.bigNum}>01</span><div><div style={styles.eyebrow}>PETIT QUIZ</div><h2 style={styles.sectionTitle}>Entre deux souvenirs…</h2></div></div>
            <div style={styles.quizCard}>
              <h3 style={styles.quizQuestion}>{polls[0].question}</h3>
              <div style={styles.quizOptions}>{(polls[0].options || []).map((o, i) => <button key={i} style={styles.quizOption}>{o}</button>)}</div>
            </div>
          </section>
        )}

        {event.word_cloud_enabled && (
          <section id="jeux" style={styles.wordSection}>
            <div style={styles.interludeTop}><span style={styles.bigNum}>02</span><div><div style={styles.eyebrow}>COLLECTIF</div><h2 style={styles.sectionTitle}>Décrivez-les en un mot</h2></div></div>
            <div style={styles.cloud}>
              {wordCloud.map((item, i) => <span key={item.label} style={{ ...styles.cloudWord, fontSize: `${item.size}px`, opacity: Math.max(.55, 1 - i * .045) }}>{item.label}</span>)}
            </div>
            <form onSubmit={addWord} style={styles.inlineForm}>
              <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={28} placeholder="Ton mot…" style={styles.input} />
              <button style={styles.goldBtn}>{wordSent ? "Ajouté ✓" : "Ajouter"}</button>
            </form>
          </section>
        )}

        {event.riddles_enabled && currentRiddle && (
          <section style={styles.riddleSection}>
            <div style={styles.interludeTop}><span style={styles.bigNum}>03</span><div><div style={styles.eyebrow}>DÉFI EXPRESS</div><h2 style={styles.sectionTitle}>Une devinette rien que pour vous</h2></div></div>
            <div style={styles.riddleCard}>
              <div style={styles.riddleCount}>{riddleIndex + 1} / {riddles.length}</div>
              <p style={styles.riddleQuestion}>{currentRiddle.question}</p>
              <form onSubmit={checkRiddle} style={styles.riddleForm}>
                <input value={riddleAnswer} onChange={(e) => { setRiddleAnswer(e.target.value); setRiddleResult(null); }} placeholder="Votre réponse" style={styles.input} />
                <button style={styles.darkBtn}>Valider</button>
              </form>
              {riddleResult === "good" && <p style={styles.good}>Bien joué ✨</p>}
              {riddleResult === "bad" && <p style={styles.bad}>Pas tout à fait. Indice : {currentRiddle.hint}</p>}
              {riddleResult && <button onClick={nextRiddle} style={styles.linkBtn}>Devinette suivante →</button>}
            </div>
          </section>
        )}

        {event.playlist_enabled && (
          <section id="dj" style={styles.djSection}>
            <div style={styles.djIntro}><div style={styles.eyebrowLight}>POUR LA PISTE</div><h2 style={styles.djTitle}>Vous voulez entendre quoi ?</h2><p style={styles.djCopy}>Envoyez votre titre directement au DJ, sans interrompre la soirée.</p></div>
            <form onSubmit={sendSong} style={styles.djForm}>
              <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Titre de la chanson" style={styles.darkInput} />
              <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artiste" style={styles.darkInput} />
              <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Votre prénom (facultatif)" style={styles.darkInput} />
              <button style={styles.djBtn}>{songSent ? "Envoyée ✓" : "Envoyer au DJ"}</button>
            </form>
          </section>
        )}

        <section style={styles.fundSection}>
          <div style={styles.fundText}><div style={styles.eyebrow}>UN PETIT PLUS</div><h2 style={styles.sectionTitle}>Leur prochaine aventure</h2><p style={styles.copy}>Votre présence est déjà leur plus beau cadeau. Une cagnotte peut être affichée ici uniquement si les mariés le souhaitent.</p></div>
          <button style={styles.fundBtn}>Voir la cagnotte ↗</button>
        </section>

        <footer style={styles.footer}><span>LEHNOVA</span><small>Le Fil · souvenirs connectés</small></footer>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#eee9df", padding: "24px 12px 64px", color: "#27211d", fontFamily: "Inter, system-ui, sans-serif" },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#eee9df", fontFamily: "Inter, sans-serif" },
  shell: { width: "100%", maxWidth: "720px", margin: "0 auto", background: "#fbfaf6", boxShadow: "0 30px 90px rgba(52,41,28,.16)", overflow: "hidden" },
  hero: { minHeight: "520px", position: "relative", backgroundImage: "linear-gradient(120deg,rgba(25,22,19,.12),rgba(25,22,19,.35)),url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=88')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end" },
  heroShade: { position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,18,16,.04) 35%,rgba(20,18,16,.76) 100%)" },
  heroContent: { position: "relative", zIndex: 2, color: "#fff", padding: "48px 42px 34px", width: "100%" },
  kicker: { fontSize: "11px", letterSpacing: ".24em", fontWeight: 800, opacity: .82, marginBottom: "10px" },
  names: { margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, fontSize: "clamp(48px,11vw,78px)", lineHeight: .95, letterSpacing: "-.035em" },
  amp: { color: "#d7b472", fontStyle: "italic", fontSize: ".7em" },
  heroText: { fontFamily: "Georgia, serif", fontStyle: "italic", opacity: .86, fontSize: "17px", margin: "14px 0 25px" },
  quickRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  quickBtn: { color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.42)", borderRadius: "999px", padding: "9px 13px", fontSize: "12px", backdropFilter: "blur(7px)", background: "rgba(255,255,255,.08)" },
  introBlock: { padding: "52px 42px 34px" },
  eyebrow: { fontSize: "10px", letterSpacing: ".22em", fontWeight: 800, color: "#9b7947", marginBottom: "8px" },
  eyebrowLight: { fontSize: "10px", letterSpacing: ".22em", fontWeight: 800, color: "#d8bc86", marginBottom: "8px" },
  sectionTitle: { margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, fontSize: "clamp(30px,6vw,42px)", lineHeight: 1.08, letterSpacing: "-.025em" },
  copy: { color: "#746a61", fontSize: "14px", lineHeight: 1.75, maxWidth: "560px" },
  actionStrip: { marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", borderTop: "1px solid #ded5c8", borderBottom: "1px solid #ded5c8" },
  actionItem: { padding: "18px 10px", display: "flex", flexDirection: "column", gap: "3px", textAlign: "center", borderRight: "1px solid #ded5c8", fontSize: "13px" },
  feedSection: { padding: "26px 42px 50px" },
  feedHeader: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: "20px", marginBottom: "22px" },
  feedTitle: { margin: 0, fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "34px" },
  livePill: { fontSize: "11px", border: "1px solid #d6c8b4", padding: "7px 10px", borderRadius: "999px", color: "#8b6b3f" },
  feedGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px" },
  post: { background: "#fff", border: "1px solid #e4ddd3", minWidth: 0 },
  featurePost: { background: "#fff", border: "1px solid #e4ddd3", minWidth: 0, gridColumn: "1 / -1" },
  postPhoto: { width: "100%", height: "230px", objectFit: "cover", display: "block" },
  postBody: { padding: "16px" },
  postMeta: { display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px", color: "#756a60" },
  postText: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "17px", lineHeight: 1.45, margin: "12px 0 0" },
  interlude: { padding: "48px 42px", borderTop: "1px solid #ded5c8", background: "#f4f0e8" },
  interludeTop: { display: "flex", gap: "20px", alignItems: "start", marginBottom: "24px" },
  bigNum: { color: "#c9ad7d", fontFamily: "Georgia, serif", fontSize: "20px", fontStyle: "italic", paddingTop: "4px" },
  quizCard: { background: "#fff", border: "1px solid #ddd2c1", padding: "26px" },
  quizQuestion: { fontFamily: "Georgia, serif", fontSize: "23px", fontWeight: 400, margin: "0 0 18px" },
  quizOptions: { display: "grid", gap: "8px" },
  quizOption: { background: "transparent", border: "1px solid #d6c9b7", padding: "14px 16px", textAlign: "left", fontSize: "14px", cursor: "pointer" },
  wordSection: { padding: "48px 42px", borderTop: "1px solid #ded5c8" },
  cloud: { minHeight: "190px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "10px 18px", padding: "24px 10px", background: "#f3ede3", border: "1px solid #dfd4c4" },
  cloudWord: { fontFamily: "Georgia, serif", color: "#80643e", lineHeight: 1.1 },
  inlineForm: { display: "flex", gap: "8px", marginTop: "12px" },
  input: { flex: 1, minWidth: 0, border: "1px solid #d7cbbb", background: "#fff", padding: "13px 14px", fontSize: "14px", outline: "none" },
  goldBtn: { border: 0, background: "#a98550", color: "#fff", padding: "0 18px", fontWeight: 700, cursor: "pointer" },
  riddleSection: { padding: "48px 42px", borderTop: "1px solid #ded5c8", background: "#fff" },
  riddleCard: { borderLeft: "3px solid #aa8650", padding: "5px 0 5px 22px" },
  riddleCount: { fontSize: "11px", letterSpacing: ".18em", color: "#9b7947", fontWeight: 800 },
  riddleQuestion: { fontFamily: "Georgia, serif", fontSize: "24px", lineHeight: 1.35, margin: "12px 0 20px" },
  riddleForm: { display: "flex", gap: "8px" },
  darkBtn: { border: 0, background: "#302922", color: "#fff", padding: "0 18px", fontWeight: 700 },
  good: { color: "#557b5d", fontWeight: 700, marginBottom: 0 },
  bad: { color: "#9a5a4c", marginBottom: 0, lineHeight: 1.5 },
  linkBtn: { border: 0, background: "none", color: "#8d6b3e", padding: "12px 0 0", cursor: "pointer", fontWeight: 700 },
  djSection: { padding: "48px 42px", background: "#29231f", color: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px" },
  djTitle: { fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "34px", margin: 0 },
  djCopy: { color: "#c8bfb5", fontSize: "13px", lineHeight: 1.6 },
  djForm: { display: "grid", gap: "8px" },
  darkInput: { background: "#38312c", color: "#fff", border: "1px solid #5b4e44", padding: "12px", outline: "none" },
  djBtn: { background: "#d1ac6b", color: "#2b251f", border: 0, padding: "13px", fontWeight: 800, cursor: "pointer" },
  fundSection: { padding: "46px 42px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: "24px", borderTop: "1px solid #ded5c8" },
  fundText: { maxWidth: "470px" },
  fundBtn: { whiteSpace: "nowrap", background: "transparent", border: "1px solid #b79b73", padding: "12px 14px", color: "#705631" },
  footer: { padding: "24px 42px", background: "#f2ede4", borderTop: "1px solid #ded5c8", display: "flex", justifyContent: "space-between", fontSize: "11px", letterSpacing: ".12em", color: "#887762" },
};