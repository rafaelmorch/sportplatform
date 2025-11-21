// app/events/page.tsx
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";

type EventCard = {
  slug: string;
  title: string;
  distance: string;
  date: string;
  location: string;
  description: string;
  level: string;
  imageUrl: string;
  status: "inscricoes-abertas" | "em-breve" | "encerrado";
};

const events: EventCard[] = [
  {
    slug: "maratona-orlando",
    title: "Maratona SportPlatform Orlando",
    distance: "42.195 km",
    date: "21 de Setembro de 2025",
    location: "Orlando, FL · Lake Nona District",
    description:
      "Prova oficial de 42 km com preparação guiada pelo SportPlatform, focada em performance e consistência de carga semanal.",
    level: "Intermediário · Avançado",
    imageUrl: "/events/marathon.jpg", // coloque uma imagem com esse nome em /public/events/
    status: "inscricoes-abertas",
  },
  {
    slug: "meia-maratona-10k",
    title: "Desafio 21K + 10K",
    distance: "21 km + 10 km",
    date: "05 de Outubro de 2025",
    location: "Downtown Orlando, FL",
    description:
      "Formato híbrido com baterias de 10 km e meia maratona. Ideal para quem está construindo base para provas maiores.",
    level: "Intermediário",
    imageUrl: "/events/half-marathon.jpg",
    status: "inscricoes-abertas",
  },
  {
    slug: "night-5k",
    title: "Night 5K Experience",
    distance: "5 km",
    date: "12 de Julho de 2025",
    location: "Orlando, FL · Lake Eola Park",
    description:
      "Prova noturna de 5 km com foco em iniciantes e atletas que querem testar ritmo em uma experiência leve e divertida.",
    level: "Beginner · Intermediário",
    imageUrl: "/events/5k-night.jpg",
    status: "inscricoes-abertas",
  },
  {
    slug: "triathlon-sprint",
    title: "Triathlon Sprint Series",
    distance: "750 m · 20 km · 5 km",
    date: "30 de Agosto de 2025",
    location: "Clermont, FL · Waterfront Park",
    description:
      "Triathlon sprint com foco em transições eficientes e controle de intensidade. Integrado com métricas do SportPlatform.",
    level: "Intermediário · Avançado",
    imageUrl: "/events/triathlon.jpg",
    status: "em-breve",
  },
];

function getStatusLabel(status: EventCard["status"]) {
  switch (status) {
    case "inscricoes-abertas":
      return {
        text: "Inscrições abertas",
        bg: "rgba(34,197,94,0.12)",
        color: "#22c55e",
        border: "1px solid rgba(34,197,94,0.35)",
      };
    case "em-breve":
      return {
        text: "Em breve",
        bg: "rgba(234,179,8,0.08)",
        color: "#eab308",
        border: "1px solid rgba(234,179,8,0.3)",
      };
    case "encerrado":
    default:
      return {
        text: "Encerrado",
        bg: "rgba(148,163,184,0.08)",
        color: "#9ca3af",
        border: "1px solid rgba(148,163,184,0.35)",
      };
  }
}

export default function EventsPage() {
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
          paddingBottom: "80px", // espaço para a bottom navbar
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}
          <header
            style={{
              marginBottom: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#64748b",
                margin: 0,
              }}
            >
              Calendário
            </p>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
              }}
            >
              Eventos SportPlatform
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#94a3b8",
                margin: 0,
              }}
            >
              Escolha um evento-alvo, conecte seu Strava e acompanhe sua
              preparação diretamente no SportPlatform.
            </p>
          </header>

          {/* LISTA DE EVENTOS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {events.map((event) => {
              const status = getStatusLabel(event.status);

              return (
                <article
                  key={event.slug}
                  style={{
                    borderRadius: "18px",
                    border: "1px solid #1e293b",
                    background:
                      "radial-gradient(circle at top left, #020617, #020617 55%, #000000 100%)",
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
                    gap: "0",
                  }}
                >
                  {/* Imagem */}
                  <div
                    style={{
                      position: "relative",
                      minHeight: "140px",
                      maxHeight: "200px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "radial-gradient(circle at top, rgba(34,197,94,0.15), transparent 55%)",
                        zIndex: 1,
                      }}
                    />
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        filter: "grayscale(0.2)",
                      }}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div
                    style={{
                      padding: "12px 14px 12px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {event.title}
                        </h2>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            margin: 0,
                          }}
                        >
                          {event.distance} • {event.location}
                        </p>
                      </div>

                      {/* Status */}
                      <span
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: status.bg,
                          color: status.color,
                          border: status.border,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {status.text}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#cbd5e1",
                        margin: 0,
                      }}
                    >
                      {event.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: "#020617",
                          border: "1px solid #1e293b",
                          color: "#e5e7eb",
                        }}
                      >
                        {event.date}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: "#020617",
                          border: "1px solid #1e293b",
                          color: "#9ca3af",
                        }}
                      >
                        {event.level}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        marginTop: "6px",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <Link
                        href={
                          event.status === "inscricoes-abertas"
                            ? `/signup`
                            : "#"
                        }
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: 40,
                          borderRadius: "999px",
                          background:
                            event.status === "inscricoes-abertas"
                              ? "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)"
                              : "#020617",
                          color:
                            event.status === "inscricoes-abertas"
                              ? "#020617"
                              : "#6b7280",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          border:
                            event.status === "inscricoes-abertas"
                              ? "1px solid rgba(248,250,252,0.1)"
                              : "1px solid #1f2937",
                          cursor:
                            event.status === "inscricoes-abertas"
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        {event.status === "inscricoes-abertas"
                          ? "Inscrever-se"
                          : "Indisponível"}
                      </Link>

                      <Link
                        href="/plans"
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Ver planos de preparação
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
