import {getSupabaseAdmin} from "../../../lib/supabaseAdmin";
export const dynamic="force-dynamic";
export default async function ContactPage({params}){
 const {slug}=await params;
 const {data:c}=await getSupabaseAdmin().from("lehnova_contacts").select("*").eq("slug",slug).maybeSingle();
 if(!c)return <main style={{padding:48,fontFamily:"sans-serif"}}>Cette fiche n’existe pas.</main>;
 const gallery=Array.isArray(c.gallery_urls)?c.gallery_urls.filter(Boolean):[];
 const catalogUrl=c.catalogue_slug?"/catalogue/"+encodeURIComponent(c.catalogue_slug):"";
 const services=(c.services||"").split("\n").map(x=>x.trim()).filter(Boolean);
 const links=[["Téléphone",c.phone?"tel:"+c.phone:""],["WhatsApp",c.whatsapp?"https://wa.me/"+c.whatsapp.replace(/\D/g,""):""],["Instagram",c.instagram],["Site internet",c.website]].filter(x=>x[1]);
 const action={display:"flex",alignItems:"center",justifyContent:"center",minHeight:56,padding:"12px 20px",borderRadius:14,fontSize:14,fontWeight:650,textDecoration:"none",letterSpacing:".015em",boxSizing:"border-box"};
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% -10%,#e9ddd0 0%,#f8f6f2 52%,#f3eee7 100%)",padding:"clamp(24px,6vw,76px) 16px",fontFamily:"Arial,Helvetica,sans-serif",color:"#28231f"}}>
 <article style={{maxWidth:590,margin:"0 auto",background:"#fffdfb",border:"1px solid #eae2d8",borderRadius:28,overflow:"hidden",boxShadow:"0 24px 80px rgba(62,42,28,.10)"}}>
 <div style={{height:7,background:"linear-gradient(90deg,#c1a88b,#e9d9bf,#b89776)"}}/>
 <header style={{textAlign:"center",padding:"44px 28px 30px"}}>
 <p style={{fontSize:10,fontWeight:700,letterSpacing:".33em",color:"#a48c72",margin:"0 0 32px"}}>LEHNOVA <span style={{color:"#c6b49f"}}>·</span> CONTACT</p>
 {c.photo_url?<img src={c.photo_url} alt={"Photo de "+c.name} style={{width:112,height:112,borderRadius:22,objectFit:"cover",border:"5px solid #f6f1eb",boxShadow:"0 8px 25px #30201516",marginBottom:19}}/>:<div style={{width:76,height:76,margin:"0 auto 22px",border:"1px solid #d8c8b5",borderRadius:22,display:"grid",placeItems:"center",background:"#f8f3ed",fontSize:27,color:"#a88c6f"}}>{(c.company||c.name||"L").slice(0,1).toUpperCase()}</div>}
 <h1 style={{fontFamily:"Georgia,'Times New Roman',serif",fontWeight:400,fontSize:"clamp(30px,6vw,41px)",letterSpacing:"-.035em",lineHeight:1.12,margin:"0 0 12px"}}>{c.company||c.name}</h1>
 {c.name&&c.name!==c.company&&<p style={{fontSize:15,margin:"0 0 6px"}}>{c.name}</p>}
 {c.job&&<p style={{fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"#967c63",margin:"10px 0 0"}}>{c.job}</p>}
 {c.description&&<p style={{fontSize:14,lineHeight:1.8,color:"#746b63",maxWidth:410,margin:"22px auto 0"}}>{c.description}</p>}
 <div style={{width:42,height:1,background:"#c6ae93",margin:"28px auto"}}/>
 <div style={{display:"grid",gap:11,maxWidth:410,margin:"0 auto"}}>
 <a href={"/contact/"+encodeURIComponent(slug)+"/vcf"} style={{...action,background:"#2f2924",color:"#fff",boxShadow:"0 8px 20px #30251b1a"}}>＋ &nbsp; Enregistrer le contact</a>
 {c.display_mode==="catalogue"&&catalogUrl&&<a href={catalogUrl} style={{...action,border:"1px solid #cbb9a3",background:"#f8f4ee",color:"#40362e"}}>Découvrir notre catalogue &nbsp; ↗</a>}
 {c.display_mode==="vitrine"&&c.showcase_url&&<a href={c.showcase_url} style={{...action,border:"1px solid #cbb9a3",background:"#f8f4ee",color:"#40362e"}}>Découvrir nos prestations &nbsp; ↗</a>}
 </div></header>
 {(services.length>0||gallery.length>0)&&c.display_mode!=="simple"&&<section style={{padding:"6px 28px 34px"}}>
 <div style={{height:1,background:"#e9e2d9",marginBottom:28}}/>
 <p style={{fontSize:10,fontWeight:700,letterSpacing:".24em",color:"#a38a72",textAlign:"center",margin:"0 0 12px"}}>DÉCOUVRIR</p>
 <h2 style={{fontFamily:"Georgia,serif",fontWeight:400,textAlign:"center",fontSize:27,margin:"0 0 25px"}}>{gallery.length?"Nos réalisations":"Nos prestations"}</h2>
 {gallery.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>{gallery.map((url,i)=><img key={i} src={url} alt={"Réalisation "+(i+1)} style={{width:"100%",aspectRatio:i===0&&gallery.length%2===1?"2 / 1":"1 / 1",gridColumn:i===0&&gallery.length%2===1?"span 2":undefined,objectFit:"cover",borderRadius:12}}/>)}</div>}
 {services.length>0&&<div style={{marginTop:gallery.length?22:0}}>{services.map((item,i)=><div key={i} style={{borderBottom:"1px solid #eee7df",padding:"13px 3px",fontSize:14,color:"#51463c"}}><span style={{color:"#b89d7e",marginRight:12}}>✦</span>{item}</div>)}</div>}
 </section>}
 {links.length>0&&<section style={{padding:"0 28px 32px",display:"flex",justifyContent:"center",gap:9,flexWrap:"wrap"}}>{links.map(([label,url])=><a key={label} href={url} target={url.startsWith("http")?"_blank":undefined} rel={url.startsWith("http")?"noopener noreferrer":undefined} style={{padding:"11px 16px",borderRadius:50,border:"1px solid #e2d8cd",textDecoration:"none",fontSize:12,color:"#514336"}}>{label} ↗</a>)}</section>}
 <footer style={{background:"#f8f5f0",padding:"18px 16px",textAlign:"center",fontSize:10,letterSpacing:".15em",color:"#a39484"}}>CARTE DE VISITE NUMÉRIQUE <span style={{color:"#c7b59f"}}>·</span> LEHNOVA</footer>
 </article></main>
}