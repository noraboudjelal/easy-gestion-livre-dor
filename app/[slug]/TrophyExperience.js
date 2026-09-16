"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";

const newToken = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export default function TrophyExperience({ slug }) {
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
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    const key = `trophy-voter-${slug}`;
    let token = sessionStorage.getItem(key);
    if (!token) { token = newToken(); sessionStorage.setItem(key, token); }
    setVoter(token);
  }, [slug]);

  const rpc = useCallback(async (action = "state", extra = {}) => {
    if (!event?.id || !voter) return null;
    const { data, error } = await supabase.rpc("trophy_action", { p_event:event.id, p_action:action, p_category:extra.category||null, p_look:extra.look||null, p_voter:voter, p_reveal:null });
    if (error) throw error;
    if (data?.server_now) setServerOffset(new Date(data.server_now).getTime() - Date.now());
    setState(data); return data;
  }, [event?.id, voter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("events").select("id,slug,event_title").eq("slug", slug).maybeSingle();
      if (!alive) return;
      if (error || !data) { setStatus(error?.message || "Événement introuvable."); return; }
      setEvent(data);
      const { data: photos } = await supabase.from("daily_looks").select("id,name,photo_url,created_at").eq("event_id", data.id).not("photo_url","is",null).order("created_at",{ascending:true});
      if (alive) setLooks(photos || []);
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => { if (event?.id && voter) rpc().catch(e => setStatus(e?.message || "Impossible de charger les Trophées.")); }, [event?.id,voter,rpc]);
  useEffect(() => { const t=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(t); },[]);
  useEffect(() => { if (!event?.id || !voter) return; const t=setInterval(()=>rpc().catch(()=>{}),15000); return()=>clearInterval(t); },[event?.id,voter,rpc]);

  useEffect(() => {
    const locate=()=>{
      const card=Array.from(document.querySelectorAll(".fun-card")).find(c=>/Les Trophées|Les Awards/.test(c.textContent||"") && /Meilleure tenue/.test(c.textContent||""));
      if(!card) return;
      card.querySelectorAll("p").forEach(n=>{ if(n.textContent?.includes("Les Awards")) n.textContent="🏆 Les Trophées"; if(n.textContent?.includes("participe aux Awards")) n.textContent="Ajoute ta photo pour participer aux Trophées !"; if(n.textContent?.includes("votes par catégorie")) n.style.display="none"; });
      card.querySelectorAll("span").forEach(n=>{ if(["👗 Meilleure tenue","💇 Meilleure coiffure","😂 Plus drôle","📸 Meilleure pose"].includes((n.textContent||"").trim())) n.style.display="none"; });
      let host=card.querySelector("[data-trophy-host='true']"); if(!host){host=document.createElement("div");host.dataset.trophyHost="true";card.appendChild(host);} setPortalTarget(host);
    };
    locate(); const t=setInterval(locate,500); return()=>clearInterval(t);
  },[]);

  const voted=state?.voted_categories||[];
  const remaining=state?.reveal_at?Math.max(0,new Date(state.reveal_at).getTime()-(now+serverOffset)):null;
  const countdown=useMemo(()=>{ if(remaining==null)return null; const x=Math.ceil(remaining/1000),h=Math.floor(x/3600),m=Math.floor((x%3600)/60),s=x%60; return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":"); },[remaining]);

  async function vote(){ if(!category||!selected)return; try{await rpc("vote",{category:category.id,look:selected});setStatus("Bravo, ton vote est enregistré ! 🎉");setSelected(null);setCategory(null);setTimeout(()=>setStatus(""),2500);}catch(e){setStatus(e.message||"Vote impossible.");} }

  if(!portalTarget)return null;
  if(!state)return createPortal(<p style={{textAlign:"center"}}>{status||"Chargement…"}</p>,portalTarget);
  const results=state.results||[], current=results[revealIndex];
  const content=<section style={S.wrap}>
    {!state.closed&&<>
      {!state.reveal_at&&<div style={S.intro}><div style={S.big}>📸</div><strong>Participe aux Trophées !</strong><p>Ajoute ton prénom et ta photo juste au-dessus pour tenter de gagner un Trophée 🏆</p><p style={S.small}>Les votes ouvriront plus tard.</p></div>}
      {state.reveal_at&&remaining>0&&<><div style={S.egg}><div style={S.big}>🏆</div><strong>À vous de voter !</strong><div style={S.clock}>{countdown}</div><small>avant la découverte des Trophées</small></div><p>Choisis un trophée :</p><div style={S.categories}>{(state.categories||[]).map(c=><button key={c.id} disabled={voted.includes(c.id)} onClick={()=>{setCategory(c);setSelected(null);setStatus("");}} style={{...S.category,opacity:voted.includes(c.id)?.45:1}}>{c.label}{voted.includes(c.id)?" ✓":""}</button>)}</div>{category&&<div style={S.voteBox}><h3>{category.label}</h3><p>Touche ta photo préférée 👇</p><div style={S.grid}>{looks.map(l=><button key={l.id} onClick={()=>setSelected(l.id)} style={{...S.photoButton,outline:selected===l.id?"4px solid #d4a72c":"2px solid transparent"}}><img src={l.photo_url} alt={l.name||"Participant"} style={S.photo}/><span style={S.name}>{l.name||"Participant"}</span>{selected===l.id&&<span style={S.check}>✓</span>}</button>)}</div><button disabled={!selected} onClick={vote} style={{...S.vote,opacity:selected?1:.45}}>Je vote 🏆</button></div>}</>}
    </>}
    {state.closed&&!revealing&&<div style={S.egg}><div style={S.big}>🎁</div><strong>Les Trophées sont prêts !</strong><button onClick={()=>{setRevealIndex(0);setRevealing(true);}} style={S.discover}>Découvrir les gagnants 🏆</button></div>}
    {state.closed&&revealing&&current&&<div style={S.reveal}><div style={S.confetti}>✨ 🎉 🏆 🎉 ✨</div><h2>{current.label}</h2>{(current.winners||[]).length?<div style={S.winners}>{current.winners.map(w=><div key={w.id} style={S.winner}><img src={w.photo_url} alt={w.name} style={S.winnerPhoto}/><strong>{w.name}</strong></div>)}</div>:<p>Aucun vote pour ce trophée.</p>}{(current.winners||[]).length>1&&<p>Ex æquo 🏆</p>}{revealIndex<results.length-1&&<button onClick={()=>setRevealIndex(i=>i+1)} style={S.discover}>Trophée suivant 🎁</button>}</div>}
    {status&&<p style={S.status}>{status}</p>}
  </section>;
  return createPortal(content,portalTarget);
}

