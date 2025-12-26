export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Imagem (responsiva, ~20% menor) */}
      <a href="/register" style={{ width: "100%", maxWidth: "720px" }}>
        <img
          src="/run.png"
          alt="Register"
          style={{
            width: "100%",
            height: "auto",
            marginBottom: "24px",
            cursor: "pointer",
            display: "block",
          }}
        />
      </a>

      {/* Botão (mesma largura da imagem, contorno degradê) */}
      <a
        href="/register"
        style={{
          width: "100%",
          maxWidth: "720px",
          textDecoration: "none",
          display: "block",
        }}
      >
        <div
          style={{
            padding: "2px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, #ff2d55, #ff9500, #ffd60a)",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.9)",
              color: "#fff",
              textAlign: "center",
              fontSize: "1.25rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: 700, // Rowdies fica forte aqui
              fontFamily: "'Rowdies', sans-serif",
            }}
          >
            REGISTRE-SE AGORA
          </div>
        </div>
      </a>
    </main>
  );
}
