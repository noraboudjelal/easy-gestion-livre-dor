"use client";
import {useEffect,useRef,useState} from "react";
function AudioSouvenir({src,ar}){const ref=useRef(null);const [playing,setPlaying]=useState(false),[current,setCurrent]=useState(0),[duration,setDuration]=useState(0);const fmt=s=>Number.isFinite(s)?Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"):"0:00";return <div className="audio-player" dir="ltr"><audio ref={ref} preload="metadata" src={src} onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onTimeUpdate={e=>setCurrent(e.currentTarget.currentTime)} onEnded={()=>setPlaying(false)} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)}/><button type="button" className="audio-play" aria-label={playing?(ar?"إيقاف مؤقت":"Mettre en pause"):(ar?"تشغيل الرسالة":"Écouter le message")} onClick={()=>{const a=ref.current;if(!a)return;if(a.paused){a.play().catch(()=>setPlaying(false))}else a.pause()}}>{playing?"Ⅱ":"▶"}</button><div className="audio-info"><span className="audio-label">{ar?"استمع إلى رسالتك":"Écouter votre message"}</span><input aria-label={ar?"تقدم التسجيل":"Progression du message"} type="range" min="0" max={duration||1} step=".1" value={Math.min(current,duration||1)} onChange={e=>{if(ref.current){ref.current.currentTime=Number(e.target.value);setCurrent(Number(e.target.value))}}}/><span className="audio-time">{fmt(current)} / {fmt(duration)}</span></div></div>}

export default function Souvenir({params}){
 const [adminPreview,setAdminPreview]=useState(false),[data,setData]=useState(null),[opened,setOpened]=useState(false),[error,setError]=useState("");
 useEffect(()=>{setAdminPreview(new URLSearchParams(window.location.search).get("admin_preview")==="1")},[]);
 useEffect(()=>{fetch("/api/events/souvenirs/view/"+params.token,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setData(d)}).catch(e=>setError(e.message))},[params.token]);
 const ar=data?.language==="ar";
 return <main className="souvenir" dir={ar?"rtl":"ltr"} lang={ar?"ar":"fr"}>
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
 *{box-sizing:border-box}html,body{margin:0}.souvenir{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:65px 17px 34px;background:radial-gradient(ellipse at 50% 32%,#fffdf9 0%,#f8f0ec 56%,#eddfdb 100%);font-family:'DM Sans',Arial,sans-serif;color:#634b4e;text-align:center;overflow:hidden;position:relative}
 .scene{width:min(100%,480px);min-height:620px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:1}
 .brand{font-size:10px;letter-spacing:.35em;color:#a18a80;margin:0 0 46px;direction:ltr}.foot{display:none}
 .heart{font:43px Georgia,serif;color:#c68b91;filter:drop-shadow(0 5px 10px #b9898950);animation:heartbeat 3.5s ease-in-out infinite}
 .intro{font:24px/1.5 'Cormorant Garamond',Georgia,serif;color:#765b5f;margin:23px 0 25px}.arabic .intro{font:27px/1.8 'Amiri',serif}
 .envelope-button{background:none;border:0;padding:0;cursor:pointer;display:block;width:min(82vw,340px);height:245px;position:relative;perspective:850px;filter:drop-shadow(0 17px 20px #88615b24);-webkit-tap-highlight-color:transparent}
 .envelope-button:focus-visible{outline:3px solid #b78b6b;outline-offset:12px}
 .envelope{position:absolute;inset:28px 0 0;isolation:isolate;background:#f1ded4;border:1px solid #dfc5b7;border-radius:3px;overflow:visible}
 .envelope:before{content:"";position:absolute;inset:0;background:#fff6ee;clip-path:polygon(0 0,50% 60%,100% 0);z-index:1;transform-origin:top;transition:transform 1s cubic-bezier(.2,.8,.25,1),z-index 0s .45s;backface-visibility:hidden}
 .envelope:after{content:"";position:absolute;inset:0;background:linear-gradient(145deg,#f9ece3,#ebd4c9);clip-path:polygon(0 100%,50% 35%,100% 100%);z-index:3;pointer-events:none}
 .side{position:absolute;inset:0;background:#f6e5da;clip-path:polygon(0 0,50% 57%,100% 0,100% 100%,0 100%);z-index:2;pointer-events:none}
 .letter{position:absolute;left:7%;right:7%;top:13px;height:175px;background:#fffdf9;border:1px solid #e8d6c7;box-shadow:0 3px 8px #a47d6b15;display:flex;align-items:center;justify-content:center;z-index:0;transition:transform 1.1s .45s cubic-bezier(.22,.8,.2,1)}
 .letter .heart{font-size:31px}
 .wax{position:absolute;top:36%;left:50%;transform:translate(-50%,-50%);height:60px;width:60px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#e8b5b6,#b87b85 75%);border:3px double #f5d4c8;box-shadow:0 4px 10px #6f4a4933;z-index:4;display:grid;place-items:center;color:white;font:30px Georgia,serif;transition:opacity .35s}
 .opened .envelope:before{transform:rotateX(180deg);z-index:0}.opened .letter{transform:translateY(-100px)}.opened .wax{opacity:0}
 .hint{margin:28px 0 0;color:#a17f79;font-size:12px;letter-spacing:.08em}.arabic .hint{font:20px 'Amiri',serif;letter-spacing:0}
 .reveal{width:100%;animation:rise 1.15s cubic-bezier(.2,.7,.2,1) both;margin-top:0;position:relative;padding:48px 0 20px}.reveal:before{content:"";position:absolute;left:3%;right:3%;bottom:6px;height:145px;background:linear-gradient(145deg,#f9eae0,#ead1c6);clip-path:polygon(0 0,50% 58%,100% 0,100% 100%,0 100%);box-shadow:0 14px 30px #8c655822;z-index:0}.reveal-card{transform:rotate(-1deg);background:linear-gradient(145deg,#fffefa,#fff9f4);border:1px solid #e8d5c6;box-shadow:0 18px 35px #8d685525,0 0 0 7px #fffaf6 inset;padding:51px 26px 42px;position:relative;z-index:1;width:89%;margin:0 auto 26px;min-height:310px}.reveal-card:before{content:"♥";position:absolute;top:17px;left:50%;transform:translateX(-50%);color:#c88e94;font:27px Georgia,serif}.reveal-card:after{content:"";position:absolute;left:25%;right:25%;bottom:24px;height:1px;background:linear-gradient(90deg,transparent,#d5b9a7,transparent)}
 .reveal-caption{font:italic 18px/1.6 Georgia,serif;color:#ad8b87;margin:0 0 10px}.arabic .reveal-caption{font:20px/1.7 'Amiri',serif}.headline{font:normal clamp(30px,7vw,42px)/1.2 'Cormorant Garamond',Georgia,serif;margin:20px 0 24px}.arabic .headline{font:normal 36px/1.65 'Amiri',serif}
 .message{font:24px/1.8 'Cormorant Garamond',Georgia,serif;white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0 24px;color:#654b4f}.arabic .message{font:25px/2 'Amiri',serif}
 .audio-player{display:flex;align-items:center;gap:13px;padding:14px;border:1px solid #ead7d0;border-radius:24px;background:#f8edeb;box-shadow:0 8px 20px #a37c7920;max-width:390px;margin:20px auto 25px}.audio-play{flex:none;width:52px;height:52px;border:0;border-radius:50%;background:linear-gradient(145deg,#d8a9ae,#b9828d);color:white;font-size:21px;cursor:pointer;box-shadow:0 4px 12px #aa78884a}.audio-info{flex:1;min-width:0;display:flex;flex-direction:column;align-items:stretch;gap:5px;text-align:left}.audio-label{font-size:12px;color:#86666d}.audio-info input{width:100%;accent-color:#b9828d;cursor:pointer}.audio-time{font-size:11px;color:#9b8183}.media{accent-color:#bb8b8e;display:block;width:100%;max-width:390px;max-height:55vh;margin:15px auto 25px;border-radius:8px}.sender{font-size:13px;color:#957b78;line-height:1.7}
 .replay{position:relative;z-index:2;border:0;background:transparent;text-decoration:underline;text-underline-offset:5px;color:#9d7975;font-size:12px;margin:26px auto 0;cursor:pointer}.arabic .replay{font:18px 'Amiri',serif}
 .loading{color:#987b77}.admin-back{position:fixed;z-index:10;top:12px;left:12px;padding:12px 15px;background:#fffaf7;border:1px solid #e2cfc1;border-radius:12px;color:#704c57;text-decoration:none;font-size:12px}
 @keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@keyframes heartbeat{50%{transform:scale(1.08)}}
 @media(max-width:480px){.scene{min-height:calc(100dvh - 100px)}.brand{margin-bottom:34px}.envelope-button{height:215px}.envelope{inset:25px 0 0}.letter{height:155px}.opened .letter{transform:translateY(-80px)}}
 @media(prefers-reduced-motion:reduce){.heart,.reveal{animation:none}.envelope:before,.letter,.wax{transition:none}}
 `}</style>
 {adminPreview&&<a className="admin-back" href="/admin/events">← Retour à Lehnova Events</a>}
 <section className={"scene"+(ar?" arabic":"")}>
 <div className="brand">LEHNOVA EVENTS</div>
 {error?<p className="loading" role="alert">{error}</p>:!data?<p className="loading">{ar?"جارٍ التحميل…":"Votre surprise se prépare…"}</p>:!opened?<>
 <div className="heart" aria-hidden="true">♡</div>
 <p className="intro">{ar?"رسالة صغيرة، تحمل مشاعر كبيرة":<>Une attention toute particulière{data.recipient?" pour "+data.recipient:""}…</>}</p>
 <button className="envelope-button" type="button" aria-label={ar?"افتح رسالتك":"Ouvrir mon message"} onClick={()=>setOpened(true)}>
 <span className="envelope"><span className="letter"><span className="heart">♡</span></span><span className="side"/><span className="wax">♡</span></span>
 </button>
 <p className="hint">{ar?"المس الظرف لفتح رسالتك":"Touchez l’enveloppe pour découvrir votre message"}</p>
 </>:<div className="reveal">
 <div className="reveal-card"><p className="reveal-caption">{ar?"بكل الحب":"Quelques mots, beaucoup d’amour…"}</p><h1 className="headline">{ar?"رسالة من القلب":<>Pour toi{data.recipient?", "+data.recipient:""} ♡</>}</h1>
 {ar&&data.arabic_message&&<div className="message" dir="rtl" lang="ar">{data.arabic_message}</div>}
 {!ar&&data.dedication&&<div className="message">{data.dedication}</div>}
 {data.url&&(data.media_type==="audio"?<AudioSouvenir src={data.url} ar={ar}/>:<video className="media" controls playsInline src={data.url}/>)}
 {!ar&&<p className="sender">Avec tendresse, {data.sender||"quelqu’un qui pense à toi"} ♡</p>}
 </div>
 <button className="replay" onClick={()=>setOpened(false)}>{ar?"↺ فتح الظرف مرة أخرى":"↺ Revoir l’ouverture"}</button>
 </div>}
 
 </section></main>
}