"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const emptyOptions = () => [
  { id: null, label: "", product_ids: [], category: "" },
  { id: null, label: "", product_ids: [], category: "" },
];

export default function ShowcaseAdvisorManager({ showcase, prestations, onShowcaseChange }) {
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !showcase?.id) return;
    const { data, error: loadError } = await supabase.from("quiz_questions")
      .select("*, quiz_options!question_id(*)").eq("showcase_id", showcase.id)
      .order("step_order", { ascending: true });
    if (loadError) { setError("Chargement impossible : " + loadError.message); return; }
    setQuestions((data || []).map((question) => ({
      ...question,
      answer_type: question.answer_type || "product",
      parent_option_id: question.parent_option_id || "",
      quiz_options: (question.quiz_options || []).sort((a, b) => a.option_order - b.option_order)
        .map((option) => ({ ...option, category: option.category || "", product_ids: option.product_ids || [] })),
    })));
  }, [showcase?.id]);

  useEffect(() => { load(); }, [load]);

  const updateQuestion = (index, patch) => setQuestions((current) => current.map((q, i) => i === index ? { ...q, ...patch } : q));
  const updateOption = (qIndex, oIndex, patch) => setQuestions((current) => current.map((q, i) => i !== qIndex ? q : ({ ...q, quiz_options: q.quiz_options.map((o, j) => j === oIndex ? { ...o, ...patch } : o) })));

  async function toggleEnabled() {
    const next = !showcase.quiz_enabled;
    const { error: toggleError } = await supabase.from("showcases").update({ quiz_enabled: next }).eq("id", showcase.id);
    if (toggleError) setError("Modification impossible : " + toggleError.message);
    else onShowcaseChange({ ...showcase, quiz_enabled: next });
  }

  async function saveQuestion(qIndex) {
    const q = questions[qIndex];
    const isCategory = q.answer_type === "category";
    const options = q.quiz_options.filter((o) => o.label.trim() && (!isCategory || o.category.trim()));
    if (!q.question.trim() || options.length < 2) { setError("Ajoute une question et au moins deux réponses complètes."); return; }
    setSaving(qIndex); setError("");
    try {
      let questionId = q.id;
      if (questionId) {
        const { error: questionError } = await supabase.from("quiz_questions").update({ question: q.question.trim(), answer_type: q.answer_type, parent_option_id: q.parent_option_id || null, step_order: qIndex }).eq("id", questionId).eq("showcase_id", showcase.id);
        if (questionError) throw questionError;
        const { data: existing, error: existingError } = await supabase.from("quiz_options").select("id").eq("question_id", questionId);
        if (existingError) throw existingError;
        const keep = options.filter((o) => o.id).map((o) => o.id);
        const remove = (existing || []).map((o) => o.id).filter((id) => !keep.includes(id));
        if (remove.length) { const { error: removeError } = await supabase.from("quiz_options").delete().in("id", remove); if (removeError) throw removeError; }
      } else {
        const { data: created, error: createError } = await supabase.from("quiz_questions").insert({ showcase_id: showcase.id, catalog_id: null, question: q.question.trim(), answer_type: q.answer_type, parent_option_id: q.parent_option_id || null, step_order: qIndex }).select("id").single();
        if (createError) throw createError;
        questionId = created.id;
      }
      for (let index = 0; index < options.length; index += 1) {
        const option = options[index];
        const values = { label: option.label.trim(), product_ids: isCategory ? [] : option.product_ids, category: isCategory ? option.category.trim() : null, option_order: index };
        const result = option.id
          ? await supabase.from("quiz_options").update(values).eq("id", option.id).eq("question_id", questionId)
          : await supabase.from("quiz_options").insert({ ...values, question_id: questionId });
        if (result.error) throw result.error;
      }
      await load();
    } catch (saveError) { setError("Enregistrement impossible : " + (saveError.message || "erreur inconnue")); }
    finally { setSaving(null); }
  }

  async function deleteQuestion(qIndex) {
    const q = questions[qIndex];
    if (!q.id) { setQuestions((current) => current.filter((_, i) => i !== qIndex)); return; }
    if (!window.confirm("Supprimer cette question du conseiller ?")) return;
    const { error: deleteError } = await supabase.from("quiz_questions").delete().eq("id", q.id).eq("showcase_id", showcase.id);
    if (deleteError) setError("Suppression impossible : " + deleteError.message); else load();
  }

  const categories = [...new Set(prestations.map((item) => item.category).filter(Boolean))];
  return <section style={s.panel}>
    <div style={s.header}><div><h2 style={s.title}>Conseiller interactif</h2><p style={s.help}>Pose quelques questions et recommande automatiquement les prestations adaptées.</p></div><button type="button" style={{...s.toggle,background:showcase.quiz_enabled?"#3B7A4A":"#D8CCAB"}} onClick={toggleEnabled}>{showcase.quiz_enabled?"Activé":"Désactivé"}</button></div>
    {error && <p style={s.error}>{error}</p>}
    {questions.map((q, qIndex) => {
      const triggers = questions.flatMap((other, otherIndex) => otherIndex === qIndex ? [] : (other.quiz_options || []).filter((o) => o.id).map((o) => ({ id:o.id, label:`Q${otherIndex + 1} — ${o.label}` })));
      return <div style={s.question} key={q.id || `new-${qIndex}`}>
        <div style={s.questionHead}><b>Question {qIndex + 1}</b><button type="button" style={s.remove} onClick={() => deleteQuestion(qIndex)}>Supprimer</button></div>
        <input style={s.input} value={q.question} onChange={(e) => updateQuestion(qIndex,{question:e.target.value})} placeholder="Quelle prestation recherchez-vous ?" />
        <label style={s.label}>Afficher seulement après une réponse
          <select style={s.input} value={q.parent_option_id || ""} onChange={(e) => updateQuestion(qIndex,{parent_option_id:e.target.value})}><option value="">Toujours afficher</option>{triggers.map((o)=><option value={o.id} key={o.id}>{o.label}</option>)}</select>
        </label>
        <label style={s.label}>Recommander
          <select style={s.input} value={q.answer_type} onChange={(e) => updateQuestion(qIndex,{answer_type:e.target.value})}><option value="product">Des prestations précises</option><option value="category">Une catégorie de prestations</option></select>
        </label>
        {q.quiz_options.map((o,oIndex)=><div style={s.option} key={o.id || `option-${oIndex}`}>
          <input style={s.input} value={o.label} onChange={(e)=>updateOption(qIndex,oIndex,{label:e.target.value})} placeholder={`Réponse ${oIndex+1}`} />
          {q.answer_type === "category" ? <select style={s.input} value={o.category} onChange={(e)=>updateOption(qIndex,oIndex,{category:e.target.value})}><option value="">Choisir une catégorie</option>{categories.map((category)=><option value={category} key={category}>{category}</option>)}</select> : <div style={s.chips}>{prestations.map((item)=>{const active=o.product_ids.includes(item.id);return <button type="button" key={item.id} style={{...s.chip,...(active?s.chipOn:{})}} onClick={()=>updateOption(qIndex,oIndex,{product_ids:active?o.product_ids.filter((id)=>id!==item.id):[...o.product_ids,item.id]})}>{item.name}</button>})}</div>}
          <button type="button" style={s.optionRemove} onClick={()=>updateQuestion(qIndex,{quiz_options:q.quiz_options.filter((_,i)=>i!==oIndex)})}>✕ Retirer cette réponse</button>
        </div>)}
        <button type="button" style={s.linkButton} onClick={()=>updateQuestion(qIndex,{quiz_options:[...q.quiz_options,{id:null,label:"",product_ids:[],category:""}]})}>+ Ajouter une réponse</button>
        <button type="button" style={s.primary} disabled={saving===qIndex} onClick={()=>saveQuestion(qIndex)}>{saving===qIndex?"Enregistrement…":q.id?"Mettre à jour":"Ajouter la question"}</button>
      </div>;
    })}
    <button type="button" style={s.add} onClick={()=>setQuestions((current)=>[...current,{id:null,question:"",step_order:current.length,answer_type:"product",parent_option_id:"",quiz_options:emptyOptions()}])}>+ Ajouter une question</button>
  </section>;
}

