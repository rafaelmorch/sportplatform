// app/profile/page.tsx
import BottomNavbar from "@/components/BottomNavbar";

export default function ProfilePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço para a bottom navbar fixa
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 20% 20%, #22c55e, #16a34a 40%, #0f172a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#0b1120",
              }}
            >
              A
            </div>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Meu Perfil
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Área básica de perfil do atleta na SportPlatform.
              </p>
            </div>
          </div>
        </header>

        {/* Cards simples */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 18,
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #0f172a, #020617 60%)",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginBottom: 4,
              }}
            >
              Nome do atleta
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Atleta conectado
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 6,
              }}
            >
              No futuro, aqui você poderá editar nome, foto e dados básicos do
              seu perfil.
            </p>
          </div>

          <div
            style={{
              borderRadius: 18,
              padding: "14px 14px",
              background:
                "radial-gradient(circle at top, #020617, #020617 60%)",
              border: "1px solid rgba(34,197,94,0.4)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#bbf7d0",
                marginBottom: 4,
              }}
            >
              Integrações
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: 0,
              }}
            >
              Strava / Garmin
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 6,
              }}
            >
              Gerencie aqui suas conexões com plataformas de treino. Por
              enquanto, use a aba “Integrações” no menu inferior.
            </p>
          </div>
        </section>

        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Sobre este perfil
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Esta é uma página básica de perfil para evitar o erro 404. Em
            versões futuras, você poderá editar seus dados pessoais, preferências
            de treino e configurações da conta diretamente por aqui.
          </p>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
