"use client";
import { useState } from "react";
import Link from "next/link";
const path = "/cadres-coraniques/protection";
export default function AdminCadresCoraniques() {
  const [copied,setCopied] = useState(false);
  const [url,setUrl] = useState("");
  const full = url || path;
  const copy = async () => {
    const link = window.location.origin + path;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };
  return <main style={{minHeight:"100vh",padding:"40px 20px",background:"#faf7f3",fontFamily:"system-ui,sans-serif",color:"#40352d"}}>
    <section style={{maxWidth:680,margin:"auto",background:"#fff",padding:30,borderRadius:20}}>
      <p><Link href="/admin">← Administration</Link></p>
      <h1>Cadres coraniques NFC</h1>
      <p>Premier modèle : les trois sourates de protection, écoutées successivement.</p>
      <div style={{background:"#f7f0e8",padding:20,borderRadius:12,margin:"24px 0"}}>
        <strong>Cadre Protection</strong>
        <p>Al-Ikhlas → Al-Falaq → An-Nas</p>
        <p style={{overflowWrap:"anywhere"}}><Link href={path} target="_blank">{path}</Link></p>
        <button onClick={copy} style={{background:"#846a4d",color:"white",padding:"12px 18px",border:0,borderRadius:8,cursor:"pointer"}}>{copied?"Lien copié ✓":"Copier le lien NFC / QR"}</button>
      </div>
      <p><strong>Pour le cadre :</strong> programmez la puce NFC et le QR code avec ce même lien permanent.</p>
      <p style={{fontSize:13,color:"#806c58"}}>Version prototype : la personnalisation des modèles, l'export de l'affiche, la génération du QR et le changement des fichiers audio depuis l'administration restent à développer. Avant commercialisation, vérifiez les droits de réutilisation des enregistrements.</p>
    </section>
  </main>;
}
