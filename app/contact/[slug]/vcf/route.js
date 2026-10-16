import {getSupabaseAdmin} from "../../../../lib/supabaseAdmin";
export const dynamic="force-dynamic";
export const revalidate=0;
const esc=x=>String(x||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\r/g,"");
const fold=line=>{const chunks=[];let rest=line;while(Buffer.byteLength(rest,"utf8")>73){let n=73;while(Buffer.byteLength(rest.slice(0,n),"utf8")>73)n--;chunks.push(rest.slice(0,n));rest=" "+rest.slice(n)}chunks.push(rest);return chunks.join("\r\n")};
export async function GET(req,{params}){
 const {slug}=await params;
 const {data:c}=await getSupabaseAdmin().from("lehnova_contacts").select("*").eq("slug",slug).maybeSingle();
 if(!c)return new Response("Contact introuvable",{status:404});
 const base="https://lehnova.fr",url=base+"/contact/"+encodeURIComponent(slug);
 const lines=["BEGIN:VCARD","VERSION:3.0","N:"+esc(c.name||c.company)+";;;;","FN:"+esc(c.company||c.name),"ORG:"+esc(c.company),"TITLE:"+esc(c.job)];
 if(c.phone)lines.push("TEL;TYPE=CELL,VOICE:"+String(c.phone).replace(/[^+0-9]/g,""));
 if(c.email)lines.push("EMAIL;TYPE=INTERNET:"+esc(c.email));
 lines.push("URL:"+esc(url));
 if(c.website)lines.push("URL;TYPE=WORK:"+esc(c.website));
 if(c.description)lines.push("NOTE:"+esc(c.description));
 if(c.photo_url){
  try{
   const parsed=new URL(c.photo_url);
   if(parsed.protocol==="https:"&&["lehnova.fr","www.lehnova.fr"].includes(parsed.hostname)){
    const image=await fetch(parsed.toString(),{cache:"no-store",signal:AbortSignal.timeout(6000)});
    if(image.ok){
     const bytes=Buffer.from(await image.arrayBuffer());
     if(bytes.length<2000000){
      const sharp=(await import("sharp")).default;
      const png=await sharp(bytes).resize(360,360,{fit:"contain"}).png().toBuffer();
      lines.push("PHOTO;ENCODING=b;TYPE=PNG:"+png.toString("base64"));
     }
    }
   }
  }catch(e){console.error("Contact photo export:",e)}
 }
 lines.push("END:VCARD");
 return new Response(lines.map(fold).join("\r\n")+"\r\n",{headers:{"Content-Type":"text/vcard; charset=utf-8","Content-Disposition":'attachment; filename="contact-'+slug+'.vcf"',"Cache-Control":"no-store, no-cache, must-revalidate"}});
}
