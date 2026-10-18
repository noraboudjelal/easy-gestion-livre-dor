"use client";
import {useState} from "react";
export default function SouvenirDemo(){
 const [opened,setOpened]=useState(false);
 return <main className="scene">
 <style>{`
 *{box-sizing:border-box}body{margin:0}.scene{min-height:100dvh;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 20%,#fff9f4,#f4e3df 65%,#ebd5d4);font-family:Georgia,serif;color:#68444c;overflow:hidden;padding:24px;position:relative;text-align:center}
 .petal{position:absolute;top:-15%;font-size:25px;opacity:.55;animation:fall 12s linear infinite;pointer-events:none}
 .petal:nth-child(2){left:12%;animation-delay:-3s}.petal:nth-child(3){left:33%;animation-delay:-8s}.petal:nth-child(4){left:72%;animation-delay:-5s}.petal:nth-child(5){left:91%;animation-delay:-10s}
 @keyframes fall{to{transform:translate(70px,115vh) rotate(400deg)}}
 .panel{z-index:1;width:min(100%,490px);padding:46px 24px;border:1px solid #e6c5c4;border-radius:28px;background:#fffaf5dc;box-shadow:0 22px 70px #a36b6b30;animation:rise .8s ease both}
 @keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
 .brand{font:600 11px Arial,sans-serif;letter-spacing:4px;color:#ad8181}.heart{font-size:43px;margin:25px auto 10px;animation:pulse 3s infinite}@keyframes pulse{50%{transform:scale(1.12)}}
 h1{font-size:clamp(30px,7vw,44px);font-weight:400;line-height:1.18;margin:12px 0 16px}p{line-height:1.7;font-size:17px;color:#82666b}.envelope{margin:30px auto 18px;width:180px;height:115px;background:linear-gradient(145deg,#f4d7d1,#e7b7b7);border-radius:5px 5px 12px 12px;position:relative;box-shadow:0 12px 25px #b87c8033}
 .envelope:before{content:"";position:absolute;inset:0;clip-path:polygon(0 0,50% 58%,100% 0);background:#fbe6df;transform-origin:top;animation:flap 2s ease-in-out infinite alternate}@keyframes flap{to{transform:rotateX(65deg)}}
 button{border:0;border-radius:40px;padding:16px 29px;background:#a56a78;color:white;font-size:15px;cursor:pointer;box-shadow:0 6px 20px #a56a7833}
 .note{margin-top:20px;font:12px Arial,sans-serif;color:#a18b8c}.reveal{animation:rise .8s ease both}.message{padding:25px 15px;background:#fff2ed;border-radius:20px;margin:20px auto}
 `}</style>
 {["🌸","🌷","🌸","🌹"].map((x,i)=><span className="petal" key={i}>{x}</span>)}
 <section className="panel">
 <div className="brand">LEHNOVA EVENTS</div>
 {!opened?<><div className="heart">♡</div><h1>Un message rien que pour toi</h1><p>Il y a des mots qui méritent de rester pour toujours…</p><div className="envelope" aria-hidden="true"/><button onClick={()=>setOpened(true)}>Découvrir ma surprise ♡</button></>:
 <div className="reveal"><div className="heart">♥</div><h1>Pour toi, avec amour</h1><div className="message"><p>Un souvenir à écouter, à regarder et à garder précieusement.</p><p><strong>Ton message personnalisé apparaîtra ici.</strong></p></div><button onClick={()=>setOpened(false)}>Revoir la surprise ↺</button></div>}
 <div className="note">Démonstration · Aucun message audio ou vidéo n'est encore associé</div>
 </section></main>
}