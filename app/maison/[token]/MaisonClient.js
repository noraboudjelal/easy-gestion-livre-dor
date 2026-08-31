"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../../lib/supabaseClient";
import styles from "./maison.module.css";

const sections = [
  { id: "groceries", icon: "🛒", label: "Courses" },
  { id: "todos", icon: "✅", label: "À faire" },
  { id: "meals", icon: "🍽️", label: "On mange quoi ?" },
  { id: "kids", icon: "📚", label: "Enfants" },
];

function SectionIcon({ type }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (type === "groceries") {
    return (
      <svg {...common}>
        <path d="M3 4h2l2.1 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 7H6" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="18" cy="19" r="1.2" />
      </svg>
    );
  }

  if (type === "todos") {
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2.5" />
        <path d="M9 3.5h6M8.5 9.5l1.6 1.6 3.1-3.2M8.5 15.5l1.6 1.6 3.1-3.2M15.5 10h1M15.5 16h1" />
      </svg>
    );
  }

  if (type === "meals") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 5.5v13M4 4v7M6.5 4v7M4 8h2.5M19.5 4v16M17.5 8c0-2.2.8-4 2-4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 5.5c2.8-.7 5.5-.1 8 1.8v12c-2.5-1.9-5.2-2.5-8-1.8zM20 5.5c-2.8-.7-5.5-.1-8 1.8v12c2.5-1.9 5.2-2.5 8-1.8z" />
      <path d="M7 9h2M7 12h2M15 9h2M15 12h2" />
    </svg>
  );
}

export default function MaisonClient({ token }) {
  const [view, setView] = useState("home");
  const [homeName, setHomeName] = useState("Notre maison");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/maison/${token}/items`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Chargement impossible.");
      setHomeName(payload.home.name);
      setItems(payload.items);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel(`maison:${token}`)
      .on("broadcast", { event: "items-changed" }, () => loadItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, token]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.kind === view),
    [items, view]
  );

  const itemCounts = useMemo(
    () => ({
      groceries: items.filter((item) => item.kind === "groceries").length,
      todos: items.filter((item) => item.kind === "todos").length,
    }),
    [items]
  );

  function sectionDetail(id) {
    if (loading) return id === "groceries" ? "Articles restants" : "Tâches restantes";
    if (id === "groceries") {
      const count = itemCounts.groceries;
      return `${count} article${count === 1 ? "" : "s"}`;
    }
    if (id === "todos") {
      const count = itemCounts.todos;
      return `${count} tâche${count === 1 ? "" : "s"}`;
    }
    return id === "meals" ? "Idées & recettes" : "Apprendre en s’amusant";
  }

  async function addItem(event) {
    event.preventDefault();
    const label = draft.trim();
    if (!label || saving) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/maison/${token}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: view, label }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Ajout impossible.");
      setItems((current) => [...current, payload.item]);
      setDraft("");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function completeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/maison/${token}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setError("Impossible de terminer cet élément.");
      loadItems();
    }
  }

  const section = sections.find((entry) => entry.id === view);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={`${styles.header} ${view === "home" ? styles.homeHeader : ""}`}>
          {view !== "home" && (
            <button className={styles.back} onClick={() => setView("home")} aria-label="Retour à l’accueil">
              ←
            </button>
          )}
          <div className={styles.headingGroup}>
            <div className={styles.brand}>Lehnova Maison</div>
            <div className={styles.homeName}>{view === "home" ? "Notre maison" : homeName}</div>
            {view === "home" && <div className={styles.welcome}>Le quotidien de toute la famille, au même endroit.</div>}
          </div>
        </header>

        {view === "home" ? (
          <section className={styles.grid} aria-label="Menu principal">
            {sections.map((entry) => (
              <button key={entry.id} className={styles.tile} onClick={() => setView(entry.id)}>
                <span className={styles.tileIcon}><SectionIcon type={entry.id} /></span>
                <span className={styles.tileCopy}>
                  <span className={styles.tileLabel}>{entry.label}</span>
                  <span className={styles.tileDetail}>{sectionDetail(entry.id)}</span>
                </span>
                <span className={styles.tileArrow} aria-hidden="true">→</span>
              </button>
            ))}
          </section>
        ) : view === "groceries" || view === "todos" ? (
          <section className={styles.listView}>
            <h1><span>{section.icon}</span> {section.label}</h1>
            <form className={styles.addForm} onSubmit={addItem}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={view === "groceries" ? "Ajouter un produit…" : "Ajouter une tâche…"}
                maxLength={120}
                aria-label={view === "groceries" ? "Produit" : "Tâche"}
              />
              <button disabled={!draft.trim() || saving}>{saving ? "…" : "+ Ajouter"}</button>
            </form>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.empty}>Chargement…</p>
            ) : visibleItems.length === 0 ? (
              <p className={styles.empty}>{view === "groceries" ? "La liste de courses est vide." : "Rien à faire pour le moment."}</p>
            ) : (
              <ul className={styles.list}>
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    <button className={styles.check} onClick={() => completeItem(item.id)} aria-label={`Terminer : ${item.label}`}>✓</button>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className={styles.placeholder}>
            <div className={styles.placeholderIcon}>{section.icon}</div>
            <h1>{section.label}</h1>
            <div className={styles.soon}>Bientôt</div>
            {view === "meals" ? (
              <p>Des idées de repas, des recettes légères et, plus tard, des suggestions à partir de ce que vous avez à la maison.</p>
            ) : (
              <p>De petits exercices simples, adaptés au niveau scolaire de chaque enfant.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
