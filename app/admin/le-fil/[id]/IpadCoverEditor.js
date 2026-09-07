"use client";

import { useEffect, useRef, useState } from "react";
import { COVER_STYLES, coverDefaults, drawCover, loadCoverFonts, loadCoverPhoto } from "./ipadCover";
import styles from "./ipadCover.module.css";

export default function IpadCoverEditor({ event }) {
  const [config, setConfig] = useState(() => coverDefaults(event));
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [guides, setGuides] = useState(true);
  const [status, setStatus] = useState("");
  const [customSize, setCustomSize] = useState(false);
  const dialog = useRef(null);
  const canvas = useRef(null);
  const photoRequest = useRef(0);
  const photoUrl = useRef("");
  const thumbs = useRef({});
  const set = (key, value) => { setReady(false); setStatus(""); setConfig((prev) => ({ ...prev, [key]: value })); };
  const validSize = Number.isInteger(config.width) && Number.isInteger(config.height) && config.width >= 1000 && config.height >= config.width && config.width <= 4096 && config.height <= 4096 && config.height / config.width <= 1.6;

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  useEffect(() => () => { photoRequest.current++; if (photoUrl.current) URL.revokeObjectURL(photoUrl.current); }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    if (!validSize || !config.title.trim()) return;
    loadCoverFonts().then(() => {
      if (cancelled || !canvas.current) return;
      drawCover(canvas.current, config, photo);
      COVER_STYLES.forEach(({ id }) => {
        if (thumbs.current[id]) drawCover(thumbs.current[id], { ...config, style: id }, photo, 180, Math.round(180 * config.height / config.width));
      });
      setReady(true);
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [open, config, photo, validSize]);

  async function choosePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 25 * 1024 * 1024) {
      setError("Choisissez une image JPG, PNG ou WebP de moins de 25 Mo."); return;
    }
    const request = ++photoRequest.current;
    const url = URL.createObjectURL(file);
    setPhotoBusy(true); setError("");
    try {
      const loaded = await loadCoverPhoto(url);
      if (request !== photoRequest.current) { URL.revokeObjectURL(url); return; }
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
      photoUrl.current = url;
      setPhoto(loaded); setConfig((prev) => ({ ...prev, photo: url, x: 50, y: 50 }));
      setStatus(loaded.naturalWidth < config.width || loaded.naturalHeight < config.height ? "Cette photo sera agrandie : vérifiez sa netteté dans l’aperçu." : "Photo prête.");
    } catch (e) { URL.revokeObjectURL(url); if (request === photoRequest.current) setError(e.message); }
    finally { if (request === photoRequest.current) setPhotoBusy(false); }
  }

  function removePhoto() {
    photoRequest.current++; setPhotoBusy(false); setPhoto(null);
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = ""; set("photo", ""); setError("");
  }

  async function download() {
    if (!ready || busy || photoBusy) return;
    setBusy(true); setError("");
    try {
      const blob = await new Promise((resolve) => canvas.current.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image trop volumineuse pour cet appareil. Essayez un format plus petit.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `couverture-ipad-${(event.slug || "le-fil").replace(/[^a-z0-9-]/gi, "-")}-${config.style}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setStatus("Image téléchargée. Enregistrez-la dans Photos sur l’iPad, puis choisissez-la comme fond de l’écran verrouillé.");
    } catch (e) { setError(e.message || "Téléchargement impossible. Réessayez."); }
    finally { setBusy(false); }
  }

  return <section id="couverture-ipad" className={styles.section}>
    <div><p className={styles.kicker}>LA PREMIÈRE IMPRESSION</p><h2>Une couverture pour votre borne</h2>
      <p className={styles.help}>Une papeterie numérique assortie à votre événement, à installer sur l’écran verrouillé de l’iPad.</p></div>
    <button className={styles.primary} type="button" onClick={() => setOpen(true)}>Générer la couverture iPad</button>
    <dialog ref={dialog} className={styles.dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="ipad-cover-title">
      <div className={styles.header}><div><p className={styles.kicker}>LE FIL · ATELIER DE COUVERTURE</p><h2 id="ipad-cover-title">L’art de leur souhaiter la bienvenue.</h2></div><button type="button" className={styles.close} aria-label="Fermer l’aperçu" onClick={() => setOpen(false)}>×</button></div>
      <div className={styles.layout}>
        <div className={styles.controls}>
          <fieldset className={styles.fieldset} disabled={busy}><legend>01 — Choisir une composition</legend>
            <div className={styles.styles}>{COVER_STYLES.map((s) => <button type="button" key={s.id} aria-pressed={config.style === s.id} className={`${styles.style} ${config.style === s.id ? styles.selected : ""}`} onClick={() => set("style", s.id)}>
              <canvas ref={(el) => { thumbs.current[s.id] = el; }} aria-hidden="true" /><strong>{s.label}</strong><span>{s.description}</span>
            </button>)}</div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled={busy}><legend>02 — Vos mots</legend>
            <p className={styles.help}>Les noms et la date viennent de l’événement. Vos ajustements ici concernent uniquement la couverture.</p>
            <label>Prénoms / titre de l’événement<input value={config.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></label>
            <div className={styles.two}><label>Mot d’accueil<input value={config.welcome} maxLength={60} onChange={(e) => set("welcome", e.target.value)} /></label><label>Date<input type="date" value={config.date} onChange={(e) => set("date", e.target.value)} /></label></div>
            <label>Signature<input value={config.subtitle} maxLength={90} onChange={(e) => set("subtitle", e.target.value)} /></label>
          </fieldset>
          <fieldset className={styles.fieldset} disabled={busy}><legend>03 — Matières & couleurs</legend>
            <label>Photographie de l’événement<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></label>
            <p className={styles.help}>{config.style === "minimal" ? "Le style Minimal privilégie un fond uni. Votre photo reste disponible pour les deux autres styles." : photo ? "Ajustez le cadrage pour laisser les visages visibles." : "Importez votre photo, ou conservez la composition sur fond coloré."} JPG, PNG ou WebP · 25 Mo maximum.</p>
            {(photo || photoBusy) && <button type="button" className={styles.secondary} onClick={removePhoto}>Retirer la photo</button>}
            {photo && config.style !== "minimal" && <><div className={styles.two}><label>Cadrage horizontal<input type="range" min="0" max="100" value={config.x} onChange={(e) => set("x", Number(e.target.value))} /></label><label>Cadrage vertical<input type="range" min="0" max="100" value={config.y} onChange={(e) => set("y", Number(e.target.value))} /></label></div><label>Douceur du voile · {config.veil} %<input type="range" min="0" max="100" value={config.veil} onChange={(e) => set("veil", Number(e.target.value))} /></label></>}
            <div className={styles.colors}>{[["background", "Fond"], ["ink", "Encre"], ["accent", "Accent"]].map(([key, label]) => <label key={key}>{label}<input type="color" value={config[key]} onChange={(e) => set(key, e.target.value)} /></label>)}</div>
            {config.style === "editorial" && <p className={styles.help}>Le texte ivoire et le dégradé sombre préservent la lisibilité du style Éditorial.</p>}
          </fieldset>
          <fieldset className={styles.fieldset} disabled={busy}><legend>04 — Format de l’écran</legend>
            <label>Dimensions en portrait<select value={customSize ? "custom" : `${config.width}x${config.height}`} onChange={(e) => { if (e.target.value === "custom") { setCustomSize(true); return; } setCustomSize(false); const [width, height] = e.target.value.split("x").map(Number); setReady(false); setConfig((prev) => ({ ...prev, width, height })); }}>
              <option value="2048x2732">2048 × 2732 px</option><option value="1668x2388">1668 × 2388 px</option><option value="1640x2360">1640 × 2360 px</option><option value="1536x2048">1536 × 2048 px</option><option value="custom">Dimensions personnalisées</option>
            </select></label>
            {customSize && <div className={styles.two}>{[["width", "Largeur (px)"], ["height", "Hauteur (px)"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="1000" max="4096" step="1" value={config[key] || ""} onChange={(e) => set(key, Number(e.target.value))} /></label>)}</div>}
            {!validSize && <p role="alert" className={styles.error}>Choisissez un format portrait de 1 000 à 4 096 px, avec une hauteur comprise entre 1 et 1,6 fois la largeur.</p>}
          </fieldset>
        </div>
        <div className={styles.previewPanel}>
          <div className={styles.previewHeading}><span>APERÇU DE VOTRE COUVERTURE</span><span>PNG · HAUTE DÉFINITION</span></div>
          <div className={styles.device} style={{ aspectRatio: `${validSize ? config.width : 2048} / ${validSize ? config.height : 2732}` }}>
            <canvas ref={canvas} aria-label={`Couverture ${config.style} : ${config.welcome}, ${config.title}, ${config.date}, ${config.subtitle}`} role="img" />
            {guides && <div className={styles.clock} aria-hidden="true"><span>Horloge de l’iPad</span><strong>16:09</strong></div>}
            {(!ready || photoBusy) && <div className={styles.pending}>{photoBusy ? "Chargement de la photo…" : !config.title.trim() ? "Renseignez les prénoms pour générer la couverture." : !validSize ? "Vérifiez les dimensions." : "Préparation de la couverture…"}</div>}
          </div>
          <label className={styles.guide}><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />Simuler l’horloge (absente de l’image téléchargée)</label>
          <p className={styles.help}>L’emplacement de l’horloge est indicatif. Vérifiez le cadrage sur l’iPad au moment de définir le fond d’écran.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button type="button" className={styles.primary} disabled={!ready || busy || photoBusy} onClick={download}>{busy ? "Création du PNG…" : "Télécharger la couverture PNG"}</button>
          <p className={styles.status} role="status">{status}</p>
        </div>
      </div>
    </dialog>
  </section>;
}
