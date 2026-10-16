"use client";

import { useEffect, useState } from 'react';
import { CONSENT_VERSION, validConsent, contactKind, UUID } from '../lib/statistics/model.mjs';
import styles from './CatalogStatistics.module.css';

// No storage or identifier is read before resolving the catalogue's consent choice.
export default function CatalogStatistics({ catalogId }) {
  const [choice, setChoice] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(true);
  const key = `lehnova-statistics-choice:${catalogId}`;

  useEffect(() => {
    if (!catalogId) return;
    const query = new URLSearchParams(location.search);
    const excluded = query.has('adminPreview') || query.has('managementPreview');
    setPreview(excluded);
    setChoice(undefined);
    if (excluded) return;
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (!validConsent(stored)) {
        localStorage.removeItem(key);
        localStorage.removeItem(`lehnova-statistics-visitor:${catalogId}`);
        sessionStorage.removeItem(`lehnova-statistics-session:${catalogId}`);
      }
      setChoice(validConsent(stored) ? { ...stored, catalogId } : null);
    } catch { setChoice(null); }
    const sync = (event) => {
      if (event.key !== key) return;
      try { const value = JSON.parse(event.newValue); setChoice(validConsent(value) ? { ...value, catalogId } : null); }
      catch { setChoice(null); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [catalogId, key]);

  function choose(accepted) {
    const value = { version: CONSENT_VERSION, accepted, at: Date.now(), catalogId };
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (!accepted) {
        localStorage.removeItem(`lehnova-statistics-visitor:${catalogId}`);
        sessionStorage.removeItem(`lehnova-statistics-session:${catalogId}`);
      }
    } catch {}
    setChoice(value); setEditing(false);
  }

  useEffect(() => {
    if (preview || !catalogId || choice?.catalogId !== catalogId || !choice?.accepted || !validConsent(choice)) return;
    let visitorId, sessionId;
    try {
      const visitorKey = `lehnova-statistics-visitor:${catalogId}`;
      const sessionKey = `lehnova-statistics-session:${catalogId}`;
      const visitor = JSON.parse(localStorage.getItem(visitorKey));
      visitorId = UUID.test(visitor?.id || '') && visitor.expires > Date.now() ? visitor.id : crypto.randomUUID();
      localStorage.setItem(visitorKey, JSON.stringify({ id: visitorId, expires: choice.at + 180 * 86400000 }));
      const session = JSON.parse(sessionStorage.getItem(sessionKey));
      sessionId = UUID.test(session?.id || '') && session.expires > Date.now() ? session.id : crypto.randomUUID();
      sessionStorage.setItem(sessionKey, JSON.stringify({ id: sessionId, expires: Date.now() + 30 * 60000 }));
    } catch { return; } // Blocked storage means no measurement.
    const pending = new Set();
    function send(kind, productId = null) {
      if (!validConsent(choice)) return;
      // Read the choice again to honour immediate withdrawal in another tab.
      try { const current = JSON.parse(localStorage.getItem(key)); if (!validConsent(current) || !current.accepted) return; }
      catch { return; }
      const controller = new AbortController(); pending.add(controller);
      fetch('/api/statistics/collect', {
        method: 'POST', credentials: 'same-origin', keepalive: true, signal: controller.signal, referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogId, visitorId, sessionId, eventId: crypto.randomUUID(), kind, productId, consent: CONSENT_VERSION }),
      }).catch(() => {}).finally(() => pending.delete(controller));
    }
    send('visit');
    function click(event) {
      const target = event.target instanceof Element ? event.target : null;
      const product = target?.closest('[data-statistics-product]');
      if (product) send('product_click', product.dataset.statisticsProduct);
      const anchor = target?.closest('a[href]');
      const kind = anchor ? contactKind(anchor.href) : null;
      if (kind) send(kind);
    }
    document.addEventListener('click', click, true);
    const expiry = setInterval(() => {
      if (validConsent(choice)) return;
      try { localStorage.removeItem(key); localStorage.removeItem(`lehnova-statistics-visitor:${catalogId}`); sessionStorage.removeItem(`lehnova-statistics-session:${catalogId}`); } catch {}
      setChoice(null);
    }, 60000);
    return () => { clearInterval(expiry); document.removeEventListener('click', click, true); pending.forEach(c => c.abort()); };
  }, [catalogId, choice, preview, key]);

  if (!catalogId || preview || choice === undefined) return null;
  return <>
    <button type="button" className={styles.preferences} onClick={() => setEditing(true)}>Confidentialité · Statistiques</button>
    {(choice === null || editing) && <aside className={styles.panel} aria-label="Préférences de mesure d’audience">
      <strong>Votre choix, en toute simplicité</strong>
      <p>Autorisez-vous la mesure des visites et des clics de ce catalogue ? Un identifiant aléatoire propre à ce catalogue est conservé pendant 6 mois au maximum. Aucun nom, adresse IP ou empreinte du navigateur n’est enregistré dans les statistiques. Historique : 13 mois.</p>
      <p>Le refus ne change pas votre navigation. Vous pouvez retirer votre accord ici à tout moment.</p>
      <div className={styles.actions}><button type="button" onClick={() => choose(false)}>Refuser</button><button type="button" onClick={() => choose(true)}>Accepter</button>{choice && <button type="button" onClick={() => setEditing(false)}>Fermer</button>}</div>
    </aside>}
  </>;
}
