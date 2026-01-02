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

      {/* Formulário Jotform */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "32px",
        }}
      >
        <script
          type="text/javascript"
          src="https://form.jotform.com/jsform/253594326585064"
        ></script>
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
