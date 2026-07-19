"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { VITRINE_THEMES } from "../../lib/vitrineThemes";

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

const TYPE_BADGE = {
  "Mariage": { background: "#E8EDF8", color: "#3E4E7A" },
  "Anniversaire": { background: "#FBE9E4", color: "#B5402D" },
  "Baptême": { background: "#EAF1F7", color: "#4A6A85" },
  "Baby Shower": { background: "#FBE7EF", color: "#B5567F" },
  "Pot de départ": { background: "#E3F1F0", color: "#2E6E68" },
  "Départ en retraite": { background: "#E9F3EA", color: "#3F7A52" },
  "Henné": { background: "#E9F3EA", color: "#4E7A3F" },
  "Circoncision": { background: "#E3F3FA", color: "#2E7A9E" },
  "Fiançailles": { background: "#F7EEE4", color: "#9E6B34" },
  "Inauguration": { background: "#F7F1DE", color: "#8A6D18" },
  "Lancement de produit": { background: "#E1F4F0", color: "#1F8072" },
  "Fête d'entreprise": { background: "#EAEAEC", color: "#4C4E56" },
  "Vos avis": { background: "#EDEDED", color: "#4A4A4A" },
  "Autre": { background: "#EFE4C8", color: "#7A5A1E" },
};
function badgeColors(type) {
  return TYPE_BADGE[type] || TYPE_BADGE["Autre"];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  const [view, setView] = useState("livres"); // "livres" | "catalogues" | "vitrine"

  // --- Livres d'or ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("Mariage");
  const [eventDate, setEventDate] = useState("");
  const [newPolls, setNewPolls] = useState([]);
  const [cagnotteUrl, setCagnotteUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingPollFor, setEditingPollFor] = useState(null);
  const [editingPolls, setEditingPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [savingPollId, setSavingPollId] = useState(null);
  const [editingCagnotteFor, setEditingCagnotteFor] = useState(null);
  const [editCagnotteUrl, setEditCagnotteUrl] = useState("");
  const [savingCagnotte, setSavingCagnotte] = useState(false);
  const [editingDateFor, setEditingDateFor] = useState(null);
  const [editEventDate, setEditEventDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [editingGiftsFor, setEditingGiftsFor] = useState(null);
  const [editingGifts, setEditingGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [savingGiftId, setSavingGiftId] = useState(null);

  // --- Catalogues ---
  const [catalogs, setCatalogs] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState("");
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [catalogClient, setCatalogClient] = useState("");
  const [catalogTitle, setCatalogTitle] = useState("");
  const [catalogColor, setCatalogColor] = useState("#B5402D");
  const [catalogFont, setCatalogFont] = useState("manuscrite");
  const [creatingCatalog, setCreatingCatalog] = useState(false);
  const [copiedCatalogId, setCopiedCatalogId] = useState(null);

  // --- Ma Vitrine ---
  const [showcases, setShowcases] = useState([]);
  const [showcasesLoading, setShowcasesLoading] = useState(true);
  const [showcasesError, setShowcasesError] = useState("");
  const [showShowcaseForm, setShowShowcaseForm] = useState(false);
  const [showcaseBusinessName, setShowcaseBusinessName] = useState("");
  const [showcaseTagline, setShowcaseTagline] = useState("");
  const [showcaseTheme, setShowcaseTheme] = useState("coiffure");
  const [creatingShowcase, setCreatingShowcase] = useState(false);
  const [copiedShowcaseId, setCopiedShowcaseId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ld-admin-ok") === "1") {
      setAuthed(true);
    }
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (!expected) {
      setAuthError("Mot de passe admin non configuré. Ajoute NEXT_PUBLIC_ADMIN_PASSWORD dans Vercel.");
      return;
    }
    if (pwd === expected) {
      sessionStorage.setItem("ld-admin-ok", "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Mot de passe incorrect.");
    }
  }

  const loadEvents = useCallback(async () => {
    if (!supabase) {
      setLoadError("Connexion à Supabase non configurée.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*, messages(count), poll_questions(count)")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError("Impossible de charger les livres d'or : " + error.message);
    } else {
      setLoadError("");
      setEvents(data || []);
    }
    setLoading(false);
  }, []);

  const loadCatalogs = useCallback(async () => {
    if (!supabase) {
      setCatalogsError("Connexion à Supabase non configurée.");
      setCatalogsLoading(false);
      return;
    }
    setCatalogsLoading(true);
    const { data, error } = await supabase
      .from("catalogs")
      .select("*, catalog_products(count)")
      .order("created_at", { ascending: false });
    if (error) {
      setCatalogsError("Impossible de charger les catalogues : " + error.message);
    } else {
      setCatalogsError("");
      setCatalogs(data || []);
    }
    setCatalogsLoading(false);
  }, []);

  const loadShowcases = useCallback(async () => {
    if (!supabase) {
      setShowcasesError("Connexion à Supabase non configurée.");
      setShowcasesLoading(false);
      return;
    }
    setShowcasesLoading(true);
    const { data, error } = await supabase
      .from("showcases")
      .select("*, showcase_products(count)")
      .order("created_at", { ascending: false });
    if (error) {
      setShowcasesError("Impossible de charger les vitrines : " + error.message);
    } else {
      setShowcasesError("");
      setShowcases(data || []);
    }
    setShowcasesLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      loadEvents();
      loadCatalogs();
      loadShowcases();
    }
  }, [authed, loadEvents, loadCatalogs, loadShowcases]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!client.trim() || !eventTitle.trim() || !supabase) return;
    setCreating(true);
    const slug = `${slugify(client)}-${shortCode()}`;
    const { data: created, error } = await supabase
      .from("events")
      .insert({
        client: client.trim(),
        event_title: eventTitle.trim(),
        event_type: eventType,
        slug,
        cagnotte_url: cagnotteUrl.trim() || null,
        client_password: clientAccessCode(),
        event_date: eventDate || null,
      })
      .select()
      .single();
    if (error) {
      setCreating(false);
      setLoadError("Création impossible : " + error.message);
      return;
    }

    const validPolls = newPolls
      .map((p) => ({ question: p.question.trim(), options: p.options.map((o) => o.trim()).filter(Boolean) }))
      .filter((p) => p.question && p.options.length >= 2);

    if (validPolls.length > 0) {
      await supabase.from("poll_questions").insert(
        validPolls.map((p, i) => ({
          event_id: created.id,
          question: p.question,
          options: p.options,
          votes: p.options.map(() => 0),
          position: i,
        }))
      );
    }

    setCreating(false);
    setClient("");
    setEventTitle("");
    setEventType("Mariage");
    setEventDate("");
    setNewPolls([]);
    setCagnotteUrl("");
    setShowForm(false);
    loadEvents();
  }

  function addNewPollBlock() {
    setNewPolls((prev) => (prev.length >= 5 ? prev : [...prev, { question: "", options: ["", "", "", ""] }]));
  }
  function removeNewPollBlock(index) {
    setNewPolls((prev) => prev.filter((_, i) => i !== index));
  }
  function updateNewPollQuestion(index, value) {
    setNewPolls((prev) => prev.map((p, i) => (i === index ? { ...p, question: value } : p)));
  }
  function updateNewPollOption(pollIndex, optIndex, value) {
    setNewPolls((prev) =>
      prev.map((p, i) => {
        if (i !== pollIndex) return p;
        const options = [...p.options];
        options[optIndex] = value;
        return { ...p, options };
      })
    );
  }

  async function openPollEditor(ev) {
    setEditingPollFor(ev);
    setLoadingPolls(true);
    const { data } = await supabase
      .from("poll_questions")
      .select("*")
      .eq("event_id", ev.id)
      .order("position", { ascending: true });
    setEditingPolls(
      (data || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: [q.options?.[0] || "", q.options?.[1] || "", q.options?.[2] || "", q.options?.[3] || ""],
        isNew: false,
      }))
    );
    setLoadingPolls(false);
  }

  function addEditingPollBlock() {
    setEditingPolls((prev) =>
      prev.length >= 5 ? prev : [...prev, { id: null, question: "", options: ["", "", "", ""], isNew: true }]
    );
  }
  function updateEditingPollQuestion(index, value) {
    setEditingPolls((prev) => prev.map((p, i) => (i === index ? { ...p, question: value } : p)));
  }
  function updateEditingPollOption(pollIndex, optIndex, value) {
    setEditingPolls((prev) =>
      prev.map((p, i) => {
        if (i !== pollIndex) return p;
        const options = [...p.options];
        options[optIndex] = value;
        return { ...p, options };
      })
    );
  }

  async function handleSaveOnePoll(index) {
    const poll = editingPolls[index];
    if (!poll || !editingPollFor || !supabase) return;
    const cleanOptions = poll.options.map((o) => o.trim()).filter(Boolean);
    if (!poll.question.trim() || cleanOptions.length < 2) {
      setLoadError("Il faut une question et au moins 2 réponses.");
      return;
    }
    setSavingPollId(index);
    if (poll.id) {
      const { error } = await supabase
        .from("poll_questions")
        .update({ question: poll.question.trim(), options: cleanOptions, votes: cleanOptions.map(() => 0) })
        .eq("id", poll.id);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { data, error } = await supabase
        .from("poll_questions")
        .insert({
          event_id: editingPollFor.id,
          question: poll.question.trim(),
          options: cleanOptions,
          votes: cleanOptions.map(() => 0),
          position: index,
        })
        .select()
        .single();
      if (error) {
        setLoadError("Création impossible : " + error.message);
      } else {
        setEditingPolls((prev) => prev.map((p, i) => (i === index ? { ...p, id: data.id, isNew: false } : p)));
      }
    }
    setSavingPollId(null);
    loadEvents();
  }

  async function handleDeletePoll(index) {
    const poll = editingPolls[index];
    if (!poll) return;
    if (poll.id && supabase) {
      await supabase.from("poll_questions").delete().eq("id", poll.id);
      loadEvents();
    }
    setEditingPolls((prev) => prev.filter((_, i) => i !== index));
  }

  async function openGiftEditor(ev) {
    setEditingGiftsFor(ev);
    setLoadingGifts(true);
    const { data } = await supabase
      .from("gift_items")
      .select("*")
      .eq("event_id", ev.id)
      .order("position", { ascending: true });
    setEditingGifts(
      (data || []).map((g) => ({
        id: g.id,
        name: g.name,
        link: g.link || "",
        price: g.price || "",
        reservedBy: g.reserved_by,
        isNew: false,
      }))
    );
    setLoadingGifts(false);
  }

  function addEditingGiftBlock() {
    setEditingGifts((prev) =>
      prev.length >= 20 ? prev : [...prev, { id: null, name: "", link: "", price: "", reservedBy: null, isNew: true }]
    );
  }
  function updateEditingGift(index, field, value) {
    setEditingGifts((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }

  async function handleSaveOneGift(index) {
    const gift = editingGifts[index];
    if (!gift || !editingGiftsFor || !supabase) return;
    if (!gift.name.trim()) {
      setLoadError("Le cadeau a besoin d'un nom.");
      return;
    }
    setSavingGiftId(index);
    if (gift.id) {
      const { error } = await supabase
        .from("gift_items")
        .update({ name: gift.name.trim(), link: gift.link.trim() || null, price: gift.price.trim() || null })
        .eq("id", gift.id);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { data, error } = await supabase
        .from("gift_items")
        .insert({
          event_id: editingGiftsFor.id,
          name: gift.name.trim(),
          link: gift.link.trim() || null,
          price: gift.price.trim() || null,
          position: index,
        })
        .select()
        .single();
      if (error) {
        setLoadError("Création impossible : " + error.message);
      } else {
        setEditingGifts((prev) => prev.map((g, i) => (i === index ? { ...g, id: data.id, isNew: false } : g)));
      }
    }
    setSavingGiftId(null);
    loadEvents();
  }

  async function handleUnreserveGift(index) {
    const gift = editingGifts[index];
    if (!gift?.id || !supabase) return;
    await supabase.from("gift_items").update({ reserved_by: null, reserved_at: null }).eq("id", gift.id);
    setEditingGifts((prev) => prev.map((g, i) => (i === index ? { ...g, reservedBy: null } : g)));
  }

  async function handleDeleteGift(index) {
    const gift = editingGifts[index];
    if (!gift) return;
    if (gift.id && supabase) {
      await supabase.from("gift_items").delete().eq("id", gift.id);
      loadEvents();
    }
    setEditingGifts((prev) => prev.filter((_, i) => i !== index));
  }

  function openCagnotteEditor(ev) {
    setEditingCagnotteFor(ev);
    setEditCagnotteUrl(ev.cagnotte_url || "");
  }

  async function handleSaveCagnotte(e) {
    e.preventDefault();
    if (!editingCagnotteFor || !supabase) return;
    setSavingCagnotte(true);
    const { error } = await supabase
      .from("events")
      .update({ cagnotte_url: editCagnotteUrl.trim() || null })
      .eq("id", editingCagnotteFor.id);
    setSavingCagnotte(false);
    if (error) {
      setLoadError("Modification de la cagnotte impossible : " + error.message);
      return;
    }
    setEditingCagnotteFor(null);
    loadEvents();
  }

  function openDateEditor(ev) {
    setEditingDateFor(ev);
    setEditEventDate(ev.event_date || "");
  }

  async function handleSaveDate(e) {
    e.preventDefault();
    if (!editingDateFor || !supabase) return;
    setSavingDate(true);
    const { error } = await supabase
      .from("events")
      .update({ event_date: editEventDate || null })
      .eq("id", editingDateFor.id);
    setSavingDate(false);
    if (error) {
      setLoadError("Modification de la date impossible : " + error.message);
      return;
    }
    setEditingDateFor(null);
    loadEvents();
  }

  async function handleCreateCatalog(e) {
    e.preventDefault();
    if (!catalogClient.trim() || !catalogTitle.trim() || !supabase) return;
    setCreatingCatalog(true);
    const slug = `${slugify(catalogClient)}-${shortCode()}`;
    const { error } = await supabase.from("catalogs").insert({
      client: catalogClient.trim(),
      catalog_title: catalogTitle.trim(),
      slug,
      accent_color: catalogColor,
      font_style: catalogFont,
      client_password: clientAccessCode(),
    });
    setCreatingCatalog(false);
    if (error) {
      setCatalogsError("Création impossible : " + error.message);
      return;
    }
    setCatalogClient("");
    setCatalogTitle("");
    setCatalogColor("#B5402D");
    setCatalogFont("manuscrite");
    setShowCatalogForm(false);
    loadCatalogs();
  }

  function linkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/${slug}`;
  }

  function espaceLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/${slug}/espace`;
  }

  async function handleRegenerateEventCode(eventId) {
    if (!supabase) return;
    const newCode = clientAccessCode();
    const { error } = await supabase.from("events").update({ client_password: newCode }).eq("id", eventId);
    if (error) {
      setLoadError("Impossible de régénérer le code : " + error.message);
    } else {
      loadEvents();
    }
  }

  function catalogLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/catalogue/${slug}`;
  }

  function clientManageLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/catalogue/${slug}/gerer`;
  }

  async function handleRegenerateCode(catalogId) {
    if (!supabase) return;
    const newCode = clientAccessCode();
    const { error } = await supabase.from("catalogs").update({ client_password: newCode }).eq("id", catalogId);
    if (error) {
      setCatalogsError("Impossible de régénérer le code : " + error.message);
    } else {
      loadCatalogs();
    }
  }

  function qrUrlForLink(link) {
    const data = encodeURIComponent(link);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${data}`;
  }

  function qrUrlHighRes(link) {
    const data = encodeURIComponent(link);
    return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=12&data=${data}`;
  }

  function handleCopy(id, slug) {
    const text = linkFor(slug);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  function handleCopyCatalog(id, slug) {
    const text = catalogLinkFor(slug);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCatalogId(id);
    setTimeout(() => setCopiedCatalogId(null), 1800);
  }

  async function handleDeleteEvent(id, client) {
    if (!supabase) return;
    if (!window.confirm(`Supprimer le livre d'or de "${client}" ? Cette action est définitive.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setLoadError("Suppression impossible : " + error.message);
    } else {
      loadEvents();
    }
  }

  async function handleDeleteCatalog(id, client) {
    if (!supabase) return;
    if (!window.confirm(`Supprimer le catalogue de "${client}" ? Cette action est définitive.`)) return;
    const { error } = await supabase.from("catalogs").delete().eq("id", id);
    if (error) {
      setCatalogsError("Suppression impossible : " + error.message);
    } else {
      loadCatalogs();
    }
  }

  async function handleCreateShowcase(e) {
    e.preventDefault();
    if (!showcaseBusinessName.trim() || !supabase) return;
    setCreatingShowcase(true);
    const slug = `${slugify(showcaseBusinessName)}-${shortCode()}`;
    const { error } = await supabase.from("showcases").insert({
      slug,
      business_name: showcaseBusinessName.trim(),
      tagline: showcaseTagline.trim() || null,
      theme: showcaseTheme,
      client_password: clientAccessCode(),
    });
    setCreatingShowcase(false);
    if (error) {
      setShowcasesError("Création impossible : " + error.message);
      return;
    }
    setShowcaseBusinessName("");
    setShowcaseTagline("");
    setShowcaseTheme("coiffure");
    setShowShowcaseForm(false);
    loadShowcases();
  }

  function showcaseLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/vitrine/${slug}`;
  }

  function showcaseManageLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/vitrine/${slug}/gerer`;
  }

  async function handleRegenerateShowcaseCode(showcaseId) {
    if (!supabase) return;
    const newCode = clientAccessCode();
    const { error } = await supabase.from("showcases").update({ client_password: newCode }).eq("id", showcaseId);
    if (error) {
      setShowcasesError("Impossible de régénérer le code : " + error.message);
    } else {
      loadShowcases();
    }
  }

  function handleCopyShowcase(id, slug) {
    const text = showcaseLinkFor(slug);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopiedShowcaseId(id);
    setTimeout(() => setCopiedShowcaseId(null), 1800);
  }

  async function handleDeleteShowcase(id, name) {
    if (!supabase) return;
    if (!window.confirm(`Supprimer la vitrine de "${name}" ? Cette action est définitive.`)) return;
    const { error } = await supabase.from("showcases").delete().eq("id", id);
    if (error) {
      setShowcasesError("Suppression impossible : " + error.message);
    } else {
      loadShowcases();
    }
  }

  if (!authed) {
    return (
      <div style={styles.loginPage}>
        <form style={styles.loginBox} onSubmit={handleLogin}>
          <span style={styles.loginLogoMark}>EG</span>
          <h1 style={styles.loginTitle}>Espace admin</h1>
          <input
            type="password"
            placeholder="Mot de passe"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.newButton}>
            Entrer
          </button>
          {authError && <p style={{ color: "#B5402D", fontSize: "0.8rem" }}>{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
        .row:hover { background: #FAF7F2; }
        @media (max-width: 720px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: flex !important; }
        }
        @media (min-width: 721px) {
          .mobile-cards { display: none !important; }
        }
      `}</style>

      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.brandRow}>
            <span style={styles.logoMark}>EG</span>
            <div>
              <p style={styles.brandKicker}>EASY GESTION TOULOUSE</p>
              <h1 style={styles.brandTitle}>
                {view === "livres" ? "Mes livres d'or" : view === "catalogues" ? "Mes catalogues" : "Ma Vitrine"}
              </h1>
            </div>
          </div>
          {view === "livres" && (
            <button style={styles.newButton} onClick={() => setShowForm(true)}>
              + Nouveau livre d'or
            </button>
          )}
          {view === "catalogues" && (
            <button style={styles.newButton} onClick={() => setShowCatalogForm(true)}>
              + Nouveau catalogue
            </button>
          )}
          {view === "vitrine" && (
            <button style={styles.newButton} onClick={() => setShowShowcaseForm(true)}>
              + Nouvelle vitrine
            </button>
          )}
        </header>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{events.length}</span>
            <span style={styles.statLabel}>Livres d'or</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{events.reduce((sum, e) => sum + (e.messages?.[0]?.count ?? 0), 0)}</span>
            <span style={styles.statLabel}>Messages reçus</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{events.reduce((sum, e) => sum + (e.poll_questions?.[0]?.count ?? 0), 0)}</span>
            <span style={styles.statLabel}>Questions de sondage</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{catalogs.length}</span>
            <span style={styles.statLabel}>Catalogues</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{showcases.length}</span>
            <span style={styles.statLabel}>Ma Vitrine</span>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(view === "livres" ? styles.tabActive : {}) }}
            onClick={() => setView("livres")}
          >
            Livres d'or
          </button>
          <button
            style={{ ...styles.tab, ...(view === "catalogues" ? styles.tabActive : {}) }}
            onClick={() => setView("catalogues")}
          >
            Catalogues
          </button>
          <button
            style={{ ...styles.tab, ...(view === "vitrine" ? styles.tabActive : {}) }}
            onClick={() => setView("vitrine")}
          >
            Ma Vitrine
          </button>
        </div>

        {view === "livres" && (
          <>
            {loadError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{loadError}</p>}

            {showForm && (
              <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
                <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
                  <h2 style={styles.modalTitle}>Créer un livre d'or</h2>
                  <label style={styles.label}>
                    Nom du client
                    <input
                      style={styles.input}
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="ex. Sarah & Karim"
                      required
                      autoFocus
                    />
                  </label>
                  <label style={styles.label}>
                    Titre affiché sur le livre d'or
                    <input
                      style={styles.input}
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="ex. Le mariage de Sarah & Karim"
                      required
                    />
                  </label>
                  <label style={styles.label}>
                    Type d'événement
                    <select style={styles.input} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                      <option>Mariage</option>
                      <option>Anniversaire</option>
                      <option>Baptême</option>
                      <option>Baby Shower</option>
                      <option>Pot de départ</option>
                      <option>Départ en retraite</option>
                      <option>Henné</option>
                      <option>Circoncision</option>
                      <option>Fiançailles</option>
                      <option>Inauguration</option>
                      <option>Lancement de produit</option>
                      <option>Fête d'entreprise</option>
                      <option>Vos avis</option>
                      <option>Autre</option>
                    </select>
                  </label>
                  <label style={styles.label}>
                    Date de l'événement (optionnel)
                    <input
                      type="date"
                      style={styles.input}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#8A7F66", fontWeight: 400 }}>
                      Si renseignée, seul le formulaire "confirmation de présence" s'affiche avant cette date.
                    </span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {newPolls.map((poll, i) => (
                      <div key={i} style={styles.pollBlock}>
                        <div style={styles.pollBlockHead}>
                          <span style={styles.pollBlockLabel}>Question {i + 1}</span>
                          <button type="button" style={styles.removePollLink} onClick={() => removeNewPollBlock(i)}>
                            retirer
                          </button>
                        </div>
                        <input
                          style={styles.input}
                          value={poll.question}
                          onChange={(e) => updateNewPollQuestion(i, e.target.value)}
                          placeholder="ex. Qui va pleurer en premier ?"
                        />
                        {poll.options.map((opt, j) => (
                          <input
                            key={j}
                            style={{ ...styles.input, marginTop: "6px" }}
                            value={opt}
                            onChange={(e) => updateNewPollOption(i, j, e.target.value)}
                            placeholder={`Réponse ${j + 1}`}
                          />
                        ))}
                      </div>
                    ))}
                    {newPolls.length < 5 && (
                      <button type="button" style={styles.addPollButton} onClick={addNewPollBlock}>
                        + Ajouter une question de sondage
                      </button>
                    )}
                  </div>
                  <label style={styles.label}>
                    Lien de cagnotte (optionnel)
                    <input
                      style={styles.input}
                      value={cagnotteUrl}
                      onChange={(e) => setCagnotteUrl(e.target.value)}
                      placeholder="ex. https://onparticipe.fr/cagnottes/..."
                    />
                  </label>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setShowForm(false)}>
                      Annuler
                    </button>
                    <button type="submit" style={styles.newButton} disabled={creating}>
                      {creating ? "Création…" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editingPollFor && (
              <div style={styles.modalOverlay} onClick={() => setEditingPollFor(null)}>
                <div style={{ ...styles.modal, maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                  <h2 style={styles.modalTitle}>Sondages — {editingPollFor.client}</h2>
                  {loadingPolls && <p style={{ fontSize: "0.8rem", color: "#8A7F66" }}>Chargement…</p>}
                  {!loadingPolls && editingPolls.length === 0 && (
                    <p style={{ fontSize: "0.8rem", color: "#8A7F66" }}>Aucune question pour l'instant.</p>
                  )}
                  {!loadingPolls &&
                    editingPolls.map((poll, i) => (
                      <div key={poll.id || `new-${i}`} style={styles.pollBlock}>
                        <div style={styles.pollBlockHead}>
                          <span style={styles.pollBlockLabel}>Question {i + 1}</span>
                          <button type="button" style={styles.removePollLink} onClick={() => handleDeletePoll(i)}>
                            supprimer
                          </button>
                        </div>
                        <input
                          style={styles.input}
                          value={poll.question}
                          onChange={(e) => updateEditingPollQuestion(i, e.target.value)}
                          placeholder="ex. Qui va pleurer en premier ?"
                        />
                        {poll.options.map((opt, j) => (
                          <input
                            key={j}
                            style={{ ...styles.input, marginTop: "6px" }}
                            value={opt}
                            onChange={(e) => updateEditingPollOption(i, j, e.target.value)}
                            placeholder={`Réponse ${j + 1}`}
                          />
                        ))}
                        <button
                          type="button"
                          style={{ ...styles.newButton, marginTop: "8px", alignSelf: "flex-start" }}
                          onClick={() => handleSaveOnePoll(i)}
                          disabled={savingPollId === i}
                        >
                          {savingPollId === i ? "Enregistrement…" : poll.id ? "Mettre à jour" : "Ajouter"}
                        </button>
                        {!poll.id && (
                          <p style={{ fontSize: "0.7rem", color: "#8A7F66", margin: "4px 0 0" }}>
                            Pas encore enregistrée — clique "Ajouter".
                          </p>
                        )}
                      </div>
                    ))}
                  {editingPolls.length < 5 && (
                    <button type="button" style={styles.addPollButton} onClick={addEditingPollBlock}>
                      + Ajouter une question de sondage
                    </button>
                  )}
                  <p style={{ fontSize: "0.72rem", color: "#8A7F66", margin: 0 }}>
                    Modifier une question remet ses votes à zéro.
                  </p>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setEditingPollFor(null)}>
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {editingCagnotteFor && (
              <div style={styles.modalOverlay} onClick={() => setEditingCagnotteFor(null)}>
                <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSaveCagnotte}>
                  <h2 style={styles.modalTitle}>Cagnotte — {editingCagnotteFor.client}</h2>
                  <label style={styles.label}>
                    Lien de cagnotte
                    <input
                      style={styles.input}
                      value={editCagnotteUrl}
                      onChange={(e) => setEditCagnotteUrl(e.target.value)}
                      placeholder="ex. https://onparticipe.fr/cagnottes/..."
                      autoFocus
                    />
                  </label>
                  <p style={{ fontSize: "0.72rem", color: "#8A7F66", margin: 0 }}>
                    Laisse vide pour retirer la cagnotte du livre d'or.
                  </p>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setEditingCagnotteFor(null)}>
                      Annuler
                    </button>
                    <button type="submit" style={styles.newButton} disabled={savingCagnotte}>
                      {savingCagnotte ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editingDateFor && (
              <div style={styles.modalOverlay} onClick={() => setEditingDateFor(null)}>
                <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSaveDate}>
                  <h2 style={styles.modalTitle}>Date — {editingDateFor.client}</h2>
                  <label style={styles.label}>
                    Date de l'événement
                    <input
                      type="date"
                      style={styles.input}
                      value={editEventDate}
                      onChange={(e) => setEditEventDate(e.target.value)}
                      autoFocus
                    />
                  </label>
                  <p style={{ fontSize: "0.72rem", color: "#8A7F66", margin: 0 }}>
                    Avant cette date, seule la confirmation de présence s'affiche aux invités. Laisse vide pour désactiver.
                  </p>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setEditingDateFor(null)}>
                      Annuler
                    </button>
                    <button type="submit" style={styles.newButton} disabled={savingDate}>
                      {savingDate ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editingGiftsFor && (
              <div style={styles.modalOverlay} onClick={() => setEditingGiftsFor(null)}>
                <div style={{ ...styles.modal, maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                  <h2 style={styles.modalTitle}>Liste de cadeaux — {editingGiftsFor.client}</h2>
                  {loadingGifts && <p style={{ fontSize: "0.8rem", color: "#8A7F66" }}>Chargement…</p>}
                  {!loadingGifts && editingGifts.length === 0 && (
                    <p style={{ fontSize: "0.8rem", color: "#8A7F66" }}>Aucun cadeau pour l'instant.</p>
                  )}
                  {!loadingGifts &&
                    editingGifts.map((gift, i) => (
                      <div key={gift.id || `new-${i}`} style={styles.pollBlock}>
                        <div style={styles.pollBlockHead}>
                          <span style={styles.pollBlockLabel}>Cadeau {i + 1}</span>
                          <button type="button" style={styles.removePollLink} onClick={() => handleDeleteGift(i)}>
                            supprimer
                          </button>
                        </div>
                        <input
                          style={styles.input}
                          value={gift.name}
                          onChange={(e) => updateEditingGift(i, "name", e.target.value)}
                          placeholder="ex. Machine à café Nespresso"
                        />
                        <input
                          style={{ ...styles.input, marginTop: "6px" }}
                          value={gift.link}
                          onChange={(e) => updateEditingGift(i, "link", e.target.value)}
                          placeholder="Lien vers le produit (optionnel)"
                        />
                        <input
                          style={{ ...styles.input, marginTop: "6px" }}
                          value={gift.price}
                          onChange={(e) => updateEditingGift(i, "price", e.target.value)}
                          placeholder="Prix indicatif (optionnel, ex. 89€)"
                        />
                        {gift.reservedBy && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "0.75rem", color: "#3F7A52" }}>
                            <span>✅ Réservé par {gift.reservedBy}</span>
                            <button type="button" style={styles.removePollLink} onClick={() => handleUnreserveGift(i)}>
                              libérer
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          style={{ ...styles.newButton, marginTop: "8px", alignSelf: "flex-start" }}
                          onClick={() => handleSaveOneGift(i)}
                          disabled={savingGiftId === i}
                        >
                          {savingGiftId === i ? "Enregistrement…" : gift.id ? "Mettre à jour" : "Ajouter"}
                        </button>
                        {!gift.id && (
                          <p style={{ fontSize: "0.7rem", color: "#8A7F66", margin: "4px 0 0" }}>
                            Pas encore enregistré — clique "Ajouter".
                          </p>
                        )}
                      </div>
                    ))}
                  {editingGifts.length < 20 && (
                    <button type="button" style={styles.addPollButton} onClick={addEditingGiftBlock}>
                      + Ajouter un cadeau
                    </button>
                  )}
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setEditingGiftsFor(null)}>
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

            {!loading && events.length === 0 && !loadError && (
              <div style={styles.emptyState}>
                <p style={{ fontSize: "1.4rem", fontFamily: "'Caveat', cursive", margin: 0 }}>
                  Aucun livre d'or créé pour l'instant
                </p>
                <p style={{ color: "#8A7F66", marginTop: "6px" }}>
                  Clique sur "Nouveau livre d'or" pour ton premier client
                </p>
              </div>
            )}

            {!loading && events.length > 0 && (
              <>
                <table className="desktop-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Lien</th>
                      <th style={styles.th}>Espace</th>
                      <th style={styles.th}>QR code</th>
                      <th style={styles.th}>Messages</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr className="row" key={ev.id}>
                        <td style={styles.td}>
                          <strong>{ev.client}</strong>
                          <div style={styles.subText}>{ev.event_title}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...badgeColors(ev.event_type) }}>{ev.event_type}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <span style={styles.linkText}>{linkFor(ev.slug)}</span>
                            <button style={styles.iconButton} onClick={() => handleCopy(ev.id, ev.slug)}>
                              {copiedId === ev.id ? "✓" : "copier"}
                            </button>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <code style={styles.codeText}>{ev.client_password || "—"}</code>
                            <button
                              style={styles.iconButton}
                              onClick={() => {
                                const text = `Lien : ${espaceLinkFor(ev.slug)}\nCode d'accès : ${ev.client_password}`;
                                if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                                setCopiedId(`espace-${ev.id}`);
                                setTimeout(() => setCopiedId(null), 1800);
                              }}
                            >
                              {copiedId === `espace-${ev.id}` ? "✓" : "copier lien + code"}
                            </button>
                          </div>
                          <button style={styles.regenerateButton} onClick={() => handleRegenerateEventCode(ev.id)}>
                            régénérer le code
                          </button>
                        </td>
                        <td style={styles.td}>
                          <a href={qrUrlForLink(linkFor(ev.slug))} target="_blank" rel="noreferrer" style={styles.qrThumb}>
                            <img
                              src={qrUrlForLink(linkFor(ev.slug))}
                              alt={`QR code pour ${ev.client}`}
                              width={40}
                              height={40}
                              style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                            />
                          </a>
                          <a href={qrUrlHighRes(linkFor(ev.slug))} download={`qr-${ev.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </td>
                        <td style={styles.td}>{ev.messages?.[0]?.count ?? 0}</td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <a href={`/${ev.slug}/imprimer`} target="_blank" rel="noreferrer" style={styles.iconButton}>
                              imprimer
                            </a>
                            <a href={`/${ev.slug}/livre-souvenir`} target="_blank" rel="noreferrer" style={styles.iconButton}>
                              livre souvenir
                            </a>
                            <button style={styles.iconButton} onClick={() => openPollEditor(ev)}>
                              sondage
                            </button>
                            <button style={styles.iconButton} onClick={() => openCagnotteEditor(ev)}>
                              cagnotte
                            </button>
                            <button style={styles.iconButton} onClick={() => openDateEditor(ev)}>
                              date
                            </button>
                            <button style={styles.iconButton} onClick={() => openGiftEditor(ev)}>
                              cadeaux
                            </button>
                            <button style={styles.iconButtonDanger} onClick={() => handleDeleteEvent(ev.id, ev.client)}>
                              supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mobile-cards" style={styles.mobileCards}>
                  {events.map((ev) => (
                    <div style={styles.card} key={ev.id}>
                      <div style={styles.cardHeader}>
                        <div>
                          <strong>{ev.client}</strong>
                          <div style={styles.subText}>{ev.event_title}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <img
                            src={qrUrlForLink(linkFor(ev.slug))}
                            alt={`QR code pour ${ev.client}`}
                            width={56}
                            height={56}
                            style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                          />
                          <a href={qrUrlHighRes(linkFor(ev.slug))} download={`qr-${ev.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </div>
                      </div>
                      <span style={{ ...styles.badge, ...badgeColors(ev.event_type) }}>{ev.event_type}</span>
                      <div style={styles.linkRow}>
                        <span style={styles.linkText}>{linkFor(ev.slug)}</span>
                        <button style={styles.iconButton} onClick={() => handleCopy(ev.id, ev.slug)}>
                          {copiedId === ev.id ? "✓" : "copier"}
                        </button>
                      </div>
                      <div style={styles.linkRow}>
                        <code style={styles.codeText}>Code espace : {ev.client_password || "—"}</code>
                        <button
                          style={styles.iconButton}
                          onClick={() => {
                            const text = `Lien : ${espaceLinkFor(ev.slug)}\nCode d'accès : ${ev.client_password}`;
                            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                            setCopiedId(`espace-${ev.id}`);
                            setTimeout(() => setCopiedId(null), 1800);
                          }}
                        >
                          {copiedId === `espace-${ev.id}` ? "✓" : "copier"}
                        </button>
                      </div>
                      <div style={styles.subText}>{ev.messages?.[0]?.count ?? 0} message(s)</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a href={`/${ev.slug}/imprimer`} target="_blank" rel="noreferrer" style={{ ...styles.iconButton, textAlign: "center", flex: 1 }}>
                          imprimer le souvenir
                        </a>
                        <a href={`/${ev.slug}/livre-souvenir`} target="_blank" rel="noreferrer" style={{ ...styles.iconButton, textAlign: "center", flex: 1 }}>
                          livre souvenir
                        </a>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={{ ...styles.iconButton, flex: 1 }} onClick={() => openPollEditor(ev)}>
                          sondage
                        </button>
                        <button style={{ ...styles.iconButton, flex: 1 }} onClick={() => openCagnotteEditor(ev)}>
                          cagnotte
                        </button>
                        <button style={{ ...styles.iconButton, flex: 1 }} onClick={() => openDateEditor(ev)}>
                          date
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={{ ...styles.iconButton, flex: 1 }} onClick={() => openGiftEditor(ev)}>
                          cadeaux
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={{ ...styles.iconButtonDanger, flex: 1 }} onClick={() => handleDeleteEvent(ev.id, ev.client)}>
                          supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {view === "catalogues" && (
          <>
            {catalogsError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{catalogsError}</p>}

            {showCatalogForm && (
              <div style={styles.modalOverlay} onClick={() => setShowCatalogForm(false)}>
                <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateCatalog}>
                  <h2 style={styles.modalTitle}>Créer un catalogue</h2>
                  <label style={styles.label}>
                    Nom du client
                    <input
                      style={styles.input}
                      value={catalogClient}
                      onChange={(e) => setCatalogClient(e.target.value)}
                      placeholder="ex. Boulangerie Amel"
                      required
                      autoFocus
                    />
                  </label>
                  <label style={styles.label}>
                    Titre affiché sur le catalogue
                    <input
                      style={styles.input}
                      value={catalogTitle}
                      onChange={(e) => setCatalogTitle(e.target.value)}
                      placeholder="ex. Nos produits"
                      required
                    />
                  </label>
                  <div style={styles.formRow2}>
                    <label style={styles.label}>
                      Couleur principale
                      <input
                        type="color"
                        value={catalogColor}
                        onChange={(e) => setCatalogColor(e.target.value)}
                        style={styles.colorInput}
                      />
                    </label>
                    <label style={styles.label}>
                      Police du titre
                      <select style={styles.input} value={catalogFont} onChange={(e) => setCatalogFont(e.target.value)}>
                        <option value="manuscrite">Manuscrite (Caveat)</option>
                        <option value="moderne">Moderne (Inter)</option>
                        <option value="elegante">Élégante (Playfair)</option>
                      </select>
                    </label>
                  </div>
                  <div style={styles.swatchRow}>
                    {[
                      ["#1E1E1E", "Noir"],
                      ["#C9B790", "Beige"],
                      ["#355E3B", "Vert"],
                      ["#2A4D69", "Bleu"],
                      ["#B5402D", "Rouge"],
                    ].map(([hex, label]) => (
                      <button
                        type="button"
                        key={hex}
                        onClick={() => setCatalogColor(hex)}
                        title={label}
                        style={{
                          ...styles.swatch,
                          background: hex,
                          outline: catalogColor === hex ? "2px solid #1E2A3A" : "1px solid #D8CCAB",
                        }}
                      />
                    ))}
                  </div>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setShowCatalogForm(false)}>
                      Annuler
                    </button>
                    <button type="submit" style={styles.newButton} disabled={creatingCatalog}>
                      {creatingCatalog ? "Création…" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {catalogsLoading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

            {!catalogsLoading && catalogs.length === 0 && !catalogsError && (
              <div style={styles.emptyState}>
                <p style={{ fontSize: "1.4rem", fontFamily: "'Caveat', cursive", margin: 0 }}>
                  Aucun catalogue créé pour l'instant
                </p>
                <p style={{ color: "#8A7F66", marginTop: "6px" }}>
                  Clique sur "Nouveau catalogue" pour ton premier client
                </p>
              </div>
            )}

            {!catalogsLoading && catalogs.length > 0 && (
              <>
                <table className="desktop-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Lien</th>
                      <th style={styles.th}>Accès client</th>
                      <th style={styles.th}>QR code</th>
                      <th style={styles.th}>Produits</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogs.map((cat) => (
                      <tr className="row" key={cat.id}>
                        <td style={styles.td}>
                          <strong>{cat.client}</strong>
                          <div style={styles.subText}>{cat.catalog_title}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <span style={styles.linkText}>{catalogLinkFor(cat.slug)}</span>
                            <button style={styles.iconButton} onClick={() => handleCopyCatalog(cat.id, cat.slug)}>
                              {copiedCatalogId === cat.id ? "✓" : "copier"}
                            </button>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <code style={styles.codeText}>{cat.client_password || "—"}</code>
                            <button
                              style={styles.iconButton}
                              onClick={() => {
                                const text = `Lien : ${clientManageLinkFor(cat.slug)}\nCode d'accès : ${cat.client_password}`;
                                if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                                setCopiedCatalogId(`gerer-${cat.id}`);
                                setTimeout(() => setCopiedCatalogId(null), 1800);
                              }}
                            >
                              {copiedCatalogId === `gerer-${cat.id}` ? "✓" : "copier lien + code"}
                            </button>
                          </div>
                          <button style={styles.regenerateButton} onClick={() => handleRegenerateCode(cat.id)}>
                            régénérer le code
                          </button>
                        </td>
                        <td style={styles.td}>
                          <a href={qrUrlForLink(catalogLinkFor(cat.slug))} target="_blank" rel="noreferrer" style={styles.qrThumb}>
                            <img
                              src={qrUrlForLink(catalogLinkFor(cat.slug))}
                              alt={`QR code pour ${cat.client}`}
                              width={40}
                              height={40}
                              style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                            />
                          </a>
                          <a href={qrUrlHighRes(catalogLinkFor(cat.slug))} download={`qr-${cat.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </td>
                        <td style={styles.td}>{cat.catalog_products?.[0]?.count ?? 0}</td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <a href={`/admin/catalogue/${cat.id}`} style={styles.iconButton}>
                              gérer les produits
                            </a>
                            <button style={styles.iconButtonDanger} onClick={() => handleDeleteCatalog(cat.id, cat.client)}>
                              supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mobile-cards" style={styles.mobileCards}>
                  {catalogs.map((cat) => (
                    <div style={styles.card} key={cat.id}>
                      <div style={styles.cardHeader}>
                        <div>
                          <strong>{cat.client}</strong>
                          <div style={styles.subText}>{cat.catalog_title}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <img
                            src={qrUrlForLink(catalogLinkFor(cat.slug))}
                            alt={`QR code pour ${cat.client}`}
                            width={56}
                            height={56}
                            style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                          />
                          <a href={qrUrlHighRes(catalogLinkFor(cat.slug))} download={`qr-${cat.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </div>
                      </div>
                      <div style={styles.linkRow}>
                        <span style={styles.linkText}>{catalogLinkFor(cat.slug)}</span>
                        <button style={styles.iconButton} onClick={() => handleCopyCatalog(cat.id, cat.slug)}>
                          {copiedCatalogId === cat.id ? "✓" : "copier"}
                        </button>
                      </div>
                      <div style={styles.linkRow}>
                        <code style={styles.codeText}>Code client : {cat.client_password || "—"}</code>
                        <button
                          style={styles.iconButton}
                          onClick={() => {
                            const text = `Lien : ${clientManageLinkFor(cat.slug)}\nCode d'accès : ${cat.client_password}`;
                            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                            setCopiedCatalogId(`gerer-${cat.id}`);
                            setTimeout(() => setCopiedCatalogId(null), 1800);
                          }}
                        >
                          {copiedCatalogId === `gerer-${cat.id}` ? "✓" : "copier lien + code"}
                        </button>
                      </div>
                      <div style={styles.subText}>{cat.catalog_products?.[0]?.count ?? 0} produit(s)</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a href={`/admin/catalogue/${cat.id}`} style={{ ...styles.iconButton, textAlign: "center", flex: 1 }}>
                          gérer les produits
                        </a>
                        <button style={styles.iconButtonDanger} onClick={() => handleDeleteCatalog(cat.id, cat.client)}>
                          supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {view === "vitrine" && (
          <>
            {showcasesError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{showcasesError}</p>}

            {showShowcaseForm && (
              <div style={styles.modalOverlay} onClick={() => setShowShowcaseForm(false)}>
                <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateShowcase}>
                  <h2 style={styles.modalTitle}>Créer une vitrine</h2>
                  <label style={styles.label}>
                    Nom du client / commerce
                    <input
                      style={styles.input}
                      value={showcaseBusinessName}
                      onChange={(e) => setShowcaseBusinessName(e.target.value)}
                      placeholder="ex. Léa Ferrand Coiffure"
                      required
                      autoFocus
                    />
                  </label>
                  <label style={styles.label}>
                    Accroche <span style={{ fontWeight: 400, color: "#8A7F66" }}>(optionnel)</span>
                    <input
                      style={styles.input}
                      value={showcaseTagline}
                      onChange={(e) => setShowcaseTagline(e.target.value)}
                      placeholder="ex. Coiffure & stylisme"
                    />
                  </label>
                  <div style={styles.swatchRow}>
                    {Object.entries(VITRINE_THEMES).map(([key, theme]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setShowcaseTheme(key)}
                        title={theme.label}
                        style={{
                          ...styles.swatch,
                          background: theme.swatch,
                          outline: showcaseTheme === key ? "2px solid #1E2A3A" : "1px solid #D8CCAB",
                        }}
                      />
                    ))}
                  </div>
                  <div style={styles.modalActions}>
                    <button type="button" style={styles.cancelButton} onClick={() => setShowShowcaseForm(false)}>
                      Annuler
                    </button>
                    <button type="submit" style={styles.newButton} disabled={creatingShowcase}>
                      {creatingShowcase ? "Création…" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showcasesLoading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

            {!showcasesLoading && showcases.length === 0 && !showcasesError && (
              <div style={styles.emptyState}>
                <p style={{ fontSize: "1.4rem", fontFamily: "'Caveat', cursive", margin: 0 }}>
                  Aucune vitrine créée pour l'instant
                </p>
                <p style={{ color: "#8A7F66", marginTop: "6px" }}>
                  Clique sur "Nouvelle vitrine" pour ton premier client
                </p>
              </div>
            )}

            {!showcasesLoading && showcases.length > 0 && (
              <>
                <table className="desktop-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Lien</th>
                      <th style={styles.th}>Accès client</th>
                      <th style={styles.th}>QR code</th>
                      <th style={styles.th}>Réalisations</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {showcases.map((sc) => (
                      <tr className="row" key={sc.id}>
                        <td style={styles.td}>
                          <strong>{sc.business_name}</strong>
                          <div style={styles.subText}>{sc.tagline}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <span style={styles.linkText}>{showcaseLinkFor(sc.slug)}</span>
                            <button style={styles.iconButton} onClick={() => handleCopyShowcase(sc.id, sc.slug)}>
                              {copiedShowcaseId === sc.id ? "✓" : "copier"}
                            </button>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.linkRow}>
                            <code style={styles.codeText}>{sc.client_password || "—"}</code>
                            <button
                              style={styles.iconButton}
                              onClick={() => {
                                const text = `Lien : ${showcaseManageLinkFor(sc.slug)}\nCode d'accès : ${sc.client_password}`;
                                if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                                setCopiedShowcaseId(`gerer-${sc.id}`);
                                setTimeout(() => setCopiedShowcaseId(null), 1800);
                              }}
                            >
                              {copiedShowcaseId === `gerer-${sc.id}` ? "✓" : "copier lien + code"}
                            </button>
                          </div>
                          <button style={styles.regenerateButton} onClick={() => handleRegenerateShowcaseCode(sc.id)}>
                            régénérer le code
                          </button>
                        </td>
                        <td style={styles.td}>
                          <a href={qrUrlForLink(showcaseLinkFor(sc.slug))} target="_blank" rel="noreferrer" style={styles.qrThumb}>
                            <img
                              src={qrUrlForLink(showcaseLinkFor(sc.slug))}
                              alt={`QR code pour ${sc.business_name}`}
                              width={40}
                              height={40}
                              style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                            />
                          </a>
                          <a href={qrUrlHighRes(showcaseLinkFor(sc.slug))} download={`qr-${sc.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </td>
                        <td style={styles.td}>{sc.showcase_products?.[0]?.count ?? 0}</td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <a href={showcaseManageLinkFor(sc.slug)} target="_blank" rel="noreferrer" style={styles.iconButton}>
                              gérer
                            </a>
                            <button style={styles.iconButtonDanger} onClick={() => handleDeleteShowcase(sc.id, sc.business_name)}>
                              supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mobile-cards" style={styles.mobileCards}>
                  {showcases.map((sc) => (
                    <div style={styles.card} key={sc.id}>
                      <div style={styles.cardHeader}>
                        <div>
                          <strong>{sc.business_name}</strong>
                          <div style={styles.subText}>{sc.tagline}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <img
                            src={qrUrlForLink(showcaseLinkFor(sc.slug))}
                            alt={`QR code pour ${sc.business_name}`}
                            width={56}
                            height={56}
                            style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                          />
                          <a href={qrUrlHighRes(showcaseLinkFor(sc.slug))} download={`qr-${sc.slug}.png`} target="_blank" rel="noreferrer" style={styles.qrDownload}>
                            télécharger HD
                          </a>
                        </div>
                      </div>
                      <div style={styles.linkRow}>
                        <span style={styles.linkText}>{showcaseLinkFor(sc.slug)}</span>
                        <button style={styles.iconButton} onClick={() => handleCopyShowcase(sc.id, sc.slug)}>
                          {copiedShowcaseId === sc.id ? "✓" : "copier"}
                        </button>
                      </div>
                      <div style={styles.linkRow}>
                        <code style={styles.codeText}>Code client : {sc.client_password || "—"}</code>
                        <button
                          style={styles.iconButton}
                          onClick={() => {
                            const text = `Lien : ${showcaseManageLinkFor(sc.slug)}\nCode d'accès : ${sc.client_password}`;
                            if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                            setCopiedShowcaseId(`gerer-${sc.id}`);
                            setTimeout(() => setCopiedShowcaseId(null), 1800);
                          }}
                        >
                          {copiedShowcaseId === `gerer-${sc.id}` ? "✓" : "copier lien + code"}
                        </button>
                      </div>
                      <div style={styles.subText}>{sc.showcase_products?.[0]?.count ?? 0} réalisation(s)</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a href={showcaseManageLinkFor(sc.slug)} target="_blank" rel="noreferrer" style={{ ...styles.iconButton, textAlign: "center", flex: 1 }}>
                          gérer
                        </a>
                        <button style={styles.iconButtonDanger} onClick={() => handleDeleteShowcase(sc.id, sc.business_name)}>
                          supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  loginPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F7F4EF",
    fontFamily: "'Inter', sans-serif",
  },
  loginBox: {
    background: "#FFFFFF",
    padding: "32px 28px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    width: "280px",
    border: "1px solid #EAE3D6",
    boxShadow: "0 1px 2px rgba(20,15,10,0.04), 0 20px 40px -20px rgba(20,15,10,0.15)",
  },
  loginLogoMark: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    background: "#B5402D",
    color: "#FFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.9rem",
    letterSpacing: "0.02em",
  },
  loginTitle: { margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#221D18" },
  page: {
    minHeight: "100vh",
    background: "#F7F4EF",
    fontFamily: "'Inter', sans-serif",
    color: "#221D18",
    padding: "28px 16px",
    display: "flex",
    justifyContent: "center",
  },
  shell: { width: "100%", maxWidth: "860px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  },
  brandRow: { display: "flex", alignItems: "center", gap: "12px" },
  logoMark: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#B5402D",
    color: "#FFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.8rem",
    flex: "none",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#FFFFFF",
    border: "1px solid #EAE3D6",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statNumber: { fontSize: "1.5rem", fontWeight: 800, color: "#221D18", lineHeight: 1.1 },
  statLabel: { fontSize: "0.72rem", color: "#8A7F66", fontWeight: 600 },
  tabs: { display: "flex", gap: "4px", marginBottom: "22px", background: "#EFEAE0", borderRadius: "12px", padding: "4px", width: "fit-content" },
  tab: {
    background: "none",
    border: "none",
    borderRadius: "9px",
    padding: "8px 18px",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#8A7F66",
  },
  tabActive: { background: "#FFFFFF", color: "#221D18", boxShadow: "0 1px 3px rgba(20,15,10,0.1)" },
  brandKicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 700 },
  brandTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "1.5rem",
    fontWeight: 800,
    margin: "2px 0 0 0",
    color: "#221D18",
    letterSpacing: "-0.01em",
  },
  newButton: {
    background: "#B5402D",
    color: "#FFF",
    border: "none",
    borderRadius: "11px",
    padding: "11px 18px",
    fontSize: "0.85rem",
    fontWeight: 700,
    boxShadow: "0 1px 2px rgba(181,64,45,0.2), 0 8px 16px -8px rgba(181,64,45,0.35)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30,26,20,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 10,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "26px",
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 30px 60px -20px rgba(0,0,0,0.3)",
  },
  modalTitle: { fontFamily: "'Inter', sans-serif", fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#221D18" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636" },
  formRow2: { display: "flex", gap: "12px" },
  colorInput: { width: "70px", height: "38px", padding: "2px", border: "1px solid #EAE3D6", borderRadius: "8px", background: "#fff" },
  swatchRow: { display: "flex", gap: "8px" },
  swatch: { width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer" },
  input: { fontSize: "0.9rem", padding: "10px 12px", border: "1px solid #EAE3D6", borderRadius: "10px", background: "#FCFAF6", color: "#221D18" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  cancelButton: { background: "none", border: "1px solid #EAE3D6", borderRadius: "10px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636", fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px dashed #D8CCAB" },
  table: { width: "100%", borderCollapse: "collapse", background: "#FFFFFF", borderRadius: "16px", overflow: "hidden", border: "1px solid #EAE3D6" },
  th: { textAlign: "left", fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A6792B", fontWeight: 700, padding: "13px 14px", borderBottom: "1px solid #EAE3D6", background: "#FBF8F3" },
  td: { padding: "13px 14px", fontSize: "0.85rem", verticalAlign: "middle", borderBottom: "1px solid #F1ECE1" },
  subText: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  badge: { fontSize: "0.68rem", padding: "4px 10px", borderRadius: "20px", fontWeight: 700 },
  linkRow: { display: "flex", alignItems: "center", gap: "6px" },
  linkText: { fontSize: "0.75rem", color: "#221D18", fontFamily: "monospace", wordBreak: "break-all" },
  codeText: { fontSize: "0.8rem", color: "#B5402D", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" },
  regenerateButton: { background: "none", border: "none", color: "#8A7F66", fontSize: "0.65rem", textDecoration: "underline", padding: "4px 0 0 0" },
  iconButton: { background: "#F3EEE3", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "0.7rem", fontWeight: 600, color: "#5B4636" },
  iconButtonDanger: { background: "#FBEAE6", color: "#B5402D", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "0.7rem", fontWeight: 600 },
  qrThumb: { display: "flex", alignItems: "center", gap: "4px" },
  qrDownload: { fontSize: "0.62rem", color: "#B5402D", fontWeight: 600, textDecoration: "none", marginTop: "4px", display: "inline-block" },
  mobileCards: { display: "none", flexDirection: "column", gap: "12px" },
  card: { background: "#FFFFFF", borderRadius: "16px", padding: "16px", border: "1px solid #EAE3D6", display: "flex", flexDirection: "column", gap: "10px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  pollBlock: { display: "flex", flexDirection: "column", background: "#FBF8F3", border: "1px solid #EAE3D6", borderRadius: "12px", padding: "12px" },
  pollBlockHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  pollBlockLabel: { fontSize: "0.72rem", fontWeight: 700, color: "#8A7F66", textTransform: "uppercase", letterSpacing: "0.04em" },
  removePollLink: { background: "none", border: "none", color: "#B5402D", fontSize: "0.7rem", textDecoration: "underline", padding: 0 },
  addPollButton: { background: "none", border: "1.5px dashed #D8CCAB", borderRadius: "12px", padding: "10px", fontSize: "0.8rem", fontWeight: 600, color: "#8A7F66" },
};
