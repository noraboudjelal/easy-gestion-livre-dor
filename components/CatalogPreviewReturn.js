"use client";

import { useEffect, useState } from "react";

export default function CatalogPreviewReturn({ catalogId }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!catalogId) return;
    try {
      setVisible(
        new URLSearchParams(window.location.search).get("adminPreview") === "1" &&
        sessionStorage.getItem("ld-admin-ok") === "1" &&
        sessionStorage.getItem("catalog-admin-preview") === String(catalogId)
      );
    } catch {
      // Storage unavailable: keep the public catalog unchanged.
    }
  }, [catalogId]);

  if (!visible) return null;

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "12px 16px", boxSizing: "border-box" }}>
      <a href={`/admin/catalogue/${encodeURIComponent(catalogId)}`} style={{ display: "inline-flex", alignItems: "center", padding: "10px 15px", borderRadius: 8, background: "#332c26", color: "#fff", textDecoration: "none", font: "700 14px Arial, sans-serif" }}>
        ← Retour à la gestion
      </a>
    </div>
  );
}
