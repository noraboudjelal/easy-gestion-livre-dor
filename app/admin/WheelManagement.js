"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOTS, normalizeWheelSlug, wheelBusinessInput } from "../../lib/wheel/configuration.mjs";
import styles from "./wheelManagement.module.css";

function emptyDraft() { return { name: "", slug: "", lots: [...DEFAULT_LOTS] }; }

export default function WheelManagement() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/wheels", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(response.status === 401 ? "Session expirée. Reconnectez-vous à l’espace administrateur." : data.error);
        setBusinesses(data.businesses);
      })
      .catch((error) => { if (error.name !== "AbortError") setError(error.message || "Chargement impossible."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  function newBusiness() {
    setDraft(emptyDraft()); setEditingId(null); setSlugTouched(false); setError(""); setNotice("");
  }

  function editBusiness(business) {
    setDraft({ name: business.name, slug: business.slug, lots: [...business.lots] });
    setEditingId(business.id); setSlugTouched(true); setError(""); setNotice("");
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError(""); setNotice("");
    let input;
    try { input = wheelBusinessInput(draft); } catch (error) { setError(error.message); return; }
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/admin/wheels/${editingId}` : "/api/admin/wheels", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Session expirée. Reconnectez-vous à l’espace administrateur." : data.error);
      const saved = data.business;
      setBusinesses((rows) => editingId ? rows.map((row) => row.id === saved.id ? saved : row) : [saved, ...rows]);
      setEditingId(saved.id); setDraft({ name: saved.name, slug: saved.slug, lots: [...saved.lots] }); setSlugTouched(true);
      setNotice("Roue enregistrée. Le lien public utilise les lots sauvegardés.");
    } catch (error) { setError(error.message || "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  async function copyLink(slug) {
    const link = new URL(`/la-roue/${slug}`, window.location.origin).href;
    try { await navigator.clipboard.writeText(link); setNotice("Lien public copié."); }
    catch { setNotice(`Copiez ce lien : ${link}`); }
  }

  return (
    <section className={styles.section} aria-label="Gestion de La Roue">
      <div className={styles.heading}>
        <p>Un commerce, huit lots et un lien public individuel.</p>
        <button type="button" onClick={newBusiness} disabled={saving}>+ Nouveau commerce</button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p role="status" className={styles.notice}>{notice}</p>
      <form className={styles.form} onSubmit={save}>
        <h2>{editingId ? "Modifier la roue" : "Créer une roue"}</h2>
        <fieldset disabled={loading || saving}>
          <label>Nom du commerce
            <input required maxLength={100} value={draft.name} onChange={(event) => {
              const name = event.target.value;
              setDraft({ ...draft, name, slug: slugTouched ? draft.slug : normalizeWheelSlug(name) });
            }} />
          </label>
          <label>Identifiant / slug
            <input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(event) => {
              setSlugTouched(true); setDraft({ ...draft, slug: event.target.value });
            }} />
          </label>
          <p className={styles.help}>Lien public : /la-roue/{draft.slug || "nom-du-commerce"}{editingId && " · Modifier le slug change le lien public."}</p>
          <div className={styles.lots}>
            {draft.lots.map((lot, index) => <label key={index}>Lot {index + 1}
              <input required maxLength={60} value={lot} onChange={(event) => setDraft({ ...draft, lots: draft.lots.map((text, position) => position === index ? event.target.value : text) })} />
            </label>)}
          </div>
          <button type="submit">{saving ? "Enregistrement…" : "Enregistrer la roue"}</button>
        </fieldset>
      </form>
      <h2>Mes commerces ({businesses.length})</h2>
      {loading && <p>Chargement des roues…</p>}
      {!loading && !businesses.length && <p>Aucune roue créée pour le moment.</p>}
      <div className={styles.list}>
        {businesses.map((business) => <article key={business.id} className={styles.business}>
          <h3>{business.name}</h3>
          <p><a href={`/la-roue/${business.slug}`} target="_blank" rel="noreferrer">/la-roue/{business.slug}</a></p>
          <div className={styles.actions}>
            <button type="button" disabled={saving} onClick={() => editBusiness(business)}>Modifier les lots</button>
            <button type="button" onClick={() => copyLink(business.slug)}>Copier le lien</button>
          </div>
        </article>)}
      </div>
    </section>
  );
}
