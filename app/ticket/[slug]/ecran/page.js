"use client";
import {useEffect,useRef,useState} from 'react';
import {useParams} from 'next/navigation';
import {subscribeToQueue} from '../../../../lib/ticket/ticketApi';
import {formatTicketNumber} from '../../../../lib/ticket/formatTicketNumber';
import {ticketBase,ticketColors} from '../../ticketStyles';

export default function TicketScreen() {
  const {slug}=useParams();
  const [state,setState]=useState(null),[error,setError]=useState('');
  const refreshRef=useRef(()=>{});
  useEffect(()=>{
    let active=true,pending=false;
    let controller;
    setState(null);
    async function refresh(){
      if(pending) return;
      pending=true;
      controller=new AbortController();
      const timeout=window.setTimeout(()=>controller.abort(),12000);
      try{
        const response=await fetch(`/api/ticket/public/${encodeURIComponent(slug)}?screen=1`,{cache:'no-store',signal:controller.signal});
        const data=await response.json();
        if(!active) return;
        if(!response.ok){if(response.status===404) setState(null);throw new Error(data.error);}
        setState(data);setError('');
      }catch(err){if(active) setError(err.message||'Connexion interrompue. Reconnexion automatique…');}
      finally{window.clearTimeout(timeout);pending=false;}
    }
    refreshRef.current=refresh;
    refresh();
    const timer=window.setInterval(refresh,5000);
    window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return ()=>{active=false;controller?.abort();clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[slug]);
  useEffect(()=>{
    if(!state?.business_id)return;
    return subscribeToQueue(state.business_id,()=>refreshRef.current());
  },[state?.business_id]);
  return <main className="ticket-screen" style={{...ticketBase,background:ticketColors.ink,color:'#fff'}}>
    <header><p className="brand">LEHNOVA TICKET</p><h1>{state?.business_name||'Bienvenue'}</h1></header>
    {error && <p role="status" className="connection">{error} {state && 'Dernier affichage connu — nouvelle tentative automatique.'}</p>}
    {!state ? <p>{error?'':'Chargement de la file…'}</p> : <>
      <section className="current" aria-live="polite" aria-atomic="true">
        <h2>Numéro appelé</h2>
        <div className="current-number">{state.current_number==null?'—':formatTicketNumber(state.current_number)}</div>
        <p>{state.current_number==null?'Votre accueil se prépare':'Présentez-vous au comptoir'}</p>
      </section>
      <footer className="screen-bottom">
        <section><h2>À suivre</h2><div className="next">{state.next_numbers.length?state.next_numbers.map(n=><span key={n}>{formatTicketNumber(n)}</span>):<p>Aucun ticket en attente</p>}</div></section>
        <section><strong className="count">{state.waiting_count}</strong><p>{state.waiting_count===1?'personne en attente':'personnes en attente'}</p>{state.estimated_wait!=null&&<p>Attente estimée : environ {state.estimated_wait} min</p>}</section>
      </footer>
      {!state.is_open && <p className="closed">La file est fermée aux nouveaux tickets. Les tickets pris restent valables.</p>}
    </>}
    <style jsx>{`
      .ticket-screen{min-height:100vh;padding:clamp(22px,4vw,70px);box-sizing:border-box}
      header .brand{letter-spacing:.2em;color:#d8b890;font-weight:800;font-size:14px;margin:0}
      h1{font-size:clamp(28px,4vw,66px);margin:10px 0 30px;overflow-wrap:anywhere}
      h2{font-size:clamp(18px,2vw,30px);font-weight:500;margin:0;color:#e8dac8}
      .current{width:100%;text-align:center;padding:clamp(20px,3vw,50px) 0}
      .current-number{font-size:clamp(130px,25vw,430px);font-weight:900;line-height:1;letter-spacing:-.045em;overflow-wrap:anywhere}
      .current p,.screen-bottom p{font-size:clamp(18px,1.7vw,28px);margin:8px 0}
      .screen-bottom{margin-top:24px;padding-top:28px;border-top:1px solid #64594d;display:grid;grid-template-columns:1fr 1fr;gap:24px}
      .next{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
      .next span{font-size:clamp(28px,3.6vw,64px);background:#403a33;border-radius:14px;padding:8px 18px;font-weight:750}
      .count{font-size:clamp(32px,4vw,60px)}.closed,.connection{padding:16px;background:#534234;border-radius:12px}
      @media(max-width:650px){.screen-bottom{grid-template-columns:1fr}.current-number{font-size:clamp(120px,35vw,240px)}}
    `}</style>
  </main>;
}
