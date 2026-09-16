"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";

const newToken = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export default function TrophyExperience({ slug, adminMode = false }) {
  const [event, setEvent] = useState(null);
  const [looks, setLooks] = useState([]);
  const [state, setState] = useState(null);
  const [voter, setVoter] = useState("");
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealAtInput, setRevealAtInput] = useState("");
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `trophy-voter-${slug}`;
    let token = window.sessionStorage.getItem(key);
    if (!token) { token = newToken(); window.sessionStorage.setItem(key, token); }
    setVoter(token);
  }, [slug]);

  const rpc = useCallback(async (action = "state", extra = {}) => {
    if (!event?.id || !voter) return null;
    const { data, error } = await supabase.rpc("trophy_action", {
      p_event: event.id, p_action: action, p_category: extra.category || null,
      p_look: extra.look || null, p_voter: voter, p_reveal: extra.reveal || null,
    });
    if (error) throw error;
    if (data?.server_now) setServerOffset(new Date(data.server_now).getTime() - Date.now());
    setState(data);
    return data;
  }, [event?.id, voter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!slug || !supabase) return;
      const { data, error } = await supabase.from("events").select("id,slug,event_title").eq("slug", slug).maybeSingle();
      if (!alive) return;
      if (error || !data) { setStatus(error?.message || "Événement introuvable pour les Trophées."); return; }
      setEvent(data);
      const { data: photos, error: photoError } = await supabase.from("daily_looks").select("id,name,photo_url,created_at").eq("event_id", data.id).not("photo_url", "is", null).order("created_at", { ascending: true });
      if (!alive) return;
      if (photoError) setStatus(photoError.message || "Impossible de charger les photos.");
      else setLooks(photos || []);
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => { if (event?.id && voter) rpc().catch((e) => setStatus(e?.message || "Impossible de charger les Trophées.")); }, [event?.id, voter, rpc]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!event?.id || !voter) return;
    const t = setInterval(() => rpc().catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [event?.id, voter, rpc]);

  useEffect(() => {
    const locate = () => {
      const cards = Array.from(document.querySelectorAll(".fun-card"));
      const card = cards.find((c) => /Les Trophées|Les Awards/.test(c.textContent || "") && /Meilleure tenue/.test(c.textContent || ""));
      if (!card) return false;
      card.querySelectorAll("p").forEach((node) => {
        if (node.textContent?.includes("Les Awards de la soirée")) node.textContent = "🏆 Les Trophées";
        if (node.textContent?.includes("participe aux Awards")) node.textContent = "Ajoute ta photo et participe aux Trophées !";
        if (node.textContent?.includes("votes par catégorie ne sont pas encore ouverts")) node.style.display = "none";
      });
      card.querySelectorAll("span").forEach((node) => {
        if (["👗 Meilleure tenue","💇 Meilleure coiffure","😂 Plus drôle","📸 Meilleure pose"].includes((node.textContent || "").trim())) node.style.display = "none";
      });
      let host = card.querySelector("[data-trophy-host='true']");
      if (!host) {
        host = document.createElement("div");
        host.dataset.trophyHost = "true";
        card.appendChild(host);
      }
      setPortalTarget(host);
      return true;
    };
    locate();
    const timer = setInterval(locate, 500);
    return () => clearInterval(timer);
  }, []);

  const voted = state?.voted_categories || [];
  const serverNow = now + serverOffset;
  const remaining = state?.reveal_at ? Math.max(0, new Date(state.reveal_at).getTime() - serverNow) : null;
  const countdown = useMemo(() => {
    if (remaining == null) return null;
    const total = Math.ceil(remaining / 1000), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }, [remaining]);

  async function vote() {
    if (!category || !selected) return;
    setStatus("");
    try { await rpc("vote", { category: category.id, look: selected }); setStatus("Vote enregistré ✓"); setSelected(null); setCategory(null); }
    catch (e) { setStatus(e.message || "Impossible d’enregistrer le vote."); }
  }
  function nextVoter() {
    const token = newToken(); window.sessionStorage.setItem(`trophy-voter-${slug}`, token);
    setVoter(token); setCategory(null); setSelected(null); setStatus("Nouveau votant prêt ✓");
  }
  async function configure() {
    if (!revealAtInput) return;
    try { await rpc("configure", { reveal: new Date(revealAtInput).toISOString() }); setStatus("Heure enregistrée ✓"); }
    catch (e) { setStatus(e.message || "Impossible d’enregistrer l’heure."); }
  }
  async function revealNow() {
    if (!window.confirm("Clôturer les votes et rendre les Trophées disponibles maintenant ?")) return;
    try { await rpc("reveal"); setStatus("Votes clôturés. Les Trophées peuvent être découverts."); }
    catch (e) { setStatus(e.message || "Impossible de clôturer."); }
  }

  if (!portalTarget) return null;
  if (!state) return createPortal(<section id="trophees-vote" style={S.wrap}><p style={S.note}>{status || "Chargement des Trophées…"}</p></section>, portalTarget);
  const results = state.results || [];
  const currentResult = results[revealIndex];

  const content = <section id="trophees-vote" style={S.wrap}>
    {adminMode && !state.closed && <div style={S.admin}><strong>Réglage organisateur</strong><label style={S.label}>Heure de révélation<input type="datetime-local" value={revealAtInput} onChange={(e) => setRevealAtInput(e.target.value)} style={S.input}/></label><div style={S.row}><button onClick={configure} style={S.secondary}>Enregistrer l’heure</button><button onClick={revealNow} style={S.danger}>Révéler maintenant</button></div></div>}
    {!state.closed && <>
      {countdown && <div style={S.egg}><div style={S.trophy}>🏆</div><strong>Découverte des Trophées dans</strong><div style={S.clock}>{countdown}</div></div>}
      {!state.reveal_at && <p style={S.note}>Les votes sont ouverts. L’organisateur n’a pas encore programmé l’heure de révélation.</p>}
      <p style={S.note}>Choisis un trophée, sélectionne une photo, puis appuie sur « Voter 🏆 ».</p>
      <div style={S.categories}>{(state.categories || []).map((c) => <button key={c.id} disabled={voted.includes(c.id)} onClick={() => { setCategory(c); setSelected(null); setStatus(""); }} style={{...S.category, opacity: voted.includes(c.id) ? .5 : 1}}>{c.label}{voted.includes(c.id) ? " ✓" : ""}</button>)}</div>
      {category && <div style={S.voteBox}><h3>{category.label}</h3><p>Sélectionne ta photo préférée.</p><div style={S.grid}>{looks.map((l) => <button key={l.id} onClick={() => setSelected(l.id)} style={{...S.photoButton, outline: selected === l.id ? "4px solid #d4a72c" : "2px solid transparent"}}><img src={l.photo_url} alt={l.name || "Participant"} style={S.photo}/><span style={S.name}>{l.name || "Participant"}</span>{selected === l.id && <span style={S.check}>✓</span>}</button>)}</div><button disabled={!selected} onClick={vote} style={{...S.vote, opacity:selected?1:.45}}>Voter 🏆</button></div>}
      <button onClick={nextVoter} style={S.secondary}>Nouveau votant</button>
    </>}
    {state.closed && !revealing && <div style={S.egg}><div style={S.closedTrophy}>🏆</div><strong>Les Trophées sont prêts !</strong><button onClick={() => { setRevealIndex(0); setRevealing(true); }} style={S.discover}>🎁 Découvrir les Trophées</button></div>}
    {state.closed && revealing && currentResult && <div style={S.reveal} key={currentResult.id}><div style={S.confetti}>✨ 🎉 ✨ 🏆 ✨ 🎉 ✨</div><h2>{currentResult.label}</h2>{(currentResult.winners || []).length ? <div style={S.winners}>{currentResult.winners.map((w) => <div key={w.id} style={S.winner}><img src={w.photo_url} alt={w.name} style={S.winnerPhoto}/><strong>{w.name}</strong></div>)}</div> : <p>Aucun vote pour ce trophée.</p>}{(currentResult.winners || []).length > 1 && <p>Ex æquo 🏆</p>}{revealIndex < results.length - 1 ? <button onClick={() => setRevealIndex((i) => i + 1)} style={S.discover}>Découvrir le trophée suivant →</button> : <button onClick={() => setRevealing(false)} style={S.secondary}>Terminer</button>}</div>}
    {status && <p role="status" style={S.status}>{status}</p>}
  </section>;
  return createPortal(content, portalTarget);
}

