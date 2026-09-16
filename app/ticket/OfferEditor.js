"use client";
import {useEffect,useState} from 'react';

const input={width:'100%',minWidth:0,boxSizing:'border-box',padding:12,fontSize:16,border:'1px solid #D8CCAB',borderRadius:8};

export function OfferFields({offers,onChange,disabled=false,direct=false}) {
  const update=(index,key,value)=>onChange(offers.map((offer,i)=>i===index?{...offer,[key]:value}:offer));
  return <div style={{display:'grid',gap:12,margin:'16px 0'}}>
    <p style={{margin:0}}>{direct?'Ajoutez jusqu’à six produits ou prestations. Ils seront affichés directement sous le ticket, sans catalogue.':'Ajoutez jusqu’à six aperçus. Chaque carte utilise le lien général, sauf si vous indiquez un autre lien.'}</p>
    {offers.map((offer,index)=><fieldset key={index} disabled={disabled} style={{minWidth:0,border:'1px solid #D8CCAB',borderRadius:12,padding:14,display:'grid',gap:10}}>
      <legend>{direct?'Produit / prestation':'Offre'} {index+1}</legend>
      {[['title',direct?'Nom':'Titre',100],['detail',direct?'Prix':'Prix ou petit texte',160],['image_url','URL de la photo',2000],...(!direct?[['url','Lien de destination (facultatif)',2000]]:[])].map(([key,label,max])=><label key={key} style={{display:'grid',gap:5}}>{label}<input type={key.endsWith('url')?'url':'text'} maxLength={max} value={offer[key]||''} onChange={e=>update(index,key,e.target.value)} style={input}/></label>)}
      {/^https?:\/\//.test(offer.image_url||'')&&<img src={offer.image_url} alt={offer.title||'Aperçu'} style={{width:'100%',height:130,objectFit:'cover',borderRadius:8}}/>}
      <button type="button" onClick={()=>onChange(offers.filter((_,i)=>i!==index))}>Retirer</button>
    </fieldset>)}
    <button type="button" disabled={disabled||offers.length>=6} onClick={()=>onChange([...offers,{title:'',detail:'',image_url:'',url:''}])}>{direct?'Ajouter un produit / une prestation':'Ajouter une offre'}</button>
  </div>;
}

export default function OfferEditor(){
  const [url,setUrl]=useState(''),[offers,setOffers]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [mode,setMode]=useState('none');
  useEffect(()=>{const controller=new AbortController();fetch('/api/ticket/merchant/offers',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);const nextUrl=data.offers_url||'';const nextOffers=Array.isArray(data.offer_previews)?data.offer_previews:[];setUrl(nextUrl);setOffers(nextOffers);setMode(nextUrl?'catalogue':nextOffers.length?'direct':'none');setLoading(false);}).catch(error=>{if(error.name!=='AbortError')setMessage(error.message);});return()=>controller.abort();},[]);
  async function save(){setBusy(true);setMessage('');try{const cleanOffers=mode==='direct'?offers.map(({title,detail,image_url})=>({title,detail,image_url,url:''})):mode==='catalogue'?offers:[];const response=await fetch('/api/ticket/merchant/offers',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({offers_url:mode==='catalogue'?url:'',offer_previews:cleanOffers})});const data=await response.json();if(!response.ok)throw new Error(data.error);setOffers(cleanOffers);setMessage(mode==='direct'?'Photos et prix affichés directement sur votre Ticket.':mode==='catalogue'?'Catalogue enregistré.':'Les offres sont masquées sur votre Ticket.');}catch(error){setMessage(error.message||'Enregistrement impossible.');}finally{setBusy(false);}}
  return <section style={{padding:20,background:'#fff',borderRadius:18,minWidth:0}}><h2>Affichage des offres</h2>{loading?<p>{message||'Chargement…'}</p>:<><label style={{display:'grid',gap:8}}>Choisir l’affichage<select value={mode} onChange={e=>setMode(e.target.value)} style={input}><option value="catalogue">Catalogue / lien externe</option><option value="direct">Photos + prix directement sur le Ticket</option><option value="none">Aucun</option></select></label>{mode==='catalogue'&&<><label style={{display:'grid',gap:8,marginTop:16}}>Lien de toutes vos offres<input type="url" placeholder="https://…" value={url} maxLength={2000} onChange={e=>setUrl(e.target.value)} style={input}/></label><OfferFields offers={offers} onChange={setOffers} disabled={busy}/></>}{mode==='direct'&&<OfferFields offers={offers} onChange={setOffers} disabled={busy} direct/>}<button type="button" disabled={busy} onClick={save} style={{padding:14}}>{busy?'Enregistrement…':'Enregistrer'}</button><p role="status">{message}</p></>}</section>;
}
