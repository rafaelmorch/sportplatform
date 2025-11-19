import { notFound } from "next/navigation";
import { trainingPlans } from "../../plans/plans-data";
import { trainingGroups } from "../../groups/groups-data";

type PageProps = {
  params: { slug: string };
};

// 👉 TROCAR pelo seu número real em formato internacional, ex: +1 407...
const CONTACT_WHATSAPP_BASE = "https://wa.me/14070000000?text=";

// 👉 TROCAR pelo seu e-mail real de contato
const CONTACT_EMAIL = "support@sportplatform.app";

function buildContactMessage(planTitle: string) {
  return encodeURIComponent(
    `Olá! Tenho interesse em contratar o plano de treino: ${planTitle}. Podemos conversar sobre detalhes, início dos treinos e formas de pagamento?`
  );
}

// 👉 Aqui você configura o link de pagamento de cada plano
function getPaymentLinkForPlan(slug: string): string {
  switch (slug) {
    case "starter-5k":
      return "https://www.paypal.com/seu_link_starter_5k";
    case "premium-10k":
      return "https://www.paypal.com/seu_link_premium_10k";
    case "marathon-pro":
      return "https://www.paypal.com/seu_link_marathon_pro";
    case "triathlon-complete":
      return "https://www.paypal.com/seu_link_triathlon_complete";
    case "weight-loss-plus":
      return "https://www.paypal.com/seu_link_weight_loss_plus";
    default:
      // Se ainda não tiver link, mantemos # para não quebrar
      return "#";
  }
}

export default function CheckoutPage({ params }: PageProps) {
  const plan = trainingPlans.find((p) => p.slug === params.slug);

  if (!plan) {
    notFound();
  }

  const groups = trainingGroups.filter((g) =>
    plan.recommendedGroups.includes(g.slug)
  );

  const paymentLink = getPaymentLinkForPlan(plan.slug);
  const contactMessage = buildContactMessage(plan.title);
  const whatsappUrl = `${CONTACT_WHATSAPP_BASE}${contactMessage}`;
  const emailSubject = encodeURIComponent(`Interesse no plano ${plan.title}`);
  const emailBody = contactMessage;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      {/* Cabeçalho do plano */}
      <header style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "12px",
            color: "#a5b4fc",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "4px",
          }}
        >
          Checkout • Plano de treino
        </p>

        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            marginBottom: "4px",
          }}
        >
          {plan.title}
        </h1>

        <p style={{ color: "#94a3b8", marginBottom: "8px" }}>
          {plan.subtitle}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            ${plan.pricePerMonth}
            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginLeft: "4px",
              }}
            >
              / mês
            </span>
          </p>

          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            Duração: {plan.durationWeeks} semanas • Nível: {plan.level}
          </p>
        </div>

        <p
          style={{
            marginTop: "10px",
            color: "#9ca3af",
            maxWidth: "640px",
            fontSize: "13px",
          }}
        >
          Este checkout é para contratar o acompanhamento do plano{" "}
          <strong>{plan.title}</strong>. Após o pagamento, você receberá os
          próximos passos por contato direto (WhatsApp ou e-mail).
        </p>
      </header>

      {/* Grade principal: passos à esquerda, ações à direita */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
          gap: "20px",
        }}
      >
        {/* Coluna esquerda – como funciona / o que inclui */}
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #1e293b",
            background: "#020617",
            padding: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            Como funciona
          </h2>

          <ol
            style={{
              listStyle: "decimal",
              paddingLeft: "20px",
              fontSize: "13px",
              color: "#e5e7eb",
              display: "grid",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <li>
              <strong>Confirme se o plano é ideal para você.</strong> Veja os
              grupos indicados, duração e o nível do plano.
            </li>
            <li>
              <strong>Realize o pagamento.</strong> Você será direcionado para
              uma página externa de pagamento (ex.: PayPal, Stripe, etc.).
            </li>
            <li>
              <strong>Envie o comprovante e seus dados básicos.</strong> Após o
              pagamento, fale comigo via WhatsApp ou e-mail para combinarmos
              histórico, rotina e início dos treinos.
            </li>
          </ol>

          <h3
            style={{
              fontSize: "15px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            O que está incluído neste plano
          </h3>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "18px",
              fontSize: "13px",
              color: "#e5e7eb",
              marginBottom: "10px",
            }}
          >
            {plan.highlights.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                {item}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
            Observação: este fluxo ainda é simples e manual. No futuro, você
            pode integrar com um checkout automatizado (Stripe, PayPal, Pix,
            etc.) e salvar os pedidos direto no Supabase.
          </p>
        </div>

        {/* Coluna direita – grupos indicados + ações */}
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #1e293b",
            background: "#020617",
            padding: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Para quem este treino é indicado
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "#cbd5e1",
              marginBottom: "8px",
            }}
          >
            Este plano foi pensado principalmente para atletas dos seguintes
            grupos:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {groups.map((g) => (
              <a key={g.slug} href={`/groups/${g.slug}`}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: "#020617",
                    cursor: "pointer",
                  }}
                >
                  {g.title}
                </span>
              </a>
            ))}
          </div>

          {/* Botões de ação */}
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gap: "8px",
            }}
          >
            {/* Botão de pagamento */}
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "9px 14px",
                borderRadius: "999px",
                border: "none",
                background:
                  paymentLink === "#"
                    ? "#6b7280"
                    : "#22c55e",
                color: "#020617",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                cursor: paymentLink === "#" ? "not-allowed" : "pointer",
                opacity: paymentLink === "#" ? 0.7 : 1,
              }}
            >
              {paymentLink === "#"
                ? "Pagamento em breve"
                : "Ir para pagamento"}
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid #334155",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              Falar com treinador no WhatsApp
            </a>

            {/* E-mail */}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${emailSubject}&body=${emailBody}`}
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid #334155",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              Falar por e-mail
            </a>
          </div>

          <p
            style={{
              marginTop: "10px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            Dica: assim que tiver os links reais de checkout (ex.: PayPal /
            Stripe), basta editar a função{" "}
            <code style={{ fontSize: "11px" }}>getPaymentLinkForPlan</code> para
            cada plano.
          </p>
        </div>
      </div>
    </div>
  );
}
