"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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

function hexToRgba(hex, alpha) {
  const clean = (hex || "#B5402D").replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function PhotoCarousel({ photos, alt, onOpen }) {
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedMap, setLoadedMap] = useState({});

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  function goTo(index) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div style={styles.photoWrap}>
      <div ref={scrollerRef} onScroll={handleScroll} style={styles.carouselScroller}>
        {photos.map((src, i) => (
          <div
            key={i}
            style={styles.carouselSlide}
            onClick={() => onOpen(i)}
          >
            {!loadedMap[i] && <div style={styles.photoSkeleton} />}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedMap((prev) => ({ ...prev, [i]: true }))}
              style={{ ...styles.photo, opacity: loadedMap[i] ? 1 : 0 }}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div style={styles.dotsRow}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{ ...styles.dot, opacity: activeIndex === i ? 1 : 0.4 }}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Lightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);

  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % photos.length);
  }
  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={styles.lightboxOverlay} onClick={onClose}>
      <button style={styles.lightboxClose} onClick={onClose} aria-label="Fermer">
        ✕
      </button>
      <img src={photos[index]} alt="" style={styles.lightboxImage} onClick={(e) => e.stopPropagation()} />
      {photos.length > 1 && (
        <>
          <button style={{ ...styles.lightboxNav, left: "12px" }} onClick={prev} aria-label="Photo précédente">
            ‹
          </button>
          <button style={{ ...styles.lightboxNav, right: "12px" }} onClick={next} aria-label="Photo suivante">
            ›
          </button>
          <div style={styles.lightboxCounter}>
            {index + 1} / {photos.length}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

function Card({ product, accent }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const photos =
    product.photo_urls && product.photo_urls.length > 0
      ? product.photo_urls
      : product.photo_url
      ? [product.photo_url]
      : [];

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
      {photos.length > 0 && (
        <PhotoCarousel photos={photos} alt={product.name} onOpen={(i) => setLightboxIndex(i)} />
      )}
      <div style={styles.cardBody}>
        <div style={styles.cardTop}>
          <h3 style={styles.name}>{product.name}</h3>
          {product.price && (
            <span style={{ ...styles.price, color: accent, background: hexToRgba(accent, 0.1) }}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {product.description && <p style={styles.description}>{product.description}</p>}
      </div>
      {lightboxIndex !== null && (
        <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </article>
  );
}

function QuizWidget({ questions, products, accent, onDone }) {
  const topLevel = [...questions]
    .filter((q) => !q.parent_option_id)
    .sort((a, b) => a.step_order - b.step_order);

  const childByOptionId = {};
  questions.forEach((q) => {
    if (q.parent_option_id) childByOptionId[q.parent_option_id] = q;
  });

  const [currentId, setCurrentId] = useState(topLevel[0]?.id || null);
  const [answerSets, setAnswerSets] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions.find((q) => q.id === currentId) || null;

  function choose(option, question) {
    const setForThisAnswer =
      question.answer_type === "category"
        ? products.filter((p) => (p.category || "") === (option.category || "")).map((p) => p.id)
        : option.product_ids || [];
    const nextSets = [...answerSets, setForThisAnswer];
    setAnswerSets(nextSets);
    setAnsweredCount((c) => c + 1);

    const child = childByOptionId[option.id];
    if (child) {
      setCurrentId(child.id);
      return;
    }

    const currentTopIndex = topLevel.findIndex((tq) => tq.id === question.id);
    const nextTop = currentTopIndex >= 0 ? topLevel[currentTopIndex + 1] : null;
    if (nextTop) {
      setCurrentId(nextTop.id);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setCurrentId(topLevel[0]?.id || null);
    setAnswerSets([]);
    setAnsweredCount(0);
    setFinished(false);
  }

  const recommended = (() => {
    if (answerSets.length === 0) return [];
    let ids = answerSets[0];
    for (let i = 1; i < answerSets.length; i++) {
      const intersection = ids.filter((id) => answerSets[i].includes(id));
      ids = intersection.length > 0 ? intersection : ids;
    }
    if (ids.length === 0) {
      ids = [...new Set(answerSets.flat())];
    }
    return products.filter((p) => ids.includes(p.id));
  })();

  if (finished || !currentQuestion) {
    return (
      <div style={styles.quizBox}>
        <p style={{ ...styles.quizTag, color: accent }}>NOS RECOMMANDATIONS POUR VOUS</p>
        {recommended.length === 0 ? (
          <p style={{ color: "#8A7F66", fontSize: "0.85rem" }}>
            On n'a pas trouvé de correspondance exacte — jetez un œil au catalogue complet ci-dessous.
          </p>
        ) : (
          <div style={styles.quizResultsGrid}>
            {recommended.map((p) => (
              <Card product={p} accent={accent} key={p.id} />
            ))}
          </div>
        )}
        <div style={styles.quizActions}>
          <button type="button" style={{ ...styles.quizGhostButton, borderColor: accent, color: accent }} onClick={restart}>
            Refaire le questionnaire
          </button>
          <button type="button" style={{ ...styles.quizSkipButton, color: accent }} onClick={onDone}>
            Voir tout le catalogue ↓
          </button>
        </div>
      </div>
    );
  }

  const q = currentQuestion;

  return (
    <div style={styles.quizBox}>
      <p style={{ ...styles.quizTag, color: accent }}>✨ ON VOUS AIDE À CHOISIR</p>
      <h3 style={styles.quizQuestion}>{q.question}</h3>
      <div style={styles.quizOptions}>
        {q.quiz_options.map((o) => (
          <button
            type="button"
            key={o.id}
            style={styles.quizOptionButton}
            onClick={() => choose(o, q)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button type="button" style={styles.quizSkipButton} onClick={onDone}>
        Passer, voir tout le catalogue
      </button>
    </div>
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
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoadError, setQuizLoadError] = useState("");
  const [showQuiz, setShowQuiz] = useState(true);
  const mainRef = useRef(null);

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

    if (cat.quiz_enabled) {
      const { data: questions, error: quizErr } = await supabase
        .from("quiz_questions")
        .select("*, quiz_options!question_id(*)")
        .eq("catalog_id", cat.id)
        .order("step_order", { ascending: true });

      if (quizErr) {
        console.error("Erreur chargement quiz :", quizErr);
        setQuizLoadError(quizErr.message);
      } else {
        const withOptions = (questions || []).filter((q) => (q.quiz_options || []).length >= 2);
        setQuizQuestions(withOptions);
      }
    }

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

      <main style={styles.main} ref={mainRef}>
        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}

        {quizLoadError && (
          <p style={{ color: "#B5402D", fontSize: "0.8rem", fontWeight: 600 }}>
            Erreur chargement quiz : {quizLoadError}
          </p>
        )}

        {!loading && showQuiz && quizQuestions.length > 0 && (
          <QuizWidget
            questions={quizQuestions}
            products={products}
            accent={accent}
            onDone={() => setShowQuiz(false)}
          />
        )}

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
    background: "#F9F5EC",
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" },
  empty: { textAlign: "center", color: "#8A7F66", padding: "30px 0" },
  card: {
    background: "#FFFDF8",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(30,20,10,0.05)",
    boxShadow: "0 10px 28px rgba(30,20,10,0.09)",
    display: "flex",
    flexDirection: "column",
    transition: "opacity 0.6s ease, transform 0.6s ease",
  },
  photoWrap: {
    width: "100%",
    aspectRatio: "2 / 1",
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
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.4s ease" },
  carouselScroller: {
    display: "flex",
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    width: "100%",
    height: "100%",
    scrollbarWidth: "none",
  },
  carouselSlide: {
    flex: "0 0 100%",
    scrollSnapAlign: "start",
    position: "relative",
    cursor: "pointer",
  },
  dotsRow: {
    position: "absolute",
    bottom: "8px",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: "6px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fff",
    border: "none",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
    padding: 0,
  },
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20,15,10,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "16px",
  },
  lightboxImage: { maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "6px" },
  lightboxClose: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  lightboxNav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    fontSize: "1.4rem",
    cursor: "pointer",
  },
  lightboxCounter: {
    position: "absolute",
    bottom: "18px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: "0.75rem",
    background: "rgba(255,255,255,0.15)",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  cardBody: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "6px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  name: { fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#1E2A3A", flex: 1, lineHeight: 1.25 },
  price: {
    fontSize: "0.95rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
    flexShrink: 0,
    letterSpacing: "0.01em",
    padding: "3px 10px",
    borderRadius: "999px",
  },
  description: { fontSize: "0.82rem", color: "#6B5D4C", margin: 0, lineHeight: 1.5 },
  footer: { marginTop: "40px", fontSize: "0.68rem", letterSpacing: "0.06em", color: "#A6947A", opacity: 0.8 },
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
  quizBox: {
    background: "#FCFAF2",
    border: "1px solid #E6DCC2",
    borderRadius: "14px",
    padding: "22px 20px",
    marginBottom: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  quizTag: { fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", margin: 0 },
  quizProgress: { display: "flex", gap: "6px" },
  quizDot: { flex: 1, height: "3px", borderRadius: "2px" },
  quizQuestion: { fontSize: "1.15rem", fontWeight: 700, color: "#1E2A3A", margin: 0 },
  quizOptions: { display: "flex", flexDirection: "column", gap: "8px" },
  quizOptionButton: {
    textAlign: "left",
    background: "#F1EAD6",
    border: "1px solid #E6DCC2",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "0.88rem",
    color: "#2A241D",
    cursor: "pointer",
  },
  quizResultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  quizActions: { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between", alignItems: "center" },
  quizGhostButton: {
    background: "none",
    border: "1px solid",
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  quizSkipButton: {
    background: "none",
    border: "none",
    fontSize: "0.78rem",
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};
