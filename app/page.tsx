"use client";

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
      {/* Imagem (20% menor e responsiva) */}
      <a href="/register" style={{ width: "100%", maxWidth: "720px" }}>
        <img
          src="/run.png"
          alt="Register"
          style={{
            width: "100%",
            height: "auto",
            cursor: "pointer",
            marginBottom: "32px",
          }}
        />
      </a>

      {/* Botão mais bonito */}
      <a
        href="/register"
        style={{
          padding: "16px 44px",
          background: "linear-gradient(135deg, #ffffff, #e5e5e5)",
          color: "#000",
          borderRadius: "999px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "1.15rem",
          boxShadow: "0 10px 30px rgba(255,255,255,0.25)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 14px 40px rgba(255,255,255,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 10px 30px rgba(255,255,255,0.25)";
        }}
      >
        Registre-se agora
      </a>
    </main>
  );
}
