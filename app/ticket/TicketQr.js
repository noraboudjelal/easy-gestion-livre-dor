"use client";

export default function TicketQr({url, label='Scannez pour prendre un ticket', size=220}) {
  if (!url) return null;
  return <figure style={{margin:0,textAlign:'center'}}>
    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&data=${encodeURIComponent(url)}`}
      width={size} height={size} alt={`QR code : ${label}`} style={{display:'block',margin:'0 auto',maxWidth:'100%',height:'auto',background:'#fff',borderRadius:12}} />
    <figcaption style={{marginTop:12,lineHeight:1.4}}>{label}</figcaption>
    <a href={url} style={{display:'block',marginTop:6,color:'inherit',fontSize:14,overflowWrap:'anywhere'}}>{url}</a>
  </figure>;
}
