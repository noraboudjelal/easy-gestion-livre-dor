"use client";

import { useParams, usePathname } from "next/navigation";

export default function GererLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.slug;
  const isContact = pathname?.endsWith("/coordonnees");

  return <>
    <div style={{position:"sticky",top:0,zIndex:1000,background:"#1E2A3A",padding:"9px 14px",textAlign:"center",fontFamily:"Arial,sans-serif"}}>
      <a href={isContact ? `/vitrine/${slug}/gerer` : `/vitrine/${slug}/gerer/coordonnees`} style={{color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>
        {isContact ? "← Revenir à la gestion principale" : "📍 Modifier téléphone · WhatsApp · adresse · horaires · réservation"}
      </a>
    </div>
    {children}
  </>;
}