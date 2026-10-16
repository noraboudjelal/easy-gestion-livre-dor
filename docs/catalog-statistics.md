# Statistiques des catalogues et showrooms

Module accessible depuis les liens **Statistiques** de la liste des catalogues (ordinateur et mobile) ou de leur gestion : `/admin/catalogue/<id>/statistiques`.

## Fonctionnement

- Une visite par catalogue et session de 30 minutes par onglet. Le rechargement d’une page ne double pas cette visite. Les onglets peuvent partager la session initiale lorsque le navigateur copie sessionStorage.
- Visiteurs uniques estimés : identifiant aléatoire propre au catalogue, limité à la durée du consentement, haché par HMAC côté serveur. Déduplication SQL sur toute la période sélectionnée, jamais addition des uniques quotidiens. Les visiteurs non consentants ne sont pas comptés ; changement de navigateur, effacement, expiration, réacceptation ou rotation du secret peuvent modifier l’estimation.
- Chaque clic dans une fiche produit est compté ; dans le showroom, ouverture de la fiche. Les changements de photo dans une fiche classique peuvent donc compter comme plusieurs clics. Le classement mesure les clics, pas les impressions à l’écran. Les produits à zéro clic figurent aussi dans le classement.
- WhatsApp, téléphone, Instagram, Facebook, TikTok et autres réseaux : écoute des liens existants, sans ajouter de liens de contact au catalogue. Aucune URL, aucun numéro ni contenu des messages n’est transmis à la collecte. Les liens inexistants restent à zéro.
- Période personnalisée jusqu’à 366 jours, historique roulant de 13 mois, regroupement jour/semaine/mois/année, fuseau Europe/Paris, semaines commençant le lundi. Les périodes partielles sont comptées dans les limites sélectionnées. Graphiques et tableau détaillé accessible.
- Les aperçus portant `adminPreview` ou `managementPreview` sont exclus. La route Henna par catégories réutilise automatiquement le module commun. Les vitrines de prestations `/vitrine` et les pages de démonstration statiques ne sont pas des lignes de la table `catalogs` et ne sont pas modifiées.

## Consentement et minimisation

La nouvelle mesure d’audience exige un accord explicite ; aucune exemption CNIL n’est présumée. Aucun événement ni identifiant de mesure n’est créé avant cet accord. Accepter et Refuser ont la même présentation. Le refus laisse les fonctionnalités disponibles. Le bouton Confidentialité permet de changer le choix ; le retrait arrête immédiatement la collecte, annule les requêtes en cours et supprime l’identifiant local. Un changement de choix dans un autre onglet est pris en compte. Choix et identifiant expirent au plus tard après 180 jours, sans prolongation silencieuse. Le choix est enregistré séparément par catalogue. Le stockage bloqué empêche la collecte.

Le composant ajoute uniquement les contrôles nécessaires au consentement en surimpression ; la mise en page, les styles, les liens et les comportements des catalogues et showrooms restent en place. Les styles de ces contrôles sont isolés dans un module CSS.

Le stockage contient : catalogue, produit éventuel, type d’événement, horodatage serveur, identifiant d’événement, session aléatoire, version du consentement et identifiant visiteur pseudonymisé. **Il s’agit de données pseudonymisées, pas d’une garantie d’anonymat.** Aucun nom, e-mail, IP, géolocalisation, user-agent, referrer, URL de navigation ou fingerprint n’est stocké dans les tables statistiques. Le navigateur transmet nécessairement son IP aux infrastructures réseau : vérifier séparément leurs journaux, accès et durées de conservation.

Les événements sont conservés 13 mois et exclus des rapports dès expiration. Une purge quotidienne doit être opérationnelle avant activation publique (voir ci-dessous). Le retrait empêche les nouveaux traitements de mesure ; il n’efface pas rétroactivement l’historique déjà licitement collecté. Les demandes d’accès/effacement doivent suivre le processus du responsable de traitement ; les identifiants locaux permettent une recherche HMAC si encore disponibles.

