"use client";
import {useEffect,useState} from 'react';
import {ticketColors} from '../ticketStyles';

export default function TicketOffers({slug}) {
  const [settings,setSettings]=useState(null);
  const offers=Array.isArray(settings?.offer_previews)
    ? settings.offer_previews.filter(o=>o&&(o.title||o.detail||o.image_url))
    : [];

  useEffect(()=>{
    const controller=new AbortController();
    setSettings(null);
    fetch(`/api/ticket/public/${encodeURIComponent(slug)}`,{cache:'no-store',signal:controller.signal})
      .then(async r=>r.ok?r.json():null)
      .then(data=>setSettings(data))
      .catch(()=>{});
    return ()=>controller.abort();
  },[slug]);

  if(!offers.length) return null;

  return <aside style={{marginTop:28,paddingTop:24,borderTop:`1px solid ${ticketColors.border}`}}>
    <div style={{textAlign:'center',marginBottom:18}}>
      <p style={{margin:'0 0 4px',fontSize:11,fontWeight:800,letterSpacing:'.22em',color:ticketColors.ink}}>NOS OFFRES</p>
      <p style={{margin:0,fontSize:13,color:ticketColors.muted}}>À découvrir pendant votre attente</p>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
      {offers.map((offer,i)=><article key={i} style={{background:'#FAFAF9',border:`1px solid ${ticketColors.border}`,borderRadius:16,overflow:'hidden',boxShadow:'0 8px 24px -22px rgba(0,0,0,.55)'}}>
        {offer.image_url&&<img src={offer.image_url} alt={offer.title||''} loading="lazy" style={{display:'block',width:'100%',aspectRatio:'4/3',objectFit:'cover'}}/>}
        <div style={{padding:12,textAlign:'left'}}>
          {offer.title&&<strong style={{display:'block',fontSize:15,lineHeight:1.25,color:ticketColors.ink}}>{offer.title}</strong>}
          {offer.detail&&<span style={{display:'block',marginTop:6,fontSize:14,fontWeight:700,color:ticketColors.ink}}>{offer.detail}</span>}
        </div>
      </article>)}
    </div>
  </aside>;
}
