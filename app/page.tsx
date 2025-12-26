// app/page.tsx
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
      <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
        SportsPlatform
      </h1>

      <p style={{ fontSize: "1.1rem", maxWidth: "520px", marginBottom: "24px" }}>
        We are building something powerful for athletes and organizers.
        <br />
        Launch scheduled for <strong>March 1, 2026</strong>.
      </p>

      <a
        href="/login"
        style={{
          padding: "12px 24px",
          border: "1px solid #fff",
          borderRadius: "6px",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Go to Login
      </a>
    </main>
  );
}
