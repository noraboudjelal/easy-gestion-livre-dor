"use client";
import {ticketColors} from './ticketStyles';

export default function SimplifiedTicketOffers({offers=[]}){
  const visible=Array.isArray(offers)?offers.filter(o=>o&&(o.title||o.detail||o.image_url)):[];
  if(!visible.length)return null;
  return <aside style={{marginTop:28,paddingTop:24,borderTop:`1px solid ${ticketColors.border}`}}>
    <div style={{textAlign:'center',marginBottom:18}}><p style={{margin:'0 0 4px',fontSize:11,fontWeight:800,letterSpacing:'.22em',color:ticketColors.ink}}>NOS OFFRES</p><p style={{margin:0,fontSize:13,color:ticketColors.muted}}>À découvrir pendant votre attente</p></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>{visible.map((offer,i)=><article key={i} style={{background:'#FAFAF9',border:`1px solid ${ticketColors.border}`,borderRadius:16,overflow:'hidden'}}>{offer.image_url&&<img src={offer.image_url} alt={offer.title||''} loading="lazy" style={{display:'block',width:'100%',aspectRatio:'4/3',objectFit:'cover'}}/>}<div style={{padding:12}}>{offer.title&&<strong style={{display:'block',fontSize:15,color:ticketColors.ink}}>{offer.title}</strong>}{offer.detail&&<span style={{display:'block',marginTop:6,fontSize:14,fontWeight:700,color:ticketColors.ink}}>{offer.detail}</span>}</div></article>)}</div>
  </aside>;
}
