"use client";
import {useState} from 'react';

const input={width:'100%',minWidth:0,boxSizing:'border-box',padding:12,fontSize:16,border:'1px solid #D8CCAB',borderRadius:8};

export default function SimplifiedOfferEditor({value=[],onChange,disabled=false}){
  const offers=Array.isArray(value)?value:[];
  const update=(index,key,val)=>onChange(offers.map((offer,i)=>i===index?{...offer,[key]:val}:offer));
  return <section style={{padding:20,background:'#fff',borderRadius:18,minWidth:0}}>
    <h2>Lehnova Ticket simplifié</h2>
    <p>Affichez directement jusqu’à six produits ou prestations sur le ticket : photo, nom et prix. Aucun catalogue séparé.</p>
    <div style={{display:'grid',gap:12,margin:'16px 0'}}>
      {offers.map((offer,index)=><fieldset key={index} disabled={disabled} style={{minWidth:0,border:'1px solid #D8CCAB',borderRadius:12,padding:14,display:'grid',gap:10}}>
        <legend>Produit / prestation {index+1}</legend>
        <label style={{display:'grid',gap:5}}>Nom<input maxLength={100} value={offer.title||''} onChange={e=>update(index,'title',e.target.value)} style={input}/></label>
        <label style={{display:'grid',gap:5}}>Prix<input maxLength={160} value={offer.detail||''} onChange={e=>update(index,'detail',e.target.value)} style={input}/></label>
        <label style={{display:'grid',gap:5}}>URL de la photo<input type="url" maxLength={2000} value={offer.image_url||''} onChange={e=>update(index,'image_url',e.target.value)} style={input}/></label>
        {/^https?:\/\//.test(offer.image_url||'')&&<img src={offer.image_url} alt={offer.title||'Aperçu'} style={{width:'100%',height:130,objectFit:'cover',borderRadius:8}}/>}
        <button type="button" onClick={()=>onChange(offers.filter((_,i)=>i!==index))}>Retirer</button>
      </fieldset>)}
      <button type="button" disabled={disabled||offers.length>=6} onClick={()=>onChange([...offers,{title:'',detail:'',image_url:''}])}>Ajouter un produit / une prestation</button>
    </div>
  </section>;
}
