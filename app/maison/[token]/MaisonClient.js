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
  const common = { viewBox: "0 0 64 64", "aria-hidden": true };

  if (type === "groceries") {
    return (
      <svg {...common}>
        <path fill="#d8a56d" d="M20 24h25l-3 27H23z" />
        <path fill="#b96a4b" d="M17 22h31v7H17z" />
        <path fill="#f2d8b1" d="M25 19c0-7 4-12 7-12s7 5 7 12h-4c0-5-2-8-3-8s-3 3-3 8z" />
        <path fill="#72906c" d="M24 22c-1-6 1-11 7-13 1 7-1 11-7 13z" />
        <path fill="#dd8364" d="M38 12c5 0 9 4 9 10H31c0-6 3-10 7-10z" />
        <path fill="#fff4df" d="M27 33h4v13h-4zm8 0h4v13h-4z" opacity=".75" />
      </svg>
    );
  }

  if (type === "todos") {
    return (
      <svg {...common}>
        <rect x="15" y="8" width="35" height="48" rx="6" fill="#fff8e9" />
        <rect x="24" y="5" width="17" height="8" rx="4" fill="#c58b63" />
        <rect x="22" y="20" width="7" height="7" rx="2" fill="#dfaa73" />
        <path d="m23.5 23 2 2 4-5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="33" y="21" width="11" height="4" rx="2" fill="#d7c4a8" />
        <rect x="22" y="34" width="7" height="7" rx="2" fill="#dfaa73" />
        <path d="m23.5 37 2 2 4-5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="33" y="35" width="11" height="4" rx="2" fill="#d7c4a8" />
        <path fill="#a65b43" d="m46 44 5-17 5 2-5 17-5 5z" />
      </svg>
    );
  }

  if (type === "meals") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="22" fill="#fff4df" />
        <circle cx="32" cy="32" r="14" fill="#f0c887" />
        <path d="M23 32c6-8 14-8 19 0-5 8-13 9-19 0z" fill="#e8895f" />
        <circle cx="29" cy="29" r="3" fill="#fff7e5" />
        <path d="M10 17v13m-4-13v9c0 4 8 4 8 0v-9M10 30v20M53 16v34M48 29c0-8 2-13 5-13" fill="none" stroke="#9b604b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path fill="#d88965" d="M12 15h38v11H12z" />
      <path fill="#e8b875" d="M9 28h40v11H9z" />
      <path fill="#8ea184" d="M14 41h39v11H14z" />
      <path fill="#fff5e4" d="M17 18h25v5H17zm-2 13h27v5H15zm5 13h26v5H20z" />
      <path fill="#a75e49" d="m47 9 7 5-22 30-8 3 2-8z" />
      <path fill="#f1d3aa" d="m47 9 4-5 7 5-4 5z" />
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
    if (loading && id === "groceries") return "Articles restants";
    if (loading && id === "todos") return "Tâches restantes";
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
