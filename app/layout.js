export const metadata = {
  title: "Lehnova — Supports connectés",
  description: "Supports numériques et physiques connectés, pour vos commerces et événements à Toulouse.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lehnova",
  },
};

export const viewport = {
  themeColor: "#1C1B33",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
