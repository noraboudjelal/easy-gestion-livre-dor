# La Roue

## Gestion par commerce

Se connecter à `/admin` avec le mot de passe administrateur existant, puis ouvrir l'onglet **La Roue**.

1. Cliquer sur **Nouveau commerce** et saisir son nom.
2. Vérifier ou modifier le slug généré à partir du nom (unique entre les roues).
3. Renseigner les huit lots, puis cliquer sur **Enregistrer la roue**.
4. Ouvrir ou copier le lien individuel `/la-roue/nom-du-commerce` dans la liste.
5. Revenir à l'onglet et cliquer sur **Modifier les lots** pour reprendre une configuration sauvegardée.

Les données sont enregistrées dans `public.wheel_businesses`, indépendamment de Le Fil et des autres commerces. Les routes `/api/admin/wheels` utilisent `lib/admin/adminSession.js` et `getSupabaseAdmin()` : aucun nouveau système de connexion. La table est protégée par RLS et ne donne aucun accès direct aux rôles navigateur. Le serveur lit uniquement le nom, le slug et les lots pour la page publique.

Les pages individuelles n'ont pas d'éditeur, n'utilisent ni la sauvegarde locale ni le paramètre `configuration`, et relisent les lots en base à chaque ouverture. Changer le slug change le lien public. Un visiteur ayant déjà la roue ouverte doit recharger la page pour obtenir les nouveaux lots.

Appliquer la migration `supabase/migrations/20261007084613_create_la_roue_businesses.sql` avant de publier cette intégration. Elle ne modifie aucune table existante. Les variables serveur existantes `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont réutilisées telles quelles.

## Version simple existante

Page indépendante : `/la-roue`.

1. Ouvrir « Personnaliser les lots ».
2. Saisir le nom du commerce et ses huit lots (60 caractères maximum chacun).
3. Cliquer sur « Enregistrer les lots ».
4. Copier et conserver le lien personnalisé pour ce client. Il contient la configuration et fonctionne dans un autre navigateur sans compte ni base de données.

Les textes complets sont disponibles dans « Voir les 8 lots » et le résultat. Les longs textes sont abrégés uniquement sur les parts.

La sauvegarde locale utilise exclusivement `lehnova-la-roue-v1`. Un lien personnalisé est un instantané des lots : après une modification, partager le nouveau lien. La dernière configuration enregistrée est restaurée à l'ouverture de `/la-roue` dans ce navigateur. Un lien personnalisé est prioritaire sur cette sauvegarde.

Chaque lot a une probabilité de 1/8. Le tirage est effectué dans le navigateur. L'animation reprend la géométrie SVG, les cinq tours, la durée et la courbe de la roue de `app/[slug]/page.js`. Aucune écriture dans les données de Le Fil ; sa roue d'origine reste inchangée.

La démonstration simple `/la-roue` conserve son éditeur local et ses anciens liens. Les liens de commerces gérés dans l'administration utilisent exclusivement `/la-roue/slug`, avec les lots en base et aucune personnalisation publique. La remise ou la validation des cadeaux reste à la charge du commerce.
