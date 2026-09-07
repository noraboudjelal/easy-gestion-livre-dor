"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

export default function EcranVeillePage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!id || !supabase) return;
    supabase.from("events").select("id,event_title,client,slug,idle_cover_url").eq("id", id).single().then(({ data }) => {
      setEvent(data || null);
      setPreview(data?.idle_cover_url || "");
    });
  }, [id]);

  function choose(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 15 * 1024 * 1024) {
      setStatus("Choisissez une image PNG, JPG ou WebP de moins de 15 Mo."); return;
    }
    setFile(f); setPreview(URL.createObjectURL(f)); setStatus("");
  }

  async function save() {
    if (!file || !event) return;
    setBusy(true); setStatus("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${event.id}/idle-cover/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("guestbook-media").upload(path, file, { contentType: file.type });
    if (uploadError) { setBusy(false); setStatus("Enregistrement impossible. Réessayez."); return; }
    const { data } = supabase.storage.from("guestbook-media").getPublicUrl(path);
    const url = data?.publicUrl;
    const { error } = await supabase.from("events").update({ idle_cover_url: url }).eq("id", event.id);
    setBusy(false);
    if (error) { setStatus("Image envoyée, mais elle n’a pas pu être liée à l’événement."); return; }
    setPreview(url); setFile(null); setStatus("Écran de veille enregistré. Il apparaîtra sur la borne.");
  }

  async function remove() {
    if (!event) return;
    setBusy(true);
    const { error } = await supabase.from("events").update({ idle_cover_url: null }).eq("id", event.id);
    setBusy(false);
    if (!error) { setPreview(""); setFile(null); setStatus("Image personnalisée retirée. La couverture Le Fil par défaut sera utilisée."); }
  }

  return <main style={{minHeight:"100vh",background:"#f7f4ef",padding:"32px 18px",fontFamily:"Arial,sans-serif",color:"#2f2923"}}>
    <section style={{maxWidth:760,margin:"0 auto",background:"white",border:"1px solid #e8dfd1",borderRadius:24,padding:24,boxShadow:"0 12px 35px rgba(60,45,30,.07)"}}>
      <button onClick={() => router.back()} style={{border:0,background:"transparent",cursor:"pointer",marginBottom:20}}>← Retour</button>
      <div style={{fontSize:12,letterSpacing:".18em",color:"#a6792b",fontWeight:700}}>LE FIL · BORNE</div>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"10px 0"}}>Écran de veille</h1>
      <p style={{color:"#76685b",lineHeight:1.6}}>Choisissez la couverture personnalisée que vous avez créée. Elle sera affichée en plein écran sur la borne et reviendra après 30 secondes sans utilisation.</p>
      <label style={{display:"block",border:"1px dashed #b48645",borderRadius:16,padding:18,margin:"22px 0",cursor:"pointer",textAlign:"center"}}>
        Choisir ma couverture PNG
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} style={{display:"none"}} />
      </label>
      {preview && <div style={{maxWidth:360,margin:"20px auto",borderRadius:20,overflow:"hidden",boxShadow:"0 10px 28px rgba(0,0,0,.12)",background:"#eee"}}><img src={preview} alt="Aperçu écran de veille" style={{display:"block",width:"100%",height:"auto"}} /></div>}
      <button disabled={!file || busy} onClick={save} style={{width:"100%",border:0,borderRadius:14,padding:15,background:!file||busy?"#c8c1b7":"#3d3128",color:"white",fontWeight:700,cursor:!file||busy?"default":"pointer"}}>{busy?"Enregistrement…":"Utiliser comme écran de veille"}</button>
      {event?.idle_cover_url && <button disabled={busy} onClick={remove} style={{width:"100%",border:"1px solid #d8c8b3",borderRadius:14,padding:13,background:"white",color:"#6e5b49",fontWeight:600,marginTop:10,cursor:"pointer"}}>Retirer l’image personnalisée</button>}
      {status && <p style={{textAlign:"center",marginTop:16,color:"#6e5b49"}}>{status}</p>}
    </section>
  </main>;
}
