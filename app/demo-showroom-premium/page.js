import ShowroomView from "../catalogue/[slug]/ShowroomView";
export const metadata = { title: "Démonstration Showroom Premium | Lehnova", robots: { index: false, follow: false } };
const img=(id)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=85`;
const catalog={
 client:"ATELIER MATIÈRES",catalog_title:"Des matières qui subliment vos espaces",
 accent_color:"#8C7760",
 cover_image_url:img("photo-1600607687939-ce8a6c25118c"),
 portfolio_photo_urls:[
 img("photo-1600566753190-17f0baa2a6c3"),
 img("photo-1600607687920-4e2a09cf159d"),
 img("photo-1600566753086-00f18fb6b3ea"),
 img("photo-1600585154340-be6161a56a0c")
 ]
};
const products=[
 {id:"1",category:"Carrelage & pierre",name:"Pierre naturelle",description:"Une sélection de finitions minérales aux tons chaleureux.",photo_url:img("photo-1600607687939-ce8a6c25118c")},
 {id:"2",category:"Carrelage & pierre",name:"Travertin contemporain",description:"Une inspiration douce et intemporelle.",photo_url:img("photo-1600607687920-4e2a09cf159d")},
 {id:"3",category:"Carrelage & pierre",name:"Beige texturé",description:"Matières et couleurs naturelles.",photo_url:img("photo-1600566753190-17f0baa2a6c3")},
 {id:"4",category:"Décoration & ambiances",name:"Salon signature",description:"Un intérieur élégant et lumineux.",photo_url:img("photo-1600566753086-00f18fb6b3ea")},
 {id:"5",category:"Décoration & ambiances",name:"Cuisine épurée",description:"Une ambiance raffinée aux lignes simples.",photo_url:img("photo-1600585154340-be6161a56a0c")},
 {id:"6",category:"Décoration & ambiances",name:"Matières chaleureuses",description:"Un jeu de textures et de lumière.",photo_url:img("photo-1600607687920-4e2a09cf159d")}
];
export default function Page(){return <><div style={{background:"#292822",color:"#fff",padding:"11px 18px",textAlign:"center",font:"12px Arial,sans-serif",letterSpacing:"1px"}}>DÉMONSTRATION LEHNOVA — ENTREPRISE ET PRODUITS FICTIFS</div><ShowroomView catalog={catalog} products={products} transformations={[]}/></>;}
