// À placer dans : app/vitrine/[slug]/gerer/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { VITRINE_THEMES } from "../../../../lib/vitrineThemes";

export default function ClientManageVitrinePage() {
  const params = useParams();
  const slug = params?.slug;

  const [showcase, setShowcase] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState("realisation"); // "realisation" | "prestation" | "avant-apres"

  const [items, setItems] = useState([]); // showcase_products (réalisations + prestations)
  const [transformations, setTransformations] = useState([]);
  const [visitCount, setVisitCount] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);

  // --- Réseaux sociaux ---
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [socialsSaving, setSocialsSaving] = useState(false);

  // --- À propos ---
  const [aboutText, setAboutText] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);

  // --- Formulaire réalisation / prestation ---
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  // --- Formulaire avant/après ---
  const [taLabel, setTaLabel] = useState("");
  const [taBeforeFile, setTaBeforeFile] = useState(null);
  const [taAfterFile, setTaAfterFile] = useState(null);
  const [taSaving, setTaSaving] = useState(false);

  const loadShowcase = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: sc, error: scErr } = await supabase.from("showcases").select("*").eq("slug", slug).single();
    if (scErr || !sc) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setShowcase(sc);
    setInstagramUrl(sc.instagram_url || "");
    setFacebookUrl(sc.facebook_url || "");
    setTiktokUrl(sc.tiktok_url || "");
    setAboutText(sc.about_text || "");
    setLoading(false);
    if (typeof window !== "undefined" && sessionStorage.getItem(`vitrine-client-auth-${sc.id}`) === "1") {
      setAuthed(true);
    }
  }, [slug]);

  useEffect(() => {
    loadShowcase();
  }, [loadShowcase]);

  const loadItems = useCallback(async () => {
    if (!supabase || !showcase) return;
    const { data, error } = await supabase
      .from("showcase_products")
      .select("*")
      .eq("showcase_id", showcase.id)
      .order("position", { ascending: true });
    if (error) setLoadError("Impossible de charger : " + error.message);
    else setItems(data || []);
  }, [showcase]);

  const loadTransformations = useCallback(async () => {
    if (!supabase || !showcase) return;
    const { data, error } = await supabase
      .from("showcase_transformations")
      .select("*")
      .eq("showcase_id", showcase.id)
      .order("position", { ascending: true });
    if (error) setLoadError("Impossible de charger l'avant/après : " + error.message);
    else setTransformations(data || []);
  }, [showcase]);

  const loadVisits = useCallback(async () => {
    if (!supabase || !showcase) return;
    const { count } = await supabase
      .from("showcase_visits")
      .select("*", { count: "exact", head: true })
      .eq("showcase_id", showcase.id);
    setVisitCount(typeof count === "number" ? count : 0);
  }, [showcase]);

  useEffect(() => {
    if (authed && showcase) {
      loadItems();
      loadTransformations();
      loadVisits();
    }
  }, [authed, showcase, loadItems, loadTransformations, loadVisits]);

  function handleLogin(e) {
    e.preventDefault();
    if (!showcase?.client_password) {
      setAuthError("L'accès n'est pas encore configuré pour cette page. Contacte Easy Gestion Toulouse.");
      return;
    }
    if (pwd === showcase.client_password) {
      sessionStorage.setItem(`vitrine-client-auth-${showcase.id}`, "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Code incorrect.");
    }
  }

  async function changeTheme(themeKey) {
    if (!supabase || !showcase || themeKey === showcase.theme) return;
    setThemeSaving(true);
    const { error } = await supabase.from("showcases").update({ theme: themeKey }).eq("id", showcase.id);
    if (!error) setShowcase((prev) => ({ ...prev, theme: themeKey }));
    setThemeSaving(false);
  }

  async function handleSaveSocials(e) {
    e.preventDefault();
    if (!supabase || !showcase) return;
    setSocialsSaving(true);
    const { error } = await supabase
      .from("showcases")
      .update({
        instagram_url: instagramUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
      })
      .eq("id", showcase.id);
    setSocialsSaving(false);
    if (error) setLoadError("Enregistrement impossible : " + error.message);
  }

  async function handleSaveAbout(e) {
    e.preventDefault();
    if (!supabase || !showcase) return;
    setAboutSaving(true);
    const { error } = await supabase.from("showcases").update({ about_text: aboutText.trim() || null }).eq("id", showcase.id);
    setAboutSaving(false);
    if (error) setLoadError("Enregistrement impossible : " + error.message);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setCategory("");
    setPhotos([]);
    setPhotoPreviews([]);
    setExistingPhotoUrls([]);
  }

  function startEdit(item) {
    setTab(item.item_type);
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price || "");
    setDescription(item.description || "");
    setCategory(item.category || "");
    setPhotos([]);
    setPhotoPreviews([]);
    const existing = item.photo_urls && item.photo_urls.length > 0 ? item.photo_urls : item.photo_url ? [item.photo_url] : [];
    setExistingPhotoUrls(existing);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewPhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingPhoto(index) {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFile(file) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${showcase.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("vitrine-photos").upload(path, file);
    if (error) return null;
    const { data: pub } = supabase.storage.from("vitrine-photos").getPublicUrl(path);
    return pub?.publicUrl || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !supabase || !showcase) return;
    setSaving(true);

    const uploadedUrls = [];
    for (const file of photos) {
      const url = await uploadFile(file);
      if (url) uploadedUrls.push(url);
    }
    const finalPhotoUrls = [...existingPhotoUrls, ...uploadedUrls];

    const payload = {
      name: name.trim(),
      price: price.trim(),
      description: description.trim(),
      category: category.trim(),
      photo_url: finalPhotoUrls[0] || null,
      photo_urls: finalPhotoUrls,
    };

    if (editingId) {
      const { error } = await supabase.from("showcase_products").update(payload).eq("id", editingId);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { error } = await supabase.from("showcase_products").insert({
        showcase_id: showcase.id,
        item_type: tab === "prestation" ? "prestation" : "realisation",
        position: items.length,
        ...payload,
      });
      if (error) setLoadError("Ajout impossible : " + error.message);
    }

    setSaving(false);
    resetForm();
    loadItems();
  }

  async function handleDelete(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer cet élément ?")) return;
    const { error } = await supabase.from("showcase_products").delete().eq("id", id);
    if (error) setLoadError("Suppression impossible : " + error.message);
    else loadItems();
  }

  async function handleAddTransformation(e) {
    e.preventDefault();
    if (!supabase || !showcase || (!taBeforeFile && !taAfterFile)) return;
    setTaSaving(true);
    const beforeUrl = taBeforeFile ? await uploadFile(taBeforeFile) : null;
    const afterUrl = taAfterFile ? await uploadFile(taAfterFile) : null;
    const { error } = await supabase.from("showcase_transformations").insert({
      showcase_id: showcase.id,
      label: taLabel.trim(),
      before_url: beforeUrl,
      after_url: afterUrl,
      position: transformations.length,
    });
    setTaSaving(false);
    if (error) {
      setLoadError("Ajout impossible : " + error.message);
      return;
    }
    setTaLabel("");
    setTaBeforeFile(null);
    setTaAfterFile(null);
    loadTransformations();
  }

  async function handleDeleteTransformation(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer cette transformation ?")) return;
    const { error } = await supabase.from("showcase_transformations").delete().eq("id", id);
    if (error) setLoadError("Suppression impossible : " + error.message);
    else loadTransformations();
  }

  function vitrineLink() {
    if (typeof window === "undefined" || !showcase) return "";
    return `${window.location.origin}/vitrine/${showcase.slug}`;
  }

  if (notFound) return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Cette page n'existe pas.</p>;
  if (loading) return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Chargement…</p>;

  if (!authed) {
    return (
      <div style={styles.loginPage}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Work+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>
        <form style={styles.loginBox} onSubmit={handleLogin}>
          <p style={styles.loginKicker}>{showcase?.business_name}</p>
          <h1 style={styles.loginTitle}>Gérer ma page</h1>
          <input type="password" placeholder="Code d'accès" value={pwd} onChange={(e) => setPwd(e.target.value)} style={styles.input} autoFocus />
          <button type="submit" style={styles.primaryButton}>
            Entrer
          </button>
          {authError && <p style={{ color: "#B5402D", fontSize: "0.8rem", margin: 0 }}>{authError}</p>}
        </form>
      </div>
    );
  }

  const filteredItems = items.filter((it) => it.item_type === tab);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Work+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>MA PAGE</p>
            <h1 style={styles.title}>{showcase?.business_name}</h1>
          </div>
          <a href={vitrineLink()} target="_blank" rel="noreferrer" style={styles.viewLink}>
            Voir ma page ↗
          </a>
        </header>

        <div style={styles.statBar}>
          <span style={styles.statNum}>{visitCount === null ? "…" : visitCount}</span>
          <span style={styles.statLabel}>vues depuis la mise en ligne</span>
        </div>

        {loadError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{loadError}</p>}

        <section style={styles.themeBlock}>
          <h2 style={styles.blockTitle}>À propos</h2>
          <p style={{ fontSize: "0.75rem", color: "#8A7F66", margin: "6px 0 0" }}>
            Ton expérience, tes diplômes, ce qui te définit — ça apparaît sur ta page juste sous le titre.
          </p>
          <form style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }} onSubmit={handleSaveAbout}>
            <textarea
              style={{ ...styles.textarea, minHeight: "110px" }}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="ex. Diplômée d'un Brevet Professionnel de coiffure, 12 ans d'expérience en salon avant d'ouvrir mon propre espace à Toulouse…"
              rows={4}
            />
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton} disabled={aboutSaving}>
                {aboutSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.themeBlock}>
          <h2 style={styles.blockTitle}>Couleur de ma page</h2>
          <div style={styles.themeRow}>
            {Object.entries(VITRINE_THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => changeTheme(key)}
                disabled={themeSaving}
                style={{ ...styles.themeSwatch, background: theme.swatch, outline: showcase?.theme === key ? "3px solid #1E2A3A" : "3px solid transparent" }}
                title={theme.label}
              />
            ))}
          </div>
        </section>

        <section style={styles.themeBlock}>
          <h2 style={styles.blockTitle}>Réseaux sociaux</h2>
          <form style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }} onSubmit={handleSaveSocials}>
            <label style={styles.label}>
              Instagram
              <input style={styles.input} value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
            </label>
            <label style={styles.label}>
              Facebook
              <input style={styles.input} value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
            </label>
            <label style={styles.label}>
              TikTok
              <input style={styles.input} value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." />
            </label>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryButton} disabled={socialsSaving}>
                {socialsSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>

        <div style={styles.tabs}>
          <button style={{ ...styles.tabBtn, ...(tab === "realisation" ? styles.tabBtnActive : {}) }} onClick={() => { resetForm(); setTab("realisation"); }}>
            Réalisations
          </button>
          <button style={{ ...styles.tabBtn, ...(tab === "prestation" ? styles.tabBtnActive : {}) }} onClick={() => { resetForm(); setTab("prestation"); }}>
            Prestations
          </button>
          <button style={{ ...styles.tabBtn, ...(tab === "avant-apres" ? styles.tabBtnActive : {}) }} onClick={() => { resetForm(); setTab("avant-apres"); }}>
            Avant / Après
          </button>
        </div>

        {(tab === "realisation" || tab === "prestation") && (
          <>
            <form style={styles.form} onSubmit={handleSubmit}>
              <h2 style={styles.blockTitle}>
                {editingId ? "Modifier" : tab === "realisation" ? "Ajouter une réalisation" : "Ajouter une prestation"}
              </h2>
              <div style={styles.formRow2}>
                <label style={styles.label}>
                  Titre
                  <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label style={styles.label}>
                  Prix <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
                  <input style={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ex. dès 45€" />
                </label>
              </div>
              {tab === "realisation" && (
                <label style={styles.label}>
                  Rubrique <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
                  <input style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex. Coloration, Coupe…" />
                </label>
              )}
              <label style={styles.label}>
                Description
                <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </label>
              {tab === "realisation" && (
                <label style={styles.label}>
                  Photos {existingPhotoUrls.length + photoPreviews.length > 0 && `(${existingPhotoUrls.length + photoPreviews.length})`}
                  {(existingPhotoUrls.length > 0 || photoPreviews.length > 0) && (
                    <div style={styles.photoGallery}>
                      {existingPhotoUrls.map((url, i) => (
                        <div style={styles.photoThumbWrap} key={`existing-${i}`}>
                          <img src={url} alt="" style={styles.formPhotoPreview} />
                          <button type="button" style={styles.removePhotoButton} onClick={() => removeExistingPhoto(i)}>✕</button>
                        </div>
                      ))}
                      {photoPreviews.map((url, i) => (
                        <div style={styles.photoThumbWrap} key={`new-${i}`}>
                          <img src={url} alt="" style={styles.formPhotoPreview} />
                          <button type="button" style={styles.removePhotoButton} onClick={() => removeNewPhoto(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handlePhotosChange} style={styles.fileInput} />
                </label>
              )}
              <div style={styles.formActions}>
                {editingId && (
                  <button type="button" style={styles.cancelButton} onClick={resetForm}>
                    Annuler
                  </button>
                )}
                <button type="submit" style={styles.primaryButton} disabled={saving}>
                  {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>

            <h2 style={styles.listTitle}>{tab === "realisation" ? `Mes réalisations (${filteredItems.length})` : `Mes prestations (${filteredItems.length})`}</h2>
            {filteredItems.length === 0 && <p style={{ color: "#8A7F66" }}>Rien pour l'instant.</p>}
            <div style={styles.itemList}>
              {filteredItems.map((it) => (
                <div style={styles.itemRow} key={it.id}>
                  {it.photo_url ? <img src={it.photo_url} alt="" style={styles.thumb} /> : <div style={{ ...styles.thumb, ...styles.thumbEmpty }} />}
                  <div style={styles.itemInfo}>
                    {it.category && <div style={styles.itemCategory}>{it.category}</div>}
                    <strong>{it.name}</strong>
                    {it.price && <span style={styles.itemPrice}> — {it.price}</span>}
                    {it.description && <div style={styles.itemDesc}>{it.description}</div>}
                  </div>
                  <div style={styles.itemActions}>
                    <button style={styles.iconButton} onClick={() => startEdit(it)}>modifier</button>
                    <button style={styles.iconButtonDanger} onClick={() => handleDelete(it.id)}>supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "avant-apres" && (
          <>
            <form style={styles.form} onSubmit={handleAddTransformation}>
              <h2 style={styles.blockTitle}>Ajouter une transformation</h2>
              <label style={styles.label}>
                Titre <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
                <input style={styles.input} value={taLabel} onChange={(e) => setTaLabel(e.target.value)} placeholder="ex. Rénovation façade" />
              </label>
              <div style={styles.formRow2}>
                <label style={styles.label}>
                  Photo "avant"
                  <input type="file" accept="image/*" onChange={(e) => setTaBeforeFile(e.target.files?.[0] || null)} style={styles.fileInput} />
                </label>
                <label style={styles.label}>
                  Photo "après"
                  <input type="file" accept="image/*" onChange={(e) => setTaAfterFile(e.target.files?.[0] || null)} style={styles.fileInput} />
                </label>
              </div>
              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryButton} disabled={taSaving}>
                  {taSaving ? "Enregistrement…" : "Ajouter"}
                </button>
              </div>
            </form>

            <h2 style={styles.listTitle}>Mes avant/après ({transformations.length})</h2>
            {transformations.length === 0 && <p style={{ color: "#8A7F66" }}>Rien pour l'instant.</p>}
            <div style={styles.itemList}>
              {transformations.map((t) => (
                <div style={styles.itemRow} key={t.id}>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    {t.before_url ? <img src={t.before_url} alt="avant" style={{ ...styles.thumb, width: "40px" }} /> : <div style={{ ...styles.thumb, width: "40px", ...styles.thumbEmpty }} />}
                    {t.after_url ? <img src={t.after_url} alt="après" style={{ ...styles.thumb, width: "40px" }} /> : <div style={{ ...styles.thumb, width: "40px", ...styles.thumbEmpty }} />}
                  </div>
                  <div style={styles.itemInfo}>
                    <strong>{t.label || "Transformation"}</strong>
                  </div>
                  <div style={styles.itemActions}>
                    <button style={styles.iconButtonDanger} onClick={() => handleDeleteTransformation(t.id)}>supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  loginPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFE9DA", fontFamily: "'Work Sans', sans-serif" },
  loginBox: { background: "#FCFAF2", padding: "28px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", width: "280px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" },
  loginKicker: { fontSize: "0.65rem", letterSpacing: "0.1em", color: "#A6792B", margin: 0, fontWeight: 600, textTransform: "uppercase" },
  loginTitle: { margin: "0 0 6px 0", fontSize: "1.2rem", fontFamily: "'Fraunces', serif", color: "#1E2A3A" },
  page: { minHeight: "100vh", background: "#EFE9DA", fontFamily: "'Work Sans', sans-serif", color: "#2A241D", padding: "24px 16px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "18px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  kicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  title: { fontSize: "1.5rem", fontFamily: "'Fraunces', serif", fontWeight: 600, margin: 0, color: "#1E2A3A" },
  viewLink: { fontSize: "0.8rem", color: "#B5402D", fontWeight: 600, textDecoration: "none" },
  statBar: { display: "flex", alignItems: "baseline", gap: "8px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "12px 16px" },
  statNum: { fontSize: "1.3rem", fontWeight: 700, color: "#B5402D" },
  statLabel: { fontSize: "0.78rem", color: "#8A7F66" },
  themeBlock: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", border: "1px solid #E6DCC2" },
  blockTitle: { fontSize: "1.05rem", fontFamily: "'Fraunces', serif", fontWeight: 600, margin: 0, color: "#1E2A3A" },
  themeRow: { display: "flex", gap: "12px", marginTop: "10px" },
  themeSwatch: { width: "38px", height: "38px", borderRadius: "50%", border: "none", padding: 0 },
  tabs: { display: "flex", gap: "8px", flexWrap: "wrap" },
  tabBtn: { background: "#F1EAD6", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "#5B4636" },
  tabBtnActive: { background: "#1E2A3A", color: "#FCFAF2" },
  form: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #E6DCC2" },
  formRow2: { display: "flex", gap: "12px", flexWrap: "wrap" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636", flex: "1 1 200px" },
  input: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D" },
  textarea: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D", resize: "vertical" },
  fileInput: { fontSize: "0.8rem" },
  formPhotoPreview: { width: "90px", height: "68px", objectFit: "cover", borderRadius: "5px", border: "1px solid #D8CCAB", display: "block" },
  photoGallery: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "6px" },
  photoThumbWrap: { position: "relative" },
  removePhotoButton: { position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", background: "#B5402D", color: "#fff", border: "2px solid #FCFAF2", fontSize: "0.65rem", lineHeight: 1, padding: 0 },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  cancelButton: { background: "none", border: "1px solid #D8CCAB", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636" },
  primaryButton: { background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600 },
  listTitle: { fontSize: "1.2rem", fontFamily: "'Fraunces', serif", fontWeight: 600, margin: "6px 0 0 0", color: "#1E2A3A" },
  itemList: { display: "flex", flexDirection: "column", gap: "10px" },
  itemRow: { display: "flex", alignItems: "center", gap: "10px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "10px 12px" },
  thumb: { width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  thumbEmpty: { background: "#EFE4C8" },
  itemInfo: { flex: 1, fontSize: "0.85rem" },
  itemCategory: { fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A6792B", fontWeight: 600, marginBottom: "2px" },
  itemPrice: { color: "#B5402D", fontWeight: 600 },
  itemDesc: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  itemActions: { display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
};
