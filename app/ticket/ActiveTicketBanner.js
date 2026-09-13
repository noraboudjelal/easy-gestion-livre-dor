"use client";

import {useEffect,useRef,useState} from 'react';
import {readDeviceToken,savedTicketSlugs} from '../../lib/ticket/deviceToken';
import {getPublicTicketState,subscribeToQueue} from '../../lib/ticket/ticketApi';
import {estimatedWait,hasActiveTicket} from '../../lib/ticket/estimate.mjs';
import {formatTicketNumber} from '../../lib/ticket/formatTicketNumber';
import styles from './activeTicketBanner.module.css';

export default function ActiveTicketBanner() {
  const [ticket,setTicket]=useState(null),[error,setError]=useState(false);
  const refreshRef=useRef(()=>{});
  useEffect(()=>{
    let mounted=true,pending=false,currentSlug=null;
    const inactive=new Set();
    async function refresh(){
      if(pending) return;
      pending=true;
      try {
        const slugs=[...new Set([currentSlug,...savedTicketSlugs()].filter(Boolean))];
        let failed=false;
        for(const slug of slugs){
          if(inactive.has(slug)) continue;
          const token=readDeviceToken(slug);
          if(!token) continue;
          let state;
          try { state=await getPublicTicketState(slug,token); }
          catch { failed=true;continue; }
          if(!mounted) return;
          if(hasActiveTicket(state)) {
            currentSlug=slug;setTicket({...state,slug});setError(false);return;
          }
          inactive.add(slug);
          if(slug===currentSlug){currentSlug=null;setTicket(null);}
        }
        if(mounted){setError(failed);if(!failed){currentSlug=null;setTicket(null);}}
      } finally {pending=false;}
    }
    const rescan=()=>{inactive.clear();refresh();};
    refreshRef.current=refresh;
    refresh();
    const timer=window.setInterval(refresh,5000);
    window.addEventListener('storage',rescan);
    window.addEventListener('online',rescan);
    document.addEventListener('visibilitychange',rescan);
    return ()=>{mounted=false;clearInterval(timer);window.removeEventListener('storage',rescan);window.removeEventListener('online',rescan);document.removeEventListener('visibilitychange',rescan);};
  },[]);
  useEffect(()=>{
    if(!ticket?.business_id) return;
    return subscribeToQueue(ticket.business_id,()=>refreshRef.current());
  },[ticket?.business_id]);
  if(!ticket) return null;
  const called=ticket.ticket_status==='called';
  const minutes=estimatedWait(ticket.people_ahead,ticket.estimated_minutes_per_client);
  return <aside className={`${styles.banner} ${called?styles.called:''}`} aria-label='Votre ticket actif' role='status' aria-live={called?'assertive':'polite'} aria-atomic='true'>
    <div className={styles.heading}><span>{ticket.business_name}</span><a href={`/ticket/${encodeURIComponent(ticket.slug)}`}>Revenir à mon ticket →</a></div>
    {called?<><strong className={styles.title}>C’est votre tour – Ticket n°{formatTicketNumber(ticket.ticket_number)}</strong><p>Présentez-vous au comptoir.</p></>:<><strong className={styles.title}>Votre ticket : n°{formatTicketNumber(ticket.ticket_number)}</strong><div className={styles.details}><span>Numéro actuellement appelé : {ticket.current_number>0?`n°${formatTicketNumber(ticket.current_number)}`:'—'}</span><span>{minutes===null?'Estimation temporairement indisponible':`Attente estimée : environ ${minutes} min`}</span></div></>}
    {error&&<p className={styles.error}>Connexion interrompue : dernier état connu. Reconnexion automatique…</p>}
  </aside>;
}
