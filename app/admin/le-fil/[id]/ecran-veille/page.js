"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

const STYLES = {
  editorial: { label: "Éditorial", overlay: "rgba(18,14,12,.42)", accent: "#ead6b8", align: "center" },
  romantique: { label: "Romantique", overlay: "rgba(69,37,42,.34)", accent: "#f5e7df", align: "center" },
  minimal: { label: "Minimal", overlay: "rgba(15,15,15,.24)", accent: "#ffffff", align: "left" },
};

export default function EcranVeillePage() {
  const { id } = useParams();
  const router = useRouter();
  const canvasRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [mode, setMode] = useState("create");
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [styleKey, setStyleKey] = useState("editorial");
  const [title, setTitle] = useState("");
  const [dateText, setDateText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!id || !supabase) return;
    supabase.from("events").select("id,event_title,client,slug,event_date,idle_cover_url").eq("id", id).single().then(({ data }) => {
      setEvent(data || null);
      setPreview(data?.idle_cover_url || "");
      setTitle(data?.event_title || data?.client || "Bienvenue");
      if (data?.event_date) {
        const d = new Date(`${data.event_date}T12:00:00`);
        setDateText(Number.isNaN(d.getTime()) ? data.event_date : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
      }
    });
  }, [id]);

  function validateImage(f) {
    if (!f) return false;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 15 * 1024 * 1024) {
      setStatus("Choisissez une image PNG, JPG ou WebP de moins de 15 Mo.");
      return false;
    }
    return true;
  }

  function chooseImport(e) {
    const f = e.target.files?.[0];
    if (!validateImage(f)) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setStatus("");
  }

  function choosePhoto(e) {
    const f = e.target.files?.[0];
    if (!validateImage(f)) return;
    setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); setStatus("");
  }

  async function uploadAndLink(blob, ext = "png") {
    if (!event) return false;
    const path = `${event.id}/idle-cover/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("guestbook-media").upload(path, blob, { contentType: blob.type || "image/png" });
    if (uploadError) { setStatus("Enregistrement impossible. Réessayez."); return false; }
    const { data } = supabase.storage.from("guestbook-media").getPublicUrl(path);
    const url = data?.publicUrl;
    const { error } = await supabase.from("events").update({ idle_cover_url: url }).eq("id", event.id);
    if (error) { setStatus("Image envoyée, mais elle n’a pas pu être liée à l’événement."); return false; }
    setEvent((old) => ({ ...old, idle_cover_url: url }));
    setPreview(url); setFile(null);
    setStatus("Écran de veille enregistré. Il apparaîtra sur la borne.");
    return true;
  }

  async function saveImport() {
    if (!file || !event) return;
    setBusy(true); setStatus("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    await uploadAndLink(file, ext);
    setBusy(false);
  }

  function coverToBlob() {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas || !photoPreview) return reject(new Error("missing"));
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 1536; canvas.height = 2048;
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        const s = STYLES[styleKey];
        ctx.fillStyle = s.overlay; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = s.align;
        const x = s.align === "left" ? 120 : canvas.width / 2;
        ctx.fillStyle = s.accent;
        ctx.font = "600 30px Arial"; ctx.letterSpacing = "6px";
        ctx.fillText("LE FIL · BIENVENUE", x, 760);
        ctx.fillStyle = "#fff";
        ctx.font = "italic 92px Georgia";
        const maxWidth = canvas.width - 220;
        const words = (title || "Bienvenue").split(" ");
        let line = "", lines = [];
        words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
        if (line) lines.push(line);
        lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, x, 900 + i * 110, maxWidth));
        if (dateText) { ctx.fillStyle = s.accent; ctx.font = "500 34px Arial"; ctx.fillText(dateText.toUpperCase(), x, 900 + Math.min(lines.length, 3) * 110 + 70); }
        ctx.fillStyle = "rgba(255,255,255,.86)"; ctx.font = "24px Arial"; ctx.fillText("Touchez l’écran pour commencer", x, 1830);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("blob")), "image/png", .95);
      };
      img.onerror = reject;
      img.src = photoPreview;
    });
  }

  async function saveCreated() {
    if (!photo || !event) { setStatus("Ajoutez d’abord une photo."); return; }
    setBusy(true); setStatus("");
    try { const blob = await coverToBlob(); await uploadAndLink(blob, "png"); }
    catch { setStatus("La couverture n’a pas pu être créée. Réessayez avec une autre photo."); }
    setBusy(false);
  }

  async function remove() {
    if (!event) return;
    setBusy(true);
    const { error } = await supabase.from("events").update({ idle_cover_url: null }).eq("id", event.id);
    setBusy(false);
    if (!error) { setEvent((old) => ({ ...old, idle_cover_url: null })); setPreview(""); setFile(null); setStatus("Image personnalisée retirée. La couverture Le Fil par défaut sera utilisée."); }
  }

  const s = STYLES[styleKey];
  return <main style={{minHeight:"100vh",background:"#f7f4ef",padding:"32px 18px",fontFamily:"Arial,sans-serif",color:"#2f2923"}}>
    <section style={{maxWidth:900,margin:"0 auto",background:"white",border:"1px solid #e8dfd1",borderRadius:24,padding:24,boxShadow:"0 12px 35px rgba(60,45,30,.07)"}}>
      <button onClick={() => router.back()} style={{border:0,background:"transparent",cursor:"pointer",marginBottom:20}}>← Retour</button>
      <div style={{fontSize:12,letterSpacing:".18em",color:"#a6792b",fontWeight:700}}>LE FIL · BORNE</div>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"10px 0"}}>Écran de veille</h1>
      <p style={{color:"#76685b",lineHeight:1.6}}>Créez votre couverture ici ou importez une image déjà prête. Elle reviendra automatiquement après 30 secondes sans utilisation.</p>
      <div style={{display:"flex",gap:10,margin:"22px 0",flexWrap:"wrap"}}>
        <button onClick={() => setMode("create")} style={{flex:1,minWidth:180,padding:14,borderRadius:14,border:"1px solid #b48645",background:mode==="create"?"#3d3128":"white",color:mode==="create"?"white":"#3d3128",fontWeight:700,cursor:"pointer"}}>Créer ma couverture</button>
        <button onClick={() => setMode("import")} style={{flex:1,minWidth:180,padding:14,borderRadius:14,border:"1px solid #b48645",background:mode==="import"?"#3d3128":"white",color:mode==="import"?"white":"#3d3128",fontWeight:700,cursor:"pointer"}}>Importer une image</button>
      </div>

      {mode === "create" ? <div>
        <label style={{display:"block",border:"1px dashed #b48645",borderRadius:16,padding:18,margin:"18px 0",cursor:"pointer",textAlign:"center"}}>Ajouter la photo de couverture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} style={{display:"none"}} /></label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
          <label>Texte principal<input value={title} onChange={(e)=>setTitle(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,padding:12,border:"1px solid #ddd1c1",borderRadius:10}} /></label>
          <label>Date<input value={dateText} onChange={(e)=>setDateText(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,padding:12,border:"1px solid #ddd1c1",borderRadius:10}} /></label>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{Object.entries(STYLES).map(([key,val])=><button key={key} onClick={()=>setStyleKey(key)} style={{padding:"10px 16px",borderRadius:999,border:"1px solid #cdb999",background:styleKey===key?"#b48645":"white",color:styleKey===key?"white":"#4b4036",cursor:"pointer"}}>{val.label}</button>)}</div>
        <div style={{width:"min(100%,360px)",aspectRatio:"3 / 4",margin:"0 auto 20px",borderRadius:20,overflow:"hidden",position:"relative",background:"#ddd",boxShadow:"0 10px 28px rgba(0,0,0,.12)"}}>
          {photoPreview ? <img src={photoPreview} alt="Photo couverture" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} /> : <div style={{height:"100%",display:"grid",placeItems:"center",color:"#7c7168"}}>Ajoutez une photo</div>}
          {photoPreview && <div style={{position:"absolute",inset:0,background:s.overlay,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:s.align==="left"?"flex-start":"center",textAlign:s.align,padding:"32px",boxSizing:"border-box",color:"white"}}><div style={{fontSize:10,letterSpacing:3,color:s.accent,fontWeight:700}}>LE FIL · BIENVENUE</div><div style={{fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:34,lineHeight:1.05,margin:"18px 0"}}>{title || "Bienvenue"}</div><div style={{fontSize:12,letterSpacing:1.5,color:s.accent}}>{dateText}</div><div style={{position:"absolute",bottom:30,fontSize:11,opacity:.88}}>Touchez l’écran pour commencer</div></div>}
        </div>
        <canvas ref={canvasRef} style={{display:"none"}} />
        <button disabled={!photo || busy} onClick={saveCreated} style={{width:"100%",border:0,borderRadius:14,padding:15,background:!photo||busy?"#c8c1b7":"#3d3128",color:"white",fontWeight:700,cursor:!photo||busy?"default":"pointer"}}>{busy?"Création et enregistrement…":"Utiliser comme écran de veille"}</button>
      </div> : <div>
        <label style={{display:"block",border:"1px dashed #b48645",borderRadius:16,padding:18,margin:"22px 0",cursor:"pointer",textAlign:"center"}}>Choisir une image PNG, JPG ou WebP<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImport} style={{display:"none"}} /></label>
        {file && preview && <div style={{maxWidth:360,margin:"20px auto",borderRadius:20,overflow:"hidden",boxShadow:"0 10px 28px rgba(0,0,0,.12)",background:"#eee"}}><img src={preview} alt="Aperçu écran de veille" style={{display:"block",width:"100%",height:"auto"}} /></div>}
        <button disabled={!file || busy} onClick={saveImport} style={{width:"100%",border:0,borderRadius:14,padding:15,background:!file||busy?"#c8c1b7":"#3d3128",color:"white",fontWeight:700,cursor:!file||busy?"default":"pointer"}}>{busy?"Enregistrement…":"Utiliser comme écran de veille"}</button>
      </div>}

      {event?.idle_cover_url && <div style={{marginTop:28,paddingTop:22,borderTop:"1px solid #eee4d7"}}><div style={{fontWeight:700,marginBottom:10}}>Couverture actuellement utilisée</div><div style={{maxWidth:220,margin:"0 auto 12px",borderRadius:14,overflow:"hidden"}}><img src={event.idle_cover_url} alt="Couverture actuelle" style={{display:"block",width:"100%"}} /></div><button disabled={busy} onClick={remove} style={{width:"100%",border:"1px solid #d8c8b3",borderRadius:14,padding:13,background:"white",color:"#6e5b49",fontWeight:600,cursor:"pointer"}}>Retirer l’image personnalisée</button></div>}
      {status && <p style={{textAlign:"center",marginTop:16,color:"#6e5b49"}}>{status}</p>}
    </section>
  </main>;
}
