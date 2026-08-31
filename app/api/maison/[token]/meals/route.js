import { NextResponse } from "next/server";

import { getMaisonByToken } from "../../../../../lib/maison/maisonApi";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return json({ error: "Maison introuvable." }, 404);

    const admin = getSupabaseAdmin();
    const [{ data: recipes, error: recipesError }, { data: plan, error: planError }] = await Promise.all([
      admin.from("maison_recipes").select("id, name, created_at, maison_recipe_ingredients(id, name, quantity, unit)").eq("home_id", home.id).order("created_at"),
      admin.from("maison_meal_plan").select("day_index, recipe_id").eq("home_id", home.id).order("day_index"),
    ]);

    if (recipesError) throw recipesError;
    if (planError) throw planError;
    return json({ recipes: recipes || [], plan: plan || [] });
  } catch (error) {
    console.error("Maison meals GET:", error);
    return json({ error: "Impossible de charger les repas." }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return json({ error: "Maison introuvable." }, 404);

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((item) => ({
          name: String(item?.name || "").trim(),
          quantity: item?.quantity === "" || item?.quantity == null ? null : Number(item.quantity),
          unit: String(item?.unit || "").trim(),
        })).filter((item) => item.name).slice(0, 50)
      : [];

    if (!name || name.length > 100 || !ingredients.length || ingredients.some((item) =>
      item.name.length > 100 || item.unit.length > 30 || (item.quantity != null && (!Number.isFinite(item.quantity) || item.quantity <= 0))
    )) {
      return json({ error: "Indiquez un nom et au moins un ingrédient." }, 400);
    }

    const { error } = await getSupabaseAdmin().rpc("maison_create_recipe", {
      p_home_id: home.id,
      p_name: name,
      p_ingredients: ingredients,
    });
    if (error) throw error;
    return json({ success: true }, 201);
  } catch (error) {
    console.error("Maison meals POST:", error);
    return json({ error: "Impossible d’ajouter cette recette." }, 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const home = await getMaisonByToken(params.token);
    if (!home) return json({ error: "Maison introuvable." }, 404);
    const body = await request.json();
    if (body.action === "generate") {
      const { data, error } = await getSupabaseAdmin().rpc("maison_generate_weekly_groceries", {
        p_home_id: home.id,
      });
      if (error) throw error;
      return json({ success: true, generatedCount: data || 0 });
    }

    const dayIndex = Number(body.dayIndex);
    const recipeId = body.recipeId || null;
    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return json({ error: "Jour invalide." }, 400);

    const { error } = await getSupabaseAdmin().rpc("maison_set_meal_plan", {
      p_home_id: home.id,
      p_day_index: dayIndex,
      p_recipe_id: recipeId,
    });
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    console.error("Maison meals PUT:", error);
    return json({ error: "Impossible de modifier ce repas." }, 500);
  }
}
