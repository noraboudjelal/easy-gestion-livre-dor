"use client";
import {useEffect,useState} from 'react';
import TicketQr from '../TicketQr';
import {ticketColors} from '../ticketStyles';

export default function TicketOffers({slug}) {
  const [settings,setSettings]=useState(null);
  const url=settings?.offers_url;
  const offers=Array.isArray(settings?.offer_previews)?settings.offer_previews.filter(o=>o&&(o.url||url)):[];
  useEffect(()=>{
    const controller=new AbortController();
    setSettings(null);
    fetch(`/api/ticket/public/${encodeURIComponent(slug)}`,{cache:'no-store',signal:controller.signal})
      .then(async r=>r.ok?r.json():null).then(data=>setSettings(data)).catch(()=>{});
    return ()=>controller.abort();
  },[slug]);
  if(!url&&!offers.length) return null;
  return <aside style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${ticketColors.border}`,textAlign:'center'}}>
    <p style={{fontSize:14,color:ticketColors.muted}}>Pendant votre attente, découvrez nos offres</p>
    <div style={{display:'grid',gap:10,margin:'16px 0'}}>{offers.map((offer,i)=><a key={i} href={offer.url||url} style={{display:'flex',alignItems:'center',gap:14,textAlign:'left',textDecoration:'none',color:ticketColors.ink,background:ticketColors.background,borderRadius:14,overflow:'hidden',minHeight:96}}>{offer.image_url&&<img src={offer.image_url} alt="" loading="lazy" style={{width:110,height:100,objectFit:'cover',flexShrink:0}}/>}<span style={{padding:'12px 8px',minWidth:0,overflowWrap:'anywhere'}}><strong style={{display:'block',fontSize:16}}>{offer.title}</strong>{offer.detail&&<span style={{display:'block',marginTop:6,fontSize:14,color:ticketColors.accent}}>{offer.detail}</span>}</span><span aria-hidden="true" style={{marginLeft:'auto',paddingRight:12}}>→</span></a>)}</div>
    {url&&<a href={url} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'12px 22px',borderRadius:12,background:ticketColors.background,color:ticketColors.accent,fontWeight:750}}>Voir toutes les offres →</a>}
    {url&&<details style={{marginTop:14,fontSize:13,color:ticketColors.muted}}>
      <summary style={{cursor:'pointer',padding:8}}>Afficher le QR code des offres</summary>
      <TicketQr url={url} label="Découvrez les offres sur votre téléphone" size={180}/>
    </details>}
  </aside>;
}
