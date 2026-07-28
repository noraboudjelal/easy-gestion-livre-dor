"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function DjPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: ev, error: evErr } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (evErr || !ev || !ev.playlist_enabled) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(ev);
    const { data: reqs } = await supabase
      .from("playlist_requests")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: false });
    setRequests(reqs || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function togglePlayed(request) {
    if (!supabase) return;
    const nextValue = !request.played;
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, played: nextValue } : r)));
    await supabase.from("playlist_requests").update({ played: nextValue }).eq("id", request.id);
  }

  async function toggleGroupPlayed(group) {
    if (!supabase) return;
    const nextValue = !group.played;
    const ids = group.items.map((r) => r.id);
    setRequests((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, played: nextValue } : r)));
    await supabase.from("playlist_requests").update({ played: nextValue }).in("id", ids);
  }

  function normalize(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // retire les accents
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // retire la ponctuation
      .replace(/\s+/g, " ") // espaces multiples -> un seul
      .trim();
  }

  function groupRequests(list) {
    const groups = [];
    const map = new Map();
    for (const r of list) {
      const key = `${normalize(r.song_title)}__${normalize(r.artist)}`;
      if (!map.has(key)) {
        const group = {
          song_title: r.song_title,
          artist: r.artist,
          items: [],
          played: r.played,
        };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key).items.push(r);
    }
    return groups;
  }

  if (loading) {
    return <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>Chargement…</div>;
  }
  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center" }}>
        Cette page n'existe pas ou n'est pas activée.
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <div style={styles.shell}>
        <p style={styles.eyebrow}>Espace DJ · lien privé</p>
        <h1 style={styles.title}>{event.event_title}</h1>

        {requests.length === 0 ? (
          <p style={styles.hint}>Aucune demande pour l'instant — la liste se met à jour automatiquement.</p>
        ) : (
          <>
            <div style={styles.list}>
              {groupRequests(requests)
                .filter((g) => !g.played)
                .map((g, i) => (
                  <div key={i} style={styles.row}>
                    <div>
                      <p style={styles.songTitle}>
                        {g.song_title}
                        {g.items.length > 1 && <span style={styles.countBadge}> ×{g.items.length}</span>}
                      </p>
                      {g.artist && <p style={styles.songArtist}>{g.artist}</p>}
                      <span style={styles.songBy}>
                        {g.items.map((r) => r.requester_name || "Anonyme").join(", ")}
                      </span>
                    </div>
                    <button style={styles.playedButton} onClick={() => toggleGroupPlayed(g)}>
                      ✓ Joué
                    </button>
                  </div>
                ))}
              {groupRequests(requests).every((g) => g.played) && (
                <p style={styles.hint}>Toutes les demandes ont été jouées 🎉</p>
              )}
            </div>

            {groupRequests(requests).some((g) => g.played) && (
              <>
                <p style={styles.playedTitle}>Déjà jouées</p>
                <div style={styles.list}>
                  {groupRequests(requests)
                    .filter((g) => g.played)
                    .map((g, i) => (
                      <div key={i} style={{ ...styles.row, ...styles.rowPlayed }}>
                        <div>
                          <p style={{ ...styles.songTitle, textDecoration: "line-through" }}>
                            {g.song_title}
                            {g.items.length > 1 && <span style={styles.countBadge}> ×{g.items.length}</span>}
                          </p>
                          {g.artist && <p style={styles.songArtist}>{g.artist}</p>}
                          <span style={styles.songBy}>
                            {g.items.map((r) => r.requester_name || "Anonyme").join(", ")}
                          </span>
                        </div>
                        <button style={styles.undoButton} onClick={() => toggleGroupPlayed(g)}>
                          annuler
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#1C1B24", color: "#F3EAD8", fontFamily: "'Inter', sans-serif", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "480px", padding: "32px 20px 60px" },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#E7A94C", margin: "0 0 8px", fontWeight: 700 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", margin: "0 0 24px" },
  hint: { fontSize: "0.85rem", color: "#B7AF9A" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(231,169,76,0.08)",
    border: "1px solid rgba(231,169,76,0.25)",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  songTitle: { fontWeight: 600, fontSize: "0.92rem", margin: "0 0 2px" },
  countBadge: { color: "#E7A94C", fontWeight: 700 },
  songArtist: { fontSize: "0.76rem", color: "#B7AF9A", margin: 0 },
  songBy: { fontSize: "0.7rem", color: "#E7A94C" },
  playedButton: {
    background: "#3B7A4A",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "7px 14px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  undoButton: {
    background: "none",
    border: "1px solid #444",
    color: "#B7AF9A",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "0.72rem",
    cursor: "pointer",
    flexShrink: 0,
  },
  rowPlayed: { opacity: 0.55 },
  playedTitle: { fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8272", margin: "26px 0 10px" },
};
