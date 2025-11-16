// app/terms/page.tsx
import type { CSSProperties } from "react";

const containerStyle: CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 20px 80px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#0f172a",
};

const heroStyle: CSSProperties = {
  background: "linear-gradient(135deg, #0f766e, #0369a1)",
  borderRadius: "18px",
  padding: "28px 24px",
  color: "#f9fafb",
  marginBottom: "32px",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.35)",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
  alignItems: "center",
};

const badgeStyle: CSSProperties = {
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "0.75rem",
  border: "1px solid rgba(148, 163, 184, 0.6)",
  backgroundColor: "rgba(15, 23, 42, 0.35)",
};

const titleStyle: CSSProperties = {
  fontSize: "2rem",
  fontWeight: 700,
  marginBottom: "6px",
};

const subtitleStyle: CSSProperties = {
  fontSize: "0.95rem",
  maxWidth: "640px",
  lineHeight: 1.5,
  opacity: 0.92,
};

const langTabsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
};

const langPillStyle: CSSProperties = {
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "0.8rem",
  border: "1px solid rgba(148, 163, 184, 0.75)",
  backgroundColor: "rgba(15, 23, 42, 0.18)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "20px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "22px 20px 26px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  marginBottom: "10px",
};

const updatedTextStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
  marginBottom: "16px",
};

const h2Style: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginTop: "20px",
  marginBottom: "6px",
};

const pStyle: CSSProperties = {
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: "8px",
};

const ulStyle: CSSProperties = {
  paddingLeft: "20px",
  marginTop: "4px",
  marginBottom: "8px",
};

const liStyle: CSSProperties = {
  fontSize: "0.9rem",
  lineHeight: 1.5,
  marginBottom: "4px",
};

