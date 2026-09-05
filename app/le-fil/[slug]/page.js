"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const PALETTE = {
  page: "#eee7dc",
  app: "#fffaf2",
  card: "#fffdf9",
  card2: "#fff7eb",
  inner: "#ffffff",
  text: "#392f27",
  textSoft: "#76685b",
  gold: "#b48645",
  goldSoft: "#deb982",
  goldPale: "#eadbc6",
  button: "#3d3128",
};

function normalize(x) {
  return (x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}
function formatEventDate(d) {
  if (!d) return "";
  try { return new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(); } catch { return ""; }
}
function formatPostDate(d) {
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function getVisitorId() {
  if (typeof window === "undefined") return "";
  const key = "le-fil-visitor-id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    window.localStorage.setItem(key, id);
  }
  return id;
}

function EggReveal({ revealAt, revealGender }) {
  const target = new Date(revealAt).getTime();
  const [now, setNow] = useState(Date.now());
  const [cracks, setCracks] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shake, setShake] = useState(false);
  const ready = now >= target;
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(target - now, 0);
  const hh = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  function tap() {
    if (!ready) { setShake(true); setTimeout(() => setShake(false), 450); return; }
    const n = cracks + 1;
    if (n >= 5) setRevealed(true); else setCracks(n);
  }
  return <section id="reveal" className="section revealSection">
    <h2 className="sectionTitle">La révélation ✨</h2>
    <div className="sectionSub">Un petit secret est sur le point d’éclore…</div>
    {revealed ? <div className="revealResult"><div className="balloon">🎈</div><div className="revealText">{revealGender === "garcon" ? "C’est un garçon !" : "C’est une fille !"}</div></div> : <div className="eggWrap">
      {!ready && <div className="eggTimer">Révélation dans <b>{hh}:{mm}:{ss}</b></div>}
      {ready && <div className="eggHint">Touchez l’œuf pour le faire éclore</div>}
      <button type="button" className={`egg ${shake ? "shake" : ""}`} onClick={tap} aria-label="Ouvrir l'œuf">🥚</button>
      {ready && <div className="cracks">{cracks}/5</div>}
    </div>}
  </section>;
}

