"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const audioUrl = "https://lehnova.fr/cadres-coraniques/protection";
export default function CadrePersonnalise(){
 const [photo,setPhoto]=useState("");
 const [qrSize,setQrSize]=useState(22);
 const [position,setPosition]=useState("bottom");
 const [error,setError]=useState("");
 const imageRef=useRef(null);
 const qrUrl="https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=12&data="+encodeURIComponent(audioUrl);
 useEffect(()=>()=>{if(photo)URL.revokeObjectURL(photo)},[photo]);
 const upload=e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")){setError("Choisissez une image JPG ou PNG.");return;}setError("");setPhoto(URL.createObjectURL(f));};
 const download=async()=>{
  if(!photo)return;
  try{
   const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.crossOrigin="anonymous";i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
   const [background,qr]=await Promise.all([load(photo),load(qrUrl)]);
   const canvas=document.createElement("canvas");canvas.width=background.naturalWidth;canvas.height=background.naturalHeight;
   const ctx=canvas.getContext("2d");ctx.drawImage(background,0,0,canvas.width,canvas.height);
   const size=Math.round(canvas.width*qrSize/100);const pad=Math.round(canvas.width*.04);
   const x=Math.round((canvas.width-size)/2);const y=position==="top"?pad:position==="center"?Math.round((canvas.height-size)/2):canvas.height-size-pad;
   ctx.fillStyle="#fff";ctx.fillRect(x-8,y-8,size+16,size+16);ctx.drawImage(qr,x,y,size,size);
   const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="cadre-lehnova-qr.png";a.click();
  }catch{setError("Téléchargement impossible. Essayez une autre image ou utilisez l'impression.");}
 };
 return <main style={{minHeight:"100vh",background:"#f8f5f0",color:"#40352d",fontFamily:"system-ui,sans-serif",padding:"35px 16px"}}>
 <section style={{maxWidth:740,margin:"auto"}}>
 <Link href="/cadres-coraniques/protection" style={{color:"#846a4d"}}>← Écouter les sourates</Link>
 <h1 style={{fontSize:30,marginBottom:8}}>Mon cadre coranique</h1>
 <p>Choisissez votre propre image : Lehnova ajoute le QR code qui ouvre les trois sourates de protection.</p>
 <label style={{display:"block",margin:"24px 0 10px",fontWeight:600}}>1. Ajouter mon image</label>
 <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} style={{maxWidth:"100%"}}/>
 <label style={{display:"block",margin:"22px 0 8px",fontWeight:600}}>2. Position du QR code</label>
 <select value={position} onChange={e=>setPosition(e.target.value)} style={{padding:12,borderRadius:10,border:"1px solid #d8c8b6",width:"100%"}}>
 <option value="bottom">En bas</option><option value="top">En haut</option><option value="center">Au centre</option>
 </select>
 <label style={{display:"block",margin:"22px 0 8px",fontWeight:600}}>Taille du QR code : {qrSize}% de la largeur</label>
 <input type="range" min="14" max="35" value={qrSize} onChange={e=>setQrSize(Number(e.target.value))} style={{width:"100%"}}/>
 {photo?<div style={{position:"relative",marginTop:25,width:"100%",display:"inline-block",lineHeight:0}}>
 <img ref={imageRef} src={photo} alt="Votre image de cadre" style={{width:"100%",height:"auto"}}/>
 <img src={qrUrl} alt="QR code pour écouter les sourates" style={{position:"absolute",width:qrSize+"%",height:"auto",left:"50%",transform:"translateX(-50%)",...(position==="top"?{top:"4%"}:position==="center"?{top:"50%",transform:"translate(-50%,-50%)"}:{bottom:"4%"}),background:"white",padding:5,boxSizing:"border-box"}}/>
 </div>:<div style={{marginTop:25,border:"2px dashed #d8c8b6",borderRadius:15,padding:35,textAlign:"center"}}>Votre cadre apparaîtra ici</div>}
 {error&&<p role="alert" style={{color:"#a33224"}}>{error}</p>}
 <button disabled={!photo} onClick={download} style={{marginTop:20,background:"#846a4d",color:"white",border:0,borderRadius:25,padding:"15px 25px",fontSize:16,opacity:photo?1:.5,cursor:photo?"pointer":"not-allowed"}}>Télécharger mon cadre avec QR code</button>
 <p style={{fontSize:13,color:"#817467",marginTop:20}}>Avant d'imprimer, scannez le QR code pour vérifier la lecture audio. Le QR code renvoie vers une page publique de Lehnova.</p>
 </section></main>;
}