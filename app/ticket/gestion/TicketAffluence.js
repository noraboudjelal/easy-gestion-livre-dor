"use client";
import {useEffect,useState} from 'react';
import {parisToday} from '../../../lib/ticket/publicSettings.mjs';
import {subscribeToQueue} from '../../../lib/ticket/ticketApi';
import {ticketColors} from '../ticketStyles';

export default function TicketAffluence({businessId}){
  const [period,setPeriod]=useState('day'),[day,setDay]=useState(parisToday);
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let active=true,version=0;
    const controller=new AbortController();
    setData(null);setError('');
    async function load(){
      const current=++version;
      try{
        const response=await fetch(`/api/ticket/merchant/affluence?period=${period}&day=${day}`,{cache:'no-store',signal:controller.signal});
        const next=await response.json();
        if(!response.ok)throw new Error(next.error);
        if(active&&version===current){setData(next);setError('');}
      }catch(err){if(active&&version===current)setError(err.message||'Chargement impossible.');}
    }
    load();
    const unsubscribe=subscribeToQueue(businessId,load), timer=setInterval(load,15000);
    return ()=>{active=false;controller.abort();unsubscribe();clearInterval(timer);};
  },[businessId,period,day]);
  const bars=data?(period==='day'?data.hourly.map(r=>({label:`${r.hour} h`,tickets:r.tickets})):data.daily.map(r=>({label:r.day.slice(8),tickets:r.tickets}))):[];
  const max=Math.max(1,...bars.map(b=>b.tickets));
  return <section className="affluence">
    <h2>Affluence</h2>
    <div className="filters"><div role="group" aria-label="Vue des statistiques">{[['day','Jour'],['week','Semaine'],['month','Mois']].map(([value,label])=><button key={value} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{label}</button>)}</div><label>Date de référence <input type="date" value={day} onChange={e=>{if(e.target.value)setDay(e.target.value);}}/></label></div>
    {error&&<p role="alert">{error}</p>}
    {!data?<p>Chargement des statistiques…</p>:<>
      <p>Du {data.start} au {data.end} · Heure de Paris</p>
      <div className="metrics">{[
        ['Clients aujourd’hui',data.today],['Clients sur la période',data.tickets],['Clients servis',data.served],['En attente maintenant',data.waiting],
        ['Attente moyenne',data.average_wait==null?'—':`${data.average_wait} min`],['Heure de pointe',data.peak_hour==null?'—':`${data.peak_hour} h – ${data.peak_hour+1} h`],
      ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <h3>{period==='day'?'Tickets par heure':'Tickets par jour'}</h3>
      <div className="chart" role="img" aria-label={`Affluence : ${bars.map(b=>`${b.label} : ${b.tickets} tickets`).join(', ')}`}>
        {bars.map((b,i)=><div className="bar-column" key={b.label} title={`${b.label} : ${b.tickets} tickets`}><span>{b.tickets||''}</span><div className="bar" style={{height:`${b.tickets/max*150}px`}}/><small>{bars.length<10||i%3===0?b.label:''}</small></div>)}
      </div>
      <details><summary>Détail des tickets par heure</summary><div className="hours">{data.hourly.map(r=><p key={r.hour}>{r.hour} h : <strong>{r.tickets}</strong></p>)}</div></details>
      <h3>Historique par jour</h3>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Tickets</th><th>Servis</th><th>Attente moyenne</th></tr></thead><tbody>{data.daily.map(r=><tr key={r.day}><td>{r.day}</td><td>{r.tickets}</td><td>{r.served}</td><td>{r.average_wait==null?'—':`${r.average_wait} min`}</td></tr>)}</tbody></table></div>
      <p className="note">Un client correspond à un ticket émis. L’attente va de la prise du ticket à son premier appel ({data.wait_samples} mesure{data.wait_samples===1?'':'s'}). « Servis » compte les tickets de la période passés à l’état servi. Une remise à zéro ne marque pas les tickets en attente comme servis. L’historique antérieur déjà supprimé n’est pas disponible.</p>
    </>}
    <style jsx>{`
      .affluence{background:white;border:1px solid ${ticketColors.border};border-radius:24px;padding:24px;color:${ticketColors.ink}}
      h2{margin-top:0}.filters{display:flex;gap:14px;justify-content:space-between;flex-wrap:wrap}.filters button{padding:12px;border:1px solid #ddd;background:white;cursor:pointer}.filters button[aria-pressed=true]{background:${ticketColors.ink};color:white}.filters label{display:grid;gap:5px;font-size:13px}input{padding:8px;font-size:16px}
      .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:20px 0}.metrics>div{padding:18px;background:${ticketColors.background};border-radius:14px;display:grid;gap:10px}.metrics span{font-size:13px}.metrics strong{font-size:25px}
      .chart{height:205px;display:flex;align-items:flex-end;gap:3px;border-bottom:1px solid #ddd;margin:20px 0}.bar-column{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}.bar{width:100%;background:${ticketColors.accent};border-radius:4px 4px 0 0;min-height:1px}.bar-column span{font-size:10px}.bar-column small{height:25px;white-space:nowrap;font-size:10px;padding-top:8px}.hours{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));font-size:13px}
      .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}th,td{padding:12px 8px;border-bottom:1px solid #eee;white-space:nowrap}.note{font-size:12px;line-height:1.6;color:${ticketColors.muted}}summary{cursor:pointer;padding:10px 0}
    `}</style>
  </section>;
}
