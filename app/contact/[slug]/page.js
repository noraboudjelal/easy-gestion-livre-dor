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
 return <main style={{minHeight:"100vh",background:"linear-gradient(145deg,#e9dfd3 0%,#f7f4ef 48%,#ece3d8 100%)",padding:"clamp(24px,6vw,76px) 16px",fontFamily:"Arial,Helvetica,sans-serif",color:"#28231f"}}>
 <article style={{maxWidth:620,margin:"0 auto",background:"#fffdfb",border:"1px solid #eae2d8",borderRadius:32,overflow:"hidden",boxShadow:"0 35px 100px rgba(49,34,24,.16)"}}>
 <div style={{height:5,background:"linear-gradient(90deg,#8f7050,#ead4a9,#8f7050)"}}/>
 <header style={{textAlign:"center",padding:"48px 28px 34px"}}>
 <p style={{fontSize:10,fontWeight:700,letterSpacing:".33em",color:"#a48c72",margin:"0 0 38px"}}>LEHNOVA <span style={{color:"#c6b49f"}}>·</span> CONTACT</p>
 {c.photo_url?<img src={c.photo_url} alt={"Photo de "+c.name} style={{width:132,height:132,borderRadius:28,objectFit:"cover",border:"5px solid #f6f1eb",boxShadow:"0 8px 25px #30201516",marginBottom:19}}/>:<div style={{width:76,height:76,margin:"0 auto 22px",border:"1px solid #d8c8b5",borderRadius:22,display:"grid",placeItems:"center",background:"#f8f3ed",fontSize:27,color:"#a88c6f"}}>{(c.company||c.name||"L").slice(0,1).toUpperCase()}</div>}
 <h1 style={{fontFamily:"Georgia,'Times New Roman',serif",fontWeight:400,fontSize:"clamp(34px,6vw,46px)",letterSpacing:"-.035em",lineHeight:1.12,margin:"0 0 12px"}}>{c.company||c.name}</h1>
 {c.name&&c.name!==c.company&&<p style={{fontSize:15,margin:"0 0 6px"}}>{c.name}</p>}
 {c.job&&<p style={{fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"#967c63",margin:"10px 0 0"}}>{c.job}</p>}
 {c.description&&<p style={{fontSize:14,lineHeight:1.8,color:"#746b63",maxWidth:410,margin:"22px auto 0"}}>{c.description}</p>}
 <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"29px auto"}}><span style={{width:35,height:1,background:"#c6ae93"}}/><span style={{fontSize:16,color:"#b89b77"}}>✦</span><span style={{width:35,height:1,background:"#c6ae93"}}/></div>
 {links.length>0&&<nav aria-label="Contacter" style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:12,maxWidth:440,margin:"0 auto 26px"}}>{links.map(([label,url])=><a key={label} href={url} target={url.startsWith("http")?"_blank":undefined} rel={url.startsWith("http")?"noopener noreferrer":undefined} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,minWidth:76,textDecoration:"none",fontSize:11,color:"#665444"}}><span style={{width:47,height:47,borderRadius:"50%",display:"grid",placeItems:"center",background:"#f3ece2",border:"1px solid #e6d8c7",fontSize:19,color:"#9a7b54"}}>{label==="Téléphone"?"☎":label==="WhatsApp"?"✆":label==="Instagram"?"◎":"⌂"}</span>{label}</a>)}</nav>}<div style={{display:"grid",gap:12,maxWidth:430,margin:"0 auto"}}>
 <a href={"/contact/"+encodeURIComponent(slug)+"/vcf"} style={{...action,background:"linear-gradient(120deg,#28211c,#4a392c)",color:"#fff",boxShadow:"0 8px 20px #30251b1a"}}>＋ &nbsp; Enregistrer le contact</a>
 {c.display_mode==="catalogue"&&catalogUrl&&<a href={catalogUrl} style={{...action,border:"1px solid #cbb9a3",background:"linear-gradient(110deg,#f9f4ec,#efe3d3)",color:"#40362e"}}>Découvrir notre catalogue</a>}
 {c.display_mode==="vitrine"&&c.showcase_url&&<a href={c.showcase_url} style={{...action,border:"1px solid #cbb9a3",background:"#f8f4ee",color:"#40362e"}}>Découvrir nos prestations</a>}
 </div></header>
 {(services.length>0||gallery.length>0)&&c.display_mode!=="simple"&&<section style={{padding:"6px 28px 34px"}}>
 <div style={{height:1,background:"#e9e2d9",marginBottom:28}}/>
 <p style={{fontSize:10,fontWeight:700,letterSpacing:".24em",color:"#a38a72",textAlign:"center",margin:"0 0 12px"}}>DÉCOUVRIR</p>
 <h2 style={{fontFamily:"Georgia,serif",fontWeight:400,textAlign:"center",fontSize:27,margin:"0 0 25px"}}>{gallery.length?"Nos réalisations":"Nos prestations"}</h2>
 {gallery.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>{gallery.map((url,i)=><img key={i} src={url} alt={"Réalisation "+(i+1)} style={{width:"100%",aspectRatio:i===0&&gallery.length%2===1?"2 / 1":"1 / 1",gridColumn:i===0&&gallery.length%2===1?"span 2":undefined,objectFit:"cover",borderRadius:12}}/>)}</div>}
 {services.length>0&&<div style={{marginTop:gallery.length?22:0}}>{services.map((item,i)=><div key={i} style={{borderBottom:"1px solid #eee7df",padding:"13px 3px",fontSize:14,color:"#51463c"}}><span style={{color:"#b89d7e",marginRight:12}}>✦</span>{item}</div>)}</div>}
 </section>}
 
 <footer style={{background:"#f8f5f0",padding:"18px 16px",textAlign:"center",fontSize:10,letterSpacing:".15em",color:"#a39484"}}>UNE NOUVELLE PERSPECTIVE <span style={{color:"#c7b59f"}}>·</span> LEHNOVA</footer>
 </article></main>
}