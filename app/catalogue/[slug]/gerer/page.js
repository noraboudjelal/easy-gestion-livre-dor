"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function ClientManageCatalogPage() {
  const params = useParams();
  const slug = params?.slug;

  const [catalog, setCatalog] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);

  const loadCatalog = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: cat, error: catErr } = await supabase.from("catalogs").select("*").eq("slug", slug).single();
    if (catErr || !cat) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setCatalog(cat);
    setLoading(false);
    if (typeof window !== "undefined" && sessionStorage.getItem(`catalog-client-auth-${cat.id}`) === "1") {
      setAuthed(true);
    }
  }, [slug]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const loadProducts = useCallback(async () => {
    if (!supabase || !catalog) return;
    const { data: prods, error: prodErr } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("catalog_id", catalog.id)
      .order("position", { ascending: true });
    if (prodErr) {
      setLoadError("Impossible de charger les produits : " + prodErr.message);
    } else {
      setLoadError("");
      setProducts(prods || []);
    }
  }, [catalog]);

  useEffect(() => {
    if (authed && catalog) loadProducts();
  }, [authed, catalog, loadProducts]);

  function handleLogin(e) {
    e.preventDefault();
    if (!catalog?.client_password) {
      setAuthError("L'accès n'est pas encore configuré pour ce catalogue. Contacte Easy Gestion Toulouse.");
      return;
    }
    if (pwd === catalog.client_password) {
      sessionStorage.setItem(`catalog-client-auth-${catalog.id}`, "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Code incorrect.");
    }
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

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price || "");
    setDescription(p.description || "");
    setCategory(p.category || "");
    setPhotos([]);
    setPhotoPreviews([]);
    const existing = p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [];
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !supabase || !catalog) return;
    setSaving(true);

    const uploadedUrls = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${catalog.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("catalog-photos").upload(path, file);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("catalog-photos").getPublicUrl(path);
        if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
      }
    }

    const finalPhotoUrls = [...existingPhotoUrls, ...uploadedUrls];

    if (editingId) {
      const { error } = await supabase
        .from("catalog_products")
        .update({
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          category: category.trim(),
          photo_url: finalPhotoUrls[0] || null,
          photo_urls: finalPhotoUrls,
        })
        .eq("id", editingId);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { error } = await supabase.from("catalog_products").insert({
        catalog_id: catalog.id,
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        category: category.trim(),
        photo_url: finalPhotoUrls[0] || null,
        photo_urls: finalPhotoUrls,
        position: products.length,
      });
      if (error) setLoadError("Ajout impossible : " + error.message);
    }

    setSaving(false);
    resetForm();
    loadProducts();
  }

  async function handleDelete(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("catalog_products").delete().eq("id", id);
    if (error) {
      setLoadError("Suppression impossible : " + error.message);
    } else {
      loadProducts();
    }
  }

  async function moveProduct(index, direction) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length || !supabase) return;
    const current = products[index];
    const target = products[targetIndex];
    setReorderingId(current.id);

    await Promise.all([
      supabase.from("catalog_products").update({ position: target.position }).eq("id", current.id),
      supabase.from("catalog_products").update({ position: current.position }).eq("id", target.id),
    ]);

    setReorderingId(null);
    loadProducts();
  }

  function catalogLink() {
    if (typeof window === "undefined" || !catalog) return "";
    return `${window.location.origin}/catalogue/${catalog.slug}`;
  }

  if (notFound) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Ce catalogue n'existe pas.</p>;
  }
  if (loading) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Chargement…</p>;
  }

  if (!authed) {
    return (
      <div style={styles.loginPage}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>
        <form style={styles.loginBox} onSubmit={handleLogin}>
          <p style={styles.loginKicker}>{catalog?.catalog_title}</p>
          <h1 style={styles.loginTitle}>Gérer mon catalogue</h1>
          <input
            type="password"
            placeholder="Code d'accès"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.primaryButton}>
            Entrer
          </button>
          {authError && <p style={{ color: "#B5402D", fontSize: "0.8rem", margin: 0 }}>{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>MON CATALOGUE</p>
            <h1 style={styles.title}>{catalog?.catalog_title}</h1>
          </div>
          <a href={catalogLink()} target="_blank" rel="noreferrer" style={styles.viewLink}>
            Voir mon catalogue en ligne ↗
          </a>
        </header>

        {loadError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{loadError}</p>}

        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.formTitle}>{editingId ? "Modifier le produit" : "Ajouter un produit"}</h2>
          <div style={styles.formRow2}>
            <label style={styles.label}>
              Nom du produit
              <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label style={styles.label}>
              Prix
              <input style={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ex. 15€" />
            </label>
          </div>
          <label style={styles.label}>
            Rubrique <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
            <input
              style={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ex. Entrées, Plats…"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {[...new Set(products.map((p) => p.category).filter(Boolean))].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label style={styles.label}>
            Description
            <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <label style={styles.label}>
            Photos {existingPhotoUrls.length + photoPreviews.length > 0 && `(${existingPhotoUrls.length + photoPreviews.length})`}
            {(existingPhotoUrls.length > 0 || photoPreviews.length > 0) && (
              <div style={styles.photoGallery}>
                {existingPhotoUrls.map((url, i) => (
                  <div style={styles.photoThumbWrap} key={`existing-${i}`}>
                    <img src={url} alt="" style={styles.formPhotoPreview} />
                    <button type="button" style={styles.removePhotoButton} onClick={() => removeExistingPhoto(i)}>
                      ✕
                    </button>
                  </div>
                ))}
                {photoPreviews.map((url, i) => (
                  <div style={styles.photoThumbWrap} key={`new-${i}`}>
                    <img src={url} alt="" style={styles.formPhotoPreview} />
                    <button type="button" style={styles.removePhotoButton} onClick={() => removeNewPhoto(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handlePhotosChange} style={styles.fileInput} />
          </label>
          <div style={styles.formActions}>
            {editingId && (
              <button type="button" style={styles.cancelButton} onClick={resetForm}>
                Annuler
              </button>
            )}
            <button type="submit" style={styles.primaryButton} disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter au catalogue"}
            </button>
          </div>
        </form>

        <h2 style={styles.listTitle}>Mes produits ({products.length})</h2>

        {products.length === 0 && <p style={{ color: "#8A7F66" }}>Aucun produit pour l'instant.</p>}

        <div style={styles.productList}>
          {products.map((p, i) => (
            <div style={styles.productRow} key={p.id}>
              <div style={styles.reorderButtons}>
                <button
                  style={styles.reorderButton}
                  onClick={() => moveProduct(i, "up")}
                  disabled={i === 0 || reorderingId === p.id}
                  aria-label="Monter"
                >
                  ▲
                </button>
                <button
                  style={styles.reorderButton}
                  onClick={() => moveProduct(i, "down")}
                  disabled={i === products.length - 1 || reorderingId === p.id}
                  aria-label="Descendre"
                >
                  ▼
                </button>
              </div>
              {p.photo_url ? <img src={p.photo_url} alt="" style={styles.thumb} /> : <div style={{ ...styles.thumb, ...styles.thumbEmpty }} />}
              <div style={styles.productInfo}>
                {p.category && <div style={styles.productCategory}>{p.category}</div>}
                <strong>{p.name}</strong>
                {p.price && <span style={styles.productPrice}> — {p.price}</span>}
                {p.description && <div style={styles.productDesc}>{p.description}</div>}
              </div>
              <div style={styles.productActions}>
                <button style={styles.iconButton} onClick={() => startEdit(p)}>
                  modifier
                </button>
                <button style={styles.iconButtonDanger} onClick={() => handleDelete(p.id)}>
                  supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFE9DA", fontFamily: "'Inter', sans-serif" },
  loginBox: { background: "#FCFAF2", padding: "28px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", width: "280px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" },
  loginKicker: { fontSize: "0.65rem", letterSpacing: "0.1em", color: "#A6792B", margin: 0, fontWeight: 600, textTransform: "uppercase" },
  loginTitle: { margin: "0 0 6px 0", fontSize: "1.2rem", color: "#1E2A3A" },
  page: { minHeight: "100vh", background: "#EFE9DA", fontFamily: "'Inter', sans-serif", color: "#2A241D", padding: "24px 16px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "18px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  kicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  title: { fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#1E2A3A" },
  viewLink: { fontSize: "0.8rem", color: "#B5402D", fontWeight: 600, textDecoration: "none" },
  form: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #E6DCC2" },
  formTitle: { fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#1E2A3A" },
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
  listTitle: { fontSize: "1.2rem", fontWeight: 700, margin: "6px 0 0 0", color: "#1E2A3A" },
  productList: { display: "flex", flexDirection: "column", gap: "10px" },
  productRow: { display: "flex", alignItems: "center", gap: "10px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "10px 12px" },
  reorderButtons: { display: "flex", flexDirection: "column", gap: "2px" },
  reorderButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", width: "22px", height: "18px", fontSize: "0.55rem", padding: 0 },
  thumb: { width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  thumbEmpty: { background: "#EFE4C8" },
  productInfo: { flex: 1, fontSize: "0.85rem" },
  productCategory: { fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A6792B", fontWeight: 600, marginBottom: "2px" },
  productPrice: { color: "#B5402D", fontWeight: 600 },
  productDesc: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  productActions: { display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
};
