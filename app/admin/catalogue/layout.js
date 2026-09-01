"use client";

import { useEffect, useState } from "react";

export default function CatalogueAdminLayout({ children }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncAdminSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await response.json();
        const ok = response.ok && Boolean(data?.authenticated);

        if (ok) {
          // Les anciennes pages de gestion catalogue utilisent encore cette clé.
          // On la synchronise avec la vraie session admin serveur avant de monter la page.
          sessionStorage.setItem("ld-admin-ok", "1");
        } else {
          sessionStorage.removeItem("ld-admin-ok");
        }

        if (!cancelled) setAuthenticated(ok);
      } catch {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("ld-admin-ok");
        }
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    syncAdminSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
        Chargement…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <p>
          Session administrateur expirée. <a href="/admin">Se connecter à l’administration</a>
        </p>
      </div>
    );
  }

  return children;
}