export default function LeFilEventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [riddles, setRiddles] = useState([]);
  const [words, setWords] = useState([]);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [requester, setRequester] = useState("");
  const [songSent, setSongSent] = useState(false);
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [riddleResult, setRiddleResult] = useState(null);
  const [word, setWord] = useState("");
  const [voted, setVoted] = useState({});

  async function load() {
    if (!supabase || !slug) return;
    const { data: ev } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (!ev) { setLoading(false); return; }
    setEvent(ev);
    const [m, p, r, w, l, settings] = await Promise.all([
      supabase.from("messages").select("*").eq("event_id", ev.id).order("created_at", { ascending: false }),
      supabase.from("poll_questions").select("*").eq("event_id", ev.id).order("position"),
      supabase.from("event_riddles").select("*").eq("event_id", ev.id).order("position"),
      supabase.from("word_cloud_entries").select("*").eq("event_id", ev.id),
      supabase.from("message_likes").select("message_id,visitor_id"),
      supabase.from("event_fil_settings").select("welcome_message").eq("event_id", ev.id).maybeSingle(),
    ]);
    setMessages(m.data || []); setPolls(p.data || []); setRiddles(r.data || []); setWords(w.data || []);
    setWelcomeMessage(settings.data?.welcome_message || "");
    const vid = getVisitorId();
    const mine = {}; (l.data || []).forEach(x => { if (x.visitor_id === vid) mine[x.message_id] = true; }); setLiked(mine);
    if (typeof window !== "undefined") {
      const vv = {}; (p.data || []).forEach(q => { if (localStorage.getItem(`poll-voted-${q.id}`) === "1") vv[q.id] = true; }); setVoted(vv);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [slug]);

  const cloud = useMemo(() => {
    const c = {}; words.forEach(x => { const k=(x.word||"").trim().toLowerCase(); if(k)c[k]=(c[k]||0)+1; }); return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [words]);

  async function vote(qid, idx) {
    if (voted[qid]) return;
    const { error } = await supabase.rpc("increment_poll_question_vote", { p_question_id: qid, p_option_index: idx });
    if (!error) { localStorage.setItem(`poll-voted-${qid}`, "1"); setVoted(v => ({...v,[qid]:true})); load(); }
  }
  async function like(messageId) {
    if (liked[messageId]) return;
    const visitor_id = getVisitorId();
    const { error } = await supabase.from("message_likes").insert({ message_id: messageId, visitor_id });
    if (!error || error.code === "23505") { setLiked(v => ({...v,[messageId]:true})); load(); }
  }
  async function sendSong(e) {
    e.preventDefault(); if (!song.trim()) return;
    const { error } = await supabase.from("playlist_requests").insert({ event_id:event.id, song_title:song.trim(), artist:artist.trim()||null, requester_name:requester.trim()||null });
    if (!error) { setSong(""); setArtist(""); setRequester(""); setSongSent(true); setTimeout(()=>setSongSent(false),2200); }
  }
  function checkRiddle(e) {
    e.preventDefault(); const r = riddles[riddleIndex]; if (!r || !riddleAnswer.trim()) return;
    const a=normalize(r.answer), b=normalize(riddleAnswer); setRiddleResult(b===a || b.includes(a) || a.includes(b) ? "good" : "bad");
  }
  async function addWord(e) {
    e.preventDefault(); if(!word.trim()) return;
    const { error }=await supabase.from("word_cloud_entries").insert({event_id:event.id,word:word.trim().slice(0,28)}); if(!error){setWord("");load();}
  }
  function handleFiles(e){ setPhotos(Array.from(e.target.files || [])); }
  async function startRecording(){
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}); chunksRef.current=[];
      const rec=new MediaRecorder(stream); mediaRecorderRef.current=rec;
      rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
      rec.onstop=()=>{const b=new Blob(chunksRef.current,{type:rec.mimeType||"audio/webm"});setAudioBlob(b);setAudioUrl(URL.createObjectURL(b));stream.getTracks().forEach(t=>t.stop());};
      rec.start(); setRecording(true); setSeconds(0); timerRef.current=setInterval(()=>setSeconds(s=>s+1),1000);
    } catch {}
  }
  function stopRecording(){mediaRecorderRef.current?.stop();setRecording(false);clearInterval(timerRef.current)}
  async function uploadFile(bucket,file,folder){
    if(!file)return null; const ext=(file.name?.split(".").pop()||"bin"); const path=`${event.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const {error}=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type||undefined}); if(error)return null; const {data}=supabase.storage.from(bucket).getPublicUrl(path); return data?.publicUrl||null;
  }
  async function submitMemory(e){
    e.preventDefault(); if(!text.trim() && !audioBlob && photos.length===0 && !video)return; setSending(true);
    const photoUrls=[]; for(const f of photos){const u=await uploadFile("guestbook-photos",f,"photos"); if(u)photoUrls.push(u)}
    const videoUrl=video?await uploadFile("guestbook-media",video,"videos"):null;
    let voiceUrl=null; if(audioBlob){const file=new File([audioBlob],`voice-${Date.now()}.webm`,{type:audioBlob.type||"audio/webm"});voiceUrl=await uploadFile("guestbook-media",file,"audio")}
    const {error}=await supabase.from("messages").insert({event_id:event.id,name:name.trim()||"Anonyme",message:text.trim().slice(0,400),photo_url:photoUrls[0]||null,photo_urls:photoUrls,video_url:videoUrl,audio_url:voiceUrl,ink:PALETTE.gold,rotation:0});
    setSending(false); if(!error){setName("");setText("");setPhotos([]);setVideo(null);setAudioBlob(null);setAudioUrl("");setSent(true);setTimeout(()=>setSent(false),2200);load();}
  }

  if (loading) return <main className="loading">Chargement…</main>;
  if (!event) return <main className="loading">Événement introuvable.</main>;
  const riddle=riddles[riddleIndex];
  const wordEnabled=event.word_cloud_enabled ?? event.wordcloud_enabled;
  const isBaby=event.event_type === "Baby Shower";

  return <main className="page"><style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}button,input,textarea{font:inherit}.page{min-height:100vh;background:${PALETTE.page};color:${PALETTE.text};font-family:'DM Sans',sans-serif}.app{width:100%;max-width:760px;margin:auto;min-height:100vh;background:${PALETTE.app};padding-bottom:52px}.loading{min-height:100vh;display:grid;place-items:center;background:${PALETTE.page};font-family:'DM Sans',sans-serif;color:${PALETTE.text}}.header{position:sticky;top:0;z-index:50;background:rgba(255,250,242,.97);backdrop-filter:blur(14px);border-bottom:1px solid #ddc6a2;padding:16px 15px 12px;box-shadow:0 5px 18px rgba(75,52,30,.07)}.names{margin:0;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-weight:700;font-size:30px;line-height:1.08;color:#332820}.date{margin-top:6px;font-size:9px;letter-spacing:.16em;color:#90785e}.type{margin-top:4px;font-size:10px;color:${PALETTE.gold};font-weight:700}.quick{display:flex;gap:6px;overflow-x:auto;margin-top:12px;scrollbar-width:none}.quick::-webkit-scrollbar{display:none}.quick a{flex:none;text-decoration:none;border:1px solid #ddc7a7;background:#fffdf8;border-radius:999px;padding:6px 9px;color:#765d43;font-size:9px;font-weight:700;white-space:nowrap}.content{display:grid;gap:16px;padding:17px 10px 0}.section{position:relative;background:linear-gradient(160deg,${PALETTE.card},${PALETTE.card2});border:1px solid ${PALETTE.goldSoft};border-radius:26px;padding:25px 16px 20px;box-shadow:0 8px 22px rgba(91,62,31,.05);overflow:hidden;scroll-margin-top:116px}.section:before{content:'';position:absolute;top:0;left:24px;right:24px;height:2px;background:linear-gradient(90deg,transparent,${PALETTE.gold},transparent);opacity:.55}.sectionTitle{margin:0;text-align:center;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-weight:700;font-size:29px;line-height:1.2;letter-spacing:-.035em;color:#3a2e25}.sectionSub{text-align:center;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:15px;color:#b17d39;margin:7px 0 19px}.inner,.memoryForm{background:rgba(255,255,255,.67);border:1px solid ${PALETTE.goldPale};border-radius:19px;padding:16px}.stack,.memoryForm{display:grid;gap:9px}.question{margin:0 0 14px;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:19px;line-height:1.45}.choice,.input,.textarea{width:100%;border:1px solid #dac19c;background:#fffdf8;border-radius:13px;padding:12px 13px;color:#47382c;font-size:13px}.choice{text-align:left;color:#765631;font-weight:700;position:relative;overflow:hidden}.choiceFill{position:absolute;inset:0 auto 0 0;background:#f1dfc3}.choiceContent{position:relative;display:flex;justify-content:space-between;gap:10px}.textarea{min-height:88px;resize:vertical}.primary{border:0;border-radius:13px;background:${PALETTE.button};color:white;padding:13px 16px;font-weight:700;font-size:13px}.label{font-size:11px;font-weight:700;margin-top:3px}.optional{font-weight:400;color:#9d8c7b}.upload{min-height:58px;border:1px dashed #c99e60;border-radius:13px;background:#fff9ee;color:#805c34;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center}.voice{min-height:51px;border:1px solid #d8c09d;border-radius:13px;background:#fffdf8;color:#6b5034;font-weight:700;font-size:13px}.good{color:#55735c;font-weight:700}.bad{color:#99594d}.next{border:0;background:none;color:#9b713c;font-weight:700}.feed{display:grid;gap:12px}.post{background:#fff;border:1px solid ${PALETTE.goldPale};border-radius:18px;overflow:hidden}.postPhoto{display:block;width:100%;max-height:430px;object-fit:cover}.postGrid{display:grid;grid-template-columns:1fr 1fr;gap:3px}.postGrid img{width:100%;height:190px;object-fit:cover}.postBody{padding:14px}.postHead{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:${PALETTE.textSoft}}.postName{font-weight:700;color:#765631}.postText{font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:17px;line-height:1.5;margin:10px 0 0}.likeBtn{border:0;background:none;padding:8px 0 0;color:${PALETTE.gold};font-weight:700;display:flex;gap:6px;align-items:center}.likeBtn:disabled{opacity:.75}.fund{text-align:center}.outline{display:block;width:max-content;margin:18px auto 0;border:1px solid #bd9360;border-radius:13px;background:#fffaf2;color:#765434;padding:12px 20px;font-weight:700;text-decoration:none}.cloud{min-height:160px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:9px 14px;padding:18px;border-radius:17px;background:#f4e8d7;border:1px solid #e8d2b2}.cloudWord{font-family:'Libre Baskerville',Georgia,serif;font-style:italic;color:#a1743d}.inline{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:11px}.eggWrap{text-align:center}.eggTimer,.eggHint{color:${PALETTE.gold};font-size:13px;margin-bottom:8px}.egg{border:0;background:none;font-size:96px;line-height:1;cursor:pointer}.shake{animation:shake .42s ease}.cracks{font-size:11px;color:#9d8c7b}.revealResult{text-align:center;padding:10px}.balloon{font-size:52px}.revealText{font-family:'Libre Baskerville',serif;font-style:italic;font-weight:700;font-size:28px;color:${PALETTE.gold}}@keyframes shake{20%{transform:translateX(-7px) rotate(-4deg)}40%{transform:translateX(7px) rotate(4deg)}60%{transform:translateX(-5px) rotate(-3deg)}80%{transform:translateX(5px) rotate(3deg)}}@media(min-width:600px){.content{padding-left:18px;padding-right:18px}.section{padding:30px 24px 25px}.sectionTitle{font-size:34px}.names{font-size:34px}}
    .header{padding:27px 15px 14px;text-align:center}.names{font-size:clamp(24px,8vw,34px);line-height:1.1}.welcome{max-width:600px;margin:11px auto 0;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:13px;line-height:1.5;color:#765d43}.date{margin-top:10px}.type{margin-top:5px}.quick{margin-top:15px;text-align:left}.section{scroll-margin-top:190px}@media(min-width:600px){.header{padding-left:24px;padding-right:24px}.welcome{font-size:14px}}
    .header{padding:27px 15px 14px;text-align:center}
    .names{font-size:clamp(24px,8vw,34px);line-height:1.1}
    .welcome{max-width:600px;margin:11px auto 0;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:13px;line-height:1.5;color:#765d43}
    .date{margin-top:10px}
    .type{margin-top:5px}
    .quick{margin-top:15px;text-align:left}
    .section{scroll-margin-top:190px}
    @media(min-width:600px){.header{padding-left:24px;padding-right:24px}.welcome{font-size:14px}}
  `}</style><div className="app">
    <header className="header"><h1 className="names">{event.event_title}</h1>{welcomeMessage&&<p className="welcome">{welcomeMessage}</p>}<div className="date">{formatEventDate(event.event_date)}</div><div className="type">{event.event_type}</div><nav className="quick">{isBaby&&event.reveal_at&&<a href="#reveal">Révélation</a>}<a href="#quiz">Quiz</a>{event.playlist_enabled&&<a href="#music">Musique</a>}<a href="#memory">Souvenir</a>{event.riddles_enabled&&<a href="#riddles">Devinettes</a>}<a href="#feed">Le Fil</a>{event.cagnotte_url&&<a href="#fund">Cagnotte</a>}{wordEnabled&&<a href="#words">Nuage</a>}</nav></header>
    <div className="content">
      {isBaby&&event.reveal_at&&<EggReveal revealAt={event.reveal_at} revealGender={event.reveal_gender||"fille"}/>} 
      {polls.length>0&&<section id="quiz" className="section"><h2 className="sectionTitle">Petit quiz 🎉</h2><div className="sectionSub">À vous de jouer !</div>{polls.map(q=>{const total=(q.votes||[]).reduce((a,b)=>a+b,0);return <div className="inner" key={q.id} style={{marginBottom:10}}><p className="question">{q.question}</p><div className="stack">{(q.options||[]).map((o,i)=>{const n=q.votes?.[i]||0,pct=total?Math.round(n/total*100):0;return <button key={i} className="choice" disabled={voted[q.id]} onClick={()=>vote(q.id,i)}><span className="choiceFill" style={{width:`${pct}%`}}/><span className="choiceContent"><span>{o}</span><b>{pct}%</b></span></button>})}</div></div>})}</section>}
      {event.playlist_enabled&&<section id="music" className="section"><h2 className="sectionTitle">Musique</h2><div className="sectionSub">Une envie pour la soirée ?</div><form onSubmit={sendSong} className="stack"><input className="input" value={song} onChange={e=>setSong(e.target.value)} placeholder="Titre de la chanson"/><input className="input" value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artiste"/><input className="input" value={requester} onChange={e=>setRequester(e.target.value)} placeholder="Votre prénom (facultatif)"/><button className="primary">{songSent?"✓ Envoyée !":"Envoyer au DJ"}</button></form></section>}
      <section id="memory" className="section"><h2 className="sectionTitle">Laissez un mot, un souvenir 💌</h2><div className="sectionSub">Quelques mots pour cette journée</div><form className="memoryForm" onSubmit={submitMemory}><label className="label">Votre prénom</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom ou pseudo"/><label className="label">Votre message</label><textarea className="textarea" value={text} onChange={e=>setText(e.target.value)} placeholder={`Quelques mots pour ${event.event_title}…`}/><label className="label">Photo <span className="optional">facultatif</span></label><label className="upload">＋ Ajouter une ou plusieurs photos<input type="file" accept="image/*" multiple onChange={handleFiles} hidden/></label>{photos.length>0&&<div style={{fontSize:11,color:PALETTE.textSoft}}>{photos.length} photo{photos.length>1?"s":""} sélectionnée{photos.length>1?"s":""}</div>}<label className="label">Vidéo <span className="optional">facultatif</span></label><label className="upload">＋ Ajouter une vidéo<input type="file" accept="video/*" onChange={e=>setVideo(e.target.files?.[0]||null)} hidden/></label><label className="label">Message vocal <span className="optional">facultatif</span></label>{audioUrl?<audio controls src={audioUrl} style={{width:"100%"}}/>:<button className="voice" type="button" onClick={recording?stopRecording:startRecording}>{recording?`● Arrêter · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`:"◉ Ajouter un message vocal"}</button>}<button className="primary" disabled={sending}>{sending?"Envoi…":sent?"✓ Souvenir envoyé":"Envoyer mon souvenir"}</button></form></section>
      {event.riddles_enabled&&riddle&&<section id="riddles" className="section"><h2 className="sectionTitle">Devinettes</h2><div className="sectionSub">À vous de trouver ✨</div><div className="inner"><div style={{fontSize:10,fontWeight:800,color:PALETTE.gold,marginBottom:9}}>{riddleIndex+1} / {riddles.length}</div><p className="question">{riddle.question}</p><form onSubmit={checkRiddle} className="stack"><input className="input" value={riddleAnswer} onChange={e=>{setRiddleAnswer(e.target.value);setRiddleResult(null)}} placeholder="Votre réponse"/><button className="primary">Valider</button></form>{riddleResult==="good"&&<p className="good">Bien joué ✨</p>}{riddleResult==="bad"&&<p className="bad">Indice : {riddle.hint}</p>}{riddleResult&&<button className="next" onClick={()=>{setRiddleIndex((riddleIndex+1)%riddles.length);setRiddleAnswer("");setRiddleResult(null)}}>Suivante →</button>}</div></section>}
      <section id="feed" className="section"><h2 className="sectionTitle">Le Fil</h2><div className="sectionSub">Les souvenirs de la journée</div><div className="feed">{messages.map(m=>{const pics=m.photo_urls?.length?m.photo_urls:(m.photo_url?[m.photo_url]:[]);return <article className="post" key={m.id}>{pics.length===1&&<img className="postPhoto" src={pics[0]} alt="Souvenir"/>}{pics.length>1&&<div className="postGrid">{pics.map((u,i)=><img src={u} alt="Souvenir" key={i}/>)}</div>}{m.video_url&&<video className="postPhoto" src={m.video_url} controls/>}<div className="postBody"><div className="postHead"><span className="postName">{m.name||"Invité"}</span><span>{formatPostDate(m.created_at)}</span></div>{m.message&&<p className="postText">{m.message}</p>}{m.audio_url&&<audio controls src={m.audio_url} style={{width:"100%",marginTop:8}}/>}<button className="likeBtn" disabled={!!liked[m.id]} onClick={()=>like(m.id)}>{liked[m.id]?"♥":"♡"} {m.likes_count||0}</button></div></article>})}</div></section>
      {event.cagnotte_url&&<section id="fund" className="section fund"><h2 className="sectionTitle">Cagnotte</h2><div className="sectionSub">Pour leur prochaine aventure</div><a className="outline" href={event.cagnotte_url} target="_blank" rel="noreferrer">Voir la cagnotte</a></section>}
      {wordEnabled&&<section id="words" className="section"><h2 className="sectionTitle">Nuage de mots</h2><div className="sectionSub">En un mot</div><div className="cloud">{cloud.map(([x,n],i)=><span className="cloudWord" key={x} style={{fontSize:18+Math.min(15,n*3),opacity:Math.max(.55,1-i*.06)}}>{x}</span>)}</div><form className="inline" onSubmit={addWord}><input className="input" value={word} onChange={e=>setWord(e.target.value)} placeholder="Un mot…"/><button className="primary">Ajouter</button></form></section>}
    </div>
  </div></main>;
}
