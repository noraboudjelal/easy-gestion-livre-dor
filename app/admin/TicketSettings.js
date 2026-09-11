"use client";
import {useState} from 'react';

export default function TicketSettings({business,onSaved}){
  const [url,setUrl]=useState(business.offers_url||'');
  const [enabled,setEnabled]=useState(business.public_screen_enabled!==false);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const screen=`https://lehnova.fr/ticket/${business.slug}/ecran`;
  async function save(){
    setBusy(true);setMessage('');
    try{
      const response=await fetch(`/api/admin/tickets/${business.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({offers_url:url,public_screen_enabled:enabled})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setMessage('Paramètres enregistrés.');onSaved?.();
    }catch(err){setMessage(err.message||'Enregistrement impossible.');}finally{setBusy(false);}
  }
  async function copy(){try{await navigator.clipboard.writeText(screen);setMessage('Lien copié.');}catch{setMessage(`Copiez ce lien : ${screen}`);}}
  return <details style={{marginTop:12,minWidth:0,maxWidth:340,fontSize:13,overflowWrap:'anywhere'}}>
    <summary style={{cursor:'pointer',padding:'8px 0'}}>Offres et écran public</summary>
    <label style={{display:'grid',minWidth:0,gap:6}}>URL de la page / des offres<input type="url" placeholder="https://…" maxLength={2000} value={url} onChange={e=>setUrl(e.target.value)} style={{minWidth:0,width:'100%',boxSizing:'border-box',padding:10,fontSize:16}}/></label>
    <label style={{display:'flex',gap:8,margin:'12px 0'}}><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Écran public activé</label>
    <button type="button" disabled={busy} onClick={save} style={{padding:10}}>{busy?'Enregistrement…':'Enregistrer'}</button>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}><a href={screen} target="_blank" rel="noreferrer">Ouvrir l’écran public</a><button type="button" onClick={copy}>Copier le lien</button></div>
    <p role="status" style={{overflowWrap:'anywhere'}}>{message}</p>
  </details>;
}
