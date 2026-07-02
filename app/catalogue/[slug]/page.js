"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const FONTS = {
  manuscrite: { title: "'Caveat', cursive", titleWeight: 700, titleSize: "2.6rem" },
  moderne: { title: "'Inter', sans-serif", titleWeight: 700, titleSize: "2rem" },
  elegante: { title: "'Playfair Display', serif", titleWeight: 700, titleSize: "2.2rem" },
};

function groupByCategory(products) {
  const groups = [];
  const map = new Map();
  for (const p of products) {
    const key = (p.category || "").trim() || "__none__";
    if (!map.has(key)) {
      const group = { category: key === "__none__" ? null : p.category.trim(), items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(p);
  }
  return groups;
}

function formatPrice(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+)(?:[.,](\d{1,2}))?\s*€?$/);
  if (!match) return trimmed;
  let out = match[1];
  if (match[2]) out += "," + match[2];
  return out + " €";
}

function ProductImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={styles.photoWrap}>
      {!loaded && <div style={styles.photoSkeleton} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{ ...styles.photo, opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}

function Card({ product, accent }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      style={{
        ...styles.card,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      }}
    >
      {product.photo_url && <ProductImage src={product.photo_url} alt={product.name} />}
      <div style={styles.cardBody}>
        <div style={styles.cardTop}>
          <h3 style={styles.name}>{product.name}</h3>
          {product.price && <span style={{ ...styles.price, color: accent }}>{formatPrice(product.price)}</span>}
        </div>
        {product.description && <p style={styles.description}>{product.description}</p>}
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const params = useParams();
  const slug = params?.slug;

  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showTop, setShowTop] = useState(false);

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

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#5B4636", fontFamily: "system-ui, sans-serif" }}>
          Ce catalogue n'existe pas ou plus.
        </p>
      </div>
    );
  }

  const accent = catalog?.accent_color || "#B5402D";
  const font = FONTS[catalog?.font_style] || FONTS.manuscrite;
  const groups = groupByCategory(products);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
      `}</style>

      <header style={{ ...styles.header, borderBottomColor: accent }}>
        <p style={{ ...styles.eyebrow, color: accent }}>CATALOGUE NUMÉRIQUE</p>
        <h1
          style={{
            ...styles.title,
            fontFamily: font.title,
            fontWeight: font.titleWeight,
            fontSize: font.titleSize,
          }}
        >
          {loading ? "…" : catalog?.catalog_title}
        </h1>
      </header>

      <main style={styles.main}>
        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

        {!loading && products.length === 0 && (
          <div style={styles.empty}>
            <p>Ce catalogue ne contient pas encore de produits.</p>
          </div>
        )}

        {!loading &&
          groups.map((group, gi) => (
            <section key={gi} style={styles.section}>
              {group.category && (
                <h2 style={{ ...styles.categoryTitle, fontFamily: font.title, color: accent }}>
                  {group.category}
                </h2>
              )}
              <div style={styles.grid}>
                {group.items.map((p) => (
                  <Card product={p} accent={accent} key={p.id} />
                ))}
              </div>
            </section>
          ))}
      </main>

      <footer style={{ ...styles.footer, color: accent }}>Catalogue réalisé par Easy Gestion Toulouse</footer>

      {showTop && (
        <button onClick={scrollToTop} style={{ ...styles.topButton, background: accent }} aria-label="Retour en haut">
          ↑
        </button>
      )}
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
    position: "relative",
  },
  header: {
    width: "100%",
    maxWidth: "900px",
    borderBottom: "2px solid",
    paddingBottom: "16px",
    marginBottom: "24px",
    textAlign: "center",
  },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", margin: "0 0 6px 0", fontWeight: 600 },
  title: { margin: 0, lineHeight: 1.1, color: "#1E2A3A" },
  main: { width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", gap: "28px" },
  section: { display: "flex", flexDirection: "column", gap: "12px" },
  categoryTitle: { fontSize: "1.6rem", margin: 0, borderBottom: "1px solid #E6DCC2", paddingBottom: "6px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" },
  empty: { textAlign: "center", color: "#8A7F66", padding: "30px 0" },
  card: {
    background: "#FCFAF2",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #E6DCC2",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    transition: "opacity 0.6s ease, transform 0.6s ease",
  },
  photoWrap: {
    width: "100%",
    aspectRatio: "16 / 6.5",
    background: "#EFE9DA",
    overflow: "hidden",
    position: "relative",
  },
  photoSkeleton: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, #EFE9DA 25%, #F6F0E2 50%, #EFE9DA 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s infinite linear",
  },
  photo: { width: "100%", height: "100%", objectFit: "contain", display: "block", transition: "opacity 0.4s ease" },
  cardBody: { padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" },
  name: { fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#1E2A3A", flex: 1 },
  price: { fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  description: { fontSize: "0.8rem", color: "#5B4636", margin: 0, lineHeight: 1.4 },
  footer: { marginTop: "36px", fontSize: "0.7rem", letterSpacing: "0.08em" },
  topButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    color: "#FCFAF2",
    fontSize: "1.2rem",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    cursor: "pointer",
  },
};
