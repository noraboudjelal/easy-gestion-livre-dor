"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Full-surah recordings (one MP3 per surah). Verify each edition, availability and commercial licensing before selling.
const voices = [
 {id:"Alafasy_128kbps",name:"Mishary Al-Afasy",url:"https://cdn.mp3quran.net/audio/mishary-alafasy/r1/"},
 {id:"Husary_128kbps",name:"Mahmoud Khalil Al-Husary",url:"https://cdn.mp3quran.net/audio/mahmoud-husary/r1/"},
 {id:"Minshawy_Murattal_128kbps",name:"Mohamed Siddiq Al-Minshawi",url:"https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/"},
 {id:"Abdul_Basit_Murattal_64kbps",name:"Abdul Basit Abdus Samad",url:"https://server7.mp3quran.net/basit/128/"},
 {id:"Ghamadi_40kbps",name:"Saad Al-Ghamdi",url:"https://server7.mp3quran.net/s_gmd/128/"}
];
const surahs = [
  { title:"Al-Ikhlas", arabic:"الإخلاص", number:112, verses:4 },
  { title:"Al-Falaq", arabic:"الفلق", number:113, verses:5 },
  { title:"An-Nas", arabic:"الناس", number:114, verses:6 },
];

export default function ProtectionPage(){
 const audio=useRef(null);
 const [voice,setVoice]=useState("Alafasy_128kbps");
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("reciter") || window.localStorage.getItem("lehnova-quran-reciter");if(voices.some(v=>v.id===requested))setVoice(requested)},[]);
 const changeVoice=(id)=>{setVoice(id);window.localStorage.setItem("lehnova-quran-reciter",id);if(audio.current){audio.current.pause();audio.current.removeAttribute("src");audio.current.load();setPlaying(false);}};
 const position=useRef(0);
 const [current,setCurrent]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState("");
 const playAt=async (n)=>{
   const item=surahs[n];
   if(!item||!audio.current)return;
   position.current=n;
   setCurrent(n);
   setError("");
   const selected=voices.find(v=>v.id===voice)||voices[0];
   audio.current.src=selected.url+String(item.number).padStart(3,"0")+".mp3";
   try{await audio.current.play();setPlaying(true)}
   catch{setPlaying(false);setError("Lecture impossible. Vérifiez votre connexion et réessayez.")}
 };
 const next=()=>{const n=position.current+1;if(n<surahs.length)playAt(n);else setPlaying(false)};
 return <main style={{minHeight:"100vh",background:"radial-gradient(circle at top,#f8edda 0%,#e9dcc7 58%,#dfcdb4 100%)",color:"#453525",padding:"32px 16px 64px",fontFamily:"Georgia,serif"}}>
 <section style={{maxWidth:590,margin:"auto",background:"#fffcf6",border:"2px solid #c5a16a",borderRadius:26,padding:"clamp(24px,5vw,44px)",boxShadow:"0 20px 55px #6a4b2820, inset 0 0 0 7px #fffaf0, inset 0 0 0 8px #e9d6b7",textAlign:"center"}}>
 <div aria-hidden="true" style={{fontSize:30,color:"#a6814c",marginBottom:12}}>✧ ۞ ✧</div>
 <p style={{letterSpacing:3,fontSize:11,fontWeight:700,color:"#a6814c",fontFamily:"system-ui,sans-serif",margin:"0 0 18px"}}>LEHNOVA · ÉCOUTE CORANIQUE</p>
 <h1 style={{fontSize:"clamp(29px,6vw,39px)",lineHeight:1.25,margin:"0 0 12px",fontWeight:600}}>Les trois sourates<br/>de protection</h1>
 <p lang="ar" dir="rtl" style={{fontSize:"clamp(25px,6vw,34px)",lineHeight:1.8,color:"#997544",margin:"0 0 12px",fontFamily:"serif"}}>سُوَرُ الْمُعَوِّذَاتِ</p>
 <p style={{color:"#817261",fontFamily:"system-ui,sans-serif",fontSize:14,lineHeight:1.7,maxWidth:410,margin:"0 auto 28px"}}>Al-Ikhlas · Al-Falaq · An-Nas<br/>Un moment de paix et de recueillement.</p>
 <div style={{height:1,background:"linear-gradient(90deg,transparent,#c7a978,transparent)",marginBottom:28}}/>
 <button onClick={()=>playAt(0)} style={{width:"100%",background:"linear-gradient(135deg,#b79255,#76532b)",color:"white",border:0,borderRadius:16,padding:"19px 22px",fontSize:18,fontWeight:600,cursor:"pointer",fontFamily:"system-ui,sans-serif",boxShadow:"0 8px 18px #84643a25"}}>▶ &nbsp; Tout écouter</button>
 <p style={{fontSize:12,color:"#8c7d6c",fontFamily:"system-ui,sans-serif",margin:"11px 0 26px"}}>Lecture complète des trois sourates à la suite</p>
 <div style={{display:"grid",gap:12,textAlign:"left"}}>
 {surahs.map((s,i)=><button key={s.number} onClick={()=>playAt(i)} aria-label={"Lire la sourate "+s.title} style={{width:"100%",padding:"17px 18px",border:current===i&&playing?"1px solid #b89561":"1px solid #e9dece",borderRadius:12,background:current===i&&playing?"#f8f0e3":"#fffaf4",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,cursor:"pointer",color:"#453525",fontFamily:"system-ui,sans-serif",textAlign:"left"}}>
 <span style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}><span style={{width:32,height:32,borderRadius:"50%",background:"#efe3d1",color:"#86683f",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,fontSize:13}}>{i+1}</span><span><strong style={{display:"block",fontSize:16}}>{s.title}</strong><span style={{display:"block",fontSize:12,color:"#867768",marginTop:4}}>{s.verses} versets · Sourate {s.number}</span></span></span>
 <span style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}><span lang="ar" dir="rtl" style={{fontSize:24,fontFamily:"serif",color:"#8f6b3d"}}>{s.arabic}</span><span aria-hidden="true" style={{width:36,height:36,borderRadius:"50%",background:current===i&&playing?"#87643c":"#e9d6b7",color:current===i&&playing?"#fff":"#785631",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 2px 7px #73502b18"}}>{current===i&&playing?"♫":"▶"}</span></span>
 </button>)}
 </div>
 <div style={{marginTop:28,padding:"20px 16px",borderRadius:17,background:"#f8f3ec",border:"1px solid #eee2d2",fontFamily:"system-ui,sans-serif"}}>
 <p style={{fontSize:12,letterSpacing:1,textTransform:"uppercase",color:"#98774d",margin:"0 0 8px"}}>{playing?"En cours de lecture":"Lecteur audio"}</p>
 <p aria-live="polite" style={{fontSize:15,fontWeight:600,margin:"0 0 14px"}}>{surahs[current].title} — sourate complète</p>
 <audio ref={audio} controls onEnded={next} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onError={()=>setError("Cet enregistrement complet est indisponible pour cette voix. Essayez un autre récitant.")} style={{width:"100%",display:"block"}} preload="none"/>
 {error&&<p role="alert" style={{color:"#a33224",fontSize:13}}>{error}</p>}
 </div>
 <div style={{marginTop:26,textAlign:"left",fontFamily:"system-ui,sans-serif"}}>
 <label htmlFor="reciter-select" style={{display:"block",fontSize:13,fontWeight:600,color:"#66533e",marginBottom:9}}>Choisir la voix du récitant</label>
 <select id="reciter-select" aria-label="Récitant" value={voice} onChange={e=>changeVoice(e.target.value)} style={{width:"100%",padding:"14px 12px",border:"1px solid #ddcdb8",borderRadius:12,fontSize:15,background:"#fffdf9",color:"#453525"}}>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>
 </div>
 <p style={{fontFamily:"system-ui,sans-serif",fontSize:11,color:"#9a8b7a",marginTop:30}}>Chaque sourate est diffusée dans un enregistrement complet.</p>
 <p style={{fontFamily:"system-ui,sans-serif",fontSize:12,marginTop:12}}><Link href="/" style={{color:"#8d6e43",textDecoration:"none"}}>Lehnova</Link></p>
 </section></main>;
}