export const metadata = {
  title: "Easy Gestion Toulouse",
  description: "Livres d'or et catalogues numériques pour vos événements et commerces",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Easy Gestion",
  },
};

export const viewport = {
  themeColor: "#B5402D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
