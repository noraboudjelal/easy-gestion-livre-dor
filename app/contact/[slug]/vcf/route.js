import {getSupabaseAdmin} from "../../../../lib/supabaseAdmin";
export const dynamic="force-dynamic";
export const revalidate=0;
const esc=x=>String(x||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\r/g,"");
export async function GET(req,{params}){
 const {slug}=await params;
 const {data:c,error}=await getSupabaseAdmin().from("lehnova_contacts").select("*").eq("slug",slug).maybeSingle();
 if(error||!c)return new Response("Contact introuvable",{status:404});
 const url=new URL("/contact/"+encodeURIComponent(slug),req.url).toString();
 const lines=["BEGIN:VCARD","VERSION:3.0","N:"+esc(c.name||c.company)+";;;;","FN:"+esc(c.company||c.name),"ORG:"+esc(c.company),"TITLE:"+esc(c.job)];
 if(c.phone)lines.push("TEL;TYPE=CELL,VOICE:"+String(c.phone).replace(/[^+0-9]/g,""));
 if(c.email)lines.push("EMAIL;TYPE=INTERNET:"+esc(c.email));
 lines.push("URL:"+esc(url));
 if(c.website)lines.push("URL;TYPE=WORK:"+esc(c.website));
 if(c.photo_url)lines.push("PHOTO;VALUE=URI:"+esc(c.photo_url));
 if(c.description)lines.push("NOTE:"+esc(c.description));
 lines.push("END:VCARD");
 return new Response(lines.join("\r\n")+"\r\n",{headers:{"Content-Type":"text/vcard; charset=utf-8","Content-Disposition":'attachment; filename="contact-'+slug+'.vcf"',"Cache-Control":"no-store, no-cache, must-revalidate"}});
}