const S={wrap:{margin:"18px 0 0",padding:"16px 0 0",borderTop:"1px solid rgba(80,48,63,.15)",textAlign:"center",color:"#30242a"},intro:{padding:"18px",borderRadius:22,background:"#fff8f2"},big:{fontSize:58},small:{fontSize:13,opacity:.7},categories:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,margin:"14px 0"},category:{border:0,borderRadius:18,padding:"16px 10px",fontWeight:900,fontSize:15,cursor:"pointer",background:"#fff"},voteBox:{marginTop:16},grid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,margin:"14px 0"},photoButton:{position:"relative",padding:0,border:0,borderRadius:18,overflow:"hidden",background:"#fff"},photo:{display:"block",width:"100%",aspectRatio:"1 / 1",objectFit:"cover"},name:{display:"block",padding:8,fontWeight:900},check:{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:99,background:"#d4a72c",color:"white",fontWeight:900,lineHeight:"32px"},vote:{border:0,borderRadius:999,padding:"15px 28px",background:"#30242a",color:"white",fontWeight:900,fontSize:18},egg:{padding:20,borderRadius:24,background:"linear-gradient(145deg,#fff8dc,#f4e3a4)"},clock:{fontSize:"clamp(2rem,8vw,4rem)",fontWeight:900,margin:6},discover:{display:"block",margin:"14px auto 0",border:0,borderRadius:999,padding:"14px 22px",background:"#b88a22",color:"white",fontWeight:900,fontSize:17},reveal:{padding:22,borderRadius:24,background:"#fff8dc"},confetti:{fontSize:24},winners:{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"},winner:{display:"grid",gap:8,fontSize:22},winnerPhoto:{width:190,height:190,objectFit:"cover",borderRadius:24},status:{fontWeight:900,marginTop:12}};
