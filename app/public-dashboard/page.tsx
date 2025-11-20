// app/public-dashboard/page.tsx
import BottomNavbar from "@/components/BottomNavbar";

export default function PublicDashboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px",
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              marginBottom: "4px",
            }}
          >
            Insights do grupo
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              marginBottom: "16px",
            }}
          >
            Visão consolidada de volume, intensidade e consistência dos
            atletas.
          </p>

          {/* Aqui entra o conteúdo que você já tinha (cards, métricas, etc.) */}
          {/* ... */}
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
