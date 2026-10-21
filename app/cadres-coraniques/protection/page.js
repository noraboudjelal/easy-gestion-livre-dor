"use client";
import { useRef, useState } from "react";
import Link from "next/link";

// EveryAyah files contain ONE verse each, not an entire surah.
// Demo recordings: verify licensing and reciter/distributor permission before selling.
const base = "https://everyayah.com/data/Alafasy_128kbps/";
const surahs = [
  { title:"Al-Ikhlas", arabic:"الإخلاص", number:112, verses:4 },
  { title:"Al-Falaq", arabic:"الفلق", number:113, verses:5 },
  { title:"An-Nas", arabic:"الناس", number:114, verses:6 },
];
const playlist = surahs.flatMap((s,surahIndex)=>Array.from({length:s.verses},(_,v)=>({
  surahIndex, verse:v+1,
  src:base+String(s.number).padStart(3,"0")+String(v+1).padStart(3,"0")+".mp3"
})));
export default function ProtectionPage(){
 const audio=useRef(null);
 const position=useRef(0);
 const [current,setCurrent]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState("");
 const playAt=async (n)=>{
   const item=playlist[n];
   if(!item||!audio.current)return;
   position.current=n;
   setCurrent(n);
   setError("");
   audio.current.src=item.src;
   try{await audio.current.play();setPlaying(true)}
   catch{setPlaying(false);setError("Lecture impossible. Vérifiez votre connexion et réessayez.")}
 };
 const next=()=>{const n=position.current+1;if(n<playlist.length)playAt(n);else setPlaying(false)};
 return <main style={{minHeight:"100vh",background:"#f8f5f0",color:"#40352d",padding:"48px 16px",fontFamily:"system-ui,sans-serif"}}>
 <section style={{maxWidth:560,margin:"auto",background:"white",borderRadius:24,padding:"32px 24px",boxShadow:"0 12px 38px #40352d12",textAlign:"center"}}>
 <div style={{fontSize:32}}>☪</div>
 <h1 style={{fontSize:27,marginBottom:8}}>Les trois sourates de protection</h1>
 <p style={{color:"#817467"}}>Écoutez les 4 versets d'Al-Ikhlas, les 5 versets d'Al-Falaq puis les 6 versets d'An-Nas.</p>
 <button onClick={()=>playAt(0)} style={{background:"#846a4d",color:"white",border:0,borderRadius:30,padding:"15px 26px",fontSize:16,cursor:"pointer",margin:"20px 0"}}>▶ Tout écouter</button>
 <div style={{display:"grid",gap:10,marginTop:12}}>
 {surahs.map((s,i)=><button key={s.number} onClick={()=>playAt(playlist.findIndex(p=>p.surahIndex===i))} style={{padding:17,border:"1px solid #e7ded4",borderRadius:14,background:playlist[current].surahIndex===i&&playing?"#f3e9dd":"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:"#40352d",fontSize:16}}>
 <span>{i+1}. {s.title} ({s.verses} versets)</span><span lang="ar" dir="rtl">{s.arabic} ▶</span></button>)}
 </div>
 <p style={{fontSize:13,color:"#806c58"}}>{playing?"Lecture : ":"Prêt : "}{surahs[playlist[current].surahIndex].title} — verset {playlist[current].verse}/{surahs[playlist[current].surahIndex].verses}</p>
 <audio ref={audio} controls onEnded={next} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onError={()=>setError("Le fichier audio n'a pas pu être chargé.")} style={{width:"100%",marginTop:12}} preload="none"/>
 {error&&<p role="alert" style={{color:"#a33224"}}>{error}</p>}
 <p style={{fontSize:12,color:"#817467",marginTop:24}}>Appuyez sur « Tout écouter » pour lancer les 15 versets à la suite.</p>
 <p style={{fontSize:12,color:"#817467"}}><Link href="/">Lehnova</Link></p>
 </section></main>;
}