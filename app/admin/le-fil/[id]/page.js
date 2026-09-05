"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const COLORS = {
  page: "#F7F4EF",
  panel: "#FFFFFF",
  ink: "#221D18",
  muted: "#8A7F66",
  gold: "#A6792B",
  border: "#EAE3D6",
  cream: "#FBF8F3",
  button: "#B5402D",
};

function filUrl(slug) {
  if (typeof window === "undefined") return `/le-fil/${slug}`;
  return `${window.location.origin}/le-fil/${slug}`;
}

function cleanGuestText(names) {
  return (names || []).join("\n");
}

function imageData(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("QR code indisponible.");
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

function addTableCardPage(doc, event, table, qrData) {
  const pageWidth = 297;
  const pageHeight = 210;
  const foldY = pageHeight / 2;
  const centerX = pageWidth / 2;
  const guests = table.guest_names || [];

  doc.setFillColor(255, 250, 242);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setDrawColor(180, 134, 69);
  doc.setLineWidth(0.35);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(7, foldY, pageWidth - 7, foldY);
  doc.setLineDashPattern([], 0);

  doc.setTextColor(57, 47, 39);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Faites vivre cette journée avec nous", 240, 30, { align: "center", angle: 180 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Laissez un mot, une photo ou un souvenir sur Le Fil.", 240, 43, { align: "center", angle: 180 });
  doc.text("Une envie musicale ? Envoyez votre titre au DJ.", 240, 52, { align: "center", angle: 180 });
  doc.setTextColor(166, 121, 43);
  doc.setFontSize(9);
  doc.text("SCANNEZ LE QR CODE SUR L’AUTRE FACE", 240, 66, { align: "center", angle: 180 });

  doc.setTextColor(166, 121, 43);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TABLE", 91, 125, { align: "center" });
  doc.setTextColor(57, 47, 39);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(31);
  doc.text(String(table.table_number), 91, 141, { align: "center" });

  let cursorY = 153;
  if (table.table_name) {
    doc.setTextColor(166, 121, 43);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(table.table_name).toUpperCase(), 91, cursorY, { align: "center" });
    cursorY += 10;
  }

  doc.setTextColor(57, 47, 39);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(17);
  doc.text(event.event_title, 91, cursorY, { align: "center", maxWidth: 150 });
  cursorY += 9;

  if (guests.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const guestLines = doc.splitTextToSize(guests.join("  ·  "), 150);
    doc.text(guestLines.slice(0, 4), 91, cursorY, { align: "center", lineHeightFactor: 1.35 });
  }

  doc.addImage(qrData, "PNG", 220, 124, 48, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(166, 121, 43);
  doc.text("LE FIL", 244, 179, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(118, 104, 91);
  doc.text("Messages · photos · musique", 244, 185, { align: "center" });

  doc.setFontSize(6);
  doc.setTextColor(150, 135, 120);
  doc.text("Plier sur la ligne pointillée · Format A4 paysage", centerX, 198, { align: "center" });
}

export default function EventFilAdminPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ table_number: "", table_name: "", guest_names: "" });
  const [pdfBusy, setPdfBusy] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events/${id}/le-fil`, { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement impossible.");
      setEvent(data.event);
      setWelcomeMessage(data.welcome_message || "");
      setTables(data.tables || []);
    } catch (loadError) {
      setError(loadError.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function saveWelcome(eventSubmit) {
    eventSubmit.preventDefault();
    setSavingWelcome(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events/${id}/le-fil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ welcome_message: welcomeMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      setWelcomeMessage(data.welcome_message || "");
    } catch (saveError) {
      setError(saveError.message || "Enregistrement impossible.");
    } finally {
      setSavingWelcome(false);
    }
  }

  function editTable(table) {
    setEditingId(table.id);
    setForm({
      table_number: table.table_number,
      table_name: table.table_name || "",
      guest_names: cleanGuestText(table.guest_names),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ table_number: "", table_name: "", guest_names: "" });
  }

  async function saveTable(eventSubmit) {
    eventSubmit.preventDefault();
    if (!form.table_number.trim()) return;
    setSavingTable(true);
    setError("");
    try {
      const url = editingId
        ? `/api/admin/events/${id}/tables/${editingId}`
        : `/api/admin/events/${id}/tables`;
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError.message || "Enregistrement impossible.");
    } finally {
      setSavingTable(false);
    }
  }

  async function deleteTable(table) {
    if (!window.confirm(`Supprimer la table ${table.table_number} ?`)) return;
    setError("");
    const response = await fetch(`/api/admin/events/${id}/tables/${table.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Suppression impossible.");
      return;
    }
    if (editingId === table.id) resetForm();
    await load();
  }

  async function moveTable(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= tables.length) return;
    const reordered = [...tables];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setTables(reordered);
    const response = await fetch(`/api/admin/events/${id}/tables/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((table) => table.id) }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Réorganisation impossible.");
      await load();
    }
  }

  async function downloadTables(selectedTables, fileName) {
    if (!event || !selectedTables.length) return;
    setPdfBusy(fileName);
    setError("");
    try {
      const [{ jsPDF }, qrData] = await Promise.all([
        import("jspdf"),
        imageData(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=24&data=${encodeURIComponent(filUrl(event.slug))}`),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      selectedTables.forEach((table, index) => {
        if (index) doc.addPage("a4", "landscape");
        addTableCardPage(doc, event, table, qrData);
      });
      doc.save(fileName);
    } catch (pdfError) {
      setError(pdfError.message || "Génération du PDF impossible.");
    } finally {
      setPdfBusy("");
    }
  }

  const previewTable = useMemo(() => tables[0] || null, [tables]);

  if (loading) return <main style={styles.page}><div style={styles.shell}>Chargement…</div></main>;
  if (!event) return <main style={styles.page}><div style={styles.shell}><p>{error || "Événement introuvable."}</p><a href="/admin">Retour à l’admin</a></div></main>;

  return (
    <main style={styles.page}>
      <style>{`
        @media (max-width: 680px) {
          .fil-admin-table-form, .fil-admin-preview { grid-template-columns: 1fr !important; }
          .fil-admin-table-row { align-items: flex-start !important; flex-wrap: wrap; }
          .fil-admin-row-actions { width: 100%; justify-content: flex-start !important; padding-left: 40px; }
        }
      `}</style>
      <div style={styles.shell}>
        <div style={styles.topline}>
          <a href="/admin" style={styles.back}>← Retour à l’admin</a>
          <a href={filUrl(event.slug)} target="_blank" rel="noreferrer" style={styles.secondary}>Voir Le Fil</a>
        </div>
        <p style={styles.kicker}>LE FIL · ADMINISTRATION</p>
        <h1 style={styles.title}>{event.event_title}</h1>
        <p style={styles.subtitle}>Phrase d’accueil et cartons de table</p>

        {error && <p style={styles.error}>{error}</p>}

        <section id="phrase" style={styles.panel}>
          <h2 style={styles.panelTitle}>Phrase d’accueil</h2>
          <p style={styles.help}>Elle apparaît sous les noms dans le bandeau du Fil. Laissez vide pour ne rien afficher.</p>
          <form onSubmit={saveWelcome} style={styles.form}>
            <textarea
              style={styles.textarea}
              value={welcomeMessage}
              onChange={(eventChange) => setWelcomeMessage(eventChange.target.value)}
              maxLength={500}
              placeholder="Votre doua, citation ou phrase personnelle…"
            />
            <div style={styles.actions}>
              <span style={styles.counter}>{welcomeMessage.length}/500</span>
              <button type="submit" style={styles.primary} disabled={savingWelcome}>
                {savingWelcome ? "Enregistrement…" : welcomeMessage.trim() ? "Enregistrer" : "Supprimer la phrase"}
              </button>
            </div>
          </form>
        </section>

        <section id="tables" style={styles.panel}>
          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.panelTitle}>Cartons de table</h2>
              <p style={styles.help}>Un prénom par ligne. Le nom de table et les prénoms restent facultatifs.</p>
            </div>
            {tables.length > 1 && (
              <button
                type="button"
                style={styles.primary}
                disabled={Boolean(pdfBusy)}
                onClick={() => downloadTables(tables, `cartons-${event.slug}.pdf`)}
              >
                {pdfBusy ? "Génération…" : "Télécharger tous les cartons"}
              </button>
            )}
          </div>

          <form className="fil-admin-table-form" onSubmit={saveTable} style={styles.tableForm}>
            <label style={styles.label}>
              Numéro de table *
              <input
                style={styles.input}
                value={form.table_number}
                onChange={(changeEvent) => setForm((current) => ({ ...current, table_number: changeEvent.target.value }))}
                placeholder="6"
                maxLength={40}
                required
              />
            </label>
            <label style={styles.label}>
              Nom de table
              <input
                style={styles.input}
                value={form.table_name}
                onChange={(changeEvent) => setForm((current) => ({ ...current, table_name: changeEvent.target.value }))}
                placeholder="Jasmin"
                maxLength={100}
              />
            </label>
            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Prénoms
              <textarea
                style={styles.textarea}
                value={form.guest_names}
                onChange={(changeEvent) => setForm((current) => ({ ...current, guest_names: changeEvent.target.value }))}
                placeholder={"Nora\nSarah\nLeïla\nInès\nKarim"}
              />
            </label>
            <div style={{ ...styles.actions, gridColumn: "1 / -1" }}>
              {editingId && <button type="button" style={styles.secondary} onClick={resetForm}>Annuler</button>}
              <button type="submit" style={styles.primary} disabled={savingTable}>
                {savingTable ? "Enregistrement…" : editingId ? "Mettre à jour la table" : "Créer la table"}
              </button>
            </div>
          </form>

          <div style={styles.tableList}>
            {tables.length === 0 && <p style={styles.empty}>Aucune table créée pour cet événement.</p>}
            {tables.map((table, index) => (
              <article className="fil-admin-table-row" key={table.id} style={styles.tableRow}>
                <div style={styles.order}>
                  <button type="button" style={styles.orderButton} disabled={index === 0} onClick={() => moveTable(index, -1)}>↑</button>
                  <button type="button" style={styles.orderButton} disabled={index === tables.length - 1} onClick={() => moveTable(index, 1)}>↓</button>
                </div>
                <div style={{ flex: 1 }}>
                  <strong>Table {table.table_number}{table.table_name ? ` · ${table.table_name}` : ""}</strong>
                  <div style={styles.guestSummary}>{table.guest_names?.length ? table.guest_names.join(", ") : "Aucun prénom"}</div>
                </div>
                <div className="fil-admin-row-actions" style={styles.rowActions}>
                  <button type="button" style={styles.secondary} onClick={() => editTable(table)}>modifier</button>
                  <button
                    type="button"
                    style={styles.secondary}
                    disabled={Boolean(pdfBusy)}
                    onClick={() => downloadTables([table], `carton-table-${table.table_number}-${event.slug}.pdf`)}
                  >
                    PDF
                  </button>
                  <button type="button" style={styles.danger} onClick={() => deleteTable(table)}>supprimer</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {previewTable && (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Aperçu du carton</h2>
            <p style={styles.help}>Aperçu de la première table. Le PDF A4 paysage inclut la ligne de pliage et la seconde face.</p>
            <div className="fil-admin-preview" style={styles.preview}>
              <div>
                <span style={styles.previewLabel}>TABLE</span>
                <div style={styles.previewNumber}>{previewTable.table_number}</div>
                {previewTable.table_name && <div style={styles.previewTableName}>{previewTable.table_name}</div>}
                <div style={styles.previewEvent}>{event.event_title}</div>
                {previewTable.guest_names?.length > 0 && <div style={styles.previewGuests}>{previewTable.guest_names.join(" · ")}</div>}
              </div>
              <div style={styles.qrPreview}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(filUrl(event.slug))}`}
                  alt="QR code du Fil"
                  width={120}
                  height={120}
                />
                <strong>LE FIL</strong>
                <small>Messages · photos · musique</small>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: COLORS.page, color: COLORS.ink, padding: "28px 16px", fontFamily: "'Inter', sans-serif" },
  shell: { width: "100%", maxWidth: "1060px", margin: "0 auto" },
  topline: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  back: { color: COLORS.muted, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 },
  kicker: { color: COLORS.gold, letterSpacing: "0.14em", fontSize: "0.68rem", fontWeight: 800, margin: "26px 0 4px" },
  title: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: 0 },
  subtitle: { color: COLORS.muted, margin: "6px 0 24px" },
  panel: { background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "18px", padding: "22px", marginBottom: "18px" },
  panelTitle: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.5rem", margin: 0 },
  help: { color: COLORS.muted, fontSize: "0.8rem", lineHeight: 1.5, margin: "6px 0 16px" },
  form: { display: "grid", gap: "10px" },
  tableForm: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "12px", background: COLORS.cream, borderRadius: "14px", padding: "16px" },
  label: { display: "grid", gap: "6px", fontSize: "0.75rem", fontWeight: 700 },
  input: { width: "100%", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "11px 12px", background: "#fff", color: COLORS.ink },
  textarea: { width: "100%", minHeight: "96px", resize: "vertical", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "11px 12px", background: "#fff", color: COLORS.ink, font: "inherit" },
  actions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  counter: { marginRight: "auto", color: COLORS.muted, fontSize: "0.72rem" },
  primary: { background: COLORS.button, color: "#fff", border: 0, borderRadius: "10px", padding: "10px 15px", fontWeight: 700, fontSize: "0.78rem" },
  secondary: { background: "#F3EEE3", color: "#5B4636", border: 0, borderRadius: "9px", padding: "8px 11px", fontWeight: 700, fontSize: "0.72rem", textDecoration: "none" },
  danger: { background: "#FBEAE6", color: COLORS.button, border: 0, borderRadius: "9px", padding: "8px 11px", fontWeight: 700, fontSize: "0.72rem" },
  error: { background: "#FBEAE6", color: COLORS.button, borderRadius: "10px", padding: "11px 13px", fontSize: "0.82rem" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" },
  tableList: { display: "grid", gap: "9px", marginTop: "16px" },
  tableRow: { display: "flex", alignItems: "center", gap: "12px", border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "12px" },
  order: { display: "grid", gap: "3px" },
  orderButton: { width: "28px", height: "26px", border: `1px solid ${COLORS.border}`, background: COLORS.cream, borderRadius: "7px" },
  guestSummary: { color: COLORS.muted, fontSize: "0.74rem", marginTop: "4px" },
  rowActions: { display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" },
  empty: { textAlign: "center", color: COLORS.muted, padding: "18px" },
  preview: { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "24px", minHeight: "300px", background: "#FFFAF2", border: "1px solid #DEB982", borderRadius: "15px", padding: "34px", textAlign: "center" },
  previewLabel: { color: COLORS.gold, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.16em" },
  previewNumber: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "4rem", lineHeight: 1 },
  previewTableName: { color: COLORS.gold, fontSize: "0.82rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "8px" },
  previewEvent: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.45rem", marginTop: "12px" },
  previewGuests: { color: COLORS.muted, fontSize: "0.78rem", lineHeight: 1.6, marginTop: "12px" },
  qrPreview: { display: "grid", justifyItems: "center", gap: "5px", color: COLORS.gold },
};
