"use client";
import {useEffect,useState} from "react";

export default function Souvenir({params}){
 const [data,setData]=useState(null),[open,setOpen]=useState(false),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/events/souvenirs/view/"+params.token,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setData(d)}).catch(e=>setError(e.message))},[params.token]);
 const ar=data?.language==="ar";
 return <main className="souvenir" dir={ar?"rtl":"ltr"} lang={ar?"ar":"fr"}>
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
 *{box-sizing:border-box}html,body{margin:0}.souvenir{--ink:#513e42;--gold:#b68c55;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:36px 16px 50px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 4%,#fffaf5 0%,#f7eeea 48%,#ecdedb 100%);color:var(--ink);font-family:'DM Sans',Arial,sans-serif;text-align:center}
 .souvenir:before,.souvenir:after{content:"";position:absolute;width:480px;height:480px;border:1px solid #c4a87c45;border-radius:50%;pointer-events:none}.souvenir:before{top:-345px;left:-210px}.souvenir:after{right:-280px;bottom:-350px}
 .shell{position:relative;z-index:1;width:min(100%,520px);padding:9px;border:1px solid #d9c3a7;border-radius:4px;background:linear-gradient(145deg,#fffaf6,#f7eeea);box-shadow:0 30px 85px #694f4a20,0 3px 15px #694f4a0b}
 .frame{min-height:570px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:55px 34px 42px;border:1px solid #dfcdb6;position:relative}
 .frame:before,.frame:after{content:"✦";position:absolute;color:#c7a778;font-size:13px;top:13px}.frame:before{left:16px}.frame:after{right:16px}
 .brand{font:600 12px 'DM Sans',sans-serif;letter-spacing:.37em;color:#98754c;direction:ltr}.subbrand{margin-top:11px;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#ad9690;direction:ltr}
 .ornament{display:flex;align-items:center;justify-content:center;gap:14px;color:#b8925e;margin:30px 0 15px;font-size:22px}.ornament:before,.ornament:after{content:"";height:1px;width:48px;background:linear-gradient(90deg,transparent,#c3a274)}.ornament:after{transform:rotate(180deg)}
 .eyebrow{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#a08279;margin:4px 0 15px}.headline{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(38px,8vw,58px);font-weight:500;line-height:1.08;letter-spacing:-.025em;margin:10px 0 18px;overflow-wrap:anywhere}.intro{font:400 15px/1.85 'DM Sans',sans-serif;color:#8b7775;max-width:310px;margin:0 auto 32px}
 .arabic .headline,.arabic .intro,.arabic .message{font-family:'Amiri',serif;letter-spacing:0}.arabic .headline{font-size:clamp(36px,8vw,52px);line-height:1.55}.arabic .intro{font-size:21px;line-height:1.8}
 .seal{height:94px;width:94px;display:grid;place-items:center;margin:8px auto 18px;border:1px solid #c8a977;border-radius:50%;background:radial-gradient(circle,#fffaf5 48%,#f0e2d3 100%);box-shadow:0 0 0 7px #f7eee7,0 0 0 8px #c7a77a55;color:#b38c5c;font:46px Georgia,serif;animation:appear .9s ease both}
 .action{border:1px solid #9d7a56;border-radius:2px;background:linear-gradient(120deg,#b69368,#96724f);color:#fffaf5;min-height:55px;padding:15px 26px;font:500 12px 'DM Sans',sans-serif;letter-spacing:.12em;cursor:pointer;box-shadow:0 9px 22px #88684b25;transition:transform .2s,box-shadow .2s}.action:hover{transform:translateY(-2px);box-shadow:0 13px 25px #88684b38}.action:focus-visible{outline:3px solid #9d7a56;outline-offset:4px}.arabic .action{font:22px 'Amiri',serif;letter-spacing:0}
 .message{width:100%;white-space:pre-wrap;overflow-wrap:anywhere;font:24px/1.8 'Cormorant Garamond',Georgia,serif;color:#604b4d;margin:6px 0 23px;padding:24px 16px;border-top:1px solid #ddc7ad;border-bottom:1px solid #ddc7ad}.arabic .message{font-size:26px;line-height:2.05}
 .media{display:block;width:100%;max-width:390px;margin:12px auto 24px;border-radius:4px;max-height:55vh}.sender{font:13px/1.8 'DM Sans',sans-serif;color:#8b7775;margin:0 0 25px}.reveal{width:100%;animation:appear .85s ease both}.foot{margin-top:auto;padding-top:40px;font-size:10px;letter-spacing:.16em;color:#b19a90;direction:ltr}
 .loading{color:#8b7775;line-height:1.8}.spark{position:absolute;color:#c6a477;opacity:.5;pointer-events:none;font-size:16px;animation:float 8s ease-in-out infinite}.spark.one{top:13%;left:8%}.spark.two{top:30%;right:9%;animation-delay:-3s}.spark.three{bottom:17%;left:11%;animation-delay:-5s}
 @keyframes appear{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}@keyframes float{50%{transform:translateY(-18px) rotate(18deg);opacity:.85}}
 @media(max-width:480px){.souvenir{padding:14px 10px}.frame{min-height:calc(100dvh - 48px);padding:45px 23px 30px}.shell{padding:6px}.headline{font-size:44px}.foot{padding-top:30px}}
 @media(prefers-reduced-motion:reduce){.spark,.seal,.reveal{animation:none}.action{transition:none}}
 `}</style>
 <span className="spark one" aria-hidden="true">✧</span><span className="spark two" aria-hidden="true">✦</span><span className="spark three" aria-hidden="true">✧</span>
 <section className={"shell"+(ar?" arabic":"")}><div className="frame">
 <div className="brand">LEHNOVA</div><div className="subbrand">EVENTS · SOUVENIRS CONNECTÉS</div>
 <div className="ornament" aria-hidden="true">✧</div>
 {error?<p className="loading" role="alert">{error}</p>:!data?<p className="loading">{ar?"جارٍ التحميل…":"Votre surprise se prépare…"}</p>:!open?<div className="reveal">
 <div className="seal" aria-hidden="true">♡</div>
 <p className="eyebrow">{ar?"":"UNE ATTENTION UNIQUE"}</p>
 <h1 className="headline">{ar?"رسالة خاصة لك":<>Un message<br/>rien que pour toi{data.recipient?", "+data.recipient:""}.</>}</h1>
 <p className="intro">{ar?"بعض الكلمات تبقى في القلب إلى الأبد":"Il y a des attentions qui se vivent… et des mots qui restent pour toujours."}</p>
 <button className="action" onClick={()=>setOpen(true)}>{ar?"افتح رسالتك ✧":"DÉCOUVRIR MON MESSAGE  ✧"}</button>
 </div>:<div className="reveal">
 <p className="eyebrow">{ar?"":"UN INSTANT À GARDER PRÉCIEUSEMENT"}</p>
 <h1 className="headline">{ar?"رسالة من القلب":<>Pour toi{data.recipient?", "+data.recipient:""} ♡</>}</h1>
 {ar&&data.arabic_message&&<div className="message" lang="ar" dir="rtl">{data.arabic_message}</div>}
 {!ar&&data.dedication&&<div className="message">{data.dedication}</div>}
 {data.url&&(data.media_type==="audio"?<audio className="media" controls src={data.url}/>:<video className="media" controls playsInline src={data.url}/>)}
 {!ar&&<p className="sender">Avec tendresse, {data.sender||"quelqu’un qui pense à toi"} ♡</p>}
 <button className="action" onClick={()=>setOpen(false)}>{ar?"عرض الرسالة مرة أخرى ↺":"REVIVRE CET INSTANT  ↺"}</button>
 </div>}
 <div className="foot">UN SOUVENIR SIGNÉ LEHNOVA EVENTS</div>
 </div></section></main>
}