À compléter par le responsable de traitement avant activation : identité et contact du responsable, finalités/base légale dans la notice de confidentialité, droits et réclamation CNIL, sous-traitants/DPA, région Supabase et encadrement des transferts, durées des sauvegardes et journaux. Les intégrations tierces préexistantes (par exemple vidéos) ne sont pas auditées ou modifiées par ce module ; vérifier séparément leurs éventuels traceurs. La conformité dépend également de ces paramètres et de l’exploitation réelle.

Références : [CNIL, fréquentation des sites](https://www.cnil.fr/fr/mesurer-la-frequentation-de-vos-sites-web-et-de-vos-applications), [CNIL, mise en conformité des traceurs](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite), [Supabase, RLS et privilèges](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Installation en environnement de validation

Ne pas appliquer en production avant validation.

1. Conserver les variables Supabase habituelles : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement), ainsi que `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` (32 caractères minimum).
2. Ajouter `STATISTICS_HASH_SECRET`, secret aléatoire d’au moins 32 caractères côté serveur uniquement. Ne jamais le préfixer `NEXT_PUBLIC_`. Une rotation rompt la déduplication avec les identifiants précédents.
3. Appliquer `supabase/migrations/20261016112915_catalog_statistics.sql` dans une branche/base de validation possédant les tables existantes `catalogs` et `catalog_products` (identifiants UUID). La migration ne modifie pas leurs politiques existantes.
4. **Purge obligatoire** : activer l’extension Supabase pg_cron avant la migration ; elle enregistre alors le job quotidien `lehnova-statistics-retention` (02:17 UTC). Vérifier son exécution dans `cron.job_run_details`. Si pg_cron n’est pas installé, programmer un appel quotidien authentifié à `GET /api/statistics/purge` avec `Authorization: Bearer <CRON_SECRET>` (secret de 32 caractères minimum) via l’ordonnanceur de l’hébergeur. Sans ordonnanceur opérationnel, ne pas activer la collecte. La migration n’installe pas d’extension système ni ne modifie de configuration existante automatiquement.
5. Exécuter les tests SQL dans une base isolée : `supabase/tests/catalog_statistics.sql`. Ils insèrent des fixtures dans une transaction annulée. Lancer les advisors Supabase sur cette branche avant déploiement.
6. Exécuter `npm ci`, `npm test`, `npm run build`, puis vérifier avec une session admin réelle, deux catalogues distincts et une fenêtre privée sur mobile/ordinateur. Le lockfile existant a été remis en cohérence avec `package.json` (jspdf manquait).

## Sécurité et futur accès commerçant

Les rapports actuels nécessitent la session administrateur signée côté serveur ; une clé de sessionStorage n’accorde aucun accès à l’API. Les réponses sont `private, no-store` et ne contiennent que des agrégats. La clé de service ne quitte jamais le serveur. RLS est activé sur les nouvelles tables ; `anon` et `authenticated` n’ont ni lecture/écriture des événements ni accès aux RPC de collecte/rapport/purge. Les fonctions sont `SECURITY INVOKER` avec search_path vide, exécution explicitement réservée au service_role.

La table `catalog_statistics_members(catalog_id,user_id)` prépare l’accès commerçant. Seul le backend peut attribuer une appartenance ; un utilisateur Supabase authentifié peut lire uniquement ses propres appartenances. Pour ouvrir un portail commerçant ultérieurement : authentifier avec Supabase Auth et `getUser()`, vérifier en serveur que cet utilisateur appartient au catalogue demandé, puis seulement appeler le RPC de rapport via le client serveur. Ne pas réutiliser les codes clients historiques/sessionStorage comme autorisation, ne pas accorder aux commerçants la lecture des événements bruts et ne pas simplement ouvrir le RPC à `authenticated`. La migration n’ouvre encore aucun portail commerçant.

La collecte exige un POST JSON de même origine, un consentement versionné, des UUID valides, un type autorisé et un corps limité à 2 Ko. Le produit doit appartenir au catalogue. Déduplication atomique des sessions et événements et limite de 120 événements/heure par identifiant pseudonyme/catalogue. Les robots courants sont ignorés sans enregistrer leur user-agent. La collecte reste une entrée publique : un client malveillant peut simuler des consentements ou renouveler ses identifiants ; ces statistiques ne conviennent pas à la facturation. Ajouter une protection de débit à l’hébergeur si le trafic l’exige, sans introduire d’identification supplémentaire dans l’historique.
