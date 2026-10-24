"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const audioPath="/cadres-coraniques/protection";
const voices=[
 {id:"Alafasy_128kbps",name:"Mishary Al-Afasy"},
 {id:"Husary_128kbps",name:"Mahmoud Khalil Al-Husary"},
 {id:"Minshawy_Murattal_128kbps",name:"Mohamed Siddiq Al-Minshawi"},
 {id:"Abdul_Basit_Murattal_64kbps",name:"Abdul Basit Abdus Samad"},
 {id:"Ghamadi_40kbps",name:"Saad Al-Ghamdi"}
];
const chapters=[
 {name:"Al-Ikhlas",arabic:"سُورَةُ الْإِخْلَاصِ",meaning:"Le Monothéisme pur",lines:["قُلْ هُوَ اللَّهُ أَحَدٌ","اللَّهُ الصَّمَدُ","لَمْ يَلِدْ وَلَمْ يُولَدْ","وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"]},
 {name:"Al-Falaq",arabic:"سُورَةُ الْفَلَقِ",meaning:"L'Aube naissante",lines:["قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ","مِنْ شَرِّ مَا خَلَقَ","وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ","وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ","وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ"]},
 {name:"An-Nas",arabic:"سُورَةُ النَّاسِ",meaning:"Les Hommes",lines:["قُلْ أَعُوذُ بِرَبِّ النَّاسِ","مَلِكِ النَّاسِ","إِلَٰهِ النَّاسِ","مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ","الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ","مِنَ الْجِنَّةِ وَالنَّاسِ"]}
];
export default function AdminCadresCoraniques(){
 const [authorized,setAuthorized]=useState(null);
 const [link,setLink]=useState("");
 const [copied,setCopied]=useState(false);
 const [voice,setVoice]=useState("Alafasy_128kbps");
 const [selectedSurahs,setSelectedSurahs]=useState([112,113,114]);
 const [poster,setPoster]=useState("");
 const [paperFormat,setPaperFormat]=useState("20x25");
 const [customWidth,setCustomWidth]=useState("20");
 const [customHeight,setCustomHeight]=useState("25");
 const sizes={"a4":[21,29.7],"a5":[14.8,21],"a6":[10.5,14.8],"20x25":[20,25]};
 const [frameWidth,frameHeight]=paperFormat==="custom"?[Number(customWidth),Number(customHeight)]:sizes[paperFormat];
 const validFrame=Number.isFinite(frameWidth)&&Number.isFinite(frameHeight)&&frameWidth>=5&&frameHeight>=5&&frameWidth<=50&&frameHeight<=50;
 const [personalName,setPersonalName]=useState("");
 const [nameColor,setNameColor]=useState("#a87528");
 const [nameSize,setNameSize]=useState(11);
 const [nameY,setNameY]=useState(47);
 const [showName,setShowName]=useState(true);
 const [posterRatio,setPosterRatio]=useState(0.7);
 const [qrX,setQrX]=useState(82);
 const [qrY,setQrY]=useState(91);
 const [qrSize,setQrSize]=useState(14);
 const [showQr,setShowQr]=useState(true);
 const frameRef=useRef(null);
 const dragging=useRef(false);
 const moveQr=e=>{if(!dragging.current||!frameRef.current)return;const r=frameRef.current.getBoundingClientRect();const w=r.width*qrSize/100;const x=Math.max(w/2,Math.min(r.width-w/2,e.clientX-r.left));const y=Math.max(w/2,Math.min(r.height-w/2,e.clientY-r.top));setQrX(Math.round(x/r.width*1000)/10);setQrY(Math.round(y/r.height*1000)/10);};
 const beginQr=e=>{e.preventDefault();dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);moveQr(e);};
 const endQr=e=>{dragging.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 const [exporting,setExporting]=useState(false);
 const downloadFrame=async()=>{
  if(!poster){alert("Importe d’abord ton cadre.");return;}
  if(!validFrame){alert("Choisis des dimensions entre 5 et 50 cm.");return;}
  setExporting(true);
  try{
   const {jsPDF}=await import("jspdf");
   const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error("Chargement de l’image impossible"));im.src=src;});
   const original=await load(poster);
   const pw=frameWidth*10,ph=frameHeight*10,margin=0;
   const pdf=new jsPDF({orientation:pw>ph?"landscape":"portrait",unit:"mm",format:[pw,ph],compress:true});
   const scale=Math.max((pw-2*margin)/original.naturalWidth,(ph-2*margin)/original.naturalHeight);
   const width=original.naturalWidth*scale,height=original.naturalHeight*scale;
   const left=(pw-width)/2,top=(ph-height)/2;
   const canvas=document.createElement("canvas");
   canvas.width=original.naturalWidth;canvas.height=original.naturalHeight;
   const ctx=canvas.getContext("2d");ctx.drawImage(original,0,0);
   if(showName&&personalName.trim()){
    const size=canvas.width*nameSize/100;
    ctx.font="bold "+size+"px serif";ctx.fillStyle=nameColor;ctx.textAlign="center";ctx.textBaseline="middle";ctx.direction="rtl";
    ctx.shadowColor="#fff6e7";ctx.shadowBlur=Math.max(2,size/10);
    ctx.fillText(personalName.trim(),canvas.width/2,canvas.height*nameY/100,canvas.width*0.85);ctx.shadowBlur=0;
   }
   if(showQr){
    const response=await fetch("/api/cadres-coraniques/qr?data="+encodeURIComponent(voiceLink),{cache:"no-store"});
    if(!response.ok)throw new Error("Le QR code n’a pas pu être généré");
    const blob=await response.blob();
    const url=URL.createObjectURL(blob);
    try{
     const q=await load(url);const size=canvas.width*qrSize/100;
     const x=canvas.width*qrX/100-size/2,y=canvas.height*qrY/100-size/2;
     ctx.fillStyle="#fff";ctx.fillRect(x,y,size,size);ctx.drawImage(q,x,y,size,size);
    }finally{URL.revokeObjectURL(url);}
   }
   // The artwork fills the selected paper size; any excess is cropped by the PDF page.
   pdf.addImage(canvas.toDataURL("image/jpeg",0.94),"JPEG",left,top,width,height);
   pdf.save("cadre-lehnova-"+frameWidth+"x"+frameHeight+"cm.pdf");
  }catch(e){alert("Impossible de créer le PDF : "+e.message);}
  finally{setExporting(false);}
 };
 const uploadPoster=(e)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")){alert("Choisis une image JPG ou PNG.");return;}if(file.size>12*1024*1024){alert("Image trop volumineuse (12 Mo maximum).");return;}const reader=new FileReader();reader.onload=()=>{const src=String(reader.result);const img=new Image();img.onload=()=>setPosterRatio(img.naturalWidth/img.naturalHeight);img.src=src;setPoster(src);};reader.readAsDataURL(file);};
 useEffect(()=>{fetch("/api/admin/session",{cache:"no-store"}).then(r=>r.json()).then(d=>setAuthorized(Boolean(d.authenticated))).catch(()=>setAuthorized(false));const saved=window.localStorage.getItem("lehnova-quran-reciter");if(voices.some(v=>v.id===saved))setVoice(saved);setLink(window.location.origin+audioPath);},[]);
 if(authorized===null)return <main style={{padding:32}}>Vérification de la session…</main>;
 if(!authorized)return <main style={{padding:32}}><h1>Accès réservé</h1><Link href="/admin">Se connecter</Link></main>;
 const voiceLink=link+"?reciter="+encodeURIComponent(voice)+"&surahs="+selectedSurahs.join(",");
 const qr="https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=12&data="+encodeURIComponent(voiceLink);
 return <main className="q-page">
  <style>{`
  .q-uploaded{width:100%;max-width:720px;margin:0 auto;position:relative;background:white;line-height:0;overflow:hidden;box-shadow:0 12px 28px #3c271b33}
  .q-uploaded>img{display:block;width:100%;height:auto}
  .q-overlay{position:absolute;transform:translate(-50%,-50%);background:white;padding:5px;box-sizing:border-box;line-height:0;box-shadow:0 2px 9px #0004}
  .q-overlay img{width:100%;height:auto;display:block;pointer-events:none}.q-overlay{touch-action:none;cursor:grab;user-select:none}
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
  @media print{
    @page{size:A4 portrait;margin:0}
    html,body{margin:0!important;padding:0!important;width:210mm!important;height:297mm!important;overflow:hidden!important;background:white!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .q-tools{display:none!important}
    .q-page{position:fixed!important;top:0!important;left:0!important;width:210mm!important;height:297mm!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:white!important}
    .q-uploaded{position:absolute!important;top:5mm!important;left:50%!important;transform:translateX(-50%)!important;width:min(200mm,calc(270mm * var(--poster-ratio)))!important;max-width:200mm!important;max-height:270mm!important;margin:0!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important}
    .q-uploaded>img{display:block!important;width:100%!important;height:auto!important;max-height:270mm!important;object-fit:contain!important}
    .q-overlay{box-shadow:none!important}
    .q-frame{width:195mm!important;max-width:195mm!important;margin:2mm auto!important;box-shadow:none!important;padding:3mm!important}
    .q-inner{min-height:0!important;padding:3mm 7mm!important}
    .q-arch{padding:12px 10px 6px!important;margin-top:3px!important}
    .q-section{margin:5px 0!important;padding:4px 10px!important}
    .q-verse{font-size:15px!important;line-height:1.5!important}
    .q-bottom{padding:5px!important;margin-top:5px!important}
    .q-qr{width:75px!important;height:75px!important}
  }
  `}</style>
  <div className="q-tools"><p><Link href="/admin">← Retour à l'administration</Link></p><h1>Cadres coraniques · NFC / QR</h1><p>Nouveau modèle inspiré de ton cadre doré, avec les trois sourates de protection.</p><p style={{overflowWrap:"anywhere",fontSize:13}}>{voiceLink}</p><label style={{display:"block",marginBottom:6}}>Choisir la voix du récitant</label><select value={voice} onChange={e=>{setVoice(e.target.value);window.localStorage.setItem("lehnova-quran-reciter",e.target.value);setCopied(false)}} style={{padding:12,borderRadius:8,maxWidth:"100%",marginBottom:12}}>{voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select><div style={{padding:"12px",borderRadius:10,background:"#faf5ed",margin:"10px 0"}}><strong>Choisir les sourates accessibles par NFC / QR</strong>{[{number:112,title:"Al-Ikhlas — الإخلاص"},{number:113,title:"Al-Falaq — الفلق"},{number:114,title:"An-Nas — الناس"}].map(s=><label key={s.number} style={{display:"block",padding:"9px 0"}}><input type="checkbox" checked={selectedSurahs.includes(s.number)} onChange={e=>{setSelectedSurahs(prev=>e.target.checked?[...prev,s.number].sort((a,b)=>a-b):prev.length>1?prev.filter(n=>n!==s.number):prev)}}/> {s.title}</label>)}<small>Au moins une sourate doit rester sélectionnée. Le QR code et le lien NFC s'adaptent à ton choix.</small></div><p style={{fontSize:13}}>Le QR code change selon la voix et les sourates choisies. Pour un NFC déjà programmé, il faut mettre à jour son lien.</p><button onClick={async()=>{await navigator.clipboard.writeText(voiceLink);setCopied(true)}}>{copied?"Lien copié ✓":"Copier le lien NFC"}</button><div style={{margin:"16px 0",padding:"15px",background:"#faf5ed",borderRadius:10}}><label style={{display:"block",fontWeight:700,marginBottom:8}}>Importer ton image (JPG ou PNG)</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPoster} style={{width:"100%"}}/><p style={{fontSize:13}}>L'image reste sur ton appareil. Le QR code est ajouté par-dessus pour l'impression.</p>{poster&&<><div style={{padding:12,background:"#fff",borderRadius:8,margin:"12px 0"}}><label style={{display:"block",fontWeight:700}}>Prénom personnalisé (français ou arabe)</label><input value={personalName} onChange={e=>setPersonalName(e.target.value)} placeholder="Ex. حفيظة" dir="auto" style={{width:"100%",padding:10,fontSize:20,boxSizing:"border-box",marginTop:8}}/><label style={{display:"block",marginTop:8}}><input type="checkbox" checked={showName} onChange={e=>setShowName(e.target.checked)}/> Afficher le prénom</label><label style={{display:"block",marginTop:8}}>Couleur de l'écriture <input type="color" value={nameColor} onChange={e=>setNameColor(e.target.value)}/></label><label style={{display:"block"}}>Taille : {nameSize}% <input type="range" min="4" max="20" value={nameSize} onChange={e=>setNameSize(Number(e.target.value))}/></label><label style={{display:"block"}}>Hauteur : {nameY}% <input type="range" min="10" max="85" value={nameY} onChange={e=>setNameY(Number(e.target.value))}/></label><p style={{fontSize:12}}>Écriture élégante ; vérifie les lettres arabes dans le PDF avant impression.</p></div><label style={{display:"block"}}><input type="checkbox" checked={showQr} onChange={e=>setShowQr(e.target.checked)}/> Afficher le QR code</label><label style={{display:"block",marginTop:8}}>Position horizontale : {qrX}% <input type="range" min="8" max="92" value={qrX} onChange={e=>setQrX(Number(e.target.value))}/></label><label style={{display:"block"}}>Position verticale : {qrY}% <input type="range" min="8" max="92" value={qrY} onChange={e=>setQrY(Number(e.target.value))}/></label><label style={{display:"block"}}>Taille du QR code : {qrSize}% <input type="range" min="9" max="25" value={qrSize} onChange={e=>setQrSize(Number(e.target.value))}/></label><button onClick={()=>setPoster("")}>Retirer l'image</button></>}</div><div style={{padding:14,background:"#faf5ed",borderRadius:10,margin:"12px 0"}}><label style={{display:"block",fontWeight:700,marginBottom:8}}>Dimensions du cadre à imprimer</label><select value={paperFormat} onChange={e=>setPaperFormat(e.target.value)} style={{padding:10,maxWidth:"100%"}}><option value="20x25">20 × 25 cm — mon cadre doré</option><option value="a4">A4 — 21 × 29,7 cm</option><option value="a5">A5 — 14,8 × 21 cm</option><option value="a6">A6 — 10,5 × 14,8 cm</option><option value="custom">Dimensions personnalisées</option></select>{paperFormat==="custom"&&<div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}><label>Largeur (cm)<input type="number" min="5" max="50" step="0.1" value={customWidth} onChange={e=>setCustomWidth(e.target.value)} style={{display:"block",width:100,padding:8}}/></label><label>Hauteur (cm)<input type="number" min="5" max="50" step="0.1" value={customHeight} onChange={e=>setCustomHeight(e.target.value)} style={{display:"block",width:100,padding:8}}/></label></div>}<p style={{fontSize:13}}>Export à taille réelle : impression à 100 %, sans ajuster à la page. L'image remplit le format choisi et peut être légèrement recadrée. Pour le format 20 × 25 cm, imprime sur une feuille A4 puis découpe.</p></div><button disabled={!poster||!validFrame||exporting} onClick={downloadFrame}>{exporting?"Préparation…":"Créer mon PDF aux dimensions choisies"}</button><p style={{fontSize:13}}>Le PDF utilise les dimensions choisies, avec ton QR code. Imprime à 100 % sur un papier assez grand, puis découpe si nécessaire.</p><button onClick={()=>window.print()}>Imprimer directement (Safari)</button><Link href={audioPath+"?reciter="+encodeURIComponent(voice)+"&surahs="+selectedSurahs.join(",")} target="_blank" style={{marginLeft:10}}>Tester l'écoute ↗</Link><p style={{fontSize:12,color:"#806c58"}}>Le QR code est généré par un service tiers. Vérifier la mise en page et les textes avant toute commercialisation.</p></div>
  {poster?<div className="q-uploaded" ref={frameRef} style={{"--poster-ratio":posterRatio}}><img src={poster} alt="Image du cadre à imprimer"/>{showName&&personalName.trim()&&<div lang="ar" dir="auto" style={{position:"absolute",left:"5%",width:"90%",top:nameY+"%",transform:"translateY(-50%)",textAlign:"center",fontFamily:"serif",fontWeight:700,fontSize:"clamp(20px, "+(nameSize*0.55)+"vw, 85px)",lineHeight:1.5,color:nameColor,textShadow:"0 1px 5px #fff8"}}>{personalName}</div>}{showQr&&<div className="q-overlay" onPointerDown={beginQr} onPointerMove={moveQr} onPointerUp={endQr} onPointerCancel={endQr} style={{left:qrX+"%",top:qrY+"%",width:qrSize+"%"}}><img src={qr} alt="QR code de la récitation"/></div>}</div>:<div className="q-frame"><div className="q-inner">
   <div className="q-lamps"><span>🏮</span><span>🏮</span></div>
   <header className="q-arch"><div className="q-ornament">۞</div><h1 className="q-title">Les trois sourates de protection</h1><p className="q-subtitle">AL-IKHLAS · AL-FALAQ · AN-NAS</p><div className="q-ornament">❦</div></header>
   <div style={{fontSize:23,margin:"8px 0"}} lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
   {chapters.map(ch=><section className="q-section" key={ch.name}><div className="q-arabic-title" lang="ar" dir="rtl">{ch.arabic}</div><div className="q-meaning">{ch.name} — {ch.meaning}</div><div className="q-divider"/><div className="q-verse" lang="ar" dir="rtl">{ch.lines.join(" ۞ ")}</div></section>)}
   <div className="q-flower">❀ ❦ ❀</div>
   <footer className="q-bottom"><strong>APPROCHEZ VOTRE TÉLÉPHONE</strong><p style={{margin:"5px 0",fontSize:13}}>Pour écouter les trois sourates à la suite</p><div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{link&&<img className="q-qr" src={qr} alt="QR code d'écoute"/>}<span className="q-nfc">◉ NFC</span></div><small>LEHNOVA</small></footer>
  </div></div>}
 </main>;
}