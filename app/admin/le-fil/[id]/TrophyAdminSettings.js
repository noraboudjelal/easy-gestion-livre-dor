"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TrophyAdminSettings({ event }) {
  const [voteAt, setVoteAt] = useState("");
  const [revealAt, setRevealAt] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function action(name, value = null) {
    const { data, error } = await supabase.rpc("trophy_action", {
      p_event: event.id,
      p_action: name,
      p_category: null,
      p_look: null,
      p_voter: crypto.randomUUID(),
      p_reveal: value,
    });
    if (error) throw error;
    return data;
  }

  useEffect(() => {
    action("state").then((data) => {
      setVoteAt(toLocalInput(data?.vote_at));
      setRevealAt(toLocalInput(data?.reveal_at));
    }).catch(() => {});
  }, [event.id]);

  async function save() {
    if (!voteAt || !revealAt) { setStatus("Choisissez l’heure du vote et l’heure de révélation."); return; }
    if (new Date(voteAt) >= new Date(revealAt)) { setStatus("La révélation doit être après le début des votes."); return; }
    setBusy(true); setStatus("Enregistrement…");
    try {
      await action("configure", new Date(revealAt).toISOString());
      await action("configure_vote", new Date(voteAt).toISOString());
      setStatus("Horaires des Trophées enregistrés ✓");
    } catch (e) { setStatus(e.message || "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  async function revealNow() {
    if (!window.confirm("Clôturer les votes et rendre les Trophées disponibles maintenant ?")) return;
    setBusy(true);
    try { await action("reveal"); setStatus("Les Trophées sont prêts à être découverts ✓"); }
    catch (e) { setStatus(e.message || "Action impossible."); }
    finally { setBusy(false); }
  }

  return <section style={{padding:20,border:"1px solid #e4d7c2",borderRadius:18,background:"#fff",margin:"18px 0"}}>
    <p style={{fontSize:12,fontWeight:900,letterSpacing:1,margin:0}}>🏆 TROPHÉES</p>
    <h2 style={{margin:"6px 0"}}>Horaires des Trophées</h2>
    <p style={{margin:"0 0 16px",color:"#6b625a"}}>Au début, les invités ajoutent leurs photos. À l’heure du vote, les catégories s’ouvrent. À l’heure de révélation, les votes ferment.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
      <label style={{display:"grid",gap:6,fontWeight:800}}>🏆 Début des votes<input type="datetime-local" value={voteAt} onChange={(e)=>setVoteAt(e.target.value)} style={{padding:12,border:"1px solid #d8c8ae",borderRadius:12,fontSize:16}}/></label>
      <label style={{display:"grid",gap:6,fontWeight:800}}>🎁 Heure de révélation<input type="datetime-local" value={revealAt} onChange={(e)=>setRevealAt(e.target.value)} style={{padding:12,border:"1px solid #d8c8ae",borderRadius:12,fontSize:16}}/></label>
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>
      <button type="button" onClick={save} disabled={busy} style={{border:0,borderRadius:12,padding:"11px 16px",background:"#30242a",color:"white",fontWeight:900}}>Enregistrer les horaires</button>
      <button type="button" onClick={revealNow} disabled={busy} style={{border:"1px solid #b75b67",borderRadius:12,padding:"11px 16px",background:"white",color:"#7b2634",fontWeight:900}}>Révéler maintenant</button>
    </div>
    {status && <p style={{fontWeight:800,marginBottom:0}}>{status}</p>}
  </section>;
}
