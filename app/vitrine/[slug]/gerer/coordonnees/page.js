"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";

export default function CoordonneesVitrinePage() {
  const params = useParams();
  const slug = params?.slug;
  const [showcase, setShowcase] = useState(null);
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone:"", whatsapp:"", booking_url:"", address:"", hours_text:"" });

  useEffect(() => {
    if (!slug || !supabase) return;
    (async () => {
      const { data, error: loadError } = await supabase.from("showcases").select("*").eq("slug", slug).single();
      if (loadError || !data) { setError("Page introuvable."); return; }
      setShowcase(data);
      setForm({
        phone:data.phone || "",
        whatsapp:data.whatsapp || "",
        booking_url:data.booking_url || "",
        address:data.address || "",
        hours_text:data.hours_text || ""
      });
      if (typeof window !== "undefined" && sessionStorage.getItem(`vitrine-client-auth-${data.id}`) === "1") setAuthed(true);
    })();
  }, [slug]);

  function login(e) {
    e.preventDefault();
    if (!showcase) return;
    if (pwd !== showcase.client_password) { setError("Code incorrect."); return; }
    sessionStorage.setItem(`vitrine-client-auth-${showcase.id}`, "1");
    setAuthed(true); setError("");
  }

  function change(key, value) { setForm(prev => ({...prev,[key]:value})); setSaved(false); }

  async function save(e) {
    e.preventDefault();
    if (!showcase || !supabase) return;
    setSaving(true); setError(""); setSaved(false);
    const payload = Object.fromEntries(Object.entries(form).map(([k,v]) => [k, v.trim() || null]));
    const { error: saveError } = await supabase.from("showcases").update(payload).eq("id", showcase.id);
    setSaving(false);
    if (saveError) { setError("Enregistrement impossible : " + saveError.message); return; }
    setSaved(true);
  }

  if (!showcase && !error) return <main style={s.page}><div style={s.card}>Chargement…</div></main>;
  if (!authed) return <main style={s.page}><form style={s.card} onSubmit={login}><p style={s.kicker}>{showcase?.business_name || "MA PAGE"}</p><h1 style={s.title}>Coordonnées & réservation</h1><input style={s.input} type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Code d'accès"/><button style={s.button}>Entrer</button>{error && <p style={s.error}>{error}</p>}</form></main>;

  return <main style={s.page}><div style={s.shell}>
    <div style={s.header}><div><p style={s.kicker}>MA PAGE</p><h1 style={s.title}>Coordonnées & réservation</h1></div><a style={s.link} href={`/vitrine/${slug}/gerer`}>← Gestion principale</a></div>
    <p style={s.help}>Ces informations apparaissent automatiquement sur ton mini-site Lehnova.</p>
    <form style={s.card} onSubmit={save}>
      <label style={s.label}>Téléphone<input style={s.input} value={form.phone} onChange={e=>change("phone",e.target.value)} placeholder="06 00 00 00 00"/></label>
      <label style={s.label}>WhatsApp<input style={s.input} value={form.whatsapp} onChange={e=>change("whatsapp",e.target.value)} placeholder="06 00 00 00 00"/></label>
      <label style={s.label}>Lien de réservation<input style={s.input} value={form.booking_url} onChange={e=>change("booking_url",e.target.value)} placeholder="https://..."/></label>
      <label style={s.label}>Adresse<input style={s.input} value={form.address} onChange={e=>change("address",e.target.value)} placeholder="12 rue Exemple, Toulouse"/></label>
      <label style={s.label}>Horaires<textarea style={s.textarea} value={form.hours_text} onChange={e=>change("hours_text",e.target.value)} placeholder={'Mardi - Samedi\n9h00 - 18h30'} rows={4}/></label>
      <button style={s.button} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
      {saved && <p style={s.success}>✓ Informations enregistrées.</p>}{error && <p style={s.error}>{error}</p>}
    </form>
    <a style={s.preview} href={`/vitrine/${slug}`} target="_blank" rel="noreferrer">Voir mon mini-site ↗</a>
  </div></main>;
}

const s={page:{minHeight:"100vh",background:"#EFE9DA",padding:"28px 16px",fontFamily:"Arial,sans-serif",color:"#2A241D"},shell:{maxWidth:720,margin:"0 auto"},header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12},card:{maxWidth:720,margin:"0 auto",background:"#FCFAF2",border:"1px solid #E6DCC2",borderRadius:12,padding:20,display:"flex",flexDirection:"column",gap:14},kicker:{fontSize:11,letterSpacing:".14em",color:"#A6792B",fontWeight:700,margin:"0 0 4px"},title:{fontFamily:"Georgia,serif",fontSize:26,margin:0,color:"#1E2A3A"},help:{fontSize:13,color:"#756B59",margin:"0 0 18px"},label:{display:"flex",flexDirection:"column",gap:6,fontSize:13,fontWeight:700,color:"#5B4636"},input:{padding:"11px 12px",border:"1px solid #D8CCAB",borderRadius:7,fontSize:15,background:"#fff"},textarea:{padding:"11px 12px",border:"1px solid #D8CCAB",borderRadius:7,fontSize:15,background:"#fff",resize:"vertical"},button:{padding:"12px 18px",border:0,borderRadius:7,background:"#B5402D",color:"white",fontWeight:700,fontSize:14,cursor:"pointer"},link:{fontSize:13,color:"#B5402D",fontWeight:700,textDecoration:"none"},preview:{display:"block",textAlign:"center",marginTop:16,color:"#B5402D",fontWeight:700,textDecoration:"none"},success:{margin:0,color:"#36734A",fontSize:13,fontWeight:700},error:{margin:0,color:"#B5402D",fontSize:13}};