const S = {
  wrap:{margin:"18px 0 0",padding:"16px 0 0",borderTop:"1px solid rgba(80,48,63,.15)",color:"#30242a",textAlign:"center"},
  note:{margin:"10px 0",fontSize:14}, categories:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",margin:"14px 0"}, category:{border:0,borderRadius:999,padding:"10px 14px",fontWeight:800,cursor:"pointer"},
  voteBox:{marginTop:16,paddingTop:12,borderTop:"1px solid #eadfe3"}, grid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,margin:"14px 0"}, photoButton:{position:"relative",padding:0,border:0,borderRadius:18,overflow:"hidden",background:"#fff",cursor:"pointer"}, photo:{display:"block",width:"100%",aspectRatio:"1 / 1",objectFit:"cover"}, name:{display:"block",padding:8,fontWeight:800}, check:{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:999,background:"#d4a72c",color:"white",fontWeight:900,lineHeight:"30px"},
  vote:{border:0,borderRadius:999,padding:"13px 24px",background:"#30242a",color:"white",fontWeight:900,fontSize:16,cursor:"pointer"}, secondary:{border:"1px solid #cdbfc4",borderRadius:999,padding:"10px 15px",background:"white",fontWeight:800,cursor:"pointer"}, danger:{border:0,borderRadius:999,padding:"10px 15px",background:"#7b2634",color:"white",fontWeight:800,cursor:"pointer"},
  egg:{margin:"16px auto",padding:20,borderRadius:24,background:"linear-gradient(145deg,#fff8dc,#f4e3a4)"}, trophy:{fontSize:62,filter:"grayscale(1)",opacity:.55}, closedTrophy:{fontSize:78,animation:"trophyPulse 1.2s ease-in-out infinite alternate"}, clock:{fontSize:"clamp(2rem,8vw,4rem)",fontWeight:900,fontVariantNumeric:"tabular-nums",marginTop:6}, discover:{display:"block",margin:"14px auto 0",border:0,borderRadius:999,padding:"14px 22px",background:"#b88a22",color:"white",fontWeight:900,fontSize:17,cursor:"pointer"},
  reveal:{padding:22,borderRadius:24,background:"linear-gradient(145deg,#fff8dc,#fff)"}, confetti:{fontSize:24,animation:"trophyPop .6s ease-out"}, winners:{display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center",margin:"16px 0"}, winner:{display:"grid",gap:8,fontSize:22}, winnerPhoto:{width:190,height:190,objectFit:"cover",borderRadius:24,boxShadow:"0 8px 24px rgba(0,0,0,.18)"},
  admin:{display:"grid",gap:10,textAlign:"left",padding:14,borderRadius:16,background:"#f6f1f3",marginBottom:14}, label:{display:"grid",gap:6,fontSize:13,fontWeight:800}, input:{padding:10,border:"1px solid #cdbfc4",borderRadius:10}, row:{display:"flex",gap:8,flexWrap:"wrap"}, status:{fontWeight:800,marginTop:12}
};
