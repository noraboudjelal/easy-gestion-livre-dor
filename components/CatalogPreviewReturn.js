"use client";

import { useEffect, useState } from "react";

export default function CatalogPreviewReturn({ catalogId, catalogSlug }) {
  const [returnHref, setReturnHref] = useState(null);

  useEffect(() => {
    setReturnHref(null);
    if (!catalogId) return;
    try {
      const query = new URLSearchParams(window.location.search);
      if (query.get("adminPreview") === "1" &&
          sessionStorage.getItem("ld-admin-ok") === "1" &&
          sessionStorage.getItem("catalog-admin-preview") === String(catalogId)) {
        setReturnHref(`/admin/catalogue/${encodeURIComponent(catalogId)}`);
      } else if (query.get("managementPreview") === "1" && catalogSlug &&
          sessionStorage.getItem(`catalog-client-auth-${catalogId}`) === "1" &&
          sessionStorage.getItem("catalog-management-preview") === String(catalogId)) {
        setReturnHref(`/catalogue/${encodeURIComponent(catalogSlug)}/gerer`);
      }
    } catch {
      // Storage unavailable: keep the public catalog unchanged.
    }
  }, [catalogId, catalogSlug]);

  if (!returnHref) return null;

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "12px 16px", boxSizing: "border-box" }}>
      <a href={returnHref} style={{ display: "inline-flex", alignItems: "center", padding: "10px 15px", borderRadius: 8, background: "#332c26", color: "#fff", textDecoration: "none", font: "700 14px Arial, sans-serif" }}>
        ← Retour à la gestion
      </a>
    </div>
  );
}
