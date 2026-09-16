"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import styles from "./ipadCover.module.css";

export default function IpadCoverEditor({ event }) {
  const [coverUrl, setCoverUrl] = useState("");
  const [title, setTitle] = useState(event.event_title || "");
  const [busy, setBusy] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [status, setStatus] = useState("");
  const [titleStatus, setTitleStatus] = useState("");

  useEffect(() => {
    fetch(`/api/admin/events/${event.id}/le-fil`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setCoverUrl(data.cover_image_url || "");
        setTitle(data.event?.event_title || event.event_title || "");
      })
      .catch(() => {});
  }, [event.id, event.event_title]);

  async function saveTitle(e) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) { setTitleStatus("Le titre ne peut pas être vide."); return; }
    setSavingTitle(true); setTitleStatus("");
    try {
      const response = await fetch(`/api/admin/events/${event.id}/le-fil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_title: cleanTitle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      setTitle(data.event_title || cleanTitle);
      setTitleStatus("Titre enregistré ✓");
    } catch (error) {
      setTitleStatus(error.message || "Enregistrement impossible.");
    } finally { setSavingTitle(false); }
  }

  async function saveUrl(url) {
    const response = await fetch(`/api/admin/events/${event.id}/le-fil`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_image_url: url }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
    setCoverUrl(data.cover_image_url || "");
  }

  async function chooseCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setStatus("Choisissez une image."); return; }
    setBusy(true); setStatus("Envoi de la photo…");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${event.id}/covers/fil-cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("guestbook-photos").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Photo indisponible.");
      await saveUrl(data.publicUrl);
      setStatus("Couverture du Fil enregistrée ✓");
    } catch (error) {
      setStatus(error.message || "Impossible d’enregistrer la couverture.");
    } finally { setBusy(false); e.target.value = ""; }
  }

  async function removeCover() {
    setBusy(true); setStatus("");
    try { await saveUrl(""); setStatus("Couverture supprimée."); }
    catch (error) { setStatus(error.message || "Suppression impossible."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <section id="titre-fil" className={styles.section}>
        <div style={{ width: "100%" }}>
          <p className={styles.kicker}>LE FIL</p>
          <h2>Titre de la page</h2>
          <p className={styles.help}>Modifiez ici le titre affiché sur le livre d’or. Exemple : « Baby Shower de Maya & Yasin ».</p>
          <form onSubmit={saveTitle} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Baby Shower de Maya & Yasin"
              style={{ flex: "1 1 300px", minWidth: 0, border: "1px solid #d8c8ae", borderRadius: 12, padding: "12px 14px", fontSize: 16, background: "white" }}
            />
            <button type="submit" className={styles.primary} disabled={savingTitle}>
              {savingTitle ? "Enregistrement…" : "Enregistrer le titre"}
            </button>
          </form>
          {titleStatus && <p className={styles.help} style={{ marginTop: 10 }}>{titleStatus}</p>}
        </div>
      </section>

      <section id="couverture-fil" className={styles.section}>
        <div style={{ width: "100%" }}>
          <p className={styles.kicker}>LE FIL</p>
          <h2>Photo de couverture du Fil</h2>
          <p className={styles.help}>Cette photo apparaît en grand en haut du Fil, derrière le titre de l’événement.</p>
          {coverUrl && <img src={coverUrl} alt="Couverture du Fil" style={{ width: "100%", maxWidth: 520, height: 220, objectFit: "cover", borderRadius: 18, marginTop: 12 }} />}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <label className={styles.primary} style={{ cursor: busy ? "wait" : "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              {busy ? "Enregistrement…" : coverUrl ? "Changer la photo" : "Choisir une photo"}
              <input type="file" accept="image/*" onChange={chooseCover} disabled={busy} style={{ display: "none" }} />
            </label>
            {coverUrl && <button type="button" onClick={removeCover} disabled={busy} style={{ border: "1px solid #d8c8ae", borderRadius: 12, padding: "10px 14px", background: "white", cursor: "pointer" }}>Supprimer</button>}
          </div>
          {status && <p className={styles.help} style={{ marginTop: 10 }}>{status}</p>}
        </div>
      </section>

      <section id="couverture-ipad" className={styles.section}>
        <div>
          <p className={styles.kicker}>LA PREMIÈRE IMPRESSION</p>
          <h2>Écran de veille de la borne</h2>
          <p className={styles.help}>Choisissez la couverture qui s’affichera automatiquement pour cet événement lorsque la borne est au repos.</p>
        </div>
        <a className={styles.primary} href={`/admin/le-fil/${event.id}/ecran-veille`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          Écran de veille / Couverture
        </a>
      </section>
    </>
  );
}
