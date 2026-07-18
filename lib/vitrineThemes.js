// À placer dans : lib/vitrineThemes.js
// 4 palettes prêtes à l'emploi. Le client choisit la sienne depuis son espace "gerer".

export const VITRINE_THEMES = {
  coiffure: {
    label: "Doré",
    swatch: "#B08D4F",
    vars: {
      "--ink": "#17140F",
      "--bg": "#F7F2E9",
      "--bg-dim": "#EDE5D4",
      "--accent": "#B08D4F",
      "--accent-2": "#5E2530",
      "--paper": "#FFFDF8",
    },
  },
  atelier: {
    label: "Brique",
    swatch: "#A85A3F",
    vars: {
      "--ink": "#201D1B",
      "--bg": "#EFEAE0",
      "--bg-dim": "#E4DDCE",
      "--accent": "#A85A3F",
      "--accent-2": "#35566E",
      "--paper": "#FBF9F4",
    },
  },
  nature: {
    label: "Sauge",
    swatch: "#6B7F5E",
    vars: {
      "--ink": "#1B1D18",
      "--bg": "#F1F1E8",
      "--bg-dim": "#E4E5D6",
      "--accent": "#6B7F5E",
      "--accent-2": "#8A5A3D",
      "--paper": "#FCFCF6",
    },
  },
  nuit: {
    label: "Nuit",
    swatch: "#3E6B8A",
    vars: {
      "--ink": "#F4F2EC",
      "--bg": "#14181D",
      "--bg-dim": "#1E242B",
      "--accent": "#3E6B8A",
      "--accent-2": "#C99A3E",
      "--paper": "#1A1F25",
    },
  },
};

export const DEFAULT_THEME = "coiffure";

// Petit utilitaire : transforme le thème choisi en objet style CSS variables
// à passer directement en `style={...}` sur le conteneur de la page.
export function themeToCssVars(themeKey) {
  const theme = VITRINE_THEMES[themeKey] || VITRINE_THEMES[DEFAULT_THEME];
  return theme.vars;
}
