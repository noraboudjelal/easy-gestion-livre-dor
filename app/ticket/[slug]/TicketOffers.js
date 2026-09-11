"use client";
import {useEffect,useState} from 'react';
import TicketQr from '../TicketQr';
import {ticketColors} from '../ticketStyles';

export default function TicketOffers({slug}) {
  const [url,setUrl]=useState(null);
  useEffect(()=>{
    const controller=new AbortController();
    setUrl(null);
    fetch(`/api/ticket/public/${encodeURIComponent(slug)}`,{cache:'no-store',signal:controller.signal})
      .then(async r=>r.ok?r.json():null).then(data=>setUrl(data?.offers_url||null)).catch(()=>{});
    return ()=>controller.abort();
  },[slug]);
  if(!url) return null;
  return <aside style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${ticketColors.border}`,textAlign:'center'}}>
    <p style={{fontSize:14,color:ticketColors.muted}}>Pendant votre attente, découvrez nos offres</p>
    <a href={url} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'12px 22px',borderRadius:12,background:ticketColors.background,color:ticketColors.accent,fontWeight:750}}>Voir les offres</a>
    <details style={{marginTop:14,fontSize:13,color:ticketColors.muted}}>
      <summary style={{cursor:'pointer',padding:8}}>Afficher le QR code des offres</summary>
      <TicketQr url={url} label="Découvrez les offres sur votre téléphone" size={180}/>
    </details>
  </aside>;
}
