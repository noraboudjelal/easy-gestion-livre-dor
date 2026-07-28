"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function ManageInterventionPage() {
  const params = useParams();
  const proId = params?.id;

  const [authed, setAuthed] = useState(false);
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [servicesList, setServicesList] = useState([]);
  const [newService, setNewService] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ld-admin-ok") === "1") {
      setAuthed(true);
    }
  }, []);

  const load = useCallback(async () => {
    if (!supabase || !proId) return;
    setLoading(true);
    const { data, error } = await supabase.from("intervention_pros").select("*").eq("id", proId).single();
    if (error || !data) {
      setLoadError("Suivi d'intervention introuvable.");
      setLoading(false);
      return;
    }
    setPro(data);
    setServicesList(data.services || []);
    setLoading(false);
  }, [proId]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function linkFor() {
    if (typeof window === "undefined" || !pro) return "";
    return `${window.location.origin}/intervention/${pro.slug}`;
  }

  function handleCopy() {
    const text = linkFor();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function addService() {
    const value = newService.trim();
    if (!value || servicesList.includes(value)) return;
    setServicesList((prev) => [...prev, value]);
    setNewService("");
  }

  function removeService(service) {
    setServicesList((prev) => prev.filter((s) => s !== service));
  }

  async function handleSaveServices() {
    if (!supabase || !proId) return;
    setSaving(true);
    const { error } = await supabase.from("intervention_pros").update({ services: servicesList }).eq("id", proId);
    setSaving(false);
    if (error) {
      setLoadError("Enregistrement impossible : " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
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
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <a href="/admin" style={styles.backLink}>← Retour à l'admin</a>

        <header style={styles.header}>
          <p style={styles.kicker}>SUIVI D'INTERVENTION</p>
          <h1 style={styles.title}>{loading ? "…" : pro?.name}</h1>
        </header>

        {loadError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{loadError}</p>}

        {pro && (
          <>
            <div style={styles.linkBox}>
              <span style={styles.linkText}>{linkFor()}</span>
              <button style={styles.iconButton} onClick={handleCopy}>
                {copied ? "✓ copié" : "copier le lien"}
              </button>
            </div>

            <p style={styles.codeLine}>
              Code d'accès client : <strong>{pro.access_code}</strong>
            </p>
            <p style={styles.hint}>
              Donne ce lien (ou une carte NFC/QR pointant dessus) à la personne concernée — elle y accède
              directement, sans mot de passe supplémentaire à retenir.
            </p>

            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Liste des services</h2>
              <p style={styles.hint}>
                C'est cette liste qui apparaît en menu déroulant sur la page du pro, à chaque nouvelle
                intervention.
              </p>

              <div style={styles.serviceTags}>
                {servicesList.map((s) => (
                  <span key={s} style={styles.serviceTag}>
                    {s}
                    <button style={styles.tagRemove} onClick={() => removeService(s)} aria-label={`Retirer ${s}`}>
                      ✕
                    </button>
                  </span>
                ))}
                {servicesList.length === 0 && <span style={styles.hint}>Aucun service pour l'instant.</span>}
              </div>

              <div style={styles.addRow}>
                <input
                  style={styles.input}
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                  placeholder="ex. Débouchage évier"
                />
                <button style={styles.addButton} onClick={addService}>
                  Ajouter
                </button>
              </div>

              <div style={styles.formActions}>
                <button style={styles.saveButton} onClick={handleSaveServices} disabled={saving}>
                  {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer la liste"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F7F4EC", fontFamily: "'Inter', sans-serif", color: "#2A241D", padding: "32px 16px 80px" },
  shell: { maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "18px" },
  backLink: { fontSize: "0.8rem", color: "#5B4636", textDecoration: "none" },
  header: { marginBottom: "4px" },
  kicker: { fontSize: "0.7rem", letterSpacing: "0.2em", color: "#8A7F66", margin: "0 0 6px" },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: "1.6rem", fontWeight: 600, margin: 0 },
  linkBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#FFFDF8",
    border: "1px solid #E6DCC2",
    borderRadius: "10px",
    padding: "10px 14px",
  },
  linkText: { fontSize: "0.82rem", color: "#5B4636", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  codeLine: { fontSize: "0.85rem", color: "#5B4636" },
  hint: { fontSize: "0.76rem", color: "#8A7F66", margin: 0 },
  box: {
    background: "#FFFDF8",
    border: "1px solid #E6DCC2",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  boxTitle: { fontFamily: "'Oswald', sans-serif", fontSize: "1.05rem", fontWeight: 600, margin: 0 },
  serviceTags: { display: "flex", flexWrap: "wrap", gap: "8px" },
  serviceTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.8rem",
    background: "#F1EAD6",
    color: "#5B4636",
    padding: "5px 6px 5px 12px",
    borderRadius: "999px",
  },
  tagRemove: {
    background: "#E2621B",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "0.6rem",
    lineHeight: 1,
  },
  addRow: { display: "flex", gap: "8px" },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #E6DCC2",
    fontSize: "0.88rem",
    outline: "none",
  },
  addButton: {
    background: "#1E2A3A",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  formActions: { display: "flex", justifyContent: "flex-end" },
  saveButton: {
    background: "#E2621B",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
};
