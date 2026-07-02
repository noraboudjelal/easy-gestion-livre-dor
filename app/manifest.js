export default function manifest() {
  return {
    name: "Easy Gestion Toulouse",
    short_name: "Easy Gestion",
    description: "Livres d'or et catalogues numériques Easy Gestion Toulouse",
    start_url: "/admin",
    display: "standalone",
    background_color: "#F6F0E2",
    theme_color: "#B5402D",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
