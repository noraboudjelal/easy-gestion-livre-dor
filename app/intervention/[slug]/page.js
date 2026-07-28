"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import jsPDF from "jspdf";

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
  const [selectedServiceNames, setSelectedServiceNames] = useState([""]);
  const [saving, setSaving] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(todayISO().slice(0, 7)); // "2026-07"

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
    setSelectedServiceNames([proData.services?.[0]?.name || ""]);

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
    setSelectedServiceNames((prev) => [...prev, pro?.services?.[0]?.name || ""]);
  }

  function updateServiceRow(index, value) {
    setSelectedServiceNames((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function removeServiceRow(index) {
    setSelectedServiceNames((prev) => prev.filter((_, i) => i !== index));
  }

  function priceFor(name) {
    return pro?.services?.find((s) => s.name === name)?.price ?? null;
  }

  function entryTotal(entry) {
    return (entry.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
  }

  async function handleSaveEntry() {
    if (!supabase || !pro || !clientName.trim() || !entryDate) return;
    const services = selectedServiceNames
      .filter(Boolean)
      .map((name) => ({ name, price: priceFor(name) }));
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
      setSelectedServiceNames([pro?.services?.[0]?.name || ""]);
      load();
    }
  }

  async function handleDeleteEntry(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer cette intervention ?")) return;
    const { error } = await supabase.from("intervention_entries").delete().eq("id", id);
    if (!error) load();
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

  const availableMonths = [...new Set(entries.map((e) => e.entry_date.slice(0, 7)))].sort().reverse();
  if (!availableMonths.includes(selectedMonth)) availableMonths.unshift(selectedMonth);
  const monthEntries = entries.filter((e) => e.entry_date.slice(0, 7) === selectedMonth);
  const monthTotal = monthEntries.reduce((sum, e) => sum + entryTotal(e), 0);

  function monthLabel(monthStr) {
    const [y, m] = monthStr.split("-").map(Number);
    const names = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    return `${names[m - 1]} ${y}`;
  }
  const formTotal = selectedServiceNames.reduce((sum, name) => sum + (priceFor(name) || 0), 0);

  function handleExportPdf() {
    const doc = new jsPDF();
    const grandTotal = sortedForExport.reduce((sum, e) => sum + entryTotal(e), 0);

    doc.setFontSize(16);
    doc.text("Récapitulatif d'interventions", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(pro?.name || "", 14, 25);
    if (sortedForExport.length > 0) {
      doc.text(
        `Du ${sortedForExport[0].entry_date} au ${sortedForExport[sortedForExport.length - 1].entry_date}`,
        14,
        31
      );
    }

    let y = 42;
    doc.setTextColor(20);
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Date", 14, y);
    doc.text("Client", 44, y);
    doc.text("Services", 84, y);
    doc.text("Total", 180, y);
    doc.setFont(undefined, "normal");
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    sortedForExport.forEach((e) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(e.entry_date, 14, y);
      doc.text(e.client_name || "", 44, y, { maxWidth: 38 });
      doc.text((e.services || []).map((s) => s.name).join(", "), 84, y, { maxWidth: 90 });
      const total = entryTotal(e);
      doc.text(total > 0 ? `${total}€` : "—", 180, y);
      y += 8;
    });

    y += 4;
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFont(undefined, "bold");
    doc.text(`Total général : ${grandTotal}€`, 14, y);

    // Récapitulatif par service, avec quantité
    const serviceSummary = {};
    sortedForExport.forEach((e) => {
      (e.services || []).forEach((s) => {
        if (!serviceSummary[s.name]) serviceSummary[s.name] = { count: 0, total: 0 };
        serviceSummary[s.name].count += 1;
        serviceSummary[s.name].total += s.price || 0;
      });
    });
    const summaryEntries = Object.entries(serviceSummary);

    if (summaryEntries.length > 0) {
      y += 14;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text("Récapitulatif par service", 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Service", 14, y);
      doc.text("Quantité", 130, y);
      doc.text("Total", 170, y);
      doc.setFont(undefined, "normal");
      y += 4;
      doc.line(14, y, 196, y);
      y += 6;
      summaryEntries.forEach(([name, info]) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(name, 14, y, { maxWidth: 110 });
        doc.text(`×${info.count}`, 130, y);
        doc.text(info.total > 0 ? `${info.total}€` : "—", 170, y);
        y += 8;
      });
    }

    doc.save(`interventions-${(pro?.name || "pro").replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

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
              style={{ ...styles.input, maxWidth: "100%", minWidth: 0 }}
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
            {selectedServiceNames.map((val, i) => (
              <div key={i} style={styles.serviceRow}>
                <select style={{ ...styles.input, flex: 1 }} value={val} onChange={(e) => updateServiceRow(i, e.target.value)}>
                  {(pro.services || []).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedServiceNames.length > 1 && (
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

          {formTotal > 0 && (
            <p style={styles.formTotal}>
              Total de cette intervention : <strong>{formTotal}€</strong>
            </p>
          )}

          <button style={styles.primaryButton} onClick={handleSaveEntry} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer l'intervention"}
          </button>
        </div>

        <p style={styles.sectionTitle}>Interventions du jour</p>
        {todaysEntries.length === 0 ? (
          <p style={styles.hint}>Aucune intervention enregistrée aujourd'hui.</p>
        ) : (
          <>
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
                          <span key={s.name} style={styles.ticketServiceTag}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button style={styles.deleteButton} onClick={() => handleDeleteEntry(e.id)} aria-label="Supprimer">
                      supprimer
                    </button>
                  </div>
                );
              })}
            </div>
            <p style={styles.dayTotal}>
              Total du jour : <strong>{todaysEntries.reduce((sum, e) => sum + entryTotal(e), 0)}€</strong>
            </p>
          </>
        )}

        <div style={styles.monthBox}>
          <div style={styles.monthHeader}>
            <p style={styles.sectionTitleInline}>Total du mois</p>
            <select
              style={styles.monthSelect}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <p style={styles.monthTotal}>{monthTotal}€</p>
          <p style={styles.hint}>
            {monthEntries.length} intervention(s) sur {monthLabel(selectedMonth)} — chaque mois est compté
            indépendamment, sans report d'un mois sur l'autre.
          </p>
        </div>
      </div>

      <button style={styles.exportButton} onClick={handleExportPdf}>
        Exporter en PDF
      </button>
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
  formTotal: { fontSize: "0.85rem", color: "#C9B896", textAlign: "right", margin: "10px 0 0" },
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
  ticketTotal: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, color: "#E2621B", fontSize: "1rem", flexShrink: 0 },
  deleteButton: {
    background: "none",
    border: "1px solid #6B4A42",
    color: "#C9756A",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "0.72rem",
    cursor: "pointer",
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  dayTotal: { textAlign: "right", fontSize: "0.85rem", color: "#C9B896", marginTop: "10px" },
  monthBox: {
    background: "#333C2E",
    border: "1px solid #444E3E",
    borderRadius: "14px",
    padding: "18px",
    marginTop: "26px",
  },
  monthHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  sectionTitleInline: { fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.9rem", color: "#C9B896", margin: 0 },
  monthSelect: { background: "#2B3328", border: "1px solid #444E3E", borderRadius: "8px", padding: "6px 10px", color: "#F5F1E8", fontSize: "0.8rem", outline: "none" },
  monthTotal: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "2rem", color: "#E2621B", margin: "0 0 6px" },
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