const s={panel:{background:"#FFFDF8",border:"1px solid #E6DCC2",borderRadius:12,padding:16,marginBottom:18},header:{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"},title:{fontFamily:"Georgia,serif",fontSize:20,margin:0,color:"#3D3026"},help:{fontSize:12,color:"#8A7F66",lineHeight:1.5,margin:"5px 0 0"},toggle:{border:0,borderRadius:999,padding:"9px 13px",color:"#FFF",fontWeight:800},error:{color:"#B5402D",fontSize:12,fontWeight:700},question:{marginTop:14,padding:13,border:"1px solid #E6DCC2",borderRadius:10,display:"grid",gap:10},questionHead:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13},label:{display:"grid",gap:5,fontSize:12,fontWeight:700,color:"#5B4636"},input:{width:"100%",border:"1px solid #D8C9A7",borderRadius:8,padding:"10px 11px",background:"#FFF",fontSize:13},option:{display:"grid",gap:8,padding:10,background:"#F7F2E8",borderRadius:8},chips:{display:"flex",gap:6,flexWrap:"wrap"},chip:{border:"1px solid #D8C9A7",borderRadius:999,padding:"7px 9px",background:"#FFF",color:"#5B4636",fontSize:11},chipOn:{background:"#3D3026",color:"#FFF"},remove:{border:0,background:"none",color:"#B5402D",fontSize:11,fontWeight:700},optionRemove:{border:0,background:"none",color:"#B5402D",fontSize:11,textAlign:"left"},linkButton:{border:0,background:"none",color:"#8A633D",fontWeight:700,textAlign:"left"},primary:{border:0,borderRadius:8,padding:11,background:"#3D3026",color:"#FFF",fontWeight:800},add:{width:"100%",marginTop:14,border:"1px solid #D8C9A7",borderRadius:9,padding:11,background:"#FFF",color:"#5B4636",fontWeight:800}};

