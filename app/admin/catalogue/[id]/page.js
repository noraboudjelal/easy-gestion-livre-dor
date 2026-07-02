"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function ManageCatalogPage() {
  const params = useParams();
  const catalogId = params?.id;

  const [authed, setAuthed] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ld-admin-ok") === "1") {
      setAuthed(true);
    }
  }, []);

  const load = useCallback(async () => {
    if (!supabase || !catalogId) return;
    setLoading(true);
    const { data: cat, error: catErr } = await supabase
      .from("catalogs")
      .select("*")
      .eq("id", catalogId)
      .single();
    if (catErr || !cat) {
      setLoadError("Catalogue introuvable.");
      setLoading(false);
      return;
    }
    setCatalog(cat);

    const { data: prods, error: prodErr } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("catalog_id", catalogId)
      .order("position", { ascending: true });

    if (prodErr) {
      setLoadError("Impossible de charger les produits : " + prodErr.message);
    } else {
      setLoadError("");
      setProducts(prods || []);
    }
    setLoading(false);
  }, [catalogId]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setPhoto(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price || "");
    setDescription(p.description || "");
    setPhoto(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(p.photo_url || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !supabase) return;
    setSaving(true);

    let photoUrl = existingPhotoUrl;
    if (photo) {
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${catalogId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("catalog-photos").upload(path, photo);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("catalog-photos").getPublicUrl(path);
        photoUrl = pub?.publicUrl || photoUrl;
      }
    }

    if (editingId) {
      const { error } = await supabase
        .from("catalog_products")
        .update({
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          photo_url: photoUrl,
        })
        .eq("id", editingId);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { error } = await supabase.from("catalog_products").insert({
        catalog_id: catalogId,
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        photo_url: photoUrl,
        position: products.length,
      });
      if (error) setLoadError("Ajout impossible : " + error.message);
    }

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer ce produit du catalogue ?")) return;
    const { error } = await supabase.from("catalog_products").delete().eq("id", id);
    if (error) {
      setLoadError("Suppression impossible : " + error.message);
    } else {
      load();
    }
  }

  function linkFor() {
    if (typeof window === "undefined" || !catalog) return "";
    return `${window.location.origin}/catalogue/${catalog.slug}`;
  }

  function handleCopy() {
    const text = linkFor();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!authed) {
    return (
      <div style={styles.page}>
        <p style={{ fontFamily: "system-ui, sans-serif" }}>
          Connecte-toi d'abord sur <a href="/admin">/admin</a>.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <a href="/admin" style={styles.backLink}>← Retour aux livres d'or / catalogues</a>

        <header style={styles.header}>
          <div>
            <p style={styles.brandKicker}>EASY GESTION TOULOUSE</p>
            <h1 style={styles.brandTitle}>{loading ? "…" : catalog?.catalog_title}</h1>
          </div>
        </header>

        {catalog && (
          <div style={styles.linkBox}>
            <span style={styles.linkText}>{linkFor()}</span>
            <button style={styles.iconButton} onClick={handleCopy}>
              {copied ? "✓ copié" : "copier le lien"}
            </button>
          </div>
        )}

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
            Description
            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </label>
          <label style={styles.label}>
            Photo
            {(photoPreview || existingPhotoUrl) && (
              <img src={photoPreview || existingPhotoUrl} alt="" style={styles.formPhotoPreview} />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={styles.fileInput} />
          </label>
          <div style={styles.formActions}>
            {editingId && (
              <button type="button" style={styles.cancelButton} onClick={resetForm}>
                Annuler
              </button>
            )}
            <button type="submit" style={styles.newButton} disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter au catalogue"}
            </button>
          </div>
        </form>

        <h2 style={styles.listTitle}>Produits ({products.length})</h2>

        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}
        {!loading && products.length === 0 && (
          <p style={{ color: "#8A7F66" }}>Aucun produit pour l'instant — ajoute le premier ci-dessus.</p>
        )}

        <div style={styles.productList}>
          {products.map((p) => (
            <div style={styles.productRow} key={p.id}>
              {p.photo_url ? (
                <img src={p.photo_url} alt="" style={styles.thumb} />
              ) : (
                <div style={{ ...styles.thumb, ...styles.thumbEmpty }} />
              )}
              <div style={styles.productInfo}>
                <strong>{p.name}</strong>
                {p.price && <span style={styles.productPrice}> — {p.price}</span>}
                {p.description && <div style={styles.productDesc}>{p.description}</div>}
              </div>
              <div style={styles.productActions}>
                <button style={styles.iconButton} onClick={() => startEdit(p)}>modifier</button>
                <button style={styles.iconButtonDanger} onClick={() => handleDelete(p.id)}>supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#EFE9DA", fontFamily: "'Inter', sans-serif", color: "#2A241D", padding: "24px 16px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "18px" },
  backLink: { fontSize: "0.8rem", color: "#5B4636", textDecoration: "none" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  brandKicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  brandTitle: { fontFamily: "'Caveat', cursive", fontSize: "2rem", fontWeight: 700, margin: 0, color: "#1E2A3A" },
  linkBox: { display: "flex", alignItems: "center", gap: "8px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "6px", padding: "8px 12px", flexWrap: "wrap" },
  linkText: { fontSize: "0.75rem", color: "#1E2A3A", fontFamily: "monospace", wordBreak: "break-all" },
  form: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #E6DCC2" },
  formTitle: { fontFamily: "'Caveat', cursive", fontSize: "1.5rem", margin: 0, color: "#1E2A3A" },
  formRow2: { display: "flex", gap: "12px", flexWrap: "wrap" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636", flex: "1 1 200px" },
  input: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D" },
  textarea: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D", resize: "vertical" },
  fileInput: { fontSize: "0.8rem" },
  formPhotoPreview: { width: "120px", height: "90px", objectFit: "cover", borderRadius: "5px", border: "1px solid #D8CCAB", marginBottom: "6px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  cancelButton: { background: "none", border: "1px solid #D8CCAB", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636" },
  newButton: { background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600 },
  listTitle: { fontFamily: "'Caveat', cursive", fontSize: "1.6rem", margin: "6px 0 0 0", color: "#1E2A3A" },
  productList: { display: "flex", flexDirection: "column", gap: "10px" },
  productRow: { display: "flex", alignItems: "center", gap: "12px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "10px 12px" },
  thumb: { width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  thumbEmpty: { background: "#EFE4C8" },
  productInfo: { flex: 1, fontSize: "0.85rem" },
  productPrice: { color: "#B5402D", fontWeight: 600 },
  productDesc: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  productActions: { display: "flex", gap: "6px", flexShrink: 0 },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
};
