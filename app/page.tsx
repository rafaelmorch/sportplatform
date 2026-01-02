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

      {/* Imagem principal (sem faixa) */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "24px",
        }}
      >
        <img
          src="/run.png"
          alt="Run"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* Botão principal (desativado visualmente) */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "10px",
          opacity: 0.7,
        }}
      >
        <div
          style={{
            padding: "2px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #374151, #111827, #000000)",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.9)",
              color: "#9ca3af",
              textAlign: "center",
              fontSize: "1.25rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: 700,
              fontFamily: "'Rowdies', sans-serif",
            }}
          >
            INSCRIÇÕES ENCERRADAS
          </div>
        </div>
      </div>

      {/* Texto de contato (sem link) */}
      <div
        style={{
          fontSize: "1.08rem",
          color: "#9ca3af",
          marginBottom: "28px",
        }}
      >
        Fale conosco →
      </div>

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
