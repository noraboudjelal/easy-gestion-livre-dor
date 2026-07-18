// À placer dans : app/vitrine/[slug]/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { themeToCssVars } from "../../../lib/vitrineThemes";

export default function PublicVitrinePage() {
  const params = useParams();
  const slug = params?.slug;

  const [showcase, setShowcase] = useState(null);
  const [products, setProducts] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
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

    const { data: prods } = await supabase
      .from("showcase_products")
      .select("*")
      .eq("showcase_id", sc.id)
      .order("position", { ascending: true });
    setProducts(prods || []);
    setLoading(false);

    // Compteur de scans : une ligne par chargement de page, une seule fois par visite
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

  const vars = themeToCssVars(showcase.theme);

  return (
    <div style={{ ...vars, background: "var(--bg)", color: "var(--ink)", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "76px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,900&family=Inter:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <div
          style={{
            padding: "64px 26px 40px",
            background: "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.6) 100%), var(--ink)",
            color: "var(--paper)",
          }}
        >
          <p style={{ fontSize: "11px", letterSpacing: ".2em", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", margin: "0 0 12px" }}>
            {showcase.tagline || "Ma vitrine"}
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.08, margin: 0 }}>
            {showcase.business_name}
          </h1>
        </div>

        {showcase.about_text && (
          <div style={{ background: "var(--paper)", padding: "34px 26px" }}>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, margin: 0 }}>{showcase.about_text}</p>
          </div>
        )}

        <div style={{ padding: "34px 26px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", margin: "0 0 18px" }}>Réalisations</h2>
          {products.length === 0 && <p style={{ opacity: 0.6, fontSize: "13.5px" }}>Bientôt en ligne.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: "var(--paper)", borderRadius: "4px", overflow: "hidden" }}>
                {p.photo_url && <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />}
                <div style={{ padding: "14px 16px" }}>
                  {p.category && (
                    <div style={{ fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent-2)", fontWeight: 700, marginBottom: "4px" }}>
                      {p.category}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "baseline" }}>
                    <strong style={{ fontFamily: "'Fraunces', serif", fontSize: "16px" }}>{p.name}</strong>
                    {p.price && <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-2)", whiteSpace: "nowrap" }}>{p.price}</span>}
                  </div>
                  {p.description && <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: "var(--ink)" }}>
        <a href="tel:+33600000000" style={{ flex: 1, textAlign: "center", padding: "15px 4px", color: "var(--paper)", fontSize: "12.5px", fontWeight: 600, textDecoration: "none", background: "var(--accent-2)" }}>
          ☎ Appeler
        </a>
        <a href="https://wa.me/33600000000" style={{ flex: 1, textAlign: "center", padding: "15px 4px", color: "var(--paper)", fontSize: "12.5px", fontWeight: 600, textDecoration: "none", background: "#3c6b4b" }}>
          ✆ WhatsApp
        </a>
      </div>
    </div>
  );
}
