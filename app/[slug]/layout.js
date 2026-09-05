"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function formatDate(value) {
  if (!value) return "";
  try { return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }); }
  catch { return ""; }
}

export default function PublicEventLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [welcomeMessage,setWelcomeMessage]=useState("");
  const [eventMeta,setEventMeta]=useState({title:"",date:""});
  const [cameraOpen,setCameraOpen]=useState(false);
  const [shot,setShot]=useState("");
  const [shotFile,setShotFile]=useState(null);
  const [cameraError,setCameraError]=useState("");
  const [photoArea,setPhotoArea]=useState(null);
  const videoRef=useRef(null); const streamRef=useRef(null);

  useEffect(()=>{ let active=true; (async()=>{
    if(!supabase||!slug)return;
    const {data:event}=await supabase.from("events").select("id,title,event_date").eq("slug",slug).maybeSingle();
    if(!event?.id||!active)return;
    setEventMeta({title:(event.title||"").trim(),date:formatDate(event.event_date)});
    const {data:settings}=await supabase.from("event_fil_settings").select("welcome_message").eq("event_id",event.id).maybeSingle();
    if(active)setWelcomeMessage((settings?.welcome_message||"").trim());
  })(); return()=>{active=false}; },[slug]);

  useEffect(()=>{
    const header=document.querySelector(".event-header"); if(!header)return;
    let node=header.querySelector("[data-lehnova-welcome='true']");
    if(!welcomeMessage){node?.remove();return}
    if(!node){node=document.createElement("p");node.dataset.lehnovaWelcome="true";node.className="lehnova-welcome-message";const title=header.querySelector(".event-title-names");if(title)title.insertAdjacentElement("afterend",node);else header.prepend(node)}
    node.textContent=welcomeMessage;
  },[welcomeMessage]);

  useEffect(()=>{
    let cancelled=false;
    const findPhotoArea=()=>{
      const inputs=[...document.querySelectorAll('input[type="file"]')];
      const input=inputs.find(i=>(i.accept||"").includes("image"));
      if(input&&!cancelled){setPhotoArea(input.parentElement||input.closest("label")||null);return true}
      return false;
    };
    if(findPhotoArea())return()=>{cancelled=true};
    const observer=new MutationObserver(()=>{if(findPhotoArea())observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{cancelled=true;observer.disconnect()};
  },[]);

  async function openCamera(){
    setCameraOpen(true);setShot("");setShotFile(null);setCameraError("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1080},height:{ideal:1440}},audio:false});
      streamRef.current=stream;
      setTimeout(()=>{if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play().catch(()=>{})}},0);
    }catch{setCameraError("Impossible d’ouvrir la caméra. Autorisez l’accès à la caméra dans votre navigateur.")}
  }
  function closeCamera(){streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setCameraOpen(false);setShot("");setShotFile(null)}
  function capture(){
    const v=videoRef.current;if(!v?.videoWidth)return;
    const c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext("2d");
    x.drawImage(v,0,0,c.width,c.height);
    const h=Math.max(150,c.height*.22);const g=x.createLinearGradient(0,c.height-h,0,c.height);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.68)");x.fillStyle=g;x.fillRect(0,c.height-h,c.width,h);
    x.textAlign="center";x.fillStyle="#fff";x.shadowColor="rgba(0,0,0,.55)";x.shadowBlur=8;
    x.font=`italic 700 ${Math.max(34,Math.round(c.width*.055))}px Georgia`;x.fillText(eventMeta.title||"Le Fil",c.width/2,c.height-Math.max(65,c.height*.075));
    if(eventMeta.date){x.font=`600 ${Math.max(18,Math.round(c.width*.025))}px Arial`;x.fillText(eventMeta.date.toUpperCase(),c.width/2,c.height-Math.max(30,c.height*.035))}
    c.toBlob(blob=>{if(!blob)return;const file=new File([blob],`le-fil-${Date.now()}.jpg`,{type:"image/jpeg"});setShotFile(file);setShot(URL.createObjectURL(blob));streamRef.current?.getTracks().forEach(t=>t.stop())},"image/jpeg",.92);
  }
  function retake(){setShot("");setShotFile(null);openCamera()}
  function useShot(){
    if(!shotFile)return;
    const inputs=[...document.querySelectorAll('input[type="file"]')];
    const input=inputs.find(i=>(i.accept||"").includes("image"))||inputs[0];
    if(!input){setCameraError("Le formulaire photo est introuvable.");return}
    const dt=new DataTransfer();dt.items.add(shotFile);input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));closeCamera();
    input.scrollIntoView({behavior:"smooth",block:"center"});
  }

  return <>
    <style jsx global>{`
      .event-header-card{box-sizing:border-box!important;min-height:265px!important;padding:20px 26px 8px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important}.event-header{width:100%!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important}.event-title-context{font-size:1.35rem!important;font-weight:800!important;margin-bottom:7px!important;letter-spacing:.15em!important}.event-title-names{font-size:clamp(3.6rem,7vw,5.5rem)!important;line-height:.98!important}.lehnova-welcome-message{max-width:720px;margin:22px auto 0!important;padding:0 8px;text-align:center;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:.9rem;line-height:1.4;opacity:.82}.event-nav{margin-top:auto!important;margin-bottom:0!important;padding-top:4px!important;padding-bottom:0!important;align-self:stretch!important}
      .lehnova-camera-button{width:100%;margin-top:8px;border:1px solid #d8b57a;border-radius:14px;background:#fffdf9;color:#3d3128;padding:12px 15px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.06);cursor:pointer}.lehnova-camera-modal{position:fixed;inset:0;z-index:9999;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white}.lehnova-camera-stage{position:relative;width:min(100vw,520px);height:min(76vh,700px);overflow:hidden;background:#000}.lehnova-camera-stage video,.lehnova-camera-stage img{width:100%;height:100%;object-fit:cover}.lehnova-live-filter{position:absolute;left:0;right:0;bottom:0;padding:80px 16px 24px;text-align:center;background:linear-gradient(to top,rgba(0,0,0,.7),transparent);text-shadow:0 2px 6px #000;pointer-events:none}.lehnova-live-title{font:italic 700 clamp(25px,7vw,38px) Georgia,serif}.lehnova-live-date{margin-top:7px;font:600 12px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.lehnova-camera-actions{display:flex;gap:12px;padding:18px;flex-wrap:wrap;justify-content:center}.lehnova-camera-actions button{border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:12px 18px;background:white;color:#241d18;font-weight:800}.lehnova-camera-actions .secondary{background:transparent;color:white}.lehnova-camera-error{padding:20px;text-align:center;max-width:420px}
      @media(max-width:599px){.event-header-card{min-height:265px!important;padding:14px 12px 6px!important}.event-title-context{font-size:1.12rem!important;margin-bottom:5px!important}.event-title-names{font-size:clamp(2.85rem,13.8vw,4rem)!important;letter-spacing:-.055em!important}.lehnova-welcome-message{margin-top:18px!important;font-size:.82rem}.event-nav{margin-top:auto!important;padding-top:3px!important}}
    `}</style>
    {children}
    {photoArea&&createPortal(<button type="button" className="lehnova-camera-button" onClick={openCamera}>📸 Prendre une photo avec le filtre</button>,photoArea)}
    {cameraOpen&&<div className="lehnova-camera-modal">
      <div className="lehnova-camera-stage">
        {!shot&&<video ref={videoRef} playsInline muted/>}{shot&&<img src={shot} alt="Aperçu"/>}
        {!shot&&<div className="lehnova-live-filter"><div className="lehnova-live-title">{eventMeta.title||"Le Fil"}</div>{eventMeta.date&&<div className="lehnova-live-date">{eventMeta.date}</div>}</div>}
      </div>
      {cameraError&&<div className="lehnova-camera-error">{cameraError}</div>}
      <div className="lehnova-camera-actions">
        {!shot&&!cameraError&&<button type="button" onClick={capture}>● Prendre la photo</button>}
        {shot&&<><button type="button" className="secondary" onClick={retake}>↻ Reprendre</button><button type="button" onClick={useShot}>✓ Utiliser cette photo</button></>}
        <button type="button" className="secondary" onClick={closeCamera}>Fermer</button>
      </div>
    </div>}
  </>;
}
