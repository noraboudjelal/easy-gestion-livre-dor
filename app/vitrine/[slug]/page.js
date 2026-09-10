"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { VITRINE_THEMES, DEFAULT_THEME } from "../../../lib/vitrineThemes";
import ShowcaseAdvisor from "../../../components/ShowcaseAdvisor";

export default function PublicVitrinePage() {
  const params = useParams();
  const slug = params?.slug;
  const [showcase, setShowcase] = useState(null);
  const [realisations, setRealisations] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(true);
  const [active, setActive] = useState("Tout");
  const [portfolioPhotos, setPortfolioPhotos] = useState({});
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
    if (sc.quiz_enabled) {
      const { data: questions } = await supabase.from("quiz_questions")
        .select("*, quiz_options!question_id(*)").eq("showcase_id", sc.id)
        .order("step_order", { ascending: true });
      setQuizQuestions((questions || []).filter((question) => (question.quiz_options || []).length >= 2));
    } else {
      setQuizQuestions([]);
    }
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
  const automaticHeroTags = Array.from(new Set([...realisations.map(r => r.category), ...prestations.map(p => p.category)].filter(Boolean))).slice(0, 4);
  const customHeroTags = Array.isArray(showcase.cover_mentions) ? showcase.cover_mentions.map((tag) => tag.trim()).filter(Boolean) : [];
  const heroTags = customHeroTags.length > 0 ? customHeroTags : automaticHeroTags;
  const heroTitle = showcase.cover_title?.trim() || showcase.business_name;
  const heroTagline = showcase.cover_tagline?.trim() || showcase.tagline || "Portfolio professionnel";
  const customLinks = Array.isArray(showcase.cover_links)
    ? showcase.cover_links.filter((link) => link?.label?.trim() && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(link?.destination || ""))
    : [];
  const coverLinks = customLinks.filter((link) => link.placement !== "below");
  const belowCoverLinks = customLinks.filter((link) => link.placement === "below");

  function handleCoverLinkClick(event, destination) {
    if (!destination.startsWith("#")) return;
    event.preventDefault();
    document.querySelector(destination)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const visible = active === "Tout" ? realisations : realisations.filter(r => r.category === active);
  const cleanPhone = (showcase.phone || "").replace(/\D/g, "");
  const waPhone = (showcase.whatsapp || showcase.phone || "").replace(/\D/g, "").replace(/^0/, "33");

  return (
    <main className="vt">
      <style>{`
        *{box-sizing:border-box}body{margin:0}.vt{--ink:${v["--ink"]};--paper:${v["--paper"]};--bg:${v["--bg"]};--accent:${v["--accent-2"]};min-height:100vh;background:var(--bg);color:var(--ink);font-family:Arial,sans-serif}.wrap{max-width:520px;margin:auto;background:var(--paper);min-height:100vh;box-shadow:0 0 50px rgba(0,0,0,.07)}.hero{min-height:500px;padding:28px 24px 38px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;background:linear-gradient(180deg,rgba(12,10,10,.22),rgba(12,10,10,.82))${heroImage ? `,url('${heroImage}') center/cover` : `,var(--ink)`};text-shadow:0 1px 18px rgba(0,0,0,.22)}.brand{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.badge{border:1px solid rgba(255,255,255,.55);padding:8px 11px;border-radius:999px;background:rgba(0,0,0,.12);backdrop-filter:blur(5px)}.hero h1{font-family:Georgia,serif;font-size:48px;line-height:.98;font-weight:400;margin:0 0 14px}.hero p{font-size:14px;line-height:1.6;max-width:370px;margin:0 0 18px}.hero-tags{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 20px}.hero-tag{font-size:9px;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(255,255,255,.5);background:rgba(0,0,0,.18);backdrop-filter:blur(5px);padding:7px 9px;border-radius:999px}.cta{display:inline-block;background:#fff;color:#241c1b;padding:13px 18px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:700;text-shadow:none}.feature-links{display:grid;gap:12px;padding:18px 16px;background:var(--bg)}.feature-link-card{padding:24px;background:var(--paper);border:1px solid rgba(0,0,0,.09);border-radius:22px;box-shadow:0 8px 24px rgba(0,0,0,.05)}.feature-link-card h2{font-family:Georgia,serif;font-size:28px;line-height:1.08;font-weight:400;margin:0 0 10px}.feature-link-card p{font-size:14px;line-height:1.65;opacity:.7;margin:0 0 15px}.feature-link-card a{display:inline-block;color:var(--ink);font-size:15px;font-weight:700;line-height:1.45;text-decoration:none;border-bottom:1px solid var(--accent)}.section{padding:42px 24px}.eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:8px}.section h2,.contact h2{font-family:Georgia,serif;font-size:31px;font-weight:400;margin:0 0 20px}.about{font-size:14px;line-height:1.75;opacity:.7;margin:0}.filters{display:flex;gap:8px;overflow:auto;padding-bottom:6px;margin-bottom:18px}.filter{border:1px solid rgba(0,0,0,.13);background:var(--paper);border-radius:999px;padding:9px 13px;white-space:nowrap;font-size:12px;color:var(--ink)}.filter.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}#portfolio .portfolio-list{display:flex;flex-direction:column;gap:6px;margin-inline:-12px}#portfolio .portfolio-card{position:relative;min-width:0;aspect-ratio:16/9;overflow:hidden;background:var(--ink)}#portfolio .portfolio-photos{display:flex;width:100%;height:100%;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none}#portfolio .portfolio-photos::-webkit-scrollbar{display:none}#portfolio .portfolio-photo{flex:0 0 100%;min-width:0;height:100%;scroll-snap-align:start;scroll-snap-stop:always}#portfolio .portfolio-photo img{display:block;width:100%;height:100%;object-fit:cover}#portfolio .portfolio-caption{position:absolute;inset:auto 0 0;padding:48px 16px 14px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.68));pointer-events:none;overflow-wrap:anywhere;text-shadow:0 1px 6px rgba(0,0,0,.25)}#portfolio .portfolio-card.has-gallery .portfolio-caption{padding-bottom:32px}#portfolio .portfolio-caption strong{display:block;font-family:Georgia,serif;font-size:clamp(19px,5vw,25px);font-weight:400;line-height:1.15;margin:0 0 5px}#portfolio .portfolio-details{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}#portfolio .portfolio-category{font-size:9px;text-transform:uppercase;letter-spacing:.12em;opacity:.9}#portfolio .portfolio-price{font-size:12px}#portfolio .portfolio-dots{position:absolute;bottom:2px;left:12px;right:12px;display:flex;justify-content:center;flex-wrap:wrap;pointer-events:none}#portfolio .portfolio-dot{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;background:transparent;color:#fff;cursor:pointer;pointer-events:auto}#portfolio .portfolio-dot::before{content:"";width:4px;height:4px;border-radius:50%;background:currentColor;opacity:.45;box-shadow:0 1px 3px rgba(0,0,0,.4)}#portfolio .portfolio-dot[aria-current="true"]::before{opacity:1;width:6px;height:6px}#portfolio .portfolio-photos:focus-visible,#portfolio .portfolio-dot:focus-visible{outline:2px solid #fff;outline-offset:-2px}.prices{background:var(--ink);color:var(--paper)}.prices .eyebrow{color:var(--accent)}.price-row{display:flex;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.13);font-size:14px}.price-row span:last-child{color:var(--accent);white-space:nowrap}.before{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px}.before figure{margin:0;position:relative;aspect-ratio:3/4;overflow:hidden}.before img{width:100%;height:100%;object-fit:cover}.before b{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.55);color:#fff;padding:5px 7px;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.contact{text-align:center;padding:46px 24px 34px;background:var(--bg)}.contact p{font-size:13px;line-height:1.8;opacity:.7}.buttons{display:grid;gap:10px;margin-top:22px}.button{padding:14px 18px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;background:var(--ink);color:var(--paper)}.button.alt{background:var(--paper);color:var(--ink);border:1px solid rgba(0,0,0,.15)}.socials{display:flex;justify-content:center;gap:8px;margin-top:18px}.socials a{font-size:11px;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--accent);padding:4px}.footer{text-align:center;padding:18px;font-size:10px;opacity:.55;border-top:1px solid rgba(0,0,0,.08)}@media(max-width:420px){.hero{min-height:470px}.hero h1{font-size:43px}.feature-links{padding:14px 12px}.feature-link-card{padding:20px;border-radius:18px}.feature-link-card h2{font-size:25px}.section{padding:36px 20px}}
      `}</style>
      <div className="wrap">
        <section className="hero">
          <div className="brand"><span>{showcase.business_name}</span>{showcase.address && <span className="badge">{showcase.address.split(",")[0]}</span>}</div>
          <div>
            <div className="eyebrow" style={{color:"#f3d9d0"}}>{heroTagline}</div>
            <h1>{heroTitle}</h1>
            {showcase.about_text && <p>{showcase.about_text}</p>}
            {heroTags.length > 0 && <div className="hero-tags">{heroTags.map(tag => <span className="hero-tag" key={tag}>{tag}</span>)}</div>}
            {coverLinks.length > 0 && <nav aria-label="Liens de couverture" style={{display:"flex",flexWrap:"wrap",gap:"6px 14px",margin:"0 0 18px"}}>{coverLinks.map((link, index) => <a href={link.destination} onClick={(event) => handleCoverLinkClick(event, link.destination)} key={`${link.label}-${index}`} style={{color:"inherit",fontSize:"clamp(16px, 4vw, 18px)",lineHeight:1.4,textDecoration:"none",borderBottom:"1px solid rgba(255,255,255,.55)"}}>{link.label}</a>)}</nav>}
            {(showcase.booking_url || cleanPhone) && <a className="cta" href={showcase.booking_url || `tel:${cleanPhone}`}>{showcase.booking_url ? "Prendre rendez-vous" : "Nous contacter"}</a>}
          </div>
        </section>

        {belowCoverLinks.length > 0 && <div className="feature-links">{belowCoverLinks.map((link, index) => <section className="feature-link-card" key={`${link.label}-${index}`}>
          {link.eyebrow?.trim() && <div className="eyebrow">{link.eyebrow}</div>}
          <h2>{link.title?.trim() || link.label}</h2>
          {link.description?.trim() && <p>{link.description}</p>}
          <a href={link.destination} onClick={(event) => handleCoverLinkClick(event, link.destination)}>{link.label}</a>
        </section>)}</div>}

        {showcase.quiz_enabled && showQuiz && quizQuestions.length > 0 && <section style={{padding:"18px 16px",background:v["--bg"]}}>
          <ShowcaseAdvisor questions={quizQuestions} prestations={prestations} accent={v["--accent-2"]} onDone={() => setShowQuiz(false)} />
        </section>}

        {showcase.about_text && <section className="section"><div className="eyebrow">À propos</div><h2>Bienvenue</h2><p className="about">{showcase.about_text}</p></section>}
        <section className="section" id="portfolio">
          <div className="eyebrow">Portfolio</div><h2>Nos réalisations</h2>
          {categories.length > 1 && <div className="filters">{categories.map(c => <button key={c} className={`filter ${active===c?"on":""}`} onClick={()=>{if(active!==c){setActive(c);setPortfolioPhotos({});}}}>{c}</button>)}</div>}
          {visible.length ? <div className="portfolio-list">{visible.map(r => {
            const photos = Array.isArray(r.photo_urls) ? r.photo_urls.filter(url => typeof url === "string" && url.trim()) : [];
            const images = photos.length ? photos : r.photo_url ? [r.photo_url] : [];
            const currentPhoto = Math.min(portfolioPhotos[r.id] || 0, Math.max(0, images.length - 1));
            return <article className={`portfolio-card ${images.length > 1 ? "has-gallery" : ""}`} key={`${active}-${r.id}`}>
              {images.length > 0 && <div className="portfolio-photos" tabIndex={images.length > 1 ? 0 : undefined} role={images.length > 1 ? "region" : undefined} aria-label={images.length > 1 ? `Photos de ${r.name || "la réalisation"}` : undefined}
                onScroll={event => {
                  const track = event.currentTarget;
                  const index = Math.max(0, Math.min(images.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
                  setPortfolioPhotos(previous => previous[r.id] === index ? previous : { ...previous, [r.id]: index });
                }}>
                {images.map((image, index) => <div className="portfolio-photo" key={`${image}-${index}`}><img src={image} alt={`${r.name || "Réalisation"}${images.length > 1 ? ` — photo ${index + 1} sur ${images.length}` : ""}`} loading="lazy" draggable={false}/></div>)}
              </div>}
              <div className="portfolio-caption">{r.name && <strong>{r.name}</strong>}<div className="portfolio-details">{r.category && <span className="portfolio-category">{r.category}</span>}{r.price != null && r.price !== "" && <span className="portfolio-price">{r.price}</span>}</div></div>
              {images.length > 1 && <div className="portfolio-dots" aria-label="Choisir une photo">{images.map((image, index) => <button type="button" className="portfolio-dot" key={`${image}-${index}`} aria-label={`Voir la photo ${index + 1} de ${r.name || "la réalisation"}`} aria-current={currentPhoto === index ? "true" : "false"} onClick={event => {
                const track = event.currentTarget.closest("article").querySelector(".portfolio-photos");
                track.scrollTo({ left: index * track.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
              }}/>)}</div>}
            </article>;
          })}</div> : <p className="about">Les réalisations arrivent bientôt.</p>}
        </section>
        {prestations.length > 0 && <section className="section prices" id="prestations"><div className="eyebrow">Prestations</div><h2>Ce que nous proposons</h2>{prestations.map(p=><div className="price-row" key={p.id}><span>{p.name}{p.description&&<small style={{display:"block",opacity:.6,marginTop:4}}>{p.description}</small>}</span><span>{p.price||"Sur devis"}</span></div>)}</section>}
        {transformations.length > 0 && <section className="section" id="avant-apres"><div className="eyebrow">Transformations</div><h2>Avant / Après</h2>{transformations.map(t=><div key={t.id} style={{marginBottom:24}}>{t.label&&<p className="about" style={{marginBottom:8}}>{t.label}</p>}<div className="before"><figure>{t.before_url&&<img src={t.before_url} alt="Avant"/>}<b>Avant</b></figure><figure>{t.after_url&&<img src={t.after_url} alt="Après"/>}<b>Après</b></figure></div></div>)}</section>}
        <section className="contact" id="contact"><div className="eyebrow">Contact</div><h2>On prend rendez-vous ?</h2>{(showcase.hours_text||showcase.address)&&<p>{showcase.hours_text}{showcase.hours_text&&showcase.address&&<br/>}{showcase.address}</p>}<div className="buttons">{showcase.booking_url&&<a className="button" href={showcase.booking_url} target="_blank" rel="noreferrer">Prendre rendez-vous</a>}{cleanPhone&&<a className="button" href={`tel:${cleanPhone}`}>Appeler</a>}{waPhone&&<a className="button alt" href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">WhatsApp</a>}</div><div className="socials">{showcase.instagram_url&&<a href={showcase.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}{showcase.facebook_url&&<a href={showcase.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}{showcase.tiktok_url&&<a href={showcase.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>}</div></section>
        <footer className="footer">Propulsé par Lehnova — Solutions numériques</footer>
      </div>
    </main>
  );
}


