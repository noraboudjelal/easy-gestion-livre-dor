"use client";
import {useEffect,useRef,useState} from "react";
import Script from "next/script";
export default function PrintSouvenirQR({params}){
 const [ready,setReady]=useState(false),[error,setError]=useState("");
 const holder=useRef(null);
 useEffect(()=>{
  if(!ready||!holder.current||!params?.token)return;
  holder.current.innerHTML="";
  try{
   const url="https://lehnova.fr/s/"+encodeURIComponent(params.token);
   new window.QRCode(holder.current,{text:url,width:320,height:320,colorDark:"#241d1c",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.H});
  }catch(e){setError("Impossible de générer le QR code : "+e.message)}
 },[ready,params?.token]);
 return <main style={{background:"#f8f0ea",minHeight:"100vh",padding:20,color:"#6d4a54",fontFamily:"Arial,sans-serif"}}>
 <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError("Le générateur QR n'a pas pu charger.")}/>
 <style>{`@page{size:A4 portrait;margin:0}*{box-sizing:border-box}.paper{width:210mm;height:297mm;background:white;margin:18px auto;padding:15mm;box-shadow:0 6px 24px #0002}.cut{width:47mm;height:37mm;border:0.25mm dashed #b89870;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;background:#fffdf9}.qr{width:29mm;height:29mm;display:flex;align-items:center;justify-content:center}.qr canvas,.qr img{width:29mm!important;height:29mm!important;image-rendering:auto}.brand{font:7px Georgia,serif;letter-spacing:1px;color:#9c7954}.toolbar{display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap}.toolbar button{background:#a46c7c;border:0;border-radius:10px;color:white;padding:12px 18px;cursor:pointer}@media print{body{margin:0}.toolbar,.note{display:none!important}main{padding:0!important;background:white!important}.paper{margin:0;box-shadow:none;width:210mm;height:297mm;page-break-after:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
 <div className="toolbar"><a href="/admin/events">← Lehnova Events</a><button disabled={!ready} onClick={()=>window.print()}>🖨 Imprimer le QR code</button></div>
 <p className="note" style={{textAlign:"center"}}>Gabarit 4,7 × 3,7 cm (à ajuster après mesure intérieure). Imprimer à 100 %, sans ajustement à la page. Tester le QR code avant découpe.</p>
 {error&&<p role="alert">{error}</p>}
 <div className="paper"><div className="cut"><div className="qr" ref={holder}/><div className="brand">LEHNOVA EVENTS</div></div></div>
 </main>;
}