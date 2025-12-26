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

      {/* Imagem com link para /register */}
      <a href="/register" style={{ marginBottom: "24px" }}>
        <img
          src="/run.png"
          alt="Register"
          style={{
            maxWidth: "320px",
            width: "100%",
            cursor: "pointer",
          }}
        />
      </a>

      <p style={{ fontSize: "1.1rem", maxWidth: "520px" }}>
        We are building something powerful for athletes and organizers.
        <br />
        Launch scheduled for <strong>March 1, 2026</strong>.
      </p>
    </main>
  );
}
