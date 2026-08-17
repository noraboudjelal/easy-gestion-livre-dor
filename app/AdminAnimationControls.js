"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function getSlugFromImprimerLink(a) {
  try {
    const url = new URL(a.href, window.location.origin);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2 && parts[parts.length - 1] === "imprimer" ? parts[parts.length - 2] : null;
  } catch {
    return null;
  }
}

function makeButton(label, sample) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.style.cssText = sample?.style?.cssText || "padding:12px;border:0;border-radius:12px;background:#f2ede3;font-weight:700;";
  btn.style.flex = "1";
  return btn;
}

export default function AdminAnimationControls() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function enhanceAdmin() {
      if (window.location.pathname !== "/admin") return;
      const links = Array.from(document.querySelectorAll('a[href$="/imprimer"]'));

      for (const link of links) {
        const slug = getSlugFromImprimerLink(link);
        if (!slug) continue;
        const row = link.parentElement;
        const card = row?.parentElement;
        if (!card || card.querySelector(`[data-anim-controls="${slug}"]`)) continue;

        const { data: ev } = await supabase.from("events").select("id,slug,riddles_enabled,word_cloud_enabled").eq("slug", slug).single();
        if (!ev) continue;

        const sample = Array.from(card.querySelectorAll("button")).find((b) => (b.textContent || "").toLowerCase().includes("playlist"));
        const controls = document.createElement("div");
        controls.dataset.animControls = slug;
        controls.style.display = "flex";
        controls.style.gap = "6px";
        controls.style.marginTop = "6px";

        const riddleBtn = makeButton(`devinettes ${ev.riddles_enabled ? "✓" : ""}`, sample);
        const cloudBtn = makeButton(`nuage de mots ${ev.word_cloud_enabled ? "✓" : ""}`, sample);

        riddleBtn.onclick = async () => {
          const next = !ev.riddles_enabled;
          const { error } = await supabase.from("events").update({ riddles_enabled: next }).eq("id", ev.id);
          if (error) return alert("Impossible de modifier les devinettes.");
          ev.riddles_enabled = next;
          riddleBtn.textContent = `devinettes ${next ? "✓" : ""}`;

          if (next) {
            const { count } = await supabase.from("event_riddles").select("id", { count: "exact", head: true }).eq("event_id", ev.id);
            if (!count) {
              const question = window.prompt("Première devinette : quelle est la question ?");
              if (!question?.trim()) return;
              const answer = window.prompt("Quelle est la bonne réponse ?");
              if (!answer?.trim()) return;
              const hint = window.prompt("Quel indice veux-tu donner ?") || "";
              await supabase.from("event_riddles").insert({ event_id: ev.id, question: question.trim(), answer: answer.trim(), hint: hint.trim(), position: 0 });
            }
          }
        };

        cloudBtn.onclick = async () => {
          const next = !ev.word_cloud_enabled;
          const { error } = await supabase.from("events").update({ word_cloud_enabled: next }).eq("id", ev.id);
          if (error) return alert("Impossible de modifier le nuage de mots.");
          ev.word_cloud_enabled = next;
          cloudBtn.textContent = `nuage de mots ${next ? "✓" : ""}`;
        };

        controls.append(riddleBtn, cloudBtn);
        row.insertAdjacentElement("afterend", controls);
      }
    }

    const observer = new MutationObserver(() => enhanceAdmin());
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceAdmin();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname === "/admin") return;
    const slug = window.location.pathname.split("/").filter(Boolean)[0];
    if (!slug) return;

    let cancelled = false;
    async function applyRiddleVisibility() {
      const { data: ev } = await supabase.from("events").select("riddles_enabled").eq("slug", slug).maybeSingle();
      if (cancelled || !ev) return;
      const section = document.querySelector("#riddles");
      if (section) section.style.display = ev.riddles_enabled ? "" : "none";
      const navLink = document.querySelector('a[href="#riddles"]');
      if (navLink) navLink.style.display = ev.riddles_enabled ? "" : "none";
    }
    const timer = setInterval(applyRiddleVisibility, 1200);
    applyRiddleVisibility();
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return null;
}
