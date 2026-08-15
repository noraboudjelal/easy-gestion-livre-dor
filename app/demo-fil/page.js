"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const DEMO_SLUG = "sarah-karim-demo";
const DEMO_DATE = "24 mai 2025";

export default function DemoFilPage() {
  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [words, setWords] = useState([]);
  const [riddles, setRiddles] = useState([]);
  const [word, setWord] = useState("");
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [riddleResult, setRiddleResult] = useState(null);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [requester, setRequester] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data: ev } = await supabase.from("events").select("*").eq("slug", DEMO_SLUG).single();
    if (!ev) return setLoading(false);
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
    words.forEach((x) => {
      const k = (x.word || "").trim().toLowerCase();
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  }, [words]);

  async function addWord(e) {
    e.preventDefault();
    const clean = word.trim().slice(0, 28);
    if (!clean || !event) return;
    await supabase.from("word_cloud_entries").insert({ event_id: event.id, word: clean });
    setWord("");
    load();
  }

  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
  }

  function checkRiddle(e) {
    e.preventDefault();
    const current = riddles[riddleIndex];
    if (!current || !riddleAnswer.trim()) return;
    const a = normalize(current.answer), b = normalize(riddleAnswer);
    setRiddleResult(b === a || b.includes(a) || a.includes(b) ? "good" : "bad");
  }

  function nextRiddle() {
    setRiddleIndex((i) => riddles.length ? (i + 1) % riddles.length : 0);
    setRiddleAnswer("");
    setRiddleResult(null);
  }

  async function sendSong(e) {
    e.preventDefault();
    if (!event || !songTitle.trim()) return;
    await supabase.from("playlist_requests").insert({
      event_id: event.id,
      song_title: songTitle.trim(),
      artist: artist.trim() || null,
      requester_name: requester.trim() || null,
    });
    setSongTitle(""); setArtist(""); setRequester("");
  }

  if (loading) return <main style={s.center}>Chargement…</main>;
  if (!event) return <main style={s.center}>Démo introuvable.</main>;

  const riddle = riddles[riddleIndex];
  const firstPoll = polls[0];

  return (
    <main style={s.page}>
      <div style={s.app}>
        <header style={s.header}>
          <div>
            <h1 style={s.names}>Sarah <span style={s.amp}>&</span> Karim</h1>
            <div style={s.date}>{DEMO_DATE}</div>
          </div>
          <div style={s.navScroller}>
            <a href="#quiz" style={s.navPill}>Quiz</a>
            <a href="#dj" style={s.navPill}>Musique</a>
            <a href="#riddles" style={s.navPill}>Devinettes</a>
            <a href="#souvenir" style={s.navPill}>Souvenir</a>
            <a href="#feed" style={s.navPill}>Le Fil</a>
            <a href="#fund" style={s.navPill}>Cagnotte</a>
            <a href="#words" style={s.navPill}>Nuage de mots</a>
          </div>
        </header>

        <section id="quiz" style={s.section}>
          <h2 style={s.sectionTitle}>Petit quiz</h2>
          {firstPoll && (
            <div style={s.card}>
              <p style={s.question}>{firstPoll.question}</p>
              <div style={s.stack}>{(firstPoll.options || []).map((o, i) => <button key={i} style={s.choice}>{o}</button>)}</div>
            </div>
          )}
        </section>

        {event.playlist_enabled && (
          <section id="dj" style={s.sectionAlt}>
            <h2 style={s.sectionTitle}>Une chanson pour la soirée</h2>
            <p style={s.sectionLead}>Proposez un titre, le DJ reçoit la demande directement.</p>
            <form onSubmit={sendSong} style={s.stack}>
              <input style={s.input} value={songTitle} onChange={(e)=>setSongTitle(e.target.value)} placeholder="Titre de la chanson" />
              <input style={s.input} value={artist} onChange={(e)=>setArtist(e.target.value)} placeholder="Artiste" />
              <input style={s.input} value={requester} onChange={(e)=>setRequester(e.target.value)} placeholder="Votre prénom (facultatif)" />
              <button style={s.primary}>Envoyer au DJ</button>
            </form>
          </section>
        )}

        {event.riddles_enabled && riddle && (
          <section id="riddles" style={s.section}>
            <h2 style={s.sectionTitle}>Devinettes</h2>
            <div style={s.card}>
              <div style={s.counter}>{riddleIndex + 1} / {riddles.length}</div>
              <p style={s.question}>{riddle.question}</p>
              <form onSubmit={checkRiddle} style={s.stack}>
                <input style={s.input} value={riddleAnswer} onChange={(e)=>{setRiddleAnswer(e.target.value);setRiddleResult(null);}} placeholder="Votre réponse" />
                <button style={s.primary}>Valider</button>
              </form>
              {riddleResult === "good" && <p style={s.good}>Bien joué ✨</p>}
              {riddleResult === "bad" && <p style={s.bad}>Pas tout à fait. Indice : {riddle.hint}</p>}
              {riddleResult && <button onClick={nextRiddle} style={s.textBtn}>Devinette suivante →</button>}
            </div>
          </section>
        )}

        <section id="souvenir" style={s.memorySection}>
          <h2 style={s.memoryTitle}>Laissez votre souvenir</h2>
          <p style={s.memoryLead}>Choisissez simplement ce que vous voulez laisser aux mariés.</p>
          <div style={s.memoryGrid}>
            <button style={s.memoryBtn}><span style={s.memoryIcon}>📷</span><b>Photo ou vidéo</b></button>
            <button style={s.memoryBtn}><span style={s.memoryIcon}>✍️</span><b>Écrire un mot</b></button>
            <button style={s.memoryBtn}><span style={s.memoryIcon}>🎙️</span><b>Message vocal</b></button>
          </div>
        </section>

        <section id="feed" style={s.section}>
          <h2 style={s.sectionTitle}>Le Fil</h2>
          <div style={s.feed}>
            {messages.slice(0, 6).map((m) => (
              <article key={m.id} style={s.post}>
                {m.photo_url && <img src={m.photo_url} alt="Souvenir" style={s.photo} />}
                <div style={s.postBody}>
                  <div style={s.meta}><b>{m.name || "Invité"}</b><span>♡ {m.likes_count || 0}</span></div>
                  {m.message && <p style={s.message}>{m.message}</p>}
                  {m.audio_url && <audio controls src={m.audio_url} style={{width:"100%"}} />}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="fund" style={s.sectionAlt}>
          <h2 style={s.sectionTitle}>Cagnotte</h2>
          <p style={s.sectionLead}>Pour ceux qui souhaitent participer au voyage de noces des mariés.</p>
          <button style={s.outline}>Voir la cagnotte</button>
        </section>

        {event.word_cloud_enabled && (
          <section id="words" style={s.section}>
            <h2 style={s.sectionTitle}>Nuage de mots</h2>
            <p style={s.sectionLead}>Décrivez Sarah & Karim en un mot.</p>
            <div style={s.cloud}>
              {wordCloud.map(([label, count], i)=><span key={label} style={{...s.cloudWord,fontSize:`${18 + Math.min(18,count*4)}px`,opacity:Math.max(.55,1-i*.06)}}>{label}</span>)}
            </div>
            <form onSubmit={addWord} style={s.inline}>
              <input style={s.input} value={word} onChange={(e)=>setWord(e.target.value)} placeholder="Votre mot…" maxLength={28} />
              <button style={s.primary}>Ajouter</button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

const s = {
  page:{minHeight:"100vh",background:"#eee8df",padding:"0",fontFamily:"Inter,system-ui,sans-serif",color:"#2c241f"},
  center:{minHeight:"100vh",display:"grid",placeItems:"center",background:"#eee8df",fontFamily:"Inter,sans-serif"},
  app:{width:"100%",maxWidth:"760px",margin:"0 auto",background:"#fbfaf7",minHeight:"100vh"},
  header:{padding:"34px 22px 18px",position:"sticky",top:0,zIndex:20,background:"rgba(251,250,247,.96)",backdropFilter:"blur(14px)",borderBottom:"1px solid #e8dfd4"},
  names:{margin:0,fontFamily:"'Times New Roman',Georgia,serif",fontWeight:400,fontSize:"clamp(38px,9vw,60px)",lineHeight:1,letterSpacing:"-.035em"},
  amp:{fontStyle:"italic",color:"#b48a52"},
  date:{marginTop:"8px",fontSize:"12px",letterSpacing:".14em",textTransform:"uppercase",color:"#8b7b6a"},
  navScroller:{display:"flex",gap:"8px",overflowX:"auto",paddingTop:"18px",scrollbarWidth:"none"},
  navPill:{flex:"0 0 auto",textDecoration:"none",color:"#5d4d40",border:"1px solid #d9cec1",background:"#fff",borderRadius:"999px",padding:"9px 13px",fontSize:"12px",fontWeight:700},
  section:{padding:"72px 22px 76px",borderBottom:"10px solid #f0ebe4"},
  sectionAlt:{padding:"72px 22px 76px",background:"#f3eee7",borderBottom:"10px solid #fbfaf7"},
  sectionTitle:{fontFamily:"'Times New Roman',Georgia,serif",fontWeight:400,fontSize:"clamp(40px,8vw,58px)",lineHeight:.98,letterSpacing:"-.035em",margin:"0 0 26px"},
  sectionLead:{fontSize:"15px",lineHeight:1.65,color:"#756a61",margin:"-12px 0 26px",maxWidth:"560px"},
  card:{background:"#fff",border:"1px solid #e2d8cc",borderRadius:"22px",padding:"24px",boxShadow:"0 8px 24px rgba(75,58,40,.05)"},
  question:{fontFamily:"'Times New Roman',Georgia,serif",fontSize:"27px",lineHeight:1.25,margin:"0 0 22px"},
  stack:{display:"grid",gap:"10px"},
  choice:{background:"#fff",border:"1px solid #d7cab9",borderRadius:"14px",padding:"15px 16px",textAlign:"left",fontSize:"15px",cursor:"pointer"},
  input:{width:"100%",boxSizing:"border-box",background:"#fff",border:"1px solid #d6c9ba",borderRadius:"14px",padding:"14px 15px",fontSize:"15px",outline:"none"},
  primary:{background:"#2f2924",color:"#fff",border:0,borderRadius:"14px",padding:"14px 18px",fontWeight:800,fontSize:"14px",cursor:"pointer"},
  counter:{fontSize:"12px",fontWeight:800,letterSpacing:".12em",color:"#9b7c58",marginBottom:"12px"},
  good:{color:"#56775b",fontWeight:800,marginBottom:0},
  bad:{color:"#9c5d50",lineHeight:1.5,marginBottom:0},
  textBtn:{border:0,background:"none",padding:"12px 0 0",fontWeight:800,color:"#8f6d43",cursor:"pointer"},
  memorySection:{padding:"78px 22px 82px",background:"#2d2824",color:"#fff",borderBottom:"10px solid #f0ebe4"},
  memoryTitle:{fontFamily:"'Times New Roman',Georgia,serif",fontWeight:400,fontSize:"clamp(42px,9vw,62px)",lineHeight:.98,letterSpacing:"-.035em",margin:"0 0 16px"},
  memoryLead:{color:"#cfc5ba",fontSize:"15px",lineHeight:1.6,margin:"0 0 28px"},
  memoryGrid:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"10px"},
  memoryBtn:{minHeight:"118px",background:"#3a342f",color:"#fff",border:"1px solid #5a5047",borderRadius:"18px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",padding:"14px 8px",fontSize:"13px"},
  memoryIcon:{fontSize:"26px"},
  feed:{display:"grid",gap:"22px"},
  post:{background:"#fff",border:"1px solid #e3d9ce",borderRadius:"20px",overflow:"hidden",boxShadow:"0 8px 24px rgba(76,57,38,.05)"},
  photo:{width:"100%",maxHeight:"520px",objectFit:"cover",display:"block"},
  postBody:{padding:"18px"},
  meta:{display:"flex",justifyContent:"space-between",fontSize:"13px",color:"#74695f"},
  message:{fontFamily:"'Times New Roman',Georgia,serif",fontSize:"22px",lineHeight:1.4,margin:"14px 0 0"},
  outline:{background:"transparent",border:"1px solid #9e805b",color:"#6e5437",borderRadius:"14px",padding:"13px 16px",fontWeight:800},
  cloud:{minHeight:"210px",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:"12px 18px",padding:"28px 18px",background:"#f2ece3",borderRadius:"20px"},
  cloudWord:{fontFamily:"'Times New Roman',Georgia,serif",color:"#806447",lineHeight:1},
  inline:{display:"grid",gridTemplateColumns:"1fr auto",gap:"10px",marginTop:"14px"}
};