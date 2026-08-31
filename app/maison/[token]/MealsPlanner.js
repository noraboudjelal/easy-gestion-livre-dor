"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../../lib/supabaseClient";
import styles from "./maison.module.css";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function MealsPlanner({ token }) {
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMeals = useCallback(async () => {
    try {
      const response = await fetch(`/api/maison/${token}/meals`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chargement impossible.");
      setRecipes(payload.recipes);
      setPlan(payload.plan);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [token]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    if (!supabase) return undefined;
    const channel = supabase
      .channel(`maison-meals:${token}`)
      .on("broadcast", { event: "meals-changed" }, loadMeals)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadMeals, token]);

  const planByDay = useMemo(
    () => Object.fromEntries(plan.map((entry) => [entry.day_index, entry.recipe_id])),
    [plan]
  );

  async function createRecipe(event) {
    event.preventDefault();
    const values = ingredients.split("\n").map((value) => value.trim()).filter(Boolean);
    if (!name.trim() || !values.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/maison/${token}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ingredients: values }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ajout impossible.");
      setName("");
      setIngredients("");
      setShowForm(false);
      await loadMeals();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function chooseMeal(dayIndex, recipeId) {
    const previous = plan;
    setPlan((current) => [
      ...current.filter((entry) => entry.day_index !== dayIndex),
      ...(recipeId ? [{ day_index: dayIndex, recipe_id: recipeId }] : []),
    ]);
    try {
      const response = await fetch(`/api/maison/${token}/meals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayIndex, recipeId: recipeId || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Modification impossible.");
    } catch (saveError) {
      setPlan(previous);
      setError(saveError.message);
    }
  }

  return (
    <div className={styles.mealsPlanner}>
      <div className={styles.mealsIntro}>
        <div>
          <h1>On mange quoi ?</h1>
          <p>Choisissez les repas de la semaine. Les ingrédients sont ajoutés automatiquement aux courses.</p>
        </div>
        <button className={styles.newRecipeButton} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fermer" : "+ Nouvelle recette"}
        </button>
      </div>

      {showForm && (
        <form className={styles.recipeForm} onSubmit={createRecipe}>
          <label>
            Nom de la recette
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Pâtes aux légumes" maxLength={100} />
          </label>
          <label>
            Ingrédients — un par ligne
            <textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} placeholder={"Pâtes\nCourgettes\nTomates"} rows={5} />
          </label>
          <button disabled={saving || !name.trim() || !ingredients.trim()}>{saving ? "Ajout…" : "Ajouter la recette"}</button>
        </form>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.weekGrid}>
        {days.map((day, index) => (
          <label className={styles.dayCard} key={day}>
            <span>{day}</span>
            <select value={planByDay[index] || ""} onChange={(event) => chooseMeal(index, event.target.value)}>
              <option value="">Aucun repas</option>
              {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
            </select>
          </label>
        ))}
      </div>

      <section className={styles.recipeLibrary}>
        <h2>Mes recettes</h2>
        {recipes.length === 0 ? (
          <p>Ajoutez votre première recette pour commencer le planning.</p>
        ) : (
          <div className={styles.recipeCards}>
            {recipes.map((recipe) => (
              <article key={recipe.id}>
                <h3>{recipe.name}</h3>
                <p>{recipe.maison_recipe_ingredients.map((item) => item.name).join(" · ")}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
