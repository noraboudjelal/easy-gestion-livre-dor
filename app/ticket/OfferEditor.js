"use client";
import {useEffect,useState} from 'react';

export function OfferFields({offers,onChange,disabled=false}) {
  const update=(index,key,value)=>onChange(offers.map((offer,i)=>i===index?{...offer,[key]:value}:offer));
  return <div style={{display:'grid',gap:12,margin:'16px 0'}}>
    <p style={{margin:0}}>Ajoutez jusqu’à six produits ou prestations. Ils s’affichent directement sur Lehnova Ticket avec leur photo et leur prix, sans ouvrir de catalogue.</p>
    {offers.map((offer,index)=><fieldset key={index} disabled={disabled} style={{minWidth:0,border:'1px solid #D8CCAB',borderRadius:12,padding:14,display:'grid',gap:10}}>
      <legend>Produit / prestation {index+1}</legend>
      {[['title','Nom',100],['detail','Prix',160],['image_url','URL de la photo',2000]].map(([key,label,max])=><label key={key} style={{display:'grid',gap:5}}>{label}<input type={key==='image_url'?'url':'text'} maxLength={max} value={offer[key]||''} onChange={e=>update(index,key,e.target.value)} style={input}/></label>)}
      {/^https?:\/\//.test(offer.image_url||'')&&<img src={offer.image_url} alt={offer.title||'Aperçu'} style={{width:'100%',height:130,objectFit:'cover',borderRadius:8}}/>}
      <button type="button" onClick={()=>onChange(offers.filter((_,i)=>i!==index))}>Retirer</button>
    </fieldset>)}
    <button type="button" disabled={disabled||offers.length>=6} onClick={()=>onChange([...offers,{title:'',detail:'',image_url:''}])}>Ajouter un produit / une prestation</button>
  </div>;
}
const input={width:'100%',minWidth:0,boxSizing:'border-box',padding:12,fontSize:16,border:'1px solid #D8CCAB',borderRadius:8};

export default function OfferEditor(){
  const [offers,setOffers]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{const controller=new AbortController();fetch('/api/ticket/merchant/offers',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setOffers(Array.isArray(data.offer_previews)?data.offer_previews:[]);setLoading(false);}).catch(error=>{if(error.name!=='AbortError')setMessage(error.message);});return()=>controller.abort();},[]);
  async function save(){setBusy(true);setMessage('');try{const response=await fetch('/api/ticket/merchant/offers',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({offers_url:'',offer_previews:offers.map(({title,detail,image_url})=>({title,detail,image_url}))})});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage('Vos produits et prestations sont enregistrés et visibles directement sur votre Ticket.');}catch(error){setMessage(error.message||'Enregistrement impossible.');}finally{setBusy(false);}}
  return <section style={{padding:20,background:'#fff',borderRadius:18,minWidth:0}}><h2>Lehnova Ticket simplifié</h2>{loading?<p>{message||'Chargement…'}</p>:<><OfferFields offers={offers} onChange={setOffers} disabled={busy}/><button type="button" disabled={busy} onClick={save} style={{padding:14}}>{busy?'Enregistrement…':'Enregistrer'}</button><p role="status">{message}</p></>}</section>;
}
