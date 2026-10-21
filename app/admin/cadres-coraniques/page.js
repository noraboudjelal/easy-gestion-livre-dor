"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const path = "/cadres-coraniques/protection";
const names = [{ar:"سورة الإخلاص",fr:"Al-Ikhlas"},{ar:"سورة الفلق",fr:"Al-Falaq"},{ar:"سورة الناس",fr:"An-Nas"}];
export default function AdminCadresCoraniques() {
  const [authorized,setAuthorized] = useState(null);
  const [copied,setCopied] = useState(false);
  const [link,setLink] = useState("");
  useEffect(()=>{
    fetch("/api/admin/session",{cache:"no-store"}).then(r=>r.json()).then(d=>setAuthorized(Boolean(d.authenticated))).catch(()=>setAuthorized(false));
    setLink(window.location.origin + path);
  },[]);
  if(authorized===null) return <main style={{padding:32}}>Vérification de la session…</main>;
  if(!authorized) return <main style={{padding:32,fontFamily:"system-ui"}}><h1>Accès réservé</h1><p>Connectez-vous d'abord à l'administration Lehnova.</p><Link href="/admin">Se connecter</Link></main>;
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=" + encodeURIComponent(link);
  const copy = async () => { await navigator.clipboard.writeText(link);setCopied(true); };
  return <main style={{minHeight:"100vh",padding:"36px 16px",background:"#faf7f3",fontFamily:"system-ui,sans-serif",color:"#40352d"}}>
    <style>{`@media print { .no-print {display:none!important} body {margin:0} .poster {box-shadow:none!important;border:0!important;min-height:260mm!important;width:190mm!important;margin:0 auto!important;page-break-inside:avoid} @page {size:A4;margin:10mm} }`}</style>
    <section className="no-print" style={{maxWidth:700,margin:"auto auto 24px",background:"white",padding:24,borderRadius:18}}>
      <p><Link href="/admin">← Administration</Link></p>
      <h1>Cadres coraniques NFC</h1>
      <p>Premier modèle : les trois sourates de protection.</p>
      <p style={{overflowWrap:"anywhere",fontSize:14}}><strong>Lien NFC et QR :</strong> {link}</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={copy} style={buttonStyle}>{copied?"Lien copié ✓":"Copier le lien NFC"}</button>
        <button onClick={()=>window.print()} style={buttonStyle}>Imprimer l'affiche A4</button>
        <Link href={path} target="_blank" style={{padding:12}}>Tester la page audio ↗</Link>
      </div>
      <p style={{fontSize:13,color:"#806c58"}}>Le QR code est généré à partir du même lien que la puce NFC. La génération du QR nécessite une connexion Internet et utilise le service tiers QRServer. Les textes affichés ci-dessous sont les titres des sourates, pas leurs versets.</p>
    </section>
    <section className="poster" style={{boxSizing:"border-box",width:"100%",maxWidth:700,minHeight:940,margin:"auto",padding:"52px 28px",background:"#fffdf9",border:"9px double #c9ac7c",boxShadow:"0 10px 40px #0001",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize:28,color:"#ac8756"}}>۞</div>
        <h1 style={{fontSize:31,fontWeight:500,margin:"12px 0"}}>Les trois sourates de protection</h1>
        <p style={{color:"#937f65",letterSpacing:2,fontSize:12}}>ÉCOUTER • MÉDITER • APPRENDRE</p>
      </div>
      <div style={{width:"100%"}}>
        {names.map((s,i)=><div key={s.fr} style={{margin:"26px 0",paddingBottom:15,borderBottom:i<2?"1px solid #e8dfd2":"none"}}>
          <div lang="ar" dir="rtl" style={{fontFamily:"serif",fontSize:34,lineHeight:1.8}}>{s.ar}</div>
          <div style={{fontSize:17,color:"#866d4e"}}>{s.fr}</div>
        </div>)}
      </div>
      <div>
        {link && <img src={qr} alt="QR code vers les trois sourates" width="145" height="145" style={{display:"block",margin:"auto"}}/>}
        <p style={{fontSize:15,margin:"12px 0 6px"}}>Scannez ou approchez votre téléphone <span aria-label="NFC">◉</span></p>
        <p style={{fontSize:11,color:"#8c806f"}}>Écoutez les trois sourates à la suite</p>
        <p style={{fontSize:12,color:"#ac8756",marginTop:24}}>LEHNOVA</p>
      </div>
    </section>
  </main>;
}
const buttonStyle={background:"#846a4d",color:"white",padding:"12px 18px",border:0,borderRadius:9,cursor:"pointer"};
