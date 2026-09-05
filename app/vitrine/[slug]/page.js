"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { VITRINE_THEMES, DEFAULT_THEME } from "../../../lib/vitrineThemes";

export default function PublicVitrinePage() {
  const params = useParams();
  const slug = params?.slug;
  const [showcase, setShowcase] = useState(null);
  const [realisations, setRealisations] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [active, setActive] = useState("Tout");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const visitLogged = useRef(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: sc, error } = await supabase.from("showcases").select("*").eq("slug", slug).single();
    if (error || !sc) { setNotFound(true); setLoading(false); return; }
    setShowcase(sc);
    const { data: items } = await supabase.from("showcase_products").select("*").eq("showcase_id", sc.id).order("position", { ascending: true });
    setRealisations((items || []).filter((p) => (p.item_type || "realisation") === "realisation"));
    setPrestations((items || []).filter((p) => p.item_type === "prestation"));
    const { data: transfos } = await supabase.from("showcase_transformations").select("*").eq("showcase_id", sc.id).order("position", { ascending: true });
    setTransformations(transfos || []);
    setLoading(false);
    if (!visitLogged.current) { visitLogged.current = true; supabase.from("showcase_visits").insert({ showcase_id: sc.id }).then(() => {}); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);
  if (notFound) return <p style={{padding:40,fontFamily:"Arial"}}>Cette page n'existe pas.</p>;
  if (loading || !showcase) return <p style={{padding:40,fontFamily:"Arial"}}>Chargement…</p>;

  const theme = VITRINE_THEMES[showcase.theme] || VITRINE_THEMES[DEFAULT_THEME];
  const v = theme.vars;
  const firstPhoto = realisations.find(r => r.photo_url || r.photo_urls?.[0]);
  const heroImage = showcase.cover_image_url || firstPhoto?.photo_urls?.[0] || firstPhoto?.photo_url || "";
  const categories = ["Tout", ...Array.from(new Set(realisations.map(r => r.category).filter(Boolean)))];
  const visible = active === "Tout" ? realisations : realisations.filter(r => r.category === active);
  const cleanPhone = (showcase.phone || "").replace(/\D/g, "");
  const waPhone = (showcase.whatsapp || showcase.phone || "").replace(/\D/g, "").replace(/^0/, "33");

  return (
    <main className="vt">
      <style>{`
        *{box-sizing:border-box}body{margin:0}.vt{--ink:${v["--ink"]};--paper:${v["--paper"]};--bg:${v["--bg"]};--accent:${v["--accent-2"]};min-height:100vh;background:var(--bg);color:var(--ink);font-family:Arial,sans-serif}.wrap{max-width:520px;margin:auto;background:var(--paper);min-height:100vh;box-shadow:0 0 50px rgba(0,0,0,.07)}.hero{min-height:500px;padding:28px 24px 38px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;background:linear-gradient(180deg,rgba(20,15,14,.08),rgba(20,15,14,.76))${heroImage ? `,url('${heroImage}') center/cover` : `,var(--ink)`}}.brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.badge{border:1px solid rgba(255,255,255,.55);padding:8px 11px;border-radius:999px}.hero h1{font-family:Georgia,serif;font-size:48px;line-height:.98;font-weight:400;margin:0 0 14px}.hero p{font-size:14px;line-height:1.6;max-width:370px;margin:0 0 22px}.cta{display:inline-block;background:#fff;color:#241c1b;padding:13px 18px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:700}.section{padding:42px 24px}.eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:8px}.section h2,.contact h2{font-family:Georgia,serif;font-size:31px;font-weight:400;margin:0 0 20px}.about{font-size:14px;line-height:1.75;opacity:.7;margin:0}.filters{display:flex;gap:8px;overflow:auto;padding-bottom:6px;margin-bottom:18px}.filter{border:1px solid rgba(0,0,0,.13);background:var(--paper);border-radius:999px;padding:9px 13px;white-space:nowrap;font-size:12px;color:var(--ink)}.filter.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.card{position:relative;aspect-ratio:3/4;overflow:hidden;background:var(--bg)}.card img{width:100%;height:100%;object-fit:cover;display:block}.caption{position:absolute;left:0;right:0;bottom:0;padding:36px 12px 12px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.7))}.caption strong{display:block;font-family:Georgia,serif;font-size:16px;font-weight:400}.caption span{font-size:9px;text-transform:uppercase;letter-spacing:.12em;opacity:.9}.prices{background:var(--ink);color:var(--paper)}.prices .eyebrow{color:var(--accent)}.price-row{display:flex;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.13);font-size:14px}.price-row span:last-child{color:var(--accent);white-space:nowrap}.before{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px}.before figure{margin:0;position:relative;aspect-ratio:3/4;overflow:hidden}.before img{width:100%;height:100%;object-fit:cover}.before b{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.55);color:#fff;padding:5px 7px;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.contact{text-align:center;padding:46px 24px 34px;background:var(--bg)}.contact p{font-size:13px;line-height:1.8;opacity:.7}.buttons{display:grid;gap:10px;margin-top:22px}.button{padding:14px 18px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;background:var(--ink);color:var(--paper)}.button.alt{background:var(--paper);color:var(--ink);border:1px solid rgba(0,0,0,.15)}.socials{display:flex;justify-content:center;gap:8px;margin-top:18px}.socials a{font-size:11px;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--accent);padding:4px}.footer{text-align:center;padding:18px;font-size:10px;opacity:.55;border-top:1px solid rgba(0,0,0,.08)}@media(max-width:420px){.hero{min-height:470px}.hero h1{font-size:43px}.section{padding:36px 20px}}
      `}</style>
      <div className="wrap">
        <section className="hero">
          <div className="brand"><span>{showcase.business_name}</span>{showcase.address && <span className="badge">{showcase.address.split(",")[0]}</span>}</div>
          <div>
            <div className="eyebrow" style={{color:"#f3d9d0"}}>{showcase.tagline || "Portfolio professionnel"}</div>
            <h1>{showcase.business_name}</h1>
            {showcase.about_text && <p>{showcase.about_text}</p>}
            {(showcase.booking_url || cleanPhone) && <a className="cta" href={showcase.booking_url || `tel:${cleanPhone}`}>{showcase.booking_url ? "Prendre rendez-vous" : "Nous contacter"}</a>}
          </div>
        </section>

        {showcase.about_text && <section className="section"><div className="eyebrow">À propos</div><h2>Bienvenue</h2><p className="about">{showcase.about_text}</p></section>}

        <section className="section" id="portfolio">
          <div className="eyebrow">Portfolio</div><h2>Nos réalisations</h2>
          {categories.length > 1 && <div className="filters">{categories.map(c => <button key={c} className={`filter ${active===c?"on":""}`} onClick={()=>setActive(c)}>{c}</button>)}</div>}
          {visible.length ? <div className="grid">{visible.map(r => { const image=r.photo_urls?.[0]||r.photo_url; return <article className="card" key={r.id}>{image && <img src={image} alt={r.name}/>}<div className="caption">{r.category&&<span>{r.category}</span>}<strong>{r.name}</strong>{r.price&&<span>{r.price}</span>}</div></article>})}</div> : <p className="about">Les réalisations arrivent bientôt.</p>}
        </section>

        {prestations.length > 0 && <section className="section prices"><div className="eyebrow">Prestations</div><h2>Ce que nous proposons</h2>{prestations.map(p=><div className="price-row" key={p.id}><span>{p.name}{p.description&&<small style={{display:"block",opacity:.6,marginTop:4}}>{p.description}</small>}</span><span>{p.price||"Sur devis"}</span></div>)}</section>}

        {transformations.length > 0 && <section className="section"><div className="eyebrow">Transformations</div><h2>Avant / Après</h2>{transformations.map(t=><div key={t.id} style={{marginBottom:24}}>{t.label&&<p className="about" style={{marginBottom:8}}>{t.label}</p>}<div className="before"><figure>{t.before_url&&<img src={t.before_url} alt="Avant"/>}<b>Avant</b></figure><figure>{t.after_url&&<img src={t.after_url} alt="Après"/>}<b>Après</b></figure></div></div>)}</section>}

        <section className="contact" id="contact"><div className="eyebrow">Contact</div><h2>On prend rendez-vous ?</h2>{(showcase.hours_text||showcase.address)&&<p>{showcase.hours_text}{showcase.hours_text&&showcase.address&&<br/>}{showcase.address}</p>}<div className="buttons">{showcase.booking_url&&<a className="button" href={showcase.booking_url} target="_blank" rel="noreferrer">Prendre rendez-vous</a>}{cleanPhone&&<a className="button" href={`tel:${cleanPhone}`}>Appeler</a>}{waPhone&&<a className="button alt" href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">WhatsApp</a>}</div><div className="socials">{showcase.instagram_url&&<a href={showcase.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}{showcase.facebook_url&&<a href={showcase.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}{showcase.tiktok_url&&<a href={showcase.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>}</div></section>
        <footer className="footer">Propulsé par Lehnova — Solutions numériques</footer>
      </div>
    </main>
  );
}

