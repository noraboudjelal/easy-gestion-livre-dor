"use client";
import {useEffect,useRef,useState} from 'react';
import {useParams} from 'next/navigation';
import {subscribeToQueue} from '../../../../lib/ticket/ticketApi';
import {formatTicketNumber} from '../../../../lib/ticket/formatTicketNumber';
import {ticketBase,ticketColors} from '../../ticketStyles';

export default function TicketScreen() {
  const {slug}=useParams();
  const [state,setState]=useState(null),[error,setError]=useState('');
  const [audioEnabled,setAudioEnabled]=useState(false);
  const refreshRef=useRef(()=>{});
  const previousNumberRef=useRef(undefined);
  const audioContextRef=useRef(null);

  useEffect(()=>{
    let active=true,pending=false;
    let controller;
    setState(null);
    previousNumberRef.current=undefined;
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

  useEffect(()=>{
    const current=state?.current_number;
    if(current==null) return;
    if(previousNumberRef.current===undefined){
      previousNumberRef.current=current;
      return;
    }
    if(current===previousNumberRef.current) return;
    previousNumberRef.current=current;
    if(!audioEnabled) return;

    try{
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(AudioContextClass){
        const ctx=audioContextRef.current||new AudioContextClass();
        audioContextRef.current=ctx;
        if(ctx.state==='suspended') ctx.resume();
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='sine';osc.frequency.value=880;
        gain.gain.setValueAtTime(0.0001,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.16,ctx.currentTime+0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.22);
        osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.24);
      }
    }catch{}

    window.setTimeout(()=>{
      try{
        if(!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance=new SpeechSynthesisUtterance(`Ticket numéro ${current}`);
        utterance.lang='fr-FR';
        utterance.rate=0.92;
        utterance.pitch=1;
        const voices=window.speechSynthesis.getVoices();
        const frenchVoice=voices.find(v=>v.lang?.toLowerCase().startsWith('fr'));
        if(frenchVoice) utterance.voice=frenchVoice;
        window.speechSynthesis.speak(utterance);
      }catch{}
    },280);
  },[state?.current_number,audioEnabled]);

  function enableAudio(){
    setAudioEnabled(true);
    try{
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(AudioContextClass){
        const ctx=audioContextRef.current||new AudioContextClass();
        audioContextRef.current=ctx;
        ctx.resume?.();
      }
      if('speechSynthesis' in window){
        const unlock=new SpeechSynthesisUtterance('');
        unlock.volume=0;
        window.speechSynthesis.speak(unlock);
      }
    }catch{}
  }

  return <main className="ticket-screen" style={{...ticketBase,background:ticketColors.ink,color:'#fff'}}>
    <header><div><p className="brand">LEHNOVA TICKET</p><h1>{state?.business_name||'Bienvenue'}</h1></div><button className={`sound ${audioEnabled?'enabled':''}`} onClick={enableAudio}>{audioEnabled?'🔊 Son activé':'🔈 Activer le son'}</button></header>
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
      header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.brand{letter-spacing:.2em;color:#d8b890;font-weight:800;font-size:14px;margin:0}
      h1{font-size:clamp(28px,4vw,66px);margin:10px 0 30px;overflow-wrap:anywhere}
      h2{font-size:clamp(18px,2vw,30px);font-weight:500;margin:0;color:#e8dac8}
      .sound{flex:none;border:1px solid #6f665c;background:#2f2b27;color:#fff;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer}.sound.enabled{background:#fff;color:#111;border-color:#fff}
      .current{width:100%;text-align:center;padding:clamp(20px,3vw,50px) 0}
      .current-number{font-size:clamp(130px,25vw,430px);font-weight:900;line-height:1;letter-spacing:-.045em;overflow-wrap:anywhere}
      .current p,.screen-bottom p{font-size:clamp(18px,1.7vw,28px);margin:8px 0}
      .screen-bottom{margin-top:24px;padding-top:28px;border-top:1px solid #64594d;display:grid;grid-template-columns:1fr 1fr;gap:24px}
      .next{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
      .next span{font-size:clamp(28px,3.6vw,64px);background:#403a33;border-radius:14px;padding:8px 18px;font-weight:750}
      .count{font-size:clamp(32px,4vw,60px)}.closed,.connection{padding:16px;background:#534234;border-radius:12px}
      @media(max-width:650px){header{flex-direction:column}.screen-bottom{grid-template-columns:1fr}.current-number{font-size:clamp(120px,35vw,240px)}}
    `}</style>
  </main>;
}
