// À placer dans : app/admin/ma-vitrine/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { VITRINE_THEMES } from "../../../lib/vitrineThemes";

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function shortCode() {
  return Math.random().toString(36).slice(2, 6);
}
function clientAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function AdminMaVitrinePage() {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("Connexion à Supabase non configurée.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("showcases")
      .select("*, showcase_products(count)")
      .order("created_at", { ascending: false });
    if (error) setError("Impossible de charger les vitrines : " + error.message);
    else {
      setError("");
      setShowcases(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!businessName.trim() || !supabase) return;
    setCreating(true);
    const slug = `${slugify(businessName)}-${shortCode()}`;
    const { error } = await supabase.from("showcases").insert({
      slug,
      business_name: businessName.trim(),
      tagline: tagline.trim() || null,
      client_password: clientAccessCode(),
      theme: "coiffure",
    });
    setCreating(false);
    if (error) {
      setError("Création impossible : " + error.message);
      return;
    }
    setBusinessName("");
    setTagline("");
    setShowForm(false);
    load();
  }

  async function handleRegenerateCode(id) {
    if (!supabase) return;
    const newCode = clientAccessCode();
    const { error } = await supabase.from("showcases").update({ client_password: newCode }).eq("id", id);
    if (error) setError("Impossible de régénérer le code : " + error.message);
    else load();
  }

  async function handleDelete(id, name) {
    if (!supabase) return;
    if (!window.confirm(`Supprimer la vitrine de "${name}" ? Cette action est définitive.`)) return;
    const { error } = await supabase.from("showcases").delete().eq("id", id);
    if (error) setError("Suppression impossible : " + error.message);
    else load();
  }

  function publicLink(slug) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vitrine/${slug}`;
  }
  function manageLink(slug) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vitrine/${slug}/gerer`;
  }

  function handleCopy(id, slug) {
    navigator.clipboard.writeText(publicLink(slug));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; } button { cursor: pointer; font-family: inherit; }`}</style>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>ADMIN</p>
            <h1 style={styles.title}>Ma Vitrine — mes clients</h1>
          </div>
          <button style={styles.newButton} onClick={() => setShowForm(true)}>
            + Nouvelle vitrine
          </button>
        </header>

        <div style={styles.statBox}>
          <span style={styles.statNumber}>{showcases.length}</span>
          <span style={styles.statLabel}>Vitrines actives</span>
        </div>

        {error && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{error}</p>}
        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

        {showForm && (
          <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
              <h2 style={styles.modalTitle}>Créer une vitrine</h2>
              <label style={styles.label}>
                Nom du client / commerce
                <input style={styles.input} value={businessName} onChange={(e) => setBusinessName(e.target.value)} required autoFocus />
              </label>
              <label style={styles.label}>
                Accroche <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
                <input style={styles.input} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="ex. Coiffure & stylisme" />
              </label>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.primaryButton} disabled={creating}>
                  {creating ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={styles.list}>
          {showcases.map((sc) => (
            <div style={styles.row} key={sc.id}>
              <div style={{ ...styles.themeDot, background: VITRINE_THEMES[sc.theme]?.swatch || "#B08D4F" }} />
              <div style={styles.rowInfo}>
                <strong>{sc.business_name}</strong>
                <div style={styles.rowMeta}>
                  {sc.showcase_products?.[0]?.count ?? 0} réalisation(s) · code : {sc.client_password}
                </div>
              </div>
              <div style={styles.rowActions}>
                <a href={manageLink(sc.slug)} target="_blank" rel="noreferrer" style={styles.iconButton}>
                  gérer
                </a>
                <button style={styles.iconButton} onClick={() => handleCopy(sc.id, sc.slug)}>
                  {copiedId === sc.id ? "copié ✓" : "copier le lien"}
                </button>
                <button style={styles.iconButton} onClick={() => handleRegenerateCode(sc.id)}>
                  nouveau code
                </button>
                <button style={styles.iconButtonDanger} onClick={() => handleDelete(sc.id, sc.business_name)}>
                  supprimer
                </button>
              </div>
            </div>
          ))}
          {!loading && showcases.length === 0 && <p style={{ color: "#8A7F66" }}>Aucune vitrine pour l'instant.</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#EFE9DA", fontFamily: "'Inter', sans-serif", color: "#2A241D", padding: "24px 16px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "760px", display: "flex", flexDirection: "column", gap: "18px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  kicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  title: { fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#1E2A3A" },
  newButton: { background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600 },
  statBox: { display: "flex", flexDirection: "column", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "14px 16px", width: "160px" },
  statNumber: { fontSize: "1.6rem", fontWeight: 700, color: "#1E2A3A" },
  statLabel: { fontSize: "0.75rem", color: "#8A7F66" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" },
  modal: { background: "#FCFAF2", borderRadius: "12px", padding: "22px", width: "320px", display: "flex", flexDirection: "column", gap: "12px" },
  modalTitle: { margin: 0, fontSize: "1.1rem", color: "#1E2A3A" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636" },
  input: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D" },
  cancelButton: { background: "none", border: "1px solid #D8CCAB", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636" },
  primaryButton: { background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600 },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  row: { display: "flex", alignItems: "center", gap: "12px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "12px 14px", flexWrap: "wrap" },
  themeDot: { width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0 },
  rowInfo: { flex: "1 1 160px", fontSize: "0.85rem" },
  rowMeta: { fontSize: "0.72rem", color: "#8A7F66", marginTop: "2px" },
  rowActions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "7px 10px", fontSize: "0.7rem", textDecoration: "none", color: "#2A241D" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "7px 10px", fontSize: "0.7rem" },
};
