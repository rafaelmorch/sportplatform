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
      {/* Imagem do topo */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "32px",
        }}
      >
        <img
          src="/Sportsazul.png"
          alt="Sports Platform"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* Imagem principal */}
      <a
        href="/register"
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "24px",
        }}
      >
        <img
          src="/run.png"
          alt="Register"
          style={{
            width: "100%",
            height: "auto",
            cursor: "pointer",
            display: "block",
          }}
        />
      </a>

      {/* Botão principal */}
      <a
        href="/register"
        style={{
          width: "100%",
          maxWidth: "720px",
          textDecoration: "none",
          marginBottom: "10px",
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
              color: "#ffffff",
              textAlign: "center",
              fontSize: "1.25rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: 700,
              fontFamily: "'Rowdies', sans-serif",
            }}
          >
            REGISTRE-SE AGORA
          </div>
        </div>
      </a>

      {/* Botão discreto de contato */}
      <a
        href="/contact"
        style={{
          fontSize: "0.9rem",
          color: "#aaa",
          textDecoration: "none",
          marginBottom: "28px",
        }}
      >
        Fale conosco →
      </a>

      {/* Patrocinador */}
      <div style={{ textAlign: "center", marginTop: "8px" }}>
        <div
          style={{
            color: "#ccc",
            fontSize: "0.9rem",
            marginBottom: "8px",
            letterSpacing: "1px",
          }}
        >
          Patrocinador oficial:
        </div>

        <img
          src="/ip.PNG"
          alt="Patrocinador oficial"
          style={{
            maxWidth: "180px",
            width: "100%",
            height: "auto",
            opacity: 0.9,
          }}
        />
      </div>
    </main>
  );
}
