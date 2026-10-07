# La Roue

## Administration

Se connecter à `/gestion` avec le mot de passe administrateur existant, puis ouvrir l'onglet **La Roue**. `/admin` conserve le même espace et la même session : aucun deuxième système de connexion.

1. Cliquer sur **Nouveau commerce** et saisir son nom.
2. Vérifier ou modifier le slug généré à partir du nom (unique entre les roues).
3. Renseigner les huit lots, puis cliquer sur **Enregistrer la roue**.
4. Ouvrir ou copier le lien individuel `/la-roue/nom-du-commerce` dans la liste.
5. Revenir à l'onglet et cliquer sur **Modifier les lots** pour reprendre une configuration sauvegardée.

Les données sont enregistrées dans `public.wheel_businesses`, indépendamment de Le Fil et des autres commerces. Les routes `/api/admin/wheels` utilisent `lib/admin/adminSession.js` et `getSupabaseAdmin()`. La table est protégée par RLS et ne donne aucun accès direct aux rôles navigateur. Les réglages sont accessibles uniquement avec la session administrateur existante.

La migration `supabase/migrations/20261007084613_create_la_roue_businesses.sql` doit être appliquée avant de publier l'intégration. Elle ne modifie aucune table existante. Les variables serveur existantes `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont réutilisées telles quelles.

## Page publique

Le lien `/la-roue/nom-du-commerce` affiche uniquement le nom du commerce, sa roue, le bouton pour jouer et le lot gagné. Aucun formulaire, éditeur, bouton de gestion ou lien administrateur. Les lots sont relus en base à chaque ouverture. Changer le slug dans l'administration change le lien public. Un visiteur ayant déjà la roue ouverte doit recharger la page pour obtenir les nouveaux lots.

`/la-roue` est une démonstration avec huit lots fixes et le seul bouton pour jouer. Elle ne permet plus de personnaliser les lots. Les anciennes configurations dans l'URL ou le stockage local sont ignorées. Pour un commerce, utiliser exclusivement le lien `/la-roue/slug` créé dans l'administration.

Chaque lot a une probabilité de 1/8. Le tirage est effectué dans le navigateur. L'animation conserve la géométrie SVG, les cinq tours, la durée et la courbe de la roue de Le Fil. Les longs textes sont abrégés uniquement sur les parts ; le résultat affiche le lot complet. La remise ou la validation des cadeaux reste à la charge du commerce.

La roue Action/Vérité et les données de Le Fil restent inchangées.
