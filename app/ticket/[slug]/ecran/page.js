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
  const voiceRef=useRef(null);

  useEffect(()=>{
    let active=true,pending=false;let controller;
    setState(null);previousNumberRef.current=undefined;
    async function refresh(){
      if(pending)return;pending=true;controller=new AbortController();
      const timeout=window.setTimeout(()=>controller.abort(),12000);
      try{const response=await fetch(`/api/ticket/public/${encodeURIComponent(slug)}?screen=1`,{cache:'no-store',signal:controller.signal});const data=await response.json();if(!active)return;if(!response.ok){if(response.status===404)setState(null);throw new Error(data.error);}setState(data);setError('');}
      catch(err){if(active)setError(err.message||'Connexion interrompue. Reconnexion automatique…');}
      finally{window.clearTimeout(timeout);pending=false;}
    }
    refreshRef.current=refresh;refresh();const timer=window.setInterval(refresh,5000);
    window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;controller?.abort();clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[slug]);

  useEffect(()=>{if(!state?.business_id)return;return subscribeToQueue(state.business_id,()=>refreshRef.current());},[state?.business_id]);

  useEffect(()=>{
    if(!('speechSynthesis'in window))return;
    const loadVoice=()=>{const voices=window.speechSynthesis.getVoices();voiceRef.current=voices.find(v=>v.lang?.toLowerCase()==='fr-fr')||voices.find(v=>v.lang?.toLowerCase().startsWith('fr'))||voices[0]||null;};
    loadVoice();window.speechSynthesis.addEventListener?.('voiceschanged',loadVoice);
    return()=>window.speechSynthesis.removeEventListener?.('voiceschanged',loadVoice);
  },[]);

  function speakTicket(number){if(!('speechSynthesis'in window))return;try{const synth=window.speechSynthesis;synth.cancel();synth.resume?.();const utterance=new SpeechSynthesisUtterance(`Ticket numéro ${number}.`);utterance.lang='fr-FR';utterance.rate=.82;utterance.pitch=1;utterance.volume=1;if(voiceRef.current)utterance.voice=voiceRef.current;synth.speak(utterance);window.setTimeout(()=>synth.resume?.(),150);window.setTimeout(()=>synth.resume?.(),700);}catch{}}

  function playLoudAlert(){
    try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;const ctx=audioContextRef.current||new AudioContextClass();audioContextRef.current=ctx;if(ctx.state==='suspended')ctx.resume?.();const master=ctx.createGain();master.gain.value=.95;master.connect(ctx.destination);const notes=[{at:0,freq:880,duration:.28},{at:.36,freq:1175,duration:.34},{at:.82,freq:880,duration:.28},{at:1.18,freq:1175,duration:.42}];notes.forEach(({at,freq,duration})=>{const osc=ctx.createOscillator();const gain=ctx.createGain();const start=ctx.currentTime+at;osc.type='square';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.55,start+.015);gain.gain.setValueAtTime(.55,start+Math.max(.02,duration-.06));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.02);});}catch{}
  }

  useEffect(()=>{const current=state?.current_number;if(current==null)return;if(previousNumberRef.current===undefined){previousNumberRef.current=current;return;}if(current===previousNumberRef.current)return;previousNumberRef.current=current;if(!audioEnabled)return;playLoudAlert();window.setTimeout(()=>speakTicket(current),1750);},[state?.current_number,audioEnabled]);

  function toggleAudio(){
    if(audioEnabled){
      setAudioEnabled(false);
      try{window.speechSynthesis?.cancel();audioContextRef.current?.suspend?.();}catch{}
      return;
    }
    setAudioEnabled(true);
    try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(AudioContextClass){const ctx=audioContextRef.current||new AudioContextClass();audioContextRef.current=ctx;ctx.resume?.();}playLoudAlert();}catch{}
  }

  return <main className="ticket-screen" style={{...ticketBase,background:ticketColors.ink,color:'#fff'}}>
    <header><div><p className="brand">LEHNOVA TICKET</p><h1>{state?.business_name||'Bienvenue'}</h1></div><button className={`sound ${audioEnabled?'enabled':''}`} onClick={toggleAudio} aria-pressed={audioEnabled}>{audioEnabled?'🔊 Désactiver le son':'🔇 Activer le son'}</button></header>
    {error&&<p role="status" className="connection">{error} {state&&'Dernier affichage connu — nouvelle tentative automatique.'}</p>}
    {!state?<p>{error?'':'Chargement de la file…'}</p>:<>
      <section className="current" aria-live="polite" aria-atomic="true"><h2>Numéro appelé</h2><div className="current-number">{state.current_number==null?'—':formatTicketNumber(state.current_number)}</div><p>{state.current_number==null?'Votre accueil se prépare':'Présentez-vous au comptoir'}</p></section>
      <footer className="screen-bottom"><section><h2>À suivre</h2><div className="next">{state.next_numbers.length?state.next_numbers.map(n=><span key={n}>{formatTicketNumber(n)}</span>):<p>Aucun ticket en attente</p>}</div></section><section><strong className="count">{state.waiting_count}</strong><p>{state.waiting_count===1?'personne en attente':'personnes en attente'}</p>{state.estimated_wait!=null&&<p>Attente estimée : environ {state.estimated_wait} min</p>}</section></footer>
      {!state.is_open&&<p className="closed">La file est fermée aux nouveaux tickets. Les tickets pris restent valables.</p>}
    </>}
    <style jsx>{`
      .ticket-screen{min-height:100vh;padding:clamp(22px,4vw,70px);box-sizing:border-box}header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.brand{letter-spacing:.2em;color:#d8b890;font-weight:800;font-size:14px;margin:0}h1{font-size:clamp(28px,4vw,66px);margin:10px 0 30px;overflow-wrap:anywhere}h2{font-size:clamp(18px,2vw,30px);font-weight:500;margin:0;color:#e8dac8}.sound{flex:none;border:1px solid #6f665c;background:#2f2b27;color:#fff;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer}.sound.enabled{background:#fff;color:#111;border-color:#fff}.current{width:100%;text-align:center;padding:clamp(20px,3vw,50px) 0}.current-number{font-size:clamp(130px,25vw,430px);font-weight:900;line-height:1;letter-spacing:-.045em;overflow-wrap:anywhere}.current p,.screen-bottom p{font-size:clamp(18px,1.7vw,28px);margin:8px 0}.screen-bottom{margin-top:24px;padding-top:28px;border-top:1px solid #64594d;display:grid;grid-template-columns:1fr 1fr;gap:24px}.next{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.next span{font-size:clamp(28px,3.6vw,64px);background:#403a33;border-radius:14px;padding:8px 18px;font-weight:750}.count{font-size:clamp(32px,4vw,60px)}.closed,.connection{padding:16px;background:#534234;border-radius:12px}@media(max-width:650px){header{flex-direction:column}.screen-bottom{grid-template-columns:1fr}.current-number{font-size:clamp(120px,35vw,240px)}}
    `}</style>
  </main>;
}
