"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

const FONT_OPTIONS = [
  { value: "manuscrite", label: "Manuscrite (Caveat)" },
  { value: "moderne", label: "Moderne (Inter)" },
  { value: "elegante", label: "Élégante (Playfair)" },
];

export default function ManageCatalogPage() {
  const params = useParams();
  const catalogId = params?.id;

  const [authed, setAuthed] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]); // nouveaux fichiers à uploader
  const [photoPreviews, setPhotoPreviews] = useState([]); // aperçus locaux des nouveaux fichiers
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]); // photos déjà en ligne (modifiables/supprimables)
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [accentColor, setAccentColor] = useState("#B5402D");
  const [fontStyle, setFontStyle] = useState("manuscrite");
  const [catalogTitle, setCatalogTitle] = useState("");
  const [savingStyle, setSavingStyle] = useState(false);
  const [styleSaved, setStyleSaved] = useState(false);

  const [quizEnabled, setQuizEnabled] = useState(false);
  const [savingQuizToggle, setSavingQuizToggle] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]); // [{id, question, step_order, options:[{id,label,product_ids}]}]
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [savedQuestionFlash, setSavedQuestionFlash] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ld-admin-ok") === "1") {
      setAuthed(true);
    }
  }, []);

  const load = useCallback(async () => {
    if (!supabase || !catalogId) return;
    setLoading(true);
    const { data: cat, error: catErr } = await supabase
      .from("catalogs")
      .select("*")
      .eq("id", catalogId)
      .single();
    if (catErr || !cat) {
      setLoadError("Catalogue introuvable.");
      setLoading(false);
      return;
    }
    setCatalog(cat);
    setAccentColor(cat.accent_color || "#B5402D");
    setCatalogTitle(cat.catalog_title || "");
    setFontStyle(cat.font_style || "manuscrite");
    setQuizEnabled(!!cat.quiz_enabled);

    const { data: prods, error: prodErr } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("catalog_id", catalogId)
      .order("position", { ascending: true });

    if (prodErr) {
      setLoadError("Impossible de charger les produits : " + prodErr.message);
    } else {
      setLoadError("");
      setProducts(prods || []);
    }

    const { data: questions, error: quizErr } = await supabase
      .from("quiz_questions")
      .select("*, quiz_options!question_id(*)")
      .eq("catalog_id", catalogId)
      .order("step_order", { ascending: true });

    if (quizErr) {
      console.error("Erreur chargement quiz :", quizErr);
      setLoadError("Erreur chargement quiz : " + quizErr.message);
    } else {
      setQuizQuestions(
        (questions || []).map((q) => ({
          ...q,
          answer_type: q.answer_type || "product",
          parent_option_id: q.parent_option_id || "",
          quiz_options: (q.quiz_options || [])
            .sort((a, b) => a.option_order - b.option_order)
            .map((o) => ({ ...o, category: o.category || "", product_ids: o.product_ids || [] })),
        }))
      );
    }

    setLoading(false);
  }, [catalogId]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setCategory("");
    setPhotos([]);
    setPhotoPreviews([]);
    setExistingPhotoUrls([]);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price || "");
    setDescription(p.description || "");
    setCategory(p.category || "");
    setPhotos([]);
    setPhotoPreviews([]);
    const existing = p.photo_urls && p.photo_urls.length > 0 ? p.photo_urls : p.photo_url ? [p.photo_url] : [];
    setExistingPhotoUrls(existing);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewPhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingPhoto(index) {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !supabase) return;
    setSaving(true);

    const uploadedUrls = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${catalogId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("catalog-photos").upload(path, file);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("catalog-photos").getPublicUrl(path);
        if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
      }
    }

    const finalPhotoUrls = [...existingPhotoUrls, ...uploadedUrls];

    if (editingId) {
      const { error } = await supabase
        .from("catalog_products")
        .update({
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          category: category.trim(),
          photo_url: finalPhotoUrls[0] || null,
          photo_urls: finalPhotoUrls,
        })
        .eq("id", editingId);
      if (error) setLoadError("Modification impossible : " + error.message);
    } else {
      const { error } = await supabase.from("catalog_products").insert({
        catalog_id: catalogId,
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        category: category.trim(),
        photo_url: finalPhotoUrls[0] || null,
        photo_urls: finalPhotoUrls,
        position: products.length,
      });
      if (error) setLoadError("Ajout impossible : " + error.message);
    }

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id) {
    if (!supabase) return;
    if (!window.confirm("Supprimer ce produit du catalogue ?")) return;
    const { error } = await supabase.from("catalog_products").delete().eq("id", id);
    if (error) {
      setLoadError("Suppression impossible : " + error.message);
    } else {
      load();
    }
  }

  async function handleSaveStyle() {
    if (!supabase || !catalogId) return;
    setSavingStyle(true);
    const { error } = await supabase
      .from("catalogs")
      .update({ accent_color: accentColor, font_style: fontStyle, catalog_title: catalogTitle.trim() })
      .eq("id", catalogId);
    setSavingStyle(false);
    if (error) {
      setLoadError("Impossible d'enregistrer le style : " + error.message);
    } else {
      setStyleSaved(true);
      setTimeout(() => setStyleSaved(false), 1800);
      load();
    }
  }

  async function handleToggleQuiz() {
    if (!supabase || !catalogId) return;
    setSavingQuizToggle(true);
    const nextValue = !quizEnabled;
    const { error } = await supabase
      .from("catalogs")
      .update({ quiz_enabled: nextValue })
      .eq("id", catalogId);
    setSavingQuizToggle(false);
    if (error) {
      setLoadError("Impossible de changer le statut du quiz : " + error.message);
    } else {
      setQuizEnabled(nextValue);
    }
  }

  function addLocalQuestion() {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: null,
        question: "",
        step_order: prev.length,
        answer_type: "product",
        parent_option_id: "",
        quiz_options: [
          { id: null, label: "", product_ids: [], category: "" },
          { id: null, label: "", product_ids: [], category: "" },
        ],
      },
    ]);
  }

  function updateQuestionParent(qIndex, value) {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, parent_option_id: value } : q))
    );
  }

  function updateQuestionType(qIndex, value) {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, answer_type: value } : q))
    );
  }

  function updateOptionCategory(qIndex, oIndex, value) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              quiz_options: q.quiz_options.map((o, j) => (j === oIndex ? { ...o, category: value } : o)),
            }
          : q
      )
    );
  }

  function updateQuestionText(qIndex, value) {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, question: value } : q))
    );
  }

  function addOption(qIndex) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, quiz_options: [...q.quiz_options, { id: null, label: "", product_ids: [], category: "" }] }
          : q
      )
    );
  }

  function updateOptionLabel(qIndex, oIndex, value) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              quiz_options: q.quiz_options.map((o, j) => (j === oIndex ? { ...o, label: value } : o)),
            }
          : q
      )
    );
  }

  function toggleOptionProduct(qIndex, oIndex, productId) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              quiz_options: q.quiz_options.map((o, j) => {
                if (j !== oIndex) return o;
                const has = o.product_ids.includes(productId);
                return {
                  ...o,
                  product_ids: has
                    ? o.product_ids.filter((id) => id !== productId)
                    : [...o.product_ids, productId],
                };
              }),
            }
          : q
      )
    );
  }

  function removeOption(qIndex, oIndex) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, quiz_options: q.quiz_options.filter((_, j) => j !== oIndex) } : q
      )
    );
  }

  async function saveQuestion(qIndex) {
    if (!supabase || !catalogId) return;
    setLoadError("");
    const q = quizQuestions[qIndex];
    if (!q.question.trim()) return;
    const isCategory = q.answer_type === "category";
    const cleanOptions = q.quiz_options.filter((o) =>
      isCategory ? o.label.trim() && o.category.trim() : o.label.trim()
    );
    if (cleanOptions.length < 2) {
      setLoadError(
        isCategory
          ? "Il faut au moins 2 réponses, chacune avec une catégorie choisie."
          : "Il faut au moins 2 options de réponse par question."
      );
      return;
    }
    setSavingQuestionId(qIndex);

    function check(result, label) {
      if (result?.error) {
        throw new Error(`${label} : ${result.error.message}`);
      }
      return result;
    }

    try {
      let questionId = q.id;
      if (questionId) {
        check(
          await supabase
            .from("quiz_questions")
            .update({
              question: q.question.trim(),
              answer_type: q.answer_type,
              parent_option_id: q.parent_option_id || null,
            })
            .eq("id", questionId),
          "Mise à jour de la question"
        );

        // On garde les identifiants des réponses existantes pour ne jamais casser
        // une question conditionnée sur l'une de ces réponses.
        const existingRes = check(
          await supabase.from("quiz_options").select("id").eq("question_id", questionId),
          "Lecture des réponses existantes"
        );
        const existingOpts = existingRes.data;
        const keepIds = cleanOptions.filter((o) => o.id).map((o) => o.id);
        const idsToDelete = (existingOpts || []).map((o) => o.id).filter((id) => !keepIds.includes(id));
        if (idsToDelete.length > 0) {
          check(
            await supabase.from("quiz_options").delete().in("id", idsToDelete),
            "Suppression d'anciennes réponses"
          );
        }

        for (let idx = 0; idx < cleanOptions.length; idx++) {
          const o = cleanOptions[idx];
          if (o.id) {
            check(
              await supabase
                .from("quiz_options")
                .update({
                  label: o.label.trim(),
                  product_ids: isCategory ? [] : o.product_ids,
                  category: isCategory ? o.category.trim() : null,
                  option_order: idx,
                })
                .eq("id", o.id),
              "Mise à jour d'une réponse"
            );
          } else {
            check(
              await supabase.from("quiz_options").insert({
                question_id: questionId,
                label: o.label.trim(),
                product_ids: isCategory ? [] : o.product_ids,
                category: isCategory ? o.category.trim() : null,
                option_order: idx,
              }),
              "Ajout d'une réponse"
            );
          }
        }
      } else {
        const insertRes = check(
          await supabase
            .from("quiz_questions")
            .insert({
              catalog_id: catalogId,
              question: q.question.trim(),
              answer_type: q.answer_type,
              parent_option_id: q.parent_option_id || null,
              step_order: qIndex,
            })
            .select()
            .single(),
          "Création de la question"
        );
        questionId = insertRes.data.id;

        check(
          await supabase.from("quiz_options").insert(
            cleanOptions.map((o, idx) => ({
              question_id: questionId,
              label: o.label.trim(),
              product_ids: isCategory ? [] : o.product_ids,
              category: isCategory ? o.category.trim() : null,
              option_order: idx,
            }))
          ),
          "Ajout des réponses"
        );
      }

      setSavingQuestionId(null);
      setSavedQuestionFlash(qIndex);
      setTimeout(() => setSavedQuestionFlash(null), 1800);
      load();
    } catch (err) {
      setSavingQuestionId(null);
      setLoadError("Impossible d'enregistrer : " + (err?.message || "erreur inconnue"));
    }
  }


  async function deleteQuestion(qIndex) {
    const q = quizQuestions[qIndex];
    if (q.id) {
      if (!window.confirm("Supprimer cette question du quiz ?")) return;
      if (!supabase) return;
      await supabase.from("quiz_questions").delete().eq("id", q.id);
      load();
    } else {
      setQuizQuestions((prev) => prev.filter((_, i) => i !== qIndex));
    }
  }

  function linkFor() {
    if (typeof window === "undefined" || !catalog) return "";
    return `${window.location.origin}/catalogue/${catalog.slug}`;
  }

  function handleCopy() {
    const text = linkFor();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!authed) {
    return (
      <div style={styles.page}>
        <p style={{ fontFamily: "system-ui, sans-serif" }}>
          Connecte-toi d'abord sur <a href="/admin">/admin</a>.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        input, textarea, select { font-family: inherit; }
      `}</style>

      <div style={styles.shell}>
        <a href="/admin" style={styles.backLink}>← Retour aux livres d'or / catalogues</a>

        <header style={styles.header}>
          <div>
            <p style={styles.brandKicker}>EASY GESTION TOULOUSE</p>
            <h1 style={styles.brandTitle}>{loading ? "…" : catalog?.catalog_title}</h1>
          </div>
        </header>

        {catalog && (
          <div style={styles.linkBox}>
            <span style={styles.linkText}>{linkFor()}</span>
            <button style={styles.iconButton} onClick={handleCopy}>
              {copied ? "✓ copié" : "copier le lien"}
            </button>
          </div>
        )}

        {loadError && <p style={{ color: "#B5402D", fontSize: "0.85rem" }}>{loadError}</p>}

        {catalog && (
          <div style={styles.styleBox}>
            <h2 style={styles.formTitle}>Apparence du catalogue</h2>
            <label style={styles.label}>
              Titre du catalogue
              <input
                style={styles.input}
                value={catalogTitle}
                onChange={(e) => setCatalogTitle(e.target.value)}
                placeholder="ex. Nos soins, Notre carte, Nos prestations…"
              />
            </label>
            <div style={styles.formRow2}>
              <label style={styles.label}>
                Couleur principale
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={styles.colorInput}
                />
              </label>
              <label style={styles.label}>
                Police du titre
                <select style={styles.input} value={fontStyle} onChange={(e) => setFontStyle(e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={styles.swatchRow}>
              {[
                ["#1E1E1E", "Noir"],
                ["#C9B790", "Beige"],
                ["#355E3B", "Vert"],
                ["#2A4D69", "Bleu"],
                ["#B5402D", "Rouge"],
              ].map(([hex, label]) => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setAccentColor(hex)}
                  title={label}
                  style={{
                    ...styles.swatch,
                    background: hex,
                    outline: accentColor === hex ? "2px solid #1E2A3A" : "1px solid #D8CCAB",
                  }}
                />
              ))}
            </div>
            <div style={styles.formActions}>
              <button type="button" style={styles.newButton} onClick={handleSaveStyle} disabled={savingStyle}>
                {savingStyle ? "Enregistrement…" : styleSaved ? "✓ Enregistré" : "Enregistrer l'apparence"}
              </button>
            </div>
          </div>
        )}

        {catalog && (
          <div style={styles.styleBox}>
            <div style={styles.quizHeader}>
              <h2 style={styles.formTitle}>Quiz produit</h2>
              <button
                type="button"
                onClick={handleToggleQuiz}
                disabled={savingQuizToggle}
                style={{
                  ...styles.toggleButton,
                  background: quizEnabled ? "#3B7A4A" : "#D8CCAB",
                  color: quizEnabled ? "#FCFAF2" : "#5B4636",
                }}
              >
                {savingQuizToggle ? "…" : quizEnabled ? "Activé" : "Désactivé"}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#8A7F66", margin: 0 }}>
              Quand c'est activé, tes visiteurs répondent à quelques questions et le catalogue leur
              recommande directement les bons produits.
            </p>

            {loadError && (
              <p style={{ color: "#B5402D", fontSize: "0.8rem", fontWeight: 600, margin: 0 }}>
                {loadError}
              </p>
            )}

            {quizQuestions.map((q, qIndex) => {
              const triggerOptions = quizQuestions.flatMap((otherQ, otherIndex) =>
                otherIndex === qIndex
                  ? []
                  : (otherQ.quiz_options || [])
                      .filter((o) => o.id)
                      .map((o) => ({ id: o.id, label: `Q${otherIndex + 1} — ${o.label}` }))
              );

              return (
              <div style={styles.pollBlock} key={q.id || `new-q-${qIndex}`}>
                <div style={styles.pollBlockHead}>
                  <span style={styles.pollBlockLabel}>Question {qIndex + 1}</span>
                  <button type="button" style={styles.iconButtonDanger} onClick={() => deleteQuestion(qIndex)}>
                    supprimer
                  </button>
                </div>
                <input
                  style={styles.input}
                  placeholder="ex. Quel type de soin recherchez-vous ?"
                  value={q.question}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                />

                <label style={styles.label}>
                  N'afficher cette question que si le visiteur a répondu…
                  <select
                    style={styles.input}
                    value={q.parent_option_id || ""}
                    onChange={(e) => updateQuestionParent(qIndex, e.target.value)}
                  >
                    <option value="">Aucune condition — affichée à tout le monde</option>
                    {triggerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {triggerOptions.length === 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#8A7F66", fontWeight: 400 }}>
                      Enregistre d'abord une autre question pour pouvoir la conditionner à une réponse.
                    </span>
                  )}
                </label>

                <label style={styles.label}>
                  Les réponses pointent vers…
                  <select
                    style={styles.input}
                    value={q.answer_type || "product"}
                    onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                  >
                    <option value="product">Des produits précis</option>
                    <option value="category">Une catégorie du catalogue</option>
                  </select>
                </label>

                {q.quiz_options.map((o, oIndex) => (
                  <div key={o.id || `new-o-${oIndex}`} style={styles.optionBlock}>
                    <input
                      style={styles.input}
                      placeholder={`Réponse ${oIndex + 1}`}
                      value={o.label}
                      onChange={(e) => updateOptionLabel(qIndex, oIndex, e.target.value)}
                    />

                    {q.answer_type === "category" ? (
                      <select
                        style={styles.input}
                        value={o.category || ""}
                        onChange={(e) => updateOptionCategory(qIndex, oIndex, e.target.value)}
                      >
                        <option value="">— choisir une catégorie —</option>
                        {[...new Set(products.map((p) => p.category).filter(Boolean))].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={styles.productPicker}>
                        {products.length === 0 && (
                          <span style={{ fontSize: "0.72rem", color: "#8A7F66" }}>
                            Ajoute d'abord des produits au catalogue.
                          </span>
                        )}
                        {products.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => toggleOptionProduct(qIndex, oIndex, p.id)}
                            style={{
                              ...styles.productChip,
                              ...(o.product_ids.includes(p.id) ? styles.productChipActive : {}),
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      style={styles.removeOptionButton}
                      onClick={() => removeOption(qIndex, oIndex)}
                    >
                      ✕ retirer cette réponse
                    </button>
                  </div>
                ))}

                <button type="button" style={styles.addOptionLink} onClick={() => addOption(qIndex)}>
                  + Ajouter une réponse
                </button>

                <div style={styles.formActions}>
                  <button
                    type="button"
                    style={styles.newButton}
                    onClick={() => saveQuestion(qIndex)}
                    disabled={savingQuestionId === qIndex}
                  >
                    {savingQuestionId === qIndex
                      ? "Enregistrement…"
                      : savedQuestionFlash === qIndex
                      ? "✓ Enregistré"
                      : q.id
                      ? "Mettre à jour"
                      : "Ajouter la question"}
                  </button>
                </div>
              </div>
              );
            })}

            <div style={styles.formActions}>
              <button type="button" style={styles.newButton} onClick={addLocalQuestion}>
                + Ajouter une question de quiz
              </button>
            </div>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <h2 style={styles.formTitle}>{editingId ? "Modifier le produit" : "Ajouter un produit"}</h2>
          <div style={styles.formRow2}>
            <label style={styles.label}>
              Nom du produit
              <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label style={styles.label}>
              Prix
              <input style={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ex. 15€" />
            </label>
          </div>
          <label style={styles.label}>
            Rubrique <span style={{ fontWeight: 400, color: "#8A7F66" }}>(ex. Entrées, Plats, Nos best-sellers…)</span>
            <input
              style={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Laisser vide si pas de rubrique"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {[...new Set(products.map((p) => p.category).filter(Boolean))].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label style={styles.label}>
            Description
            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </label>
          <label style={styles.label}>
            Photos {existingPhotoUrls.length + photoPreviews.length > 0 && `(${existingPhotoUrls.length + photoPreviews.length})`}
            {(existingPhotoUrls.length > 0 || photoPreviews.length > 0) && (
              <div style={styles.photoGallery}>
                {existingPhotoUrls.map((url, i) => (
                  <div style={styles.photoThumbWrap} key={`existing-${i}`}>
                    <img src={url} alt="" style={styles.formPhotoPreview} />
                    <button type="button" style={styles.removePhotoButton} onClick={() => removeExistingPhoto(i)}>
                      ✕
                    </button>
                  </div>
                ))}
                {photoPreviews.map((url, i) => (
                  <div style={styles.photoThumbWrap} key={`new-${i}`}>
                    <img src={url} alt="" style={styles.formPhotoPreview} />
                    <button type="button" style={styles.removePhotoButton} onClick={() => removeNewPhoto(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handlePhotosChange} style={styles.fileInput} />
          </label>
          <div style={styles.formActions}>
            {editingId && (
              <button type="button" style={styles.cancelButton} onClick={resetForm}>
                Annuler
              </button>
            )}
            <button type="submit" style={styles.newButton} disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter au catalogue"}
            </button>
          </div>
        </form>

        <h2 style={styles.listTitle}>Produits ({products.length})</h2>

        {loading && <p style={{ color: "#8A7F66" }}>Chargement…</p>}
        {!loading && products.length === 0 && (
          <p style={{ color: "#8A7F66" }}>Aucun produit pour l'instant — ajoute le premier ci-dessus.</p>
        )}

        <div style={styles.productList}>
          {products.map((p) => (
            <div style={styles.productRow} key={p.id}>
              {p.photo_url ? (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={p.photo_url} alt="" style={styles.thumb} />
                  {p.photo_urls && p.photo_urls.length > 1 && (
                    <span style={styles.photoCountBadge}>{p.photo_urls.length}</span>
                  )}
                </div>
              ) : (
                <div style={{ ...styles.thumb, ...styles.thumbEmpty }} />
              )}
              <div style={styles.productInfo}>
                {p.category && <div style={styles.productCategory}>{p.category}</div>}
                <strong>{p.name}</strong>
                {p.price && <span style={styles.productPrice}> — {p.price}</span>}
                {p.description && <div style={styles.productDesc}>{p.description}</div>}
              </div>
              <div style={styles.productActions}>
                <button style={styles.iconButton} onClick={() => startEdit(p)}>modifier</button>
                <button style={styles.iconButtonDanger} onClick={() => handleDelete(p.id)}>supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#EFE9DA", fontFamily: "'Inter', sans-serif", color: "#2A241D", padding: "24px 16px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "18px" },
  backLink: { fontSize: "0.8rem", color: "#5B4636", textDecoration: "none" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  brandKicker: { fontSize: "0.65rem", letterSpacing: "0.14em", color: "#A6792B", margin: 0, fontWeight: 600 },
  brandTitle: { fontFamily: "'Caveat', cursive", fontSize: "2rem", fontWeight: 700, margin: 0, color: "#1E2A3A" },
  linkBox: { display: "flex", alignItems: "center", gap: "8px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "6px", padding: "8px 12px", flexWrap: "wrap" },
  linkText: { fontSize: "0.75rem", color: "#1E2A3A", fontFamily: "monospace", wordBreak: "break-all" },
  styleBox: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #E6DCC2" },
  form: { background: "#FCFAF2", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #E6DCC2" },
  formTitle: { fontFamily: "'Caveat', cursive", fontSize: "1.5rem", margin: 0, color: "#1E2A3A" },
  formRow2: { display: "flex", gap: "12px", flexWrap: "wrap" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "#5B4636", flex: "1 1 200px" },
  input: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D" },
  colorInput: { width: "70px", height: "38px", padding: "2px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff" },
  swatchRow: { display: "flex", gap: "8px" },
  swatch: { width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer" },
  textarea: { fontSize: "0.9rem", padding: "9px 10px", border: "1px solid #D8CCAB", borderRadius: "5px", background: "#fff", color: "#2A241D", resize: "vertical" },
  fileInput: { fontSize: "0.8rem" },
  formPhotoPreview: { width: "90px", height: "68px", objectFit: "cover", borderRadius: "5px", border: "1px solid #D8CCAB", display: "block" },
  photoGallery: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "6px" },
  photoThumbWrap: { position: "relative" },
  removePhotoButton: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#B5402D",
    color: "#fff",
    border: "2px solid #FCFAF2",
    fontSize: "0.65rem",
    lineHeight: 1,
    padding: 0,
  },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
  cancelButton: { background: "none", border: "1px solid #D8CCAB", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", color: "#5B4636" },
  newButton: { background: "#B5402D", color: "#FCFAF2", border: "none", borderRadius: "6px", padding: "10px 16px", fontSize: "0.85rem", fontWeight: 600 },
  listTitle: { fontFamily: "'Caveat', cursive", fontSize: "1.6rem", margin: "6px 0 0 0", color: "#1E2A3A" },
  productList: { display: "flex", flexDirection: "column", gap: "10px" },
  productRow: { display: "flex", alignItems: "center", gap: "12px", background: "#FCFAF2", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "10px 12px" },
  thumb: { width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  thumbEmpty: { background: "#EFE4C8" },
  photoCountBadge: {
    position: "absolute",
    bottom: "-4px",
    right: "-4px",
    background: "#1E2A3A",
    color: "#fff",
    fontSize: "0.6rem",
    fontWeight: 700,
    borderRadius: "999px",
    padding: "1px 5px",
    border: "1.5px solid #FCFAF2",
  },
  productInfo: { flex: 1, fontSize: "0.85rem" },
  productCategory: { fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A6792B", fontWeight: 600, marginBottom: "2px" },
  productPrice: { color: "#B5402D", fontWeight: 600 },
  productDesc: { fontSize: "0.75rem", color: "#8A7F66", marginTop: "2px" },
  productActions: { display: "flex", gap: "6px", flexShrink: 0 },
  iconButton: { background: "#F1EAD6", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
  iconButtonDanger: { background: "#F6DCD4", color: "#8B3A2B", border: "none", borderRadius: "4px", padding: "6px 10px", fontSize: "0.7rem" },
  quizHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  toggleButton: { border: "none", borderRadius: "999px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700 },
  pollBlock: { display: "flex", flexDirection: "column", gap: "8px", background: "#FBF8F3", border: "1px solid #EAE3D6", borderRadius: "12px", padding: "12px" },
  pollBlockHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  pollBlockLabel: { fontSize: "0.72rem", fontWeight: 700, color: "#8A7F66", textTransform: "uppercase", letterSpacing: "0.04em" },
  optionBlock: { display: "flex", flexDirection: "column", gap: "6px", background: "#fff", border: "1px solid #E6DCC2", borderRadius: "8px", padding: "10px" },
  productPicker: { display: "flex", flexWrap: "wrap", gap: "6px" },
  productChip: { background: "#F1EAD6", border: "1px solid #D8CCAB", borderRadius: "999px", padding: "4px 10px", fontSize: "0.72rem", color: "#5B4636" },
  productChipActive: { background: "#B5402D", color: "#FCFAF2", borderColor: "#B5402D" },
  removeOptionButton: { background: "none", border: "none", color: "#8B3A2B", fontSize: "0.7rem", alignSelf: "flex-start", padding: 0 },
  addOptionLink: { background: "none", border: "none", color: "#A6792B", fontSize: "0.78rem", fontWeight: 600, alignSelf: "flex-start", padding: 0 },
};
