"use client";
import {useState} from 'react';
import AdminTicketAffluence from './AdminTicketAffluence';

export default function TicketSettings({business,onSaved}){
  const [url,setUrl]=useState(business.offers_url||'');
  const [enabled,setEnabled]=useState(business.public_screen_enabled!==false);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [showStats,setShowStats]=useState(false);
  const client=`https://lehnova.fr/ticket/${business.slug}`;
  const screen=`${client}/ecran`;
  const qr=(value)=>`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
  async function save(){
    setBusy(true);setMessage('');
    try{
      const response=await fetch(`/api/admin/tickets/${business.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({offers_url:url,public_screen_enabled:enabled})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setMessage('Paramètres enregistrés.');onSaved?.();
    }catch(err){setMessage(err.message||'Enregistrement impossible.');}finally{setBusy(false);}
  }
  async function copy(value,label){try{await navigator.clipboard.writeText(value);setMessage(`${label} copié.`);}catch{setMessage(`Copiez ce lien : ${value}`);}}
  const button={display:'inline-block',padding:'8px 10px',border:'1px solid #D8CCAB',borderRadius:8,background:'#fff',color:'#5B4636',fontSize:12,textDecoration:'none',fontWeight:600};
  return <details open style={{marginTop:12,minWidth:0,maxWidth:520,fontSize:13,overflowWrap:'anywhere'}}>
    <summary style={{cursor:'pointer',padding:'8px 0',fontWeight:800}}>Tableau de contrôle Ticket</summary>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
      <a href={client} target="_blank" rel="noreferrer" style={button}>Page client / QR</a>
      <a href={screen} target="_blank" rel="noreferrer" style={button}>Écran public</a>
      <a href="/ticket/connexion" target="_blank" rel="noreferrer" style={button}>Gestion commerçant</a>
      <button type="button" style={button} onClick={()=>setShowStats(v=>!v)}>{showStats?'Fermer affluence':'Affluence / historique'}</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'80px minmax(0,1fr)',gap:10,alignItems:'center',marginBottom:12}}>
      <img src={qr(client)} width="80" height="80" alt={`QR client ${business.name}`} style={{borderRadius:8,border:'1px solid #EAE3D6'}}/>
      <div><strong>QR prise de ticket</strong><br/><button type="button" style={{...button,marginTop:6}} onClick={()=>copy(client,'Lien client')}>Copier le lien</button></div>
    </div>
    <label style={{display:'grid',minWidth:0,gap:6,fontWeight:700}}>Offres / promotions
      <input type="url" placeholder="https://…" maxLength={2000} value={url} onChange={e=>setUrl(e.target.value)} style={{minWidth:0,width:'100%',boxSizing:'border-box',padding:10,fontSize:16,border:'1px solid #D8CCAB',borderRadius:8}}/>
    </label>
    {url&&<div style={{display:'grid',gridTemplateColumns:'80px minmax(0,1fr)',gap:10,alignItems:'center',marginTop:10}}><img src={qr(url)} width="80" height="80" alt="QR des offres" style={{borderRadius:8,border:'1px solid #EAE3D6'}}/><div><strong>QR offres / promotions</strong><br/><a href={url} target="_blank" rel="noreferrer" style={{...button,marginTop:6}}>Voir les offres</a> <button type="button" style={{...button,marginTop:6}} onClick={()=>copy(url,'Lien offres')}>Copier</button></div></div>}
    <label style={{display:'flex',gap:8,margin:'12px 0',alignItems:'center'}}><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Écran public activé</label>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" disabled={busy} onClick={save} style={button}>{busy?'Enregistrement…':'Enregistrer les réglages'}</button><button type="button" onClick={()=>copy(screen,'Lien écran')} style={button}>Copier lien écran</button></div>
    {showStats&&<AdminTicketAffluence businessId={business.id}/>} 
    <p role="status" style={{overflowWrap:'anywhere',color:'#5B4636'}}>{message}</p>
  </details>;
}
