"use client";
import { useEffect, useState } from "react";

const imageOf = (p) => p.photo_urls?.[0] || p.photo_url || "";
const safeLink = (url) => /^https?:\/\//i.test(url || "") ? url : null;
const slug = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function ShowroomView({ catalog, products = [], transformations = [] }) {
  const [selected, setSelected] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const accent = catalog.accent_color || "#85745E";
  const groups = [...new Set(products.map(p => p.category?.trim() || "Collections"))];
  const contact = safeLink(catalog.instagram_url) || safeLink(catalog.facebook_url);
  const contactLabel = safeLink(catalog.instagram_url) ? "Écrire sur Instagram" : "Nous contacter";
  const gallery = selected ? (selected.photo_urls?.length ? selected.photo_urls : [selected.photo_url]).filter(Boolean) : [];
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setSelected(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const openProduct = (p) => { setSelected(p); setPhotoIndex(0); };

  return <main className="premium-showroom" style={{"--accent":accent}}>
    <style>{`
      .premium-showroom{font-family:Arial,Helvetica,sans-serif;background:#faf9f6;color:#282722;min-height:100vh}
      .premium-showroom *{box-sizing:border-box}.premium-showroom a{color:inherit}
      .premium-showroom .wrap{max-width:1220px;margin:auto;padding:0 28px}
      .premium-showroom .top{background:#fdfcf9;border-bottom:1px solid #e9e5dd}
      .premium-showroom .top .wrap{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px}
      .premium-showroom .brand{font:500 19px Georgia,serif;letter-spacing:.02em;overflow-wrap:anywhere}
      .premium-showroom .toplink{font-size:11px;text-transform:uppercase;letter-spacing:1.8px;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:5px;white-space:nowrap}
      .premium-showroom .hero{position:relative;min-height:620px;background:#37342e center/cover no-repeat;display:flex;align-items:end;color:white}
      .premium-showroom .hero:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,21,19,.76),rgba(22,21,19,.17)),linear-gradient(0deg,rgba(20,19,18,.5),transparent 65%)}
      .premium-showroom .hero-inner{position:relative;width:100%;padding-top:100px;padding-bottom:90px}
      .premium-showroom .eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600}
      .premium-showroom h1,.premium-showroom h2,.premium-showroom h3{font-family:Georgia,"Times New Roman",serif;font-weight:400}
      .premium-showroom h1{font-size:clamp(42px,6vw,86px);line-height:1.06;max-width:760px;margin:22px 0;overflow-wrap:anywhere}
      .premium-showroom .hero p{max-width:500px;line-height:1.8;font-size:16px;color:#eee8df}
      .premium-showroom .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--accent);color:white;text-decoration:none;border:1px solid var(--accent);padding:17px 24px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;cursor:pointer}
      .premium-showroom .hero .btn{margin-top:20px;background:#f8f6f0;border-color:#f8f6f0;color:#282722}
      .premium-showroom .section{padding:88px 0}.premium-showroom .section-alt{background:#efede7}
      .premium-showroom .section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:36px}
      .premium-showroom h2{font-size:clamp(35px,4vw,56px);margin:12px 0;line-height:1.12}
      .premium-showroom .muted{color:#6c695f;line-height:1.8;max-width:590px}
      .premium-showroom .category-nav{display:flex;gap:9px;overflow-x:auto;padding:0 0 20px;scrollbar-width:thin}
      .premium-showroom .category-nav a{border:1px solid #d7d2c7;text-decoration:none;white-space:nowrap;padding:12px 18px;font-size:12px;letter-spacing:.5px}
      .premium-showroom .category-title{font-size:29px;margin:38px 0 24px}
      .premium-showroom .product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}
      .premium-showroom .product{padding:0;border:0;background:none;text-align:left;cursor:pointer;color:inherit;font:inherit;min-width:0}
      .premium-showroom .photo-frame{aspect-ratio:4/5;background:#e9e6de;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#777168}
      .premium-showroom .photo-frame img{width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
      .premium-showroom .product:hover img{transform:scale(1.045)}
      .premium-showroom .product-info{padding:18px 2px 4px}
      .premium-showroom .product-info h3{font-size:23px;margin:8px 0;line-height:1.3}
      .premium-showroom .product-info small{color:#847c6d;font-size:10px;letter-spacing:1.8px;text-transform:uppercase}
      .premium-showroom .product-info .price{font-size:13px;color:#59544b}
      .premium-showroom .portfolio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
      .premium-showroom .portfolio img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
      .premium-showroom .before-after{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
      .premium-showroom .transformation{background:#fff;padding:12px}
      .premium-showroom .pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .premium-showroom .pair figure{margin:0}.premium-showroom .pair img{width:100%;aspect-ratio:3/4;object-fit:cover}
      .premium-showroom .pair figcaption{padding:8px 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase}
      .premium-showroom .transformation p{padding:0 8px;font-family:Georgia,serif;font-size:20px}
      .premium-showroom .footer{background:#292822;color:#fff;text-align:center;padding:92px 20px}
      .premium-showroom .footer h2{max-width:720px;margin:20px auto;font-size:clamp(40px,5vw,65px)}
      .premium-showroom .footer p{color:#d1cec5;line-height:1.8}
      .premium-showroom .footer-links{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:30px 0}
      .premium-showroom .footer-links a{border:1px solid #8a867c;padding:13px 18px;text-decoration:none;font-size:12px}
      .premium-showroom .credit{font-size:11px;opacity:.55;margin-top:52px}
      .premium-showroom .overlay{position:fixed;z-index:1000;inset:0;background:rgba(16,15,13,.8);display:flex;align-items:center;justify-content:center;padding:20px}
      .premium-showroom .dialog{background:#faf9f6;width:min(920px,100%);max-height:94vh;overflow-y:auto;position:relative;padding:30px}
      .premium-showroom .close{position:absolute;right:16px;top:14px;border:0;background:#e9e6df;padding:11px 15px;cursor:pointer}
      .premium-showroom .dialog-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:32px;align-items:center}
      .premium-showroom .dialog-img{width:100%;max-height:60vh;aspect-ratio:4/5;object-fit:contain;background:#e9e6df}
      .premium-showroom .gallery-controls{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
      .premium-showroom .gallery-controls button{border:1px solid #d7d2c7;background:transparent;padding:10px 15px;cursor:pointer}
      .premium-showroom .dialog h2{font-size:38px}
      .premium-showroom .dialog p{white-space:pre-wrap;line-height:1.8;color:#69655c}
      @media(max-width:760px){.premium-showroom .wrap{padding:0 19px}.premium-showroom .top .wrap{min-height:64px}.premium-showroom .brand{font-size:16px}.premium-showroom .hero{min-height:540px}.premium-showroom .hero-inner{padding-top:70px;padding-bottom:70px}.premium-showroom .section{padding:62px 0}.premium-showroom .section-head{display:block}.premium-showroom .product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.premium-showroom .product-info h3{font-size:18px}.premium-showroom .portfolio{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.premium-showroom .before-after{grid-template-columns:1fr}.premium-showroom .dialog{padding:22px}.premium-showroom .dialog-grid{grid-template-columns:1fr;gap:12px}.premium-showroom .dialog-img{max-height:42vh}}
      @media(prefers-reduced-motion:reduce){.premium-showroom .photo-frame img{transition:none}}
    `}</style>
    <header className="top"><div className="wrap"><span className="brand">{catalog.client}</span><a className="toplink" href="#collections">Explorer les collections ↗</a></div></header>
    <section className="hero" style={{backgroundImage:catalog.cover_image_url ? `url("${catalog.cover_image_url}")` : "linear-gradient(125deg,#33302a,#958571)"}}>
      <div className="wrap hero-inner"><div className="eyebrow">Collections · Inspirations · Réalisations</div><h1>{catalog.catalog_title || catalog.client}</h1><p>Découvrez des matières, des idées et des réalisations pour imaginer votre prochain projet.</p><a className="btn" href="#collections">Explorer le showroom ↓</a></div>
    </section>
    {catalog.offer_enabled && catalog.offer_title && <section className="section section-alt"><div className="wrap"><span className="eyebrow">À découvrir</span><h2>{catalog.offer_title}</h2>{catalog.offer_text && <p className="muted">{catalog.offer_text}</p>}</div></section>}
    <section className="section" id="collections"><div className="wrap"><div className="section-head"><div><span className="eyebrow">Sélection & savoir-faire</span><h2>Nos collections</h2><p className="muted">Explorez les matières, les finitions et les inspirations.</p></div><span className="eyebrow">{products.length} référence{products.length > 1 ? "s" : ""}</span></div>
      {groups.length > 1 && <nav className="category-nav" aria-label="Catégories">{groups.map((group,i)=><a key={group} href={`#collection-${slug(group)}-${i}`}>{group}</a>)}</nav>}
      {!products.length && <p className="muted">Les premières collections arrivent bientôt.</p>}
      {groups.map((group,i)=><div key={group} id={`collection-${slug(group)}-${i}`}><h3 className="category-title">{group}</h3><div className="product-grid">{products.filter(p=>(p.category?.trim()||"Collections")===group).map(p=><button type="button" className="product" key={p.id} onClick={()=>openProduct(p)} aria-label={`Voir ${p.name}`}><div className="photo-frame">{imageOf(p) ? <img src={imageOf(p)} alt={p.name} loading="lazy"/> : "Photo à venir"}</div><div className="product-info"><small>{group}</small><h3>{p.name}</h3>{p.price && <div className="price">{p.price}</div>}</div></button>)}</div></div>)}
    </div></section>
    {catalog.portfolio_photo_urls?.length > 0 && <section className="section section-alt"><div className="wrap"><span className="eyebrow">Le sens du détail</span><h2>Nos réalisations</h2><p className="muted">Une sélection de projets et d'ambiances.</p><div className="portfolio">{catalog.portfolio_photo_urls.map((url,i)=><img src={url} alt={`Réalisation ${i+1}`} key={i} loading="lazy"/>)}</div></div></section>}
    {transformations.length > 0 && <section className="section"><div className="wrap"><span className="eyebrow">Notre savoir-faire</span><h2>Avant & après</h2><p className="muted">Découvrez la transformation de nos espaces.</p><div className="before-after">{transformations.map(t=><div className="transformation" key={t.id}><div className="pair">{t.before_url && <figure><img src={t.before_url} alt={`Avant : ${t.label || "transformation"}`} loading="lazy"/><figcaption>Avant</figcaption></figure>}{t.after_url && <figure><img src={t.after_url} alt={`Après : ${t.label || "transformation"}`} loading="lazy"/><figcaption>Après</figcaption></figure>}</div>{t.label && <p>{t.label}</p>}</div>)}</div></div></section>}
    <footer className="footer" id="contact"><div className="eyebrow">Votre prochain projet commence ici</div><h2>Imaginons votre projet ensemble.</h2><p>Une question sur une collection ? Contactez directement notre équipe.</p>{contact && <a className="btn" href={contact} target="_blank" rel="noopener noreferrer">{contactLabel} ↗</a>}<div className="footer-links">{safeLink(catalog.instagram_url) && <a href={catalog.instagram_url} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}{safeLink(catalog.facebook_url) && <a href={catalog.facebook_url} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}{safeLink(catalog.google_review_url) && <a href={catalog.google_review_url} target="_blank" rel="noopener noreferrer">Avis Google ↗</a>}</div><div className="credit">Showroom réalisé par Lehnova</div></footer>
    {selected && <div className="overlay" onClick={()=>setSelected(null)} role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-label={selected.name} onClick={e=>e.stopPropagation()}><button className="close" type="button" onClick={()=>setSelected(null)} aria-label="Fermer">✕</button><div className="dialog-grid"><div>{gallery.length > 0 ? <><img className="dialog-img" src={gallery[photoIndex]} alt={`${selected.name} — photo ${photoIndex+1}`}/>{gallery.length > 1 && <div className="gallery-controls"><button type="button" onClick={()=>setPhotoIndex((photoIndex-1+gallery.length)%gallery.length)}>← Précédente</button><span>{photoIndex+1} / {gallery.length}</span><button type="button" onClick={()=>setPhotoIndex((photoIndex+1)%gallery.length)}>Suivante →</button></div>}</> : <div className="photo-frame">Photo à venir</div>}</div><div><span className="eyebrow">{selected.category || "Collection"}</span><h2>{selected.name}</h2>{selected.description && <p>{selected.description}</p>}{selected.price && <p><strong>{selected.price}</strong></p>}{contact && <a className="btn" href={contact} target="_blank" rel="noopener noreferrer">Se renseigner ↗</a>}</div></div></div></div>}
  </main>;
}
