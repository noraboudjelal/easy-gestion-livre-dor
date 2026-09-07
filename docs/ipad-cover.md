# Couverture iPad — Le Fil

Dans l’administration, ouvrir l’événement puis « Générer la couverture iPad ».
Choisir Éditorial, Minimal ou Romantique, ajuster les textes et éventuellement
importer une photo JPG, PNG ou WebP (25 Mo maximum). Le cadrage et le voile sont
réglables pour les compositions photographiques. Minimal conserve un fond uni.

Le titre et la date proviennent de l’événement chargé par l’API administrateur
existante. Les couleurs initiales reprennent la palette ivoire/brun/doré du Fil.
Le schéma actuel ne fournit pas de photo ni de palette personnalisée pour les
événements : la photo se choisit dans l’éditeur et les couleurs restent modifiables.
Les réglages restent en mémoire tant que la page est ouverte, sans modifier
l’événement ni enregistrer la photo sur un serveur.

L’aperçu est le canvas exporté en PNG, avec les polices Instrument Serif locales
(licence OFL fournie). L’horloge est une superposition indicative, jamais exportée.
Sélectionner les dimensions de son écran, télécharger puis enregistrer dans
Photos sur l’iPad et définir manuellement comme fond de l’écran verrouillé.
Aucun écran supplémentaire n’est ajouté au parcours des invités.

## Vérification

- Compilation de production Next.js 14.2.35 réussie.
- Parcours navigateur Chromium avec réponse d’événement simulée : préremplissage,
  trois styles, export PNG 2048 × 2732, import/cadrage d’image, prénoms longs,
  export personnalisé 1640 × 2360, validation, fermeture/réouverture et largeur 390 px.
- Route API existante : HTTP 401 sans session administrateur.
- Pas d’accès aux données de production ni de migration nécessaire.
- Installation du fond d’écran sur un iPad physique à vérifier lors de la mise en place.
