"use client";
import {useState} from 'react';
import AdminTicketAffluence from './AdminTicketAffluence';

export default function TicketSettings({business,onSaved}){
  const [enabled,setEnabled]=useState(business.public_screen_enabled!==false);
  const [queueOpen,setQueueOpen]=useState(Boolean(business.queue?.is_open));
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [showStats,setShowStats]=useState(false);
  const client=`https://lehnova.fr/ticket/${business.slug}`;
  const screen=`${client}/ecran`;
  const qr=(value)=>`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
  async function save(){setBusy(true);setMessage('');try{const response=await fetch(`/api/admin/tickets/${business.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({public_screen_enabled:enabled})});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage('Paramètres enregistrés.');onSaved?.();}catch(err){setMessage(err.message||'Enregistrement impossible.');}finally{setBusy(false);}}
  async function toggleQueue(){const next=!queueOpen;setBusy(true);setMessage('');try{const response=await fetch(`/api/admin/tickets/${business.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_open:next})});const data=await response.json();if(!response.ok)throw new Error(data.error);setQueueOpen(next);setMessage(next?'File ouverte.':'File fermée.');onSaved?.();}catch(err){setMessage(err.message||'Modification de la file impossible.');}finally{setBusy(false);}}
  async function copy(value,label){try{await navigator.clipboard.writeText(value);setMessage(`${label} copié.`);}catch{setMessage(`Copiez ce lien : ${value}`);}}
  const button={display:'inline-block',padding:'8px 10px',border:'1px solid #D8CCAB',borderRadius:8,background:'#fff',color:'#5B4636',fontSize:12,textDecoration:'none',fontWeight:600};
  return <details open style={{marginTop:12,minWidth:0,maxWidth:520,fontSize:13,overflowWrap:'anywhere'}}>
    <summary style={{cursor:'pointer',padding:'8px 0',fontWeight:800}}>Tableau de contrôle Ticket</summary>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',padding:12,marginBottom:12,border:'1px solid #E6DDCC',borderRadius:10,background:'#FAF7F2'}}><strong style={{color:queueOpen?'#287A45':'#A43B32'}}>{queueOpen?'● File ouverte':'● File fermée'}</strong><button type="button" disabled={busy||!business.is_active} onClick={toggleQueue} style={{...button,fontWeight:800,borderColor:queueOpen?'#D9AAA5':'#A8D1B4'}}>{busy?'Patientez…':queueOpen?'Fermer la file':'Ouvrir la file'}</button>{!business.is_active&&<span style={{width:'100%',fontSize:11,color:'#8A6F5B'}}>Le commerce doit être activé avant d’ouvrir la file.</span>}</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}><a href={client} target="_blank" rel="noreferrer" style={button}>Page client / QR</a><a href={screen} target="_blank" rel="noreferrer" style={button}>Écran public</a><a href={`/admin/ticket-offres?id=${encodeURIComponent(business.id)}`} style={{...button,background:'#5B4636',color:'#fff'}}>Gérer les offres</a><a href="/ticket/connexion" target="_blank" rel="noreferrer" style={button}>Gestion commerçant</a><button type="button" style={button} onClick={()=>setShowStats(v=>!v)}>{showStats?'Fermer affluence':'Affluence / historique'}</button></div>
    <div style={{display:'grid',gridTemplateColumns:'80px minmax(0,1fr)',gap:10,alignItems:'center',marginBottom:12}}><img src={qr(client)} width="80" height="80" alt={`QR client ${business.name}`} style={{borderRadius:8,border:'1px solid #EAE3D6'}}/><div><strong>QR prise de ticket</strong><br/><button type="button" style={{...button,marginTop:6}} onClick={()=>copy(client,'Lien client')}>Copier le lien</button></div></div>
    <label style={{display:'flex',gap:8,margin:'12px 0',alignItems:'center'}}><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Écran public activé</label>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" disabled={busy} onClick={save} style={button}>{busy?'Enregistrement…':'Enregistrer les réglages'}</button><button type="button" onClick={()=>copy(screen,'Lien écran')} style={button}>Copier lien écran</button></div>
    {showStats&&<AdminTicketAffluence businessId={business.id}/>}<p role="status" style={{overflowWrap:'anywhere',color:'#5B4636'}}>{message}</p>
  </details>;
}
