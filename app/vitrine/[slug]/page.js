// À placer dans : app/vitrine/[slug]/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { VITRINE_THEMES, DEFAULT_THEME } from "../../../lib/vitrineThemes";

export default function PublicVitrinePage() {
  const params = useParams();
  const slug = params?.slug;

  const [showcase, setShowcase] = useState(null);
  const [realisations, setRealisations] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openCardId, setOpenCardId] = useState(null);
  const [activeSlideByCard, setActiveSlideByCard] = useState({});
  const [avapValue, setAvapValue] = useState(50);
  const visitLogged = useRef(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: sc, error: scErr } = await supabase.from("showcases").select("*").eq("slug", slug).single();
    if (scErr || !sc) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setShowcase(sc);

    const { data: items } = await supabase
      .from("showcase_products")
      .select("*")
      .eq("showcase_id", sc.id)
      .order("position", { ascending: true });
    setRealisations((items || []).filter((p) => (p.item_type || "realisation") === "realisation"));
    setPrestations((items || []).filter((p) => p.item_type === "prestation"));

    const { data: transfos } = await supabase
      .from("showcase_transformations")
      .select("*")
      .eq("showcase_id", sc.id)
      .order("position", { ascending: true });
    setTransformations(transfos || []);

    setLoading(false);

    if (!visitLogged.current) {
      visitLogged.current = true;
      supabase.from("showcase_visits").insert({ showcase_id: sc.id }).then(() => {});
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Cette vitrine n'existe pas.</p>;
  if (loading || !showcase) return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Chargement…</p>;

  const theme = VITRINE_THEMES[showcase.theme] || VITRINE_THEMES[DEFAULT_THEME];
  const v = theme.vars;

  function photosFor(item) {
    if (item.photo_urls && item.photo_urls.length > 0) return item.photo_urls;
    if (item.photo_url) return [item.photo_url];
    return [];
  }

  function toggleCard(id) {
    setOpenCardId((prev) => (prev === id ? null : id));
  }

  function setSlide(cardId, index) {
    setActiveSlideByCard((prev) => ({ ...prev, [cardId]: index }));
  }

  return (
    <div style={{ background: v["--bg"], color: v["--ink"], minHeight: "100vh", fontFamily: "'Work Sans', sans-serif", paddingBottom: "76px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Work+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .vt-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 2px; background: ${v["--bg-dim"]}; margin-bottom: 6px; }
        .vt-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${v["--accent-2"]}; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        {/* HERO */}
        <div
          style={{
            position: "relative",
            minHeight: "52vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: "64px 26px 40px",
            color: v["--paper"],
            background: `linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.85) 88%), ${v["--ink"]}`,
          }}
        >
          <p style={{ fontSize: "11px", letterSpacing: ".2em", fontWeight: 600, color: v["--accent"], textTransform: "uppercase", margin: "0 0 14px" }}>
            {showcase.tagline || "Ma vitrine"}
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "38px", fontWeight: 700, lineHeight: 1.08, margin: 0 }}>
            {showcase.business_name}
          </h1>
        </div>

        {/* À PROPOS */}
        {showcase.about_text && (
          <div style={{ background: v["--paper"], padding: "34px 26px" }}>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, margin: 0 }}>{showcase.about_text}</p>
          </div>
        )}

        {/* PORTFOLIO — cartes dépliables multi-photos */}
        <div style={{ padding: "40px 26px 10px", background: v["--bg"] }}>
          <p style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".18em", color: v["--accent-2"], textTransform: "uppercase", margin: "0 0 8px" }}>
            Portfolio
          </p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 600, margin: "0 0 18px" }}>Le travail, en détail</h2>

          {realisations.length === 0 && <p style={{ opacity: 0.6, fontSize: "13.5px" }}>Bientôt en ligne.</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {realisations.map((item) => {
              const photos = photosFor(item);
              const activeSlide = activeSlideByCard[item.id] || 0;
              const isOpen = openCardId === item.id;
              return (
                <div key={item.id} style={{ borderRadius: "2px", overflow: "hidden", background: v["--paper"] }}>
                  <div
                    onClick={() => toggleCard(item.id)}
                    style={{
                      position: "relative",
                      height: "220px",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "16px",
                    }}
                  >
                    {photos.length > 0 ? (
                      photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={item.name}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: i === activeSlide ? 1 : 0,
                            transition: "opacity .35s ease",
                          }}
                        />
                      ))
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: v["--accent"] }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.65) 100%)" }} />

                    {photos.length > 1 && (
                      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: "5px", marginBottom: "10px" }}>
                        {photos.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlide(item.id, i);
                            }}
                            style={{
                              width: i === activeSlide ? "16px" : "6px",
                              height: "6px",
                              borderRadius: i === activeSlide ? "3px" : "50%",
                              border: "none",
                              padding: 0,
                              background: i === activeSlide ? v["--accent"] : "rgba(255,255,255,.4)",
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ position: "relative", zIndex: 2, color: v["--paper"], display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: "19px", fontWeight: 600 }}>{item.name}</span>
                      <span
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          border: `1px solid ${isOpen ? v["--accent"] : "rgba(255,255,255,.55)"}`,
                          background: isOpen ? v["--accent"] : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          flexShrink: 0,
                          transform: isOpen ? "rotate(45deg)" : "none",
                          transition: "transform .35s ease",
                        }}
                      >
                        +
                      </span>
                    </div>
                  </div>
                  <div style={{ maxHeight: isOpen ? "220px" : "0px", overflow: "hidden", transition: "max-height .45s cubic-bezier(.4,0,.2,1)" }}>
                    <div style={{ padding: "16px 18px 20px" }}>
                      {item.category && (
                        <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", color: v["--accent-2"], textTransform: "uppercase", marginBottom: "8px" }}>
                          {item.category}
                        </span>
                      )}
                      {item.price && <div style={{ fontSize: "13px", fontWeight: 600, color: v["--accent-2"], marginBottom: "6px" }}>{item.price}</div>}
                      {item.description && <p style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.75, margin: 0 }}>{item.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRESTATIONS */}
        {prestations.length > 0 && (
          <div style={{ background: v["--paper"], padding: "40px 26px" }}>
            <p style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".18em", color: v["--accent-2"], textTransform: "uppercase", margin: "0 0 8px" }}>
              Prestations
            </p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 600, margin: "0 0 18px" }}>Ce que je propose</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {prestations.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "16px 0",
                    borderBottom: i === prestations.length - 1 ? "none" : `1px solid ${v["--bg-dim"]}`,
                    gap: "14px",
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 600 }}>{p.name}</strong>
                    {p.description && <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "3px" }}>{p.description}</div>}
                  </div>
                  {p.price && <span style={{ fontSize: "14px", fontWeight: 600, color: v["--accent-2"], whiteSpace: "nowrap" }}>{p.price}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVANT / APRÈS */}
        {transformations.length > 0 && (
          <div style={{ background: v["--bg"], padding: "40px 26px" }}>
            <p style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".18em", color: v["--accent-2"], textTransform: "uppercase", margin: "0 0 8px" }}>
              Transformation
            </p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 600, margin: "0 0 18px" }}>Avant / après</h2>
            {transformations.map((t) => (
              <div key={t.id} style={{ marginBottom: "22px" }}>
                <div style={{ position: "relative", height: "260px", borderRadius: "2px", overflow: "hidden", background: "#222", marginBottom: "10px" }}>
                  {t.before_url && (
                    <img src={t.before_url} alt="avant" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {t.after_url && (
                    <img
                      src={t.after_url}
                      alt="après"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: `inset(0 0 0 ${avapValue}%)` }}
                    />
                  )}
                  <span style={{ position: "absolute", top: "12px", left: "12px", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 9px", borderRadius: "2px" }}>
                    Avant
                  </span>
                  <span style={{ position: "absolute", top: "12px", right: "12px", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "rgba(0,0,0,.55)", color: "#fff", padding: "5px 9px", borderRadius: "2px" }}>
                    Après
                  </span>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: `${avapValue}%`, width: "2px", background: "#fff", boxShadow: "0 0 0 6px rgba(0,0,0,.15)" }}>
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        background: v["--accent"],
                        color: v["--paper"],
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      ↔
                    </span>
                  </div>
                </div>
                <input type="range" className="vt-slider" min="0" max="100" value={avapValue} onChange={(e) => setAvapValue(Number(e.target.value))} />
                {t.label && <div style={{ fontSize: "12px", opacity: 0.6, textAlign: "center" }}>{t.label}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STICKY CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: v["--ink"] }}>
        <a href="tel:+33600000000" style={{ flex: 1, textAlign: "center", padding: "15px 4px", color: v["--paper"], fontSize: "12.5px", fontWeight: 600, textDecoration: "none", background: v["--accent-2"] }}>
          ☎ Appeler
        </a>
        <a href="https://wa.me/33600000000" style={{ flex: 1, textAlign: "center", padding: "15px 4px", color: v["--paper"], fontSize: "12.5px", fontWeight: 600, textDecoration: "none", background: "#3c6b4b" }}>
          ✆ WhatsApp
        </a>
      </div>
    </div>
  );
}
