export default function Home() {
  return (
    <main
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
        SportPlatform
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Conecte sua conta do Strava e visualize suas atividades em um painel simples e rápido.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <a
          href="/api/strava/auth"
          style={{
            display: "inline-block",
            background: "black",
            color: "white",
            padding: "12px 18px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Conectar com Strava
        </a>

        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          Ir para Dashboard
        </a>
      </div>

      <div style={{ marginTop: 28, fontSize: 14, opacity: 0.7 }}>
        * O botão de conexão será ativado quando configurarmos o OAuth do Strava (próximos passos).
      </div>
    </main>
  );
}

