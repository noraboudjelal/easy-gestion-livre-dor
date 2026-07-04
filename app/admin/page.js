"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  const [view, setView] = useState("livres"); // "livres" | "catalogues"

  // --- Livres d'or ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("Mariage");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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
      .select("*, messages(count)")
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

  useEffect(() => {
    if (authed) {
      loadEvents();
      loadCatalogs();
    }
  }, [authed, loadEvents, loadCatalogs]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!client.trim() || !eventTitle.trim() || !supabase) return;
    setCreating(true);
    const slug = `${slugify(client)}-${shortCode()}`;
    const { error } = await supabase.from("events").insert({
      client: client.trim(),
      event_title: eventTitle.trim(),
      event_type: eventType,
      slug,
    });
    setCreating(false);
    if (error) {
      setLoadError("Création impossible : " + error.message);
      return;
    }
    setClient("");
    setEventTitle("");
    setEventType("Mariage");
    setShowForm(false);
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

  function catalogLinkFor(slug) {
    if (typeof window === "undefined") return slug;
    return `${window.location.origin}/catalogue/${slug}`;
  }

  function qrUrlForLink(link) {
    const data = encodeURIComponent(link);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${data}`;
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

  if (!authed) {
    return (
      <div style={styles.loginPage}>
        <form style={styles.loginBox} onSubmit={handleLogin}>
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
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
        .row:hover { background: #FBF8F1; }
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
          <div>
            <p style={styles.brandKicker}>EASY GESTION TOULOUSE</p>
            <h1 style={styles.brandTitle}>{view === "livres" ? "Mes livres d'or" : "Mes catalogues"}</h1>
          </div>
          {view === "livres" ? (
            <button style={styles.newButton} onClick={() => setShowForm(true)}>
              + Nouveau livre d'or
            </button>
          ) : (
            <button style={styles.newButton} onClick={() => setShowCatalogForm(true)}>
              + Nouveau catalogue
            </button>
          )}
        </header>

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
                      <option>Pot de départ</option>
                      <option>Autre</option>
                    </select>
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
                          <span style={styles.badge}>{ev.event_type}</span>
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
                          <a href={qrUrlForLink(linkFor(ev.slug))} target="_blank" rel="noreferrer" style={styles.qrThumb}>
                            <img
                              src={qrUrlForLink(linkFor(ev.slug))}
                              alt={`QR code pour ${ev.client}`}
                              width={40}
                              height={40}
                              style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                            />
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
                        <img
                          src={qrUrlForLink(linkFor(ev.slug))}
                          alt={`QR code pour ${ev.client}`}
                          width={56}
                          height={56}
                          style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                        />
                      </div>
                      <span style={styles.badge}>{ev.event_type}</span>
                      <div style={styles.linkRow}>
                        <span style={styles.linkText}>{linkFor(ev.slug)}</span>
                        <button style={styles.iconButton} onClick={() => handleCopy(ev.id, ev.slug)}>
                          {copiedId === ev.id ? "✓" : "copier"}
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
                        <button style={styles.iconButtonDanger} onClick={() => handleDeleteEvent(ev.id, ev.client)}>
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
                          <a href={qrUrlForLink(catalogLinkFor(cat.slug))} target="_blank" rel="noreferrer" style={styles.qrThumb}>
                            <img
                              src={qrUrlForLink(catalogLinkFor(cat.slug))}
                              alt={`QR code pour ${cat.client}`}
                              width={40}
                              height={40}
                              style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                            />
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
                        <img
                          src={qrUrlForLink(catalogLinkFor(cat.slug))}
                          alt={`QR code pour ${cat.client}`}
                          width={56}
                          height={56}
                          style={{ borderRadius: "4px", border: "1px solid #E6DCC2" }}
                        />
                      </div>
                      <div style={styles.linkRow}>
                        <span style={styles.linkText}>{catalogLinkFor(cat.slug)}</span>
                        <button style={styles.iconButton} onClick={() => handleCopyCatalog(cat.id, cat.slug)}>
                          {copiedCatalogId === cat.id ? "✓" : "copier"}
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
    background: "#EFE9DA",
    fontFamily: "system-ui, sans-serif",
  },
  loginBox: {
    background: "#FCFAF2",
    padding: "28px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "260px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  loginTitle: { margin: 0, fontSize: "1.2rem", color: "#1E2A3A" },
  page: {
    minHeight: "100vh",
    background: "#EFE9DA",
    fontFamily: "'Inter', sans-serif",
    color: "#2A241D",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
  },
  shell: { width: "100%", maxWidth: "780px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "16px",
  },
  tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
  tab: {
    background: "none",
    border: "1px solid #D8CCAB",
    borderRadius: "20px",
    padding: "7px 16px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#5B4636",
  },
  tabActive: { background: "#B5402D", color: "#FCFAF2", borderColor: "#B5402D" },
  brandKicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  brandTitle: {
    fontFamily: "'Caveat', cursive",
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
    color: "#1E2A3A",
  },
  newButton: {
    background: "#B5402D",
    color: "#FCFAF2",
    border: "none",
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(30,26,20,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 10,
  },
  modal: {
    background: "#FCFAF2",
    borderRadius: "10px",
    padding: "22px",
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  modalTitle: { fontFamily: "'Caveat', cursive", fontSize: "1.6rem", margin: 0, color: "#1E2A3A" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636" },
  formRow2: { display: "flex", gap: "12px" },
  colorInput: { width: "70px", height: "38px", padding: "2px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff" },
  swatchRow: { display: "flex", gap: "8px" },
  swatch: { width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer" },
  input: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  cancelButton: { background: "none", border: "1px solid #D8CCAB", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636" },
  emptyState: { textAlign: "center", padding: "40px 20px", background: "#FCFAF2", borderRadius: "10px", border: "1px dashed #D8CCAB" },
  table: { width: "100%", borderCollapse: "collapse", background: "#FCFAF2", borderRadius: "10px", overflow: "hidden" },
  th: { textAlign: "left", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A6792B", padding: "12px 14px", borderBottom: "2px solid #E6DCC2" },
  td: { padding: "12px 14px", fontSize: "0.85rem", verticalAlign: "middle", borderBottom: "1px solid #EFE9DA" },
  subText: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  badge: { fontSize: "0.7rem", background: "#EFE4C8", color: "#7A5A1E", padding: "3px 9px", borderRadius: "20px", fontWeight: 600 },
  linkRow: { display: "flex", alignItems: "center", gap: "6px" },
  linkText: { fontSize: "0.75rem", color: "#1E2A3A", fontFamily: "monospace", wordBreak: "break-all" },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "5px 8px", fontSize: "0.7rem" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "5px 8px", fontSize: "0.7rem" },
  qrThumb: { display: "flex", alignItems: "center", gap: "4px" },
  mobileCards: { display: "none", flexDirection: "column", gap: "12px" },
  card: { background: "#FCFAF2", borderRadius: "10px", padding: "14px", border: "1px solid #E6DCC2", display: "flex", flexDirection: "column", gap: "8px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
};
