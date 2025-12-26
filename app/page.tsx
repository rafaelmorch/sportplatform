export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "24px" }}>
        SportsPlatform
      </h1>

      {/* Imagem maior e responsiva */}
      <a href="/register" style={{ width: "100%", maxWidth: "900px" }}>
        <img
          src="/run.png"
          alt="Register"
          style={{
            width: "100%",
            maxWidth: "900px", // ~80% maior que antes
            height: "auto",
            cursor: "pointer",
            marginBottom: "32px",
          }}
        />
      </a>

      {/* Botão de registro */}
      <a
        href="/register"
        style={{
          padding: "14px 36px",
          backgroundColor: "#fff",
          color: "#000",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "1.1rem",
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.opacity = "1";
        }}
      >
        Registre-se aqui
      </a>
    </main>
  );
}
