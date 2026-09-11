"use client";

import {useState} from "react";

const promos=[
 {title:"Poulet fermier",price:"6,90 € / kg",image:"https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=900"},
 {title:"Côtelettes marinées",price:"12,90 € / kg",image:"https://images.pexels.com/photos/1927377/pexels-photo-1927377.jpeg?auto=compress&cs=tinysrgb&w=900"},
 {title:"Pack barbecue",price:"24,90 €",image:"https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=900"}
];

export default function DemoTicketBoucherie(){
 const [ticket,setTicket]=useState(null);
 return <main style={{minHeight:"100vh",background:"#f5f7f8",fontFamily:"Arial,sans-serif",color:"#172126",padding:"28px 14px"}}>
  <div style={{maxWidth:520,margin:"0 auto"}}>
   <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:13,fontWeight:800,letterSpacing:1.4,color:"#66757c"}}>LEHNOVA TICKET · DÉMO</div><h1 style={{margin:"8px 0 4px",fontSize:28}}>Boucherie des Halles</h1><p style={{margin:0,color:"#6b777c"}}>Prenez votre ticket sans rester dans la file.</p></div>
   <section style={{background:"white",borderRadius:22,padding:22,boxShadow:"0 12px 35px rgba(0,0,0,.08)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:18}}><div><div style={{fontSize:13,color:"#718087"}}>Personnes en attente</div><strong style={{fontSize:32}}>4</strong></div><div style={{textAlign:"right"}}><div style={{fontSize:13,color:"#718087"}}>Attente estimée</div><strong style={{fontSize:20}}>≈ 10 min</strong></div></div>
    {!ticket?<button onClick={()=>setTicket("#005")} style={{width:"100%",border:0,borderRadius:15,padding:"16px",background:"#172126",color:"white",fontWeight:800,fontSize:16,cursor:"pointer"}}>Prendre un ticket</button>:<div style={{textAlign:"center",background:"#f1f5f5",borderRadius:15,padding:17}}><div style={{fontSize:13,color:"#718087"}}>Votre ticket</div><strong style={{fontSize:34}}>{ticket}</strong><div style={{fontSize:13}}>Vous pouvez continuer vos achats.</div></div>}
   </section>
   <section style={{marginTop:18}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",marginBottom:10}}><div><div style={{fontSize:12,fontWeight:800,color:"#b24b34"}}>🔥 PENDANT VOTRE ATTENTE</div><h2 style={{fontSize:20,margin:"4px 0 0"}}>Découvrez nos promos</h2></div><a href="#toutes-les-promos" style={{fontSize:13,fontWeight:800,color:"#172126"}}>Voir tout →</a></div>
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>{promos.map(p=><a key={p.title} href="#toutes-les-promos" style={{minWidth:210,height:145,borderRadius:18,overflow:"hidden",position:"relative",display:"block",textDecoration:"none",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.12)"}}><img src={p.image} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(transparent 35%,rgba(0,0,0,.78))"}}/><div style={{position:"absolute",left:14,right:14,bottom:12}}><strong style={{display:"block",fontSize:16}}>{p.title}</strong><span style={{fontSize:14,fontWeight:800}}>{p.price}</span></div></a>)}</div>
   </section>
   <section id="toutes-les-promos" style={{marginTop:22,background:"white",borderRadius:22,padding:20}}><div style={{fontSize:12,fontWeight:800,color:"#b24b34"}}>BOUCHERIE DES HALLES</div><h2 style={{margin:"5px 0 8px"}}>Toutes les offres du moment</h2><p style={{margin:"0 0 16px",color:"#6b777c",fontSize:14}}>Cette zone simule la page Lehnova du commerce. Le lien pourra ensuite pointer vers la vraie page que vous préparez.</p>{promos.map(p=><div key={p.title} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:"1px solid #edf0f1"}}><img src={p.image} alt="" style={{width:74,height:60,objectFit:"cover",borderRadius:11}}/><div style={{flex:1}}><strong>{p.title}</strong><div style={{fontSize:14,color:"#6b777c"}}>Offre du moment</div></div><strong>{p.price}</strong></div>)}</section>
   <p style={{textAlign:"center",fontSize:11,color:"#8a969b",marginTop:20}}>Démo Lehnova · Ticket & offres commerce</p>
  </div>
 </main>
}