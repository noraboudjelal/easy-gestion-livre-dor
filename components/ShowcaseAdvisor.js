"use client";

import { useState } from "react";

export default function ShowcaseAdvisor({ questions, prestations, accent, onDone }) {
  const roots=[...questions].filter((q)=>!q.parent_option_id).sort((a,b)=>a.step_order-b.step_order);
  const children=Object.fromEntries(questions.filter((q)=>q.parent_option_id).map((q)=>[q.parent_option_id,q]));
  const [currentId,setCurrentId]=useState(roots[0]?.id||null);
  const [answers,setAnswers]=useState([]);
  const [finished,setFinished]=useState(false);
  const current=questions.find((q)=>q.id===currentId);
  const recommended=(()=>{if(!answers.length)return[];let ids=answers[0];for(let i=1;i<answers.length;i+=1){const common=ids.filter((id)=>answers[i].includes(id));ids=common.length?common:ids;}if(!ids.length)ids=[...new Set(answers.flat())];return prestations.filter((item)=>ids.includes(item.id));})();
  function choose(option,question){const ids=question.answer_type==="category"?prestations.filter((item)=>(item.category||"")===(option.category||"")).map((item)=>item.id):(option.product_ids||[]);setAnswers((value)=>[...value,ids]);const child=children[option.id];if(child){setCurrentId(child.id);return;}const index=roots.findIndex((q)=>q.id===question.id);const next=index>=0?roots[index+1]:null;if(next)setCurrentId(next.id);else setFinished(true);}
  function restart(){setCurrentId(roots[0]?.id||null);setAnswers([]);setFinished(false);}
  if(finished||!current)return <div style={s.box}><p style={{...s.tag,color:accent}}>NOS RECOMMANDATIONS POUR VOUS</p>{recommended.length?<div style={s.results}>{recommended.map((item)=><article style={s.result} key={item.id}><div style={s.resultHead}><strong style={s.name}>{item.name}</strong>{item.price&&<span style={{...s.price,color:accent}}>{item.price}</span>}</div>{item.description&&<p style={s.description}>{item.description}</p>}</article>)}</div>:<p style={s.empty}>Aucune correspondance exacte. Découvrez toutes nos prestations ci-dessous.</p>}<div style={s.actions}><button type="button" style={{...s.ghost,borderColor:accent,color:accent}} onClick={restart}>Refaire le questionnaire</button><button type="button" style={{...s.skip,color:accent}} onClick={onDone}>Voir toutes les prestations ↓</button></div></div>;
  return <div style={s.box}><p style={{...s.tag,color:accent}}>✨ ON VOUS AIDE À CHOISIR</p><h3 style={s.question}>{current.question}</h3><div style={s.options}>{(current.quiz_options||[]).map((option)=><button type="button" key={option.id} style={s.option} onClick={()=>choose(option,current)}>{option.label}</button>)}</div><button type="button" style={s.skip} onClick={onDone}>Passer, voir toutes les prestations</button></div>;
}

const s={box:{background:"#FFF",border:"1px solid rgba(0,0,0,.1)",borderRadius:20,padding:20,boxShadow:"0 10px 28px rgba(0,0,0,.05)"},tag:{fontSize:10,fontWeight:800,letterSpacing:".14em",margin:"0 0 12px"},question:{fontFamily:"Georgia,serif",fontSize:23,fontWeight:400,lineHeight:1.2,margin:"0 0 16px"},options:{display:"grid",gap:9},option:{border:"1px solid rgba(0,0,0,.14)",borderRadius:12,padding:"12px 14px",background:"#FFF",color:"#241C1B",fontSize:14,textAlign:"left"},skip:{border:0,background:"none",padding:"13px 0 0",fontSize:12,color:"#8A7F66",fontWeight:700},results:{display:"grid",gap:8},result:{border:"1px solid rgba(0,0,0,.1)",borderRadius:13,padding:13},resultHead:{display:"flex",justifyContent:"space-between",gap:12},name:{fontFamily:"Georgia,serif",fontSize:18,fontWeight:400},price:{fontSize:13,fontWeight:800,whiteSpace:"nowrap"},description:{fontSize:13,lineHeight:1.55,opacity:.68,margin:"7px 0 0"},empty:{fontSize:13,lineHeight:1.6,color:"#8A7F66"},actions:{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"space-between",marginTop:16},ghost:{border:"1px solid",borderRadius:999,padding:"10px 13px",background:"#FFF",fontWeight:700,fontSize:12}};

