"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const audioPath="/cadres-coraniques/protection";
const chapters=[
 {name:"Al-Ikhlas",arabic:"سُورَةُ الْإِخْلَاصِ",meaning:"Le Monothéisme pur",lines:["قُلْ هُوَ اللَّهُ أَحَدٌ","اللَّهُ الصَّمَدُ","لَمْ يَلِدْ وَلَمْ يُولَدْ","وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"]},
 {name:"Al-Falaq",arabic:"سُورَةُ الْفَلَقِ",meaning:"L'Aube naissante",lines:["قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ","مِنْ شَرِّ مَا خَلَقَ","وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ","وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ","وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ"]},
 {name:"An-Nas",arabic:"سُورَةُ النَّاسِ",meaning:"Les Hommes",lines:["قُلْ أَعُوذُ بِرَبِّ النَّاسِ","مَلِكِ النَّاسِ","إِلَٰهِ النَّاسِ","مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ","الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ","مِنَ الْجِنَّةِ وَالنَّاسِ"]}
];
export default function AdminCadresCoraniques(){
 const [authorized,setAuthorized]=useState(null);
 const [link,setLink]=useState("");
 const [copied,setCopied]=useState(false);
 useEffect(()=>{fetch("/api/admin/session",{cache:"no-store"}).then(r=>r.json()).then(d=>setAuthorized(Boolean(d.authenticated))).catch(()=>setAuthorized(false));setLink(window.location.origin+audioPath);},[]);
 if(authorized===null)return <main style={{padding:32}}>Vérification de la session…</main>;
 if(!authorized)return <main style={{padding:32}}><h1>Accès réservé</h1><Link href="/admin">Se connecter</Link></main>;
 const qr="https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=12&data="+encodeURIComponent(link);
 return <main className="q-page">
  <style>{`
  .q-page{min-height:100vh;background:#e8e0d5;padding:24px 12px;font-family:Georgia,serif;color:#5a3a19}
  .q-tools{max-width:690px;margin:0 auto 24px;padding:22px;background:white;border-radius:14px;font-family:system-ui}
  .q-tools button{border:0;background:#92703b;color:white;padding:12px 18px;border-radius:8px;cursor:pointer;margin:5px}
  .q-frame{box-sizing:border-box;max-width:720px;width:100%;margin:auto;background:linear-gradient(130deg,#75451b,#d6ac65 12%,#fff1c6 18%,#98642d 27%,#f1cc83 38%,#70451c 50%,#e8be72 65%,#8b5927 80%,#ffe4a6 92%,#76501e);padding:18px;border:2px solid #75451b;box-shadow:0 18px 38px #3c271b55}
  .q-inner{min-height:950px;box-sizing:border-box;position:relative;border:5px double #b88b42;background:radial-gradient(ellipse at 50% 30%,#fffaf0,#f1dfc3 85%);padding:20px 26px 24px;overflow:hidden;text-align:center}
  .q-inner:before,.q-inner:after{content:"❈ ❖ ❈ ❖ ❈";position:absolute;top:8px;font-size:20px;letter-spacing:7px;color:#bc9553;opacity:.65}
  .q-inner:before{left:0}.q-inner:after{right:0}
  .q-arch{margin:22px auto 10px;max-width:480px;border:3px solid #bb8b42;border-bottom:0;border-radius:48% 48% 0 0 / 75% 75% 0 0;padding:36px 10px 15px;background:linear-gradient(#f8e8cd88,#fff9ed00)}
  .q-ornament{font-size:24px;color:#a47b37;letter-spacing:8px}
  .q-title{font-size:30px;margin:6px 0 0;font-weight:normal}
  .q-subtitle{font-size:15px;letter-spacing:2px;margin:4px}
  .q-lamps{display:flex;justify-content:space-between;font-size:30px;margin:-10px 8px 0}
  .q-section{border:1px solid #cba968;border-radius:19px;margin:12px 0;padding:10px 16px 12px;background:#fff9ef80}
  .q-arabic-title{font-size:25px;line-height:1.7}
  .q-meaning{font-size:13px;color:#916d3f;margin-bottom:5px}
  .q-verse{font-size:19px;line-height:1.95;direction:rtl;unicode-bidi:plaintext}
  .q-divider{height:1px;background:linear-gradient(90deg,transparent,#cda866,transparent);margin:7px 0}
  .q-bottom{border:2px solid #b88b42;border-radius:18px;margin-top:14px;padding:14px 12px;background:#f9edd8}
  .q-bottom strong{display:block;font-size:17px;letter-spacing:1px}
  .q-qr{width:105px;height:105px;object-fit:contain;border:6px solid white;margin:9px auto}
  .q-nfc{font-size:22px;border:2px solid #b88b42;border-radius:50%;padding:10px;display:inline-block;margin-left:15px}
  .q-flower{font-size:27px;color:#b58b50;letter-spacing:8px}
  @media(max-width:550px){.q-inner{padding:12px 10px}.q-frame{padding:9px}.q-title{font-size:23px}.q-verse{font-size:16px}.q-section{padding:8px}.q-arabic-title{font-size:22px}}
  @media print{@page{size:A4;margin:5mm}html,body{background:white!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}.q-page{padding:0;background:white}.q-tools{display:none!important}.q-frame{width:200mm;max-width:none;box-shadow:none;padding:5mm}.q-inner{min-height:275mm;padding:5mm 9mm}.q-arch{padding:22px 10px 10px;margin-top:5px}.q-section{margin:8px 0;padding:6px 12px}.q-verse{font-size:17px;line-height:1.7}.q-bottom{padding:8px;margin-top:8px}.q-qr{width:85px;height:85px}}
  `}</style>
  <div className="q-tools"><p><Link href="/admin">← Retour à l'administration</Link></p><h1>Cadres coraniques · NFC / QR</h1><p>Nouveau modèle inspiré de ton cadre doré, avec les trois sourates de protection.</p><p style={{overflowWrap:"anywhere",fontSize:13}}>{link}</p><button onClick={async()=>{await navigator.clipboard.writeText(link);setCopied(true)}}>{copied?"Lien copié ✓":"Copier le lien NFC"}</button><button onClick={()=>window.print()}>Imprimer le cadre A4</button><Link href={audioPath} target="_blank" style={{marginLeft:10}}>Tester l'écoute ↗</Link><p style={{fontSize:12,color:"#806c58"}}>Le QR code est généré par un service tiers. Vérifier la mise en page et les textes avant toute commercialisation.</p></div>
  <div className="q-frame"><div className="q-inner">
   <div className="q-lamps"><span>🏮</span><span>🏮</span></div>
   <header className="q-arch"><div className="q-ornament">۞</div><h1 className="q-title">Les trois sourates de protection</h1><p className="q-subtitle">AL-IKHLAS · AL-FALAQ · AN-NAS</p><div className="q-ornament">❦</div></header>
   <div style={{fontSize:23,margin:"8px 0"}} lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
   {chapters.map(ch=><section className="q-section" key={ch.name}><div className="q-arabic-title" lang="ar" dir="rtl">{ch.arabic}</div><div className="q-meaning">{ch.name} — {ch.meaning}</div><div className="q-divider"/><div className="q-verse" lang="ar" dir="rtl">{ch.lines.join(" ۞ ")}</div></section>)}
   <div className="q-flower">❀ ❦ ❀</div>
   <footer className="q-bottom"><strong>APPROCHEZ VOTRE TÉLÉPHONE</strong><p style={{margin:"5px 0",fontSize:13}}>Pour écouter les trois sourates à la suite</p><div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{link&&<img className="q-qr" src={qr} alt="QR code d'écoute"/>}<span className="q-nfc">◉ NFC</span></div><small>LEHNOVA</small></footer>
  </div></div>
 </main>;
}