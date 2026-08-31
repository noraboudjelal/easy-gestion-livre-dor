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
        <header className={styles.header}>
          {view !== "home" && (
            <button className={styles.back} onClick={() => setView("home")} aria-label="Retour à l’accueil">
              ←
            </button>
          )}
          <div>
            <div className={styles.brand}>LEHNOVA MAISON</div>
            <div className={styles.homeName}>{homeName}</div>
          </div>
        </header>

        {view === "home" ? (
          <section className={styles.grid} aria-label="Menu principal">
            {sections.map((entry) => (
              <button key={entry.id} className={styles.tile} onClick={() => setView(entry.id)}>
                <span className={styles.tileIcon}>{entry.icon}</span>
                <span>{entry.label}</span>
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
