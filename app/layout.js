export const metadata = {
  title: "Livre d'or — Easy Gestion Toulouse",
  description: "Livres d'or numériques pour vos événements",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
