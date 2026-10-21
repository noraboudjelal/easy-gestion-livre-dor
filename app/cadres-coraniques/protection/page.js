"use client";
import { useRef, useState } from "react";
import Link from "next/link";

const tracks = [
  { title: "Al-Ikhlas", arabic: "الإخلاص", file: "112001.mp3" },
  { title: "Al-Falaq", arabic: "الفلق", file: "113001.mp3" },
  { title: "An-Nas", arabic: "الناس", file: "114001.mp3" },
];
// Demonstration audio only. Verify the reciter/distributor's reuse rights before commercial use.
const audioBase = "https://everyayah.com/data/Alafasy_128kbps/";
export default function ProtectionPage() {
  const audio = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const play = async (i) => {
    setIndex(i);
    if (!audio.current) return;
    audio.current.src = audioBase + tracks[i].file;
    try { await audio.current.play(); setPlaying(true); } catch { setPlaying(false); }
  };
  const next = () => {
    if (index < tracks.length - 1) play(index + 1);
    else setPlaying(false);
  };
  return <main style={{minHeight:"100vh",background:"#f8f5f0",color:"#40352d",padding:"48px 16px",fontFamily:"system-ui,sans-serif"}}>
    <section style={{maxWidth:560,margin:"auto",background:"white",borderRadius:24,padding:"32px 24px",boxShadow:"0 12px 38px #40352d12",textAlign:"center"}}>
      <div style={{fontSize:32}}>☪</div>
      <h1 style={{fontSize:27,marginBottom:8}}>Les trois sourates de protection</h1>
      <p style={{color:"#817467"}}>Écoutez Al-Ikhlas, Al-Falaq et An-Nas, l'une après l'autre.</p>
      <button onClick={()=>play(0)} style={{background:"#846a4d",color:"white",border:0,borderRadius:30,padding:"15px 26px",fontSize:16,cursor:"pointer",margin:"20px 0"}}>▶ Tout écouter</button>
      <div style={{display:"grid",gap:10,marginTop:12}}>
        {tracks.map((track,i)=><button key={track.file} onClick={()=>play(i)} style={{padding:17,border:"1px solid #e7ded4",borderRadius:14,background:index===i&&playing?"#f3e9dd":"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:"#40352d",fontSize:16}}>
          <span>{i+1}. {track.title}</span><span lang="ar" dir="rtl">{track.arabic} &nbsp; ▶</span>
        </button>)}
      </div>
      <audio ref={audio} controls onEnded={next} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} style={{width:"100%",marginTop:24}} preload="none"/>
      <p style={{fontSize:12,color:"#817467",marginTop:24}}>L'écoute démarre après une action sur votre téléphone.</p>
      <p style={{fontSize:12,color:"#817467"}}><Link href="/">Lehnova</Link></p>
    </section>
  </main>;
}