export default function TermsPage() {
  return (
    <div style={containerStyle}>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>SportPlatform</span>
          <span style={badgeStyle}>Terms of Use · Termos de Uso</span>
        </div>
        <h1 style={titleStyle}>Terms of Use & Legal</h1>
        <p style={subtitleStyle}>
          This page describes the terms under which you may use SportPlatform and how it
          interacts with Strava data. Below you can read the full terms in English and
          Portuguese.
        </p>
        <div style={langTabsStyle}>
          <span style={{ ...langPillStyle, backgroundColor: "rgba(15, 23, 42, 0.3)" }}>
            🇺🇸 English Version
          </span>
          <span style={{ ...langPillStyle, opacity: 0.9 }}>🇧🇷 Versão em Português</span>
        </div>
      </section>

      <section style={gridStyle}>
        {/* ENGLISH TERMS */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>SportPlatform – Terms of Use (English)</h2>
          <p style={updatedTextStyle}>Last Updated: November 2024</p>

          <p style={pStyle}>
            These Terms of Use (&quot;Terms&quot;) govern your access to and use of{" "}
            <strong>SportPlatform</strong> (&quot;Platform&quot;, &quot;Application&quot;,
            &quot;we&quot;, &quot;our&quot;). By using SportPlatform and connecting your
            Strava account, you agree to these Terms.
          </p>

          <h3 style={h2Style}>1. Purpose of SportPlatform</h3>
          <p style={pStyle}>
            SportPlatform is a private performance analysis tool that allows athletes to:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Connect their Strava account securely;</li>
            <li style={liStyle}>
              View their own activities, metrics, and performance history;
            </li>
            <li style={liStyle}>
              Access personal dashboards, statistics and training insights.
            </li>
          </ul>
          <p style={pStyle}>
            SportPlatform is not a medical product and does not provide medical or
            professional training advice. All information is for informational and
            educational purposes only.
          </p>

          <h3 style={h2Style}>2. Relationship with Strava</h3>
          <p style={pStyle}>
            SportPlatform uses the <strong>Strava API</strong> but is{" "}
            <strong>not owned by, not endorsed by and not officially affiliated with Strava</strong>. 
            All Strava trademarks and logos are property of Strava, Inc.
          </p>
          <p style={pStyle}>
            Your use of Strava is governed by Strava&apos;s own Terms and Privacy Policy.
            SportPlatform only accesses data after you explicitly authorize via the
            &quot;Connect with Strava&quot; flow.
          </p>

          <h3 style={h2Style}>3. User Responsibilities</h3>
          <p style={pStyle}>By using SportPlatform, you agree to:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Provide accurate information when requested by the Platform;
            </li>
            <li style={liStyle}>
              Use the Platform only for lawful and personal purposes;
            </li>
            <li style={liStyle}>
              Not attempt to reverse engineer, resell or misuse access to Strava data;
            </li>
            <li style={liStyle}>
              Respect Strava&apos;s API Agreement, Brand Guidelines and community rules.
            </li>
          </ul>

          <h3 style={h2Style}>4. Data Visibility and Privacy</h3>
          <p style={pStyle}>
            SportPlatform strictly follows Strava&apos;s API Agreement and privacy rules:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Activity data is shown only to the authenticated user who owns that data;
            </li>
            <li style={liStyle}>
              We do not display one user&apos;s data to other users;
            </li>
            <li style={liStyle}>
              We do not create public leaderboards or public rankings using Strava data.
            </li>
          </ul>
          <p style={pStyle}>
            For details on how we handle personal data, please refer to our{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>

          <h3 style={h2Style}>5. No Warranty</h3>
          <p style={pStyle}>
            SportPlatform is provided on an &quot;as is&quot; and &quot;as available&quot;
            basis. We do not guarantee:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>uninterrupted access,</li>
            <li style={liStyle}>that all data will always be up to date,</li>
            <li style={liStyle}>or that the Platform will be free from errors.</li>
          </ul>
          <p style={pStyle}>
            You use the Platform at your own risk. SportPlatform is not responsible for
            decisions made based on the information presented.
          </p>

          <h3 style={h2Style}>6. Limitation of Liability</h3>
          <p style={pStyle}>
            To the maximum extent permitted by law, SportPlatform shall not be liable for
            any indirect, incidental, special or consequential damages arising from:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>the use or inability to use the Platform;</li>
            <li style={liStyle}>errors or omissions in the data displayed;</li>
            <li style={liStyle}>
              changes in Strava&apos;s API, policies or availability impacting our services.
            </li>
          </ul>

          <h3 style={h2Style}>7. Termination</h3>
          <p style={pStyle}>
            You may stop using SportPlatform at any time and revoke access in your Strava
            account settings. We reserve the right to suspend or terminate access to
            SportPlatform in case of misuse or violation of these Terms.
          </p>

          <h3 style={h2Style}>8. Changes to These Terms</h3>
          <p style={pStyle}>
            We may update these Terms from time to time to reflect legal, technical or
            operational changes. Whenever there is a relevant update, we will adjust the
            &quot;Last Updated&quot; date at the top of this page.
          </p>

          <h3 style={h2Style}>9. Contact</h3>
          <p style={pStyle}>
            For questions about these Terms, please contact us at:{" "}
            <a href="mailto:support@sportplatform.app">support@sportplatform.app</a>
          </p>
        </article>

        {/* PORTUGUESE TERMS */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>SportPlatform – Termos de Uso (Português)</h2>
          <p style={updatedTextStyle}>Última Atualização: Novembro de 2024</p>

          <p style={pStyle}>
            Estes Termos de Uso (&quot;Termos&quot;) regem o acesso e o uso da{" "}
            <strong>SportPlatform</strong> (&quot;Plataforma&quot;, &quot;Aplicativo&quot;,
            &quot;nós&quot;). Ao utilizar a SportPlatform e conectar sua conta Strava, você
            declara estar de acordo com estes Termos.
          </p>

          <h3 style={h2Style}>1. Finalidade da SportPlatform</h3>
          <p style={pStyle}>
            A SportPlatform é uma ferramenta privada de análise de desempenho que permite ao
            atleta:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Conectar sua conta Strava de forma segura;</li>
            <li style={liStyle}>
              Visualizar suas próprias atividades, métricas e histórico de performance;
            </li>
            <li style={liStyle}>
              Acessar dashboards, estatísticas e insights de treino de forma individual.
            </li>
          </ul>
          <p style={pStyle}>
            A SportPlatform não é um produto médico e não fornece aconselhamento médico ou
            profissional de treinamento. Todas as informações têm caráter informativo e
            educacional.
          </p>

          <h3 style={h2Style}>2. Relação com o Strava</h3>
          <p style={pStyle}>
            A SportPlatform utiliza a <strong>API do Strava</strong>, mas{" "}
            <strong>
              não pertence ao Strava, não é endossada pelo Strava e não possui vínculo
              oficial com o Strava
            </strong>
            . Todas as marcas e logotipos do Strava são propriedade da Strava, Inc.
          </p>
          <p style={pStyle}>
            O uso do Strava é regido pelos próprios Termos e Política de Privacidade do
            Strava. A SportPlatform apenas acessa dados após autorização explícita do
            usuário por meio do botão &quot;Conectar com Strava&quot;.
          </p>

          <h3 style={h2Style}>3. Responsabilidades do Usuário</h3>
          <p style={pStyle}>Ao utilizar a SportPlatform, você se compromete a:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Fornecer informações corretas quando solicitado pela Plataforma;
            </li>
            <li style={liStyle}>
              Utilizar a Plataforma apenas para fins lícitos e pessoais;
            </li>
            <li style={liStyle}>
              Não tentar reverter, revender ou utilizar de forma indevida o acesso aos dados
              do Strava;
            </li>
            <li style={liStyle}>
              Respeitar o Strava API Agreement, as Brand Guidelines e as regras da
              comunidade Strava.
            </li>
          </ul>

          <h3 style={h2Style}>4. Visibilidade de Dados e Privacidade</h3>
          <p style={pStyle}>
            A SportPlatform segue rigorosamente o Strava API Agreement e as regras de
            privacidade:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Dados de atividades são exibidos apenas para o próprio usuário autenticado;
            </li>
            <li style={liStyle}>
              Não exibimos dados de um usuário para outros usuários;
            </li>
            <li style={liStyle}>
              Não criamos rankings públicos ou placares públicos baseados em dados do
              Strava.
            </li>
          </ul>
          <p style={pStyle}>
            Para mais detalhes sobre tratamento de dados, consulte nossa{" "}
            <a href="/privacy">Política de Privacidade</a>.
          </p>

          <h3 style={h2Style}>5. Ausência de Garantias</h3>
          <p style={pStyle}>
            A SportPlatform é fornecida &quot;no estado em que se encontra&quot; e &quot;conforme
            disponível&quot;. Não garantimos:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>acesso ininterrupto à Plataforma;</li>
            <li style={liStyle}>que todos os dados estarão sempre atualizados;</li>
            <li style={liStyle}>ausência total de erros ou falhas.</li>
          </ul>
          <p style={pStyle}>
            O uso da Plataforma é de responsabilidade exclusiva do usuário. A SportPlatform
            não se responsabiliza por decisões tomadas com base nas informações exibidas.
          </p>

          <h3 style={h2Style}>6. Limitação de Responsabilidade</h3>
          <p style={pStyle}>
            Na máxima extensão permitida pela legislação aplicável, a SportPlatform não se
            responsabiliza por danos indiretos, incidentais, especiais ou consequenciais
            decorrentes de:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>uso ou impossibilidade de uso da Plataforma;</li>
            <li style={liStyle}>erros ou omissões nos dados exibidos;</li>
            <li style={liStyle}>
              alterações na API do Strava, em suas políticas ou disponibilidade que impactem
              nossos serviços.
            </li>
          </ul>

          <h3 style={h2Style}>7. Encerramento de Uso</h3>
          <p style={pStyle}>
            Você pode deixar de usar a SportPlatform a qualquer momento e revogar o acesso
            à sua conta Strava nas configurações do próprio Strava. Reservamo-nos o direito
            de suspender ou encerrar o acesso à Plataforma em caso de uso indevido ou
            violação destes Termos.
          </p>

          <h3 style={h2Style}>8. Alterações destes Termos</h3>
          <p style={pStyle}>
            Podemos atualizar estes Termos periodicamente para refletir mudanças legais,
            técnicas ou operacionais. Sempre que houver uma alteração relevante, a data de
            &quot;Última Atualização&quot; no topo desta página será ajustada.
          </p>

          <h3 style={h2Style}>9. Contato</h3>
          <p style={pStyle}>
            Em caso de dúvidas sobre estes Termos, entre em contato pelo e-mail:{" "}
            <a href="mailto:support@sportplatform.app">support@sportplatform.app</a>
          </p>
        </article>
      </section>
    </div>
  );
}

