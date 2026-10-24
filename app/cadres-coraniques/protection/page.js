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
  { title:"Ayat al-Kursi", arabic:"آية الكرسي", number:2, verses:1, ayah:255 },
];

export default function ProtectionPage(){
 const audio=useRef(null);
 const [chosenNumbers,setChosenNumbers]=useState([]);
 const [ready,setReady]=useState(false);
 const [showVerses,setShowVerses]=useState(true);
 const [verses,setVerses]=useState({});
 const [verseError,setVerseError]=useState("");
 const activeSurahs=surahs.filter(s=>chosenNumbers.includes(s.number));
 const [voice,setVoice]=useState("Alafasy_128kbps");
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("reciter") || window.localStorage.getItem("lehnova-quran-reciter");if(voices.some(v=>v.id===requested))setVoice(requested);const selection=params.get("selection")||params.get("surahs");if(selection){const numbers=selection.split(",").map(Number).filter(n=>[2,112,113,114].includes(n));if(numbers.length)setChosenNumbers([...new Set(numbers)]);else setChosenNumbers([112,113,114]);}else setChosenNumbers([112,113,114]);setReady(true);},[]);
 useEffect(()=>{if(!showVerses||!ready)return;let cancelled=false;setVerseError("");Promise.all(activeSurahs.map(async item=>{const endpoint=item.ayah?"2:255":String(item.number);const editions=["quran-uthmani","en.transliteration","fr.hamidullah"];const results=await Promise.all(editions.map(async ed=>{const r=await fetch("https://api.alquran.cloud/v1/"+(item.ayah?"ayah/":"surah/")+endpoint+"/"+ed);if(!r.ok)throw Error("Données indisponibles");const json=await r.json();if(json.code!==200)throw Error("Données indisponibles");return Array.isArray(json.data.ayahs)?json.data.ayahs:[json.data];}));return [item.number,results[0].map((v,i)=>({number:item.ayah?255:v.numberInSurah,arabic:v.text,phonetic:results[1][i]?.text||"",french:results[2][i]?.text||""}))];})).then(entries=>{if(!cancelled)setVerses(Object.fromEntries(entries));}).catch(()=>{if(!cancelled)setVerseError("Impossible de charger les versets pour le moment.");});return()=>{cancelled=true;};},[showVerses,ready,chosenNumbers.join(",")]);
 const changeVoice=(id)=>{setVoice(id);window.localStorage.setItem("lehnova-quran-reciter",id);if(audio.current){audio.current.pause();audio.current.removeAttribute("src");audio.current.load();setPlaying(false);}};
 const position=useRef(0);
 const [current,setCurrent]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState("");
 const playAt=async (n)=>{
   const item=activeSurahs[n];
   if(!item||!audio.current)return;
   position.current=n;
   setCurrent(n);
   setElapsed(0);
   setDuration(0);
   setError("");
   const selected=voices.find(v=>v.id===voice)||voices[0];
   audio.current.src=item.ayah? "https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3" : selected.url+String(item.number).padStart(3,"0")+".mp3";
   try{await audio.current.play();setPlaying(true)}
   catch{setPlaying(false);setError("Lecture impossible. Vérifiez votre connexion et réessayez.")}
 };
 const [elapsed,setElapsed]=useState(0);
 const [duration,setDuration]=useState(0);
 const togglePlayback=async()=>{
  if(!audio.current)return;
  if(playing){audio.current.pause();return;}
  if(!audio.current.src||!audio.current.getAttribute("src")){await playAt(current);return;}
  try{await audio.current.play();setError("");}catch{setError("Impossible de reprendre la lecture.");}
 };
 const seekTo=value=>{if(audio.current&&Number.isFinite(audio.current.duration)){audio.current.currentTime=Number(value);setElapsed(Number(value));}};
 const formatTime=seconds=>{const n=Math.floor(Number.isFinite(seconds)?seconds:0);return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");};
 const isKursi=activeSurahs.length===1&&activeSurahs[0].number===2;
 const isProtection=activeSurahs.length===3&&[112,113,114].every(n=>chosenNumbers.includes(n));
 const next=()=>{const n=position.current+1;if(n<activeSurahs.length)playAt(n);else setPlaying(false)};
 if(!ready)return <main style={{padding:30}}>Chargement de votre sélection…</main>;
 return <main style={{minHeight:"100vh",background:"radial-gradient(circle at top,#f8edda 0%,#e9dcc7 58%,#dfcdb4 100%)",color:"#453525",padding:"2px 8px 20px",fontFamily:"Georgia,serif"}}>
 <section style={{maxWidth:590,margin:"auto",background:"#fffcf6",border:"2px solid #c5a16a",borderRadius:26,padding:"8px 15px 18px",boxShadow:"0 20px 55px #6a4b2820, inset 0 0 0 7px #fffaf0, inset 0 0 0 8px #e9d6b7",textAlign:"center"}}>
 <div aria-hidden="true" style={{fontSize:16,color:"#a6814c",marginBottom:0}}>✧ ۞ ✧</div>
 <p style={{letterSpacing:3,fontSize:11,fontWeight:700,color:"#a6814c",fontFamily:"system-ui,sans-serif",margin:"0 0 1px"}}>LEHNOVA · ÉCOUTE CORANIQUE</p>
 <h1 style={{fontSize:"clamp(23px,5vw,32px)",lineHeight:1.25,margin:"0 0 4px",fontWeight:600}}>{isKursi?"Écoutez Ayat al-Kursi":isProtection?<>Écoutez les sourates<br/>de protection</>:activeSurahs.length===1?"Écoutez "+activeSurahs[0].title:"Écoutez votre sélection"}</h1>
 <p lang="ar" dir="rtl" style={{fontSize:"clamp(22px,5vw,30px)",lineHeight:1.35,color:"#997544",margin:"0 0 4px",fontFamily:"serif"}}>{isKursi?"آيَةُ الْكُرْسِيِّ":isProtection?"سُوَرُ الْمُعَوِّذَاتِ":activeSurahs.map(s=>s.arabic).join(" · ")}</p>
 <p style={{color:"#817261",fontFamily:"system-ui,sans-serif",fontSize:14,lineHeight:1.7,maxWidth:410,margin:"0 auto 5px"}}>{activeSurahs.map(s=>s.title).join(" · ")}<br/>Un moment de paix et de recueillement.</p>
 <div style={{height:1,background:"linear-gradient(90deg,transparent,#c7a978,transparent)",marginBottom:5}}/>
 <div style={{display:"grid",gap:12,textAlign:"left"}}>
 {activeSurahs.map((s,i)=><button key={s.number} onClick={()=>playAt(i)} aria-label={"Lire la sourate "+s.title} style={{width:"100%",padding:"12px 14px",border:current===i&&playing?"1px solid #b89561":"1px solid #e9dece",borderRadius:12,background:current===i&&playing?"#f8f0e3":"#fffaf4",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,cursor:"pointer",color:"#453525",fontFamily:"system-ui,sans-serif",textAlign:"left"}}>
 <span style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}><span style={{width:32,height:32,borderRadius:"50%",background:"#efe3d1",color:"#86683f",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,fontSize:13}}>{i+1}</span><span><strong style={{display:"block",fontSize:16}}>{s.title}</strong><span style={{display:"block",fontSize:12,color:"#867768",marginTop:4}}>{s.ayah?"Verset 255 · Al-Baqara":s.verses+" versets · Sourate "+s.number}</span></span></span>
 <span style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}><span lang="ar" dir="rtl" style={{fontSize:24,fontFamily:"serif",color:"#8f6b3d"}}>{s.arabic}</span><span aria-hidden="true" style={{width:48,height:48,borderRadius:"50%",background:current===i&&playing?"#87643c":"#e9d6b7",color:current===i&&playing?"#fff":"#785631",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:23,fontWeight:800,boxShadow:"0 2px 7px #73502b18"}}>{current===i&&playing?"♫":"▶"}</span></span>
 </button>)}
 </div>
 <div style={{marginTop:14,padding:"14px",background:"#f8f1e6",border:"1px solid #dec8a5",borderRadius:16,fontFamily:"system-ui,sans-serif"}}>
 <p style={{margin:"0 0 10px",fontSize:14,fontWeight:600,color:"#72502d"}}>{activeSurahs[current]?.title||"Récitation"}</p>
 <button type="button" onClick={togglePlayback} style={{border:0,borderRadius:30,background:"#86643c",color:"#fff",fontSize:16,fontWeight:700,padding:"12px 28px",cursor:"pointer"}}>{playing?"⏸ Pause":"▶ "+(elapsed>0?"Reprendre":"Écouter")}</button>
 <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}>
 <span style={{fontSize:12,minWidth:34}}>{formatTime(elapsed)}</span>
 <input type="range" aria-label="Avancer ou reculer dans la récitation" min="0" max={duration>0?duration:1} step="1" value={Math.min(elapsed,duration>0?duration:1)} onChange={e=>seekTo(e.target.value)} disabled={!duration} style={{flex:1,minWidth:0,accentColor:"#86643c"}}/>
 <span style={{fontSize:12,minWidth:34}}>{formatTime(duration)}</span>
 </div></div>
 <audio ref={audio} onEnded={next} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onTimeUpdate={e=>setElapsed(e.currentTarget.currentTime)} onDurationChange={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onError={()=>setError("Cet enregistrement est indisponible pour cette voix. Essayez un autre récitant.")} preload="none" />
 {error&&<p role="alert" style={{color:"#a33224",fontSize:13}}>{error}</p>}
 <div style={{marginTop:16}}><button type="button" onClick={()=>setShowVerses(v=>!v)} style={{width:"100%",padding:14,borderRadius:12,border:"1px solid #c6a16a",background:"#fff7e9",color:"#684a2b",fontWeight:700,fontSize:15,cursor:"pointer"}}>{showVerses?"Masquer les versets":"Afficher les versets · arabe, phonétique et français"}</button>{showVerses&&<div style={{marginTop:12,textAlign:"left"}}>{verseError&&<p role="alert">{verseError}</p>}{activeSurahs.map(item=><section key={item.number} style={{marginBottom:18}}><h2 style={{fontSize:19,color:"#805b32"}}>{item.title} · {item.arabic}</h2>{!verses[item.number]&&!verseError&&<p>Chargement des versets…</p>}{(verses[item.number]||[]).map(v=><article key={v.number} style={{padding:"16px 13px",marginBottom:10,background:"#fffaf2",border:"1px solid #e5d7bf",borderRadius:12}}><p style={{fontSize:12,color:"#99774b"}}>Verset {v.number}</p><p dir="rtl" lang="ar" style={{fontSize:28,lineHeight:2.2,textAlign:"right",fontFamily:"'Amiri', 'Noto Naskh Arabic', serif"}}>{v.arabic} <span style={{display:"inline-block",whiteSpace:"nowrap",color:"#a47d45",fontSize:"0.85em"}}>۝{new Intl.NumberFormat("ar-EG",{useGrouping:false}).format(v.number)}</span></p><div style={{borderTop:"1px solid #eee0ca",paddingTop:12,marginTop:12}}><p style={{fontSize:11,fontWeight:700,letterSpacing:1,color:"#99774b",margin:"0 0 6px"}}>PHONÉTIQUE</p><p style={{fontSize:16,lineHeight:1.9,fontStyle:"italic",color:"#71553a",margin:"0 0 14px"}}>{v.phonetic}</p><p style={{fontSize:11,fontWeight:700,letterSpacing:1,color:"#99774b",margin:"0 0 6px"}}>TRADUCTION FRANÇAISE</p><p lang="fr" style={{fontSize:16,lineHeight:1.9,color:"#433a30",margin:0}}>{v.french}</p></div></article>)}</section>)}</div>}</div>
 <div style={{marginTop:14,textAlign:"left",fontFamily:"system-ui,sans-serif"}}>
 <label htmlFor="reciter-select" style={{display:"block",fontSize:13,fontWeight:600,color:"#66533e",marginBottom:9}}>Choisir la voix du récitant</label>
 <select id="reciter-select" aria-label="Récitant" value={voice} onChange={e=>changeVoice(e.target.value)} style={{width:"100%",padding:"14px 12px",border:"1px solid #ddcdb8",borderRadius:12,fontSize:15,background:"#fffdf9",color:"#453525"}}>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>
 </div>
 <p style={{fontFamily:"system-ui,sans-serif",fontSize:11,color:"#9a8b7a",marginTop:30}}>Chaque sélection est diffusée en entier. Ayat al-Kursi utilise une récitation dédiée.</p>
 <p style={{fontFamily:"system-ui,sans-serif",fontSize:12,marginTop:12}}><Link href="/" style={{color:"#8d6e43",textDecoration:"none"}}>Lehnova</Link></p>
 </section></main>;
}