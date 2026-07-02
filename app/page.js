export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#3a3027",
        color: "#F6F0E2",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Easy Gestion Toulouse</h1>
      <p style={{ opacity: 0.7, maxWidth: "420px" }}>
        Cette page n'est pas destinée aux invités. Si tu es Nora, rends-toi sur{" "}
        <a href="/admin" style={{ color: "#E6B95C" }}>
          /admin
        </a>{" "}
        pour gérer tes livres d'or et catalogues.
      </p>
    </main>
  );
}
