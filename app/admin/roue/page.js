"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const initial = { name: "", slug: "", prize: "Cadeau surprise", min_purchase: 40, win_denominator: 10, max_winners: 10 };
export default function AdminRoue() {
 const [logged, setLogged] = useState(false), [form, setForm] = useState(initial), [wheels, setWheels] = useState([]);
 const [error, setError] = useState(""), [ticket, setTicket] = useState(null), [amount, setAmount] = useState({}), [busy, setBusy] = useState(false);
 const load = useCallback(async () => {
  const session = await fetch("/api/admin/session", { cache: "no-store" }).then(r => r.json());
  if (!session.authenticated) { setLogged(false); return; }
  setLogged(true);
  const r = await fetch("/api/admin/roue"), data = await r.json();
  if (!r.ok) throw new Error(data.error);
  setWheels(data.wheels || []);
 }, []);
 useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
 async function create(e) {
  e.preventDefault(); setBusy(true); setError("");
  try {
   const r = await fetch("/api/admin/roue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
   const d = await r.json(); if (!r.ok) throw new Error(d.error);
   setForm(initial); await load();
  } catch (e) { setError(e.message); } finally { setBusy(false); }
 }
 async function change(w, changes) {
  setError("");
  try {
   const r = await fetch("/api/admin/roue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id, ...changes }) });
   const d = await r.json(); if (!r.ok) throw new Error(d.error); await load();
  } catch (e) { setError(e.message); }
 }
 async function issue(w) {
  setError(""); setTicket(null);
  try {
   const r = await fetch("/api/admin/roue/ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id, purchaseAmount: amount[w.id] ?? w.min_purchase }) });
   const d = await r.json(); if (!r.ok) throw new Error(d.error); setTicket(d.url);
  } catch (e) { setError(e.message); }
 }
 const input = (field, type = "text") => <input required type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={styles.input} />;
 return <main style={styles.main}><Link href="/admin">← Administration</Link><h1>Animation marketing · La Roue</h1>
 {!logged ? <p>Connecte-toi d'abord sur <Link href="/admin">l'administration Lehnova</Link>.</p> : <>
 <p>Crée une roue par commerce. Le client reçoit un lien à usage unique après un achat vérifié à la caisse.</p>
 <form onSubmit={create} style={styles.card}><h2>Créer une roue</h2><label>Nom du commerce {input("name")}</label><label>Identifiant URL (ex. mon-commerce) {input("slug")}</label>
 <label>Cadeau {input("prize")}</label><label>Montant minimum d'achat (€) {input("min_purchase", "number")}</label>
 <label>Une chance sur… {input("win_denominator", "number")}</label><label>Nombre maximum de cadeaux {input("max_winners", "number")}</label>
 <button disabled={busy} type="submit">Créer</button></form>
 {wheels.map(w => <section key={w.id} style={styles.card}><h2>{w.name}</h2>
 <p>Minimum {w.min_purchase} € · 1 chance sur {w.win_denominator} · {w.winners_count}/{w.max_winners} cadeaux distribués</p>
 <p>État : {w.active ? "Active" : "Désactivée"} · Cadeau : {w.prize}</p>
 <button onClick={() => change(w, { active: !w.active })}>{w.active ? "Désactiver" : "Activer"}</button>{" "}
 <button onClick={() => { const x = prompt("Nouvelle probabilité : 1 chance sur…", w.win_denominator); if (x !== null) change(w, { win_denominator: Number(x) }); }}>Modifier les chances</button>{" "}
 <button onClick={() => { const x = prompt("Plafond de cadeaux (au moins " + w.winners_count + ")", w.max_winners); if (x !== null) change(w, { max_winners: Number(x) }); }}>Modifier le plafond</button>
 <h3>À la caisse : autoriser un tour</h3>
 <label>Montant réellement encaissé (€) <input type="number" step="0.01" min="0" value={amount[w.id] ?? w.min_purchase} onChange={e => setAmount({ ...amount, [w.id]: e.target.value })} style={styles.input} /></label>
 <button disabled={!w.active || w.winners_count >= w.max_winners} onClick={() => issue(w)}>Générer une participation unique</button></section>)}
 {ticket && <section style={styles.card}><h2>Participation à remettre au client</h2><p>Valable pour un seul tirage. Ne partage pas ce lien publiquement.</p><a href={ticket} target="_blank" rel="noreferrer">{ticket}</a><p><button onClick={() => navigator.clipboard.writeText(ticket)}>Copier le lien</button></p></section>}
 </>}
 {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}</main>;
}
const styles = { main: { maxWidth: 720, margin: "30px auto", padding: 20, fontFamily: "system-ui" }, card: { padding: 20, margin: "20px 0", background: "#fff7f3", border: "1px solid #dcc9b6", borderRadius: 16, display: "grid", gap: 12 }, input: { display: "block", padding: 10, width: "100%", maxWidth: 420, marginTop: 4 } };
