"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateBadge(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
  return { day: d.getDate(), month: months[d.getMonth()] };
}

export default function InterventionPage() {
  const params = useParams();
  const slug = params?.slug;

  const [pro, setPro] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [entryDate, setEntryDate] = useState(todayISO());
  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState([""]);
  const [saving, setSaving] = useState(false);

  const [showPdf, setShowPdf] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    setLoading(true);
    const { data: proData, error: proErr } = await supabase
      .from("intervention_pros")
      .select("*")
      .eq("slug", slug)
      .single();
    if (proErr || !proData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPro(proData);
    setSelectedServices([proData.services?.[0] || ""]);

    const { data: entriesData } = await supabase
      .from("intervention_entries")
      .select("*")
      .eq("pro_id", proData.id)
      .order("entry_date", { ascending: false });
    setEntries(entriesData || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  function addServiceRow() {
    setSelectedServices((prev) => [...prev, pro?.services?.[0] || ""]);
  }

  function updateServiceRow(index, value) {
    setSelectedServices((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function removeServiceRow(index) {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveEntry() {
    if (!supabase || !pro || !clientName.trim() || !entryDate) return;
    const services = selectedServices.filter(Boolean);
    if (services.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("intervention_entries").insert({
      pro_id: pro.id,
      entry_date: entryDate,
      client_name: clientName.trim(),
      services,
    });
    setSaving(false);
    if (!error) {
      setClientName("");
      setSelectedServices([pro?.services?.[0] || ""]);
      load();
    }
  }

  if (loading) {
    return <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>Chargement…</div>;
  }
  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        Ce suivi d'intervention n'existe pas.
      </div>
    );
  }

  const today = todayISO();
  const todaysEntries = entries.filter((e) => e.entry_date === today);
  const sortedForExport = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <p style={styles.eyebrow}>Suivi d'intervention</p>
        <h1 style={styles.title}>{pro.name}</h1>

        <div style={styles.addCard}>
          <h2 style={styles.addCardTitle}>Nouvelle intervention</h2>

          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              style={styles.input}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Identification (client)</label>
            <input
              type="text"
              style={styles.input}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="ex. Mme Rousseau"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Services</label>
            {selectedServices.map((val, i) => (
              <div key={i} style={styles.serviceRow}>
                <select style={{ ...styles.input, flex: 1 }} value={val} onChange={(e) => updateServiceRow(i, e.target.value)}>
                  {(pro.services || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {selectedServices.length > 1 && (
                  <button style={styles.serviceRemove} onClick={() => removeServiceRow(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button style={styles.addServiceBtn} onClick={addServiceRow}>
              + Ajouter un service pour cette date
            </button>
          </div>

          <button style={styles.primaryButton} onClick={handleSaveEntry} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer l'intervention"}
          </button>
        </div>

        <p style={styles.sectionTitle}>Interventions du jour</p>
        {todaysEntries.length === 0 ? (
          <p style={styles.hint}>Aucune intervention enregistrée aujourd'hui.</p>
        ) : (
          <div style={styles.ticketList}>
            {todaysEntries.map((e) => {
              const badge = formatDateBadge(e.entry_date);
              return (
                <div key={e.id} style={styles.ticket}>
                  <div style={styles.ticketDate}>
                    <div style={styles.ticketDay}>{badge.day}</div>
                    <div style={styles.ticketMonth}>{badge.month}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.ticketClient}>{e.client_name}</p>
                    <div style={styles.ticketServices}>
                      {(e.services || []).map((s) => (
                        <span key={s} style={styles.ticketServiceTag}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button style={styles.exportButton} onClick={() => setShowPdf(true)}>
        Exporter en PDF
      </button>

      {showPdf && (
        <div style={styles.pdfOverlay} onClick={() => setShowPdf(false)}>
          <div style={styles.pdfPage} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.pdfTitle}>Récapitulatif d'interventions</h3>
            <p style={styles.pdfSub}>
              {sortedForExport.length > 0
                ? `Du ${sortedForExport[0].entry_date} au ${sortedForExport[sortedForExport.length - 1].entry_date}`
                : "Aucune intervention enregistrée"}
            </p>
            <table style={styles.pdfTable}>
              <thead>
                <tr>
                  <th style={styles.pdfTh}>Date</th>
                  <th style={styles.pdfTh}>Client</th>
                  <th style={styles.pdfTh}>Services</th>
                </tr>
              </thead>
              <tbody>
                {sortedForExport.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.pdfTd}>{e.entry_date}</td>
                    <td style={styles.pdfTd}>{e.client_name}</td>
                    <td style={styles.pdfTd}>{(e.services || []).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={styles.pdfNote}>
              Astuce : utilise "Imprimer" ou "Imprimer en PDF" de ton navigateur pour garder ce récapitulatif.
            </p>
            <button style={styles.pdfClose} onClick={() => setShowPdf(false)}>
              Fermer l'aperçu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#2B3328",
    color: "#F5F1E8",
    fontFamily: "'Space Grotesk', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  shell: { width: "100%", maxWidth: "460px", padding: "26px 18px 100px" },
  eyebrow: { fontSize: "0.68rem", letterSpacing: "0.24em", textTransform: "uppercase", color: "#E2621B", margin: "0 0 6px", fontWeight: 600 },
  title: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em", fontSize: "1.5rem", margin: "0 0 22px" },
  addCard: { background: "#333C2E", border: "1px solid #444E3E", borderRadius: "14px", padding: "18px", marginBottom: "26px" },
  addCardTitle: { fontFamily: "'Oswald', sans-serif", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px", color: "#C9B896" },
  field: { marginBottom: "12px" },
  label: { display: "block", fontSize: "0.72rem", color: "#9AA491", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#2B3328", border: "1px solid #444E3E", borderRadius: "8px", padding: "11px 12px", color: "#F5F1E8", fontSize: "0.9rem", outline: "none" },
  serviceRow: { display: "flex", gap: "8px", marginBottom: "8px" },
  serviceRemove: { background: "none", border: "1px solid #444E3E", color: "#C9756A", borderRadius: "8px", width: "40px", cursor: "pointer", fontSize: "0.9rem" },
  addServiceBtn: { background: "none", border: "1px dashed #5C664F", color: "#C9B896", borderRadius: "8px", padding: "9px", width: "100%", fontSize: "0.8rem", cursor: "pointer", marginBottom: "6px" },
  primaryButton: { width: "100%", background: "#E2621B", color: "#FFF7EE", border: "none", borderRadius: "8px", padding: "13px", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem", cursor: "pointer", marginTop: "6px" },
  sectionTitle: { fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.95rem", color: "#C9B896", margin: "26px 0 12px" },
  hint: { fontSize: "0.85rem", color: "#9AA491" },
  ticketList: { display: "flex", flexDirection: "column", gap: "12px" },
  ticket: { position: "relative", background: "#333C2E", border: "1px solid #444E3E", borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "flex-start" },
  ticketDate: { fontFamily: "'Oswald', sans-serif", background: "#E2621B", color: "#FFF7EE", borderRadius: "6px", padding: "8px 10px", textAlign: "center", flexShrink: 0, minWidth: "52px" },
  ticketDay: { fontSize: "1.3rem", lineHeight: 1, fontWeight: 600 },
  ticketMonth: { fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  ticketClient: { fontSize: "0.95rem", fontWeight: 600, margin: "0 0 4px" },
  ticketServices: { display: "flex", flexWrap: "wrap", gap: "6px" },
  ticketServiceTag: { fontSize: "0.72rem", background: "rgba(201,184,150,0.15)", color: "#C9B896", padding: "3px 9px", borderRadius: "999px" },
  exportButton: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 36px)",
    maxWidth: "424px",
    background: "#F5F1E8",
    color: "#2B3328",
    border: "none",
    borderRadius: "10px",
    padding: "15px",
    fontFamily: "'Oswald', sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 -10px 24px rgba(0,0,0,0.25)",
    zIndex: 20,
  },
  pdfOverlay: { position: "fixed", inset: 0, background: "rgba(10,12,9,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, padding: "24px" },
  pdfPage: { background: "#fff", color: "#1A1D18", width: "100%", maxWidth: "400px", maxHeight: "85vh", overflowY: "auto", padding: "28px 24px", fontFamily: "'Space Grotesk', sans-serif", borderRadius: "4px" },
  pdfTitle: { fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1.1rem", margin: "0 0 4px" },
  pdfSub: { fontSize: "0.78rem", color: "#66705F", margin: "0 0 20px" },
  pdfTable: { width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" },
  pdfTh: { textAlign: "left", borderBottom: "2px solid #1A1D18", padding: "6px 4px", fontSize: "0.7rem", textTransform: "uppercase" },
  pdfTd: { padding: "8px 4px", borderBottom: "1px solid #E4E1D8", verticalAlign: "top" },
  pdfNote: { fontSize: "0.72rem", color: "#8A8F80", marginTop: "16px" },
  pdfClose: { display: "block", margin: "10px auto 0", background: "#2B3328", color: "#F5F1E8", border: "none", padding: "10px 20px", borderRadius: "8px", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "0.8rem", cursor: "pointer" },
};
