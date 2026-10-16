"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './statistics.module.css';

function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function daysAgo(days) { const date=new Date(today()+'T12:00:00Z'); date.setUTCDate(date.getUTCDate()-days); return date.toISOString().slice(0,10); }
const number = value => Number(value || 0).toLocaleString('fr-FR');
const labels={whatsapp:'WhatsApp',phone:'Téléphone',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',social_other:'Autres réseaux'};

export default function StatisticsPage() {
  const { id } = useParams();
  const [from,setFrom]=useState(()=>daysAgo(29)),[to,setTo]=useState(today),[bucket,setBucket]=useState('day');
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true); setError(''); setData(null);
    fetch(`/api/admin/statistics?${new URLSearchParams({catalogId:id,from,to,bucket})}`,{cache:'no-store',signal:controller.signal})
      .then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error||'Chargement impossible.');return result;})
      .then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[id,from,to,bucket,retry]);
  const series=data?.series || [];
  const max=Math.max(1,...series.map(p=>Math.max(p.visits,p.productClicks)));
  const point=(p,i,key)=>`${48+(i*700/Math.max(1,series.length-1))},${210-p[key]/max*170}`;
  return <main className={styles.page}><div className={styles.shell}>
    <a className={styles.back} href={`/admin/catalogue/${id}`}>← Gestion du catalogue</a>
    <header className={styles.header}><div><p className={styles.eyebrow}>LEHNOVA · ADMINISTRATION</p><h1>Statistiques</h1><p>{data?.catalog?.catalog_title || 'Catalogue & showroom'}</p></div><span className={styles.badge}>Mesure avec consentement</span></header>
    <section className={styles.filters} aria-label="Période des statistiques">
      <div className={styles.presets}>{[['Aujourd’hui',0],['7 jours',6],['30 jours',29],['12 mois',364]].map(([label,days])=><button key={label} type="button" onClick={()=>{setFrom(daysAgo(days));setTo(today());setBucket(days>90?'month':'day');}}>{label}</button>)}</div>
      <div className={styles.inputs}><label>Du<input type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label>Au<input type="date" value={to} min={from} max={today()} onChange={e=>setTo(e.target.value)}/></label><label>Regrouper par<select value={bucket} onChange={e=>setBucket(e.target.value)}><option value="day">Jour</option><option value="week">Semaine</option><option value="month">Mois</option><option value="year">Année</option></select></label><button type="button" onClick={()=>setRetry(v=>v+1)}>Actualiser</button></div>
    </section>
    <div aria-live="polite">{loading&&<p>Chargement des statistiques…</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}</div>
    {data&&!loading&&<>
      <section className={styles.metrics} aria-label="Indicateurs de fréquentation">{[['Visites',data.visits],['Visiteurs uniques estimés',data.uniqueVisitors],['Clics produits',data.productClicks],['Clics de contact',data.contactClicks]].map(([label,value])=><article key={label}><span>{label}</span><strong>{number(value)}</strong></article>)}</section>
      {data.visits===0&&data.productClicks===0&&data.contactClicks===0&&<p className={styles.notice}>Aucune activité consentie sur cette période. Les visites antérieures à l’installation ne peuvent pas être reconstituées.</p>}
      <section className={styles.card}><h2>Évolution de l’activité</h2><p className={styles.legend}><span>● Visites</span><span>● Clics produits</span></p>
        <svg viewBox="0 0 800 250" className={styles.chart} role="img" aria-label="Évolution des visites et des clics produits. Données détaillées dans le tableau ci-dessous.">
          {[0,0.5,1].map(n=><g key={n}><line x1="48" x2="748" y1={210-n*170} y2={210-n*170} stroke="#e4dccd"/><text x="8" y={215-n*170} fontSize="12" fill="#655b4f">{number(Math.round(max*n))}</text></g>)}
          <polyline points={series.map((p,i)=>point(p,i,'visits')).join(' ')} fill="none" stroke="#786956" strokeWidth="3"/>
          <polyline points={series.map((p,i)=>point(p,i,'productClicks')).join(' ')} fill="none" stroke="#b5402d" strokeWidth="3"/>
          {series.map((p,i)=><g key={p.period}><circle cx={48+i*700/Math.max(1,series.length-1)} cy={210-p.visits/max*170} r="3" fill="#786956"><title>{p.period} : {number(p.visits)} visites</title></circle><circle cx={48+i*700/Math.max(1,series.length-1)} cy={210-p.productClicks/max*170} r="3" fill="#b5402d"><title>{p.period} : {number(p.productClicks)} clics produits</title></circle></g>)}
          <text x="48" y="242" fontSize="12" fill="#655b4f">{series[0]?.period}</text><text x="748" y="242" textAnchor="end" fontSize="12" fill="#655b4f">{series.at(-1)?.period}</text>
        </svg>
        <details><summary>Consulter l’historique détaillé</summary><div className={styles.tableWrap}><table><caption>Historique · heure de Paris · semaines du lundi au dimanche</caption><thead><tr><th>Période</th><th>Visites</th><th>Uniques estimés</th><th>Clics produits</th></tr></thead><tbody>{series.map(row=><tr key={row.period}><th scope="row">{row.period}</th><td>{number(row.visits)}</td><td>{number(row.uniqueVisitors)}</td><td>{number(row.productClicks)}</td></tr>)}</tbody></table></div></details>
      </section>
      <div className={styles.columns}><section className={styles.card}><h2>Produits les plus consultés</h2><p>Classement selon les clics sur les fiches produits.</p>{!data.products.length?<p>Aucun produit consulté.</p>:<ol className={styles.ranking}>{data.products.map((product,i)=><li key={product.product_id||'deleted'}><span><small>{String(i+1).padStart(2,'0')}</small>{product.name}</span><strong>{number(product.clicks)} <small>clics</small></strong></li>)}</ol>}</section>
      <section className={styles.card}><h2>Contacts & réseaux</h2><ul className={styles.contacts}>{Object.entries(labels).map(([key,label])=><li key={key}><span>{label}</span><strong>{number(data.contacts[key])}</strong></li>)}</ul></section></div>
    </>}
    <p className={styles.privacy}>Données propres à ce catalogue. Historique conservé 13 mois. Les uniques sont dédupliqués sur la période choisie et ne s’additionnent pas entre périodes. Refus, changement de navigateur, effacement ou expiration de l’identifiant limitent cette estimation. Une visite correspond à une session de 30 minutes par onglet. Les aperçus administrateur sont exclus.</p>
  </div></main>;
}
