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
 return <main style={{minHeight:"100vh",background:"#f8f5f0",color:"#40352d",padding:"48px 16px",fontFamily:"system-ui,sans-serif"}}>
 <section style={{maxWidth:560,margin:"auto",background:"white",borderRadius:24,padding:"32px 24px",boxShadow:"0 12px 38px #40352d12",textAlign:"center"}}>
 <div style={{fontSize:32}}>☪</div>
 <h1 style={{fontSize:27,marginBottom:8}}>Les trois sourates de protection</h1>
 <p style={{color:"#817467"}}>Écoutez les 4 versets d'Al-Ikhlas, les 5 versets d'Al-Falaq puis les 6 versets d'An-Nas.</p>
 <label style={{display:"block",marginTop:20}}>Choisir la voix du récitant</label>
 <select aria-label="Récitant" value={voice} onChange={e=>changeVoice(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #d8c8b6",borderRadius:10,marginTop:8,fontSize:16}}>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>
 <button onClick={()=>playAt(0)} style={{background:"#846a4d",color:"white",border:0,borderRadius:30,padding:"15px 26px",fontSize:16,cursor:"pointer",margin:"20px 0"}}>▶ Tout écouter</button>
 <div style={{display:"grid",gap:10,marginTop:12}}>
 {surahs.map((s,i)=><button key={s.number} onClick={()=>playAt(i)} style={{padding:17,border:"1px solid #e7ded4",borderRadius:14,background:current===i&&playing?"#f3e9dd":"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:"#40352d",fontSize:16}}>
 <span>{i+1}. {s.title} ({s.verses} versets)</span><span lang="ar" dir="rtl">{s.arabic} ▶</span></button>)}
 </div>
 <p style={{fontSize:13,color:"#806c58"}}>{playing?"Lecture : ":"Prêt : "}{surahs[current].title} — sourate complète</p>
 <audio ref={audio} controls onEnded={next} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onError={()=>setError("Cet enregistrement complet est indisponible pour cette voix. Essayez un autre récitant.")} style={{width:"100%",marginTop:12}} preload="none"/>
 {error&&<p role="alert" style={{color:"#a33224"}}>{error}</p>}
 <p style={{fontSize:12,color:"#817467",marginTop:24}}>Chaque sourate utilise un seul enregistrement complet. « Tout écouter » enchaîne les trois sourates.</p>
 <p style={{fontSize:12,color:"#817467"}}><Link href="/">Lehnova</Link></p>
 </section></main>;
}