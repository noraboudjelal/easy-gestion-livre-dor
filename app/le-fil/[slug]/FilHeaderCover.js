"use client";

import { useEffect } from "react";

export default function FilHeaderCover({ cover }) {
  useEffect(() => {
    if (!cover) return;

    const applyCover = () => {
      const header = document.querySelector(".page .header");
      if (!header) return false;
      header.style.setProperty("background-image", `linear-gradient(180deg,rgba(8,12,18,.06) 25%,rgba(8,12,18,.68) 100%),url("${cover}")`, "important");
      header.style.setProperty("background-size", "cover", "important");
      header.style.setProperty("background-position", "center", "important");
      header.style.setProperty("background-repeat", "no-repeat", "important");
      header.style.setProperty("min-height", "390px", "important");
      header.style.setProperty("position", "relative", "important");
      header.style.setProperty("display", "flex", "important");
      header.style.setProperty("flex-direction", "column", "important");
      header.style.setProperty("justify-content", "flex-end", "important");
      header.style.setProperty("padding", "120px 18px 18px", "important");
      return true;
    };

    if (applyCover()) return;
    const observer = new MutationObserver(() => {
      if (applyCover()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => observer.disconnect(), 10000);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [cover]);

  return null;
}
