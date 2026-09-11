"use client";
import { useEffect, useState } from "react";
import { parisToday } from "../../lib/ticket/publicSettings.mjs";

export default function AdminTicketAffluence({ businessId }) {
  const [period, setPeriod] = useState("day");
  const [day, setDay] = useState(parisToday);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    fetch(`/api/admin/tickets/affluence?business_id=${encodeURIComponent(businessId)}&period=${period}&day=${day}`, { cache: "no-store", signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(setData).catch(e => { if (e.name !== "AbortError") setError(e.message || "Chargement impossible."); });
    return () => controller.abort();
  }, [businessId, period, day]);
  return <div style={{marginTop:12,padding:12,border:"1px solid #EAE3D6",borderRadius:12,background:"#FBF8F3"}}>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      {[['day','Jour'],['week','Semaine'],['month','Mois']].map(([v,l])=><button type="button" key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 9px",border:"1px solid #D8CCAB",borderRadius:8,background:period===v?"#221D18":"#fff",color:period===v?"#fff":"#5B4636"}}>{l}</button>)}
      <input type="date" value={day} onChange={e=>e.target.value&&setDay(e.target.value)} style={{padding:6,fontSize:16,border:"1px solid #D8CCAB",borderRadius:8}} />
    </div>
    {error && <p role="alert" style={{color:"#B5402D"}}>{error}</p>}
    {!data && !error && <p>Chargement…</p>}
    {data && <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginTop:10}}>
        {[['Aujourd’hui',data.today],['Période',data.tickets],['Servis',data.served],['En attente',data.waiting],['Attente moy.',data.average_wait==null?'—':`${data.average_wait} min`],['Pointe',data.peak_hour==null?'—':`${data.peak_hour} h`]].map(([l,v])=><div key={l} style={{background:"#fff",padding:10,borderRadius:9}}><small style={{display:"block",color:"#8A7F66"}}>{l}</small><strong style={{fontSize:18}}>{v}</strong></div>)}
      </div>
      <details style={{marginTop:10}}><summary style={{cursor:"pointer",fontWeight:700}}>Historique par jour</summary><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",marginTop:8,fontSize:12}}><thead><tr><th style={{textAlign:"left",padding:6}}>Date</th><th>Tickets</th><th>Servis</th><th>Attente</th></tr></thead><tbody>{(data.daily||[]).map(r=><tr key={r.day}><td style={{padding:6}}>{r.day}</td><td style={{textAlign:"center"}}>{r.tickets}</td><td style={{textAlign:"center"}}>{r.served}</td><td style={{textAlign:"center"}}>{r.average_wait==null?'—':`${r.average_wait} min`}</td></tr>)}</tbody></table></div></details>
    </>}
  </div>;
}
