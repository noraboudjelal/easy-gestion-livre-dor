export const metadata = {
  title: "Lehnova — Supports numériques personnalisés",
  description: "Solutions numériques accessibles par QR code pour les événements, les commerces et les artisans.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lehnova",
  },
};

export const viewport = {
  themeColor: "#071522",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
