"use client";

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
      {/* Imagem */}
      <a href="/register" style={{ width: "100%", maxWidth: "720px" }}>
        <img
          src="/run.png"
          alt="Register"
          style={{
            width: "100%",
            height: "auto",
            marginBottom: "24px",
            cursor: "pointer",
          }}
        />
      </a>

      {/* Botão com contorno degradê */}
      <a
        href="/register"
        style={{
          width: "100%",
          maxWidth: "720px",
          textDecoration: "none",
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
              padding: "16px 0",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            REGISTRE-SE AGORA
          </div>
        </div>
      </a>
    </main>
  );
}
