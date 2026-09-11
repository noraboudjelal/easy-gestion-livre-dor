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
  return <aside style={{marginTop:28,paddingTop:24,borderTop:`1px solid ${ticketColors.border}`,textAlign:'center'}}>
    <p style={{margin:'0 0 4px',fontSize:11,fontWeight:800,letterSpacing:'.22em',color:ticketColors.ink}}>NOS OFFRES</p>
    <p style={{margin:'0 0 18px',fontSize:13,color:ticketColors.muted}}>À découvrir pendant votre attente</p>
    <div style={{display:'grid',gap:10,margin:'0 0 18px'}}>{offers.map((offer,i)=><a key={i} href={offer.url||url} style={{display:'flex',alignItems:'center',gap:14,textAlign:'left',textDecoration:'none',color:ticketColors.ink,background:'#FAFAF9',border:`1px solid ${ticketColors.border}`,borderRadius:16,overflow:'hidden',minHeight:96,boxShadow:'0 8px 24px -22px rgba(0,0,0,.55)'}}>{offer.image_url&&<img src={offer.image_url} alt="" loading="lazy" style={{width:112,height:100,objectFit:'cover',flexShrink:0}}/>}<span style={{padding:'12px 8px',minWidth:0,overflowWrap:'anywhere'}}><strong style={{display:'block',fontSize:16,lineHeight:1.25}}>{offer.title}</strong>{offer.detail&&<span style={{display:'block',marginTop:7,fontSize:14,color:ticketColors.muted}}>{offer.detail}</span>}</span><span aria-hidden="true" style={{marginLeft:'auto',paddingRight:15,fontSize:18}}>→</span></a>)}</div>
    {url&&<a href={url} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'11px 22px',border:`1px solid ${ticketColors.ink}`,borderRadius:999,background:'#fff',color:ticketColors.ink,textDecoration:'none',fontSize:13,fontWeight:750}}>Voir toutes les offres →</a>}
    {url&&<details style={{marginTop:16,fontSize:12,color:ticketColors.muted}}><summary style={{cursor:'pointer',padding:8}}>Afficher le QR code des offres</summary><TicketQr url={url} label="Découvrez les offres sur votre téléphone" size={180}/></details>}
  </aside>;
}
