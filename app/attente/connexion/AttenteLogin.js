"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMerchantSession, signInAttente } from "../../../lib/attente/attenteApi";
import { ticketBase, ticketColors } from "../../ticket/ticketStyles";

export default function AttenteLogin() {
  const router = useRouter();
  const [code, setCode] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { getMerchantSession().then((session) => { if (session?.authenticated && session.mode === "manual") router.replace("/attente/gestion"); }).catch(() => {}); }, [router]);
  async function submit(event) { event.preventDefault(); setLoading(true); setError(""); try { await signInAttente(code); router.replace("/attente/gestion"); } catch (err) { setError(err.message || "Connexion impossible."); } finally { setLoading(false); } }
  return <main style={styles.page}><form style={styles.card} onSubmit={submit}><p style={styles.brand}>LEHNOVA ATTENTE</p><h1 style={styles.title}>Espace commerçant</h1><label style={styles.label}>Code d’accès<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={styles.input} maxLength={32}/></label>{error&&<p style={styles.error}>{error}</p>}<button style={styles.button} disabled={loading}>{loading?"CONNEXION…":"SE CONNECTER"}</button></form></main>;
}
const styles={page:{...ticketBase,display:"grid",placeItems:"center",padding:20},card:{width:"100%",maxWidth:380,background:"#FFF",border:`1px solid ${ticketColors.border}`,borderRadius:24,padding:"32px 26px",display:"flex",flexDirection:"column",gap:18},brand:{margin:0,color:ticketColors.accent,fontSize:12,fontWeight:800,letterSpacing:".18em"},title:{margin:"-6px 0 8px",fontSize:28},label:{display:"flex",flexDirection:"column",gap:7,fontSize:13,fontWeight:700},input:{border:`1px solid ${ticketColors.border}`,borderRadius:12,padding:13,fontSize:16,background:ticketColors.background},button:{minHeight:52,border:0,borderRadius:13,background:ticketColors.accent,color:"#FFF",fontWeight:800,fontSize:15},error:{margin:0,color:ticketColors.accent,fontSize:13}};

