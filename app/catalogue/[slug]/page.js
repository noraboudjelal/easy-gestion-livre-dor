"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function CatalogPage() {
  const params = useParams();
  const slug = params?.slug;

  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: cat, error: catErr } = await supabase
      .from("catalogs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (catErr || !cat) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setCatalog(cat);

    const { data: prods } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("catalog_id", cat.id)
      .order("position", { ascending: true });

    setProducts(prods || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#5B4636", fontFamily: "system-ui, sans-serif" }}>
          Ce catalogue n'existe pas ou plus.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <header style={styles.header}>
        <p style={styles.eyebrow}>CATALOGUE NUMÉRIQUE</p>
        <h1 style={styles.title}>{loading ? "…" : catalog?.catalog_title}</h1>
      </header>

      <main style={styles.grid}>
        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

        {!loading && products.length === 0 && (
          <div style={styles.empty}>
            <p>Ce catalogue ne contient pas encore de produits.</p>
          </div>
        )}

        {!loading &&
          products.map((p) => (
            <article style={styles.card} key={p.id}>
              {p.photo_url && (
                <div style={styles.photoWrap}>
                  <img src={p.photo_url} alt={p.name} style={styles.photo} />
                </div>
              )}
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <h2 style={styles.name}>{p.name}</h2>
                  {p.price && <span style={styles.price}>{p.price}</span>}
                </div>
                {p.description && <p style={styles.description}>{p.description}</p>}
              </div>
            </article>
          ))}
      </main>

      <footer style={styles.footer}>Catalogue réalisé par Easy Gestion Toulouse</footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F6F0E2",
    fontFamily: "'Inter', sans-serif",
    color: "#2A241D",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px 48px",
  },
  header: {
    width: "100%",
    maxWidth: "720px",
    borderBottom: "2px solid #B5402D",
    paddingBottom: "16px",
    marginBottom: "24px",
    textAlign: "center",
  },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", color: "#A6792B", margin: "0 0 6px 0", fontWeight: 600 },
  title: { fontFamily: "'Caveat', cursive", fontSize: "2.6rem", fontWeight: 700, color: "#1E2A3A", margin: 0, lineHeight: 1.1 },
  grid: {
    width: "100%",
    maxWidth: "720px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "18px",
  },
  empty: { gridColumn: "1 / -1", textAlign: "center", color: "#8A7F66", padding: "30px 0" },
  card: {
    background: "#FCFAF2",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #E6DCC2",
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
  },
  photoWrap: { width: "100%", aspectRatio: "4 / 3", background: "#EFE9DA", overflow: "hidden" },
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardBody: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" },
  name: { fontSize: "1rem", fontWeight: 600, margin: 0, color: "#1E2A3A" },
  price: { fontSize: "0.9rem", fontWeight: 700, color: "#B5402D", whiteSpace: "nowrap" },
  description: { fontSize: "0.8rem", color: "#5B4636", margin: 0, lineHeight: 1.4 },
  footer: { marginTop: "36px", fontSize: "0.7rem", color: "#A6792B", letterSpacing: "0.08em" },
};
