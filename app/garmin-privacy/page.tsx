// app/garmin-privacy/page.tsx
import type { CSSProperties } from "react";

const containerStyle: CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 20px 80px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#0f172a",
};

const heroStyle: CSSProperties = {
  background: "linear-gradient(135deg, #15803d, #0f766e)",
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

export default function GarminPrivacyPage() {
  return (
    <div style={containerStyle}>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>SportPlatform</span>
          <span style={badgeStyle}>Garmin Data · Dados Garmin</span>
        </div>
        <h1 style={titleStyle}>Garmin Data Privacy & Processing</h1>
        <p style={subtitleStyle}>
          This page describes specifically how SportPlatform handles data obtained from
          Garmin devices and Garmin Connect. Below you can read the full statement in
          English and Portuguese.
        </p>
        <div style={langTabsStyle}>
          <span style={{ ...langPillStyle, backgroundColor: "rgba(15, 23, 42, 0.3)" }}>
            🇺🇸 English Version
          </span>
          <span style={{ ...langPillStyle, opacity: 0.9 }}>🇧🇷 Versão em Português</span>
        </div>
      </section>

      <section style={gridStyle}>
        {/* ENGLISH CARD */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            SportPlatform – Garmin Data Privacy & Processing (English)
          </h2>
          <p style={updatedTextStyle}>Last Updated: November 2024</p>

          <p style={pStyle}>
            This document explains how <strong>SportPlatform</strong> (“Platform”,
            “Application”, “we”, “our”) collects, uses, stores, and protects data obtained
            from <strong>Garmin devices and Garmin Connect</strong> via the Garmin
            Connect Developer Program / Garmin Health APIs.
          </p>
          <p style={pStyle}>
            This statement is <strong>specific to Garmin data</strong> and complements our
            general Privacy Policy available at{" "}
            <a href="/privacy">https://sportplatform.app/privacy</a>.
          </p>

          <h3 style={h2Style}>1. Type of Garmin Data Collected</h3>
          <p style={pStyle}>
            SportPlatform only requests and processes <strong>activity-level data</strong>
            from Garmin, such as:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Running and cycling activities</li>
            <li style={liStyle}>Distance, duration, moving time</li>
            <li style={liStyle}>Pace and speed metrics</li>
            <li style={liStyle}>Elevation gain / loss</li>
            <li style={liStyle}>GPS track (route polyline / coordinates)</li>
            <li style={liStyle}>Activity type, date and basic summaries</li>
          </ul>
          <p style={pStyle}>
            <strong>SportPlatform does NOT request or process:</strong>
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Sleep data</li>
            <li style={liStyle}>Stress data</li>
            <li style={liStyle}>Body Battery data</li>
            <li style={liStyle}>Wellness or medical metrics</li>
            <li style={liStyle}>Any other biometric or sensitive health data</li>
          </ul>

          <h3 style={h2Style}>2. Purpose of Using Garmin Data</h3>
          <p style={pStyle}>
            Garmin activity data is used exclusively to:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Generate personal dashboards for each user</li>
            <li style={liStyle}>Provide individual training and performance analytics</li>
            <li style={liStyle}>Display historical activity records and trends</li>
            <li style={liStyle}>Help users track their own running and cycling progress</li>
          </ul>
          <p style={pStyle}>
            Data is used only for <strong>personal performance analysis</strong> and is
            never sold or shared with third parties.
          </p>

          <h3 style={h2Style}>3. Data Visibility & Sharing</h3>
          <p style={pStyle}>
            SportPlatform strictly limits the visibility of Garmin data:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Garmin activity data is visible only to the authenticated user who owns that
              data.
            </li>
            <li style={liStyle}>
              We do <strong>not</strong> display one user&apos;s Garmin data to any other
              user.
            </li>
            <li style={liStyle}>
              We do <strong>not</strong> create public leaderboards or public rankings
              based on Garmin data.
            </li>
            <li style={liStyle}>
              We do <strong>not</strong> share Garmin data with external platforms or
              services.
            </li>
          </ul>

          <h3 style={h2Style}>4. Data Storage & Security</h3>
          <p style={pStyle}>
            Garmin data is stored securely in our Supabase database (PostgreSQL) using:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Encrypted storage where applicable and secure credential management
            </li>
            <li style={liStyle}>Row-Level Security (RLS) and access control policies</li>
            <li style={liStyle}>Restricted internal access to production data</li>
          </ul>
          <p style={pStyle}>
            Access tokens and refresh tokens obtained from Garmin are stored only to
            synchronize the user&apos;s own data and are never shared with third parties.
          </p>

          <h3 style={h2Style}>5. Historical Data Retention</h3>
          <p style={pStyle}>
            SportPlatform may store historical Garmin activity data in order to generate
            long-term performance trends, training history charts, and cumulative
            statistics for each user.
          </p>
          <p style={pStyle}>
            This data is retained only as long as it is needed to provide the services and
            may be deleted upon user request.
          </p>

          <h3 style={h2Style}>6. Data Deletion & Revocation</h3>
          <p style={pStyle}>
            Users may revoke SportPlatform&apos;s access to their Garmin data at any time
            through their Garmin account settings.
          </p>
          <p style={pStyle}>
            Users may also request deletion of all Garmin-related data stored by
            SportPlatform by emailing:
          </p>
          <p style={pStyle}>
            👉{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
          <p style={pStyle}>
            Upon a valid deletion request, Garmin-derived data will be removed from our
            systems within a reasonable timeframe.
          </p>

          <h3 style={h2Style}>7. Compliance with Garmin Policies</h3>
          <p style={pStyle}>
            SportPlatform is designed to comply with the Garmin Connect Developer Program
            requirements and Garmin&apos;s data privacy standards:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Garmin data is used only for the user&apos;s own analysis and experience.
            </li>
            <li style={liStyle}>
              No biometric, wellness, sleep, or medical data is requested or stored.
            </li>
            <li style={liStyle}>
              No redistribution, resale, or unauthorized sharing of Garmin data occurs.
            </li>
          </ul>

          <h3 style={h2Style}>8. Contact</h3>
          <p style={pStyle}>
            For any questions about how we process Garmin data, please contact:
          </p>
          <p style={pStyle}>
            👉{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
        </article>

        {/* PORTUGUESE CARD */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            SportPlatform – Privacidade e Tratamento de Dados Garmin (Português)
          </h2>
          <p style={updatedTextStyle}>Última Atualização: Novembro de 2024</p>

          <p style={pStyle}>
            Este documento explica como a <strong>SportPlatform</strong> (“Plataforma”,
            “Aplicativo”, “nós”) coleta, utiliza, armazena e protege dados provenientes de{" "}
            <strong>dispositivos Garmin e Garmin Connect</strong> por meio do Garmin
            Connect Developer Program / Garmin Health APIs.
          </p>
          <p style={pStyle}>
            Esta declaração é <strong>específica para dados Garmin</strong> e complementa
            a nossa Política de Privacidade geral disponível em{" "}
            <a href="/privacy">https://sportplatform.app/privacy</a>.
          </p>

          <h3 style={h2Style}>1. Tipo de Dados Garmin Coletados</h3>
          <p style={pStyle}>
            A SportPlatform solicita e processa apenas{" "}
            <strong>dados de nível de atividade</strong> vindos da Garmin, tais como:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Atividades de corrida e ciclismo</li>
            <li style={liStyle}>Distância, duração e tempo em movimento</li>
            <li style={liStyle}>Ritmo (pace) e velocidade</li>
            <li style={liStyle}>Ganho/perda de elevação</li>
            <li style={liStyle}>Trilhas GPS (rotas / polilinhas)</li>
            <li style={liStyle}>Tipo de atividade, data e resumos básicos</li>
          </ul>
          <p style={pStyle}>
            <strong>A SportPlatform NÃO solicita nem processa:</strong>
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Dados de sono</li>
            <li style={liStyle}>Dados de estresse</li>
            <li style={liStyle}>Body Battery</li>
            <li style={liStyle}>Métricas de bem-estar ou médicas</li>
            <li style={liStyle}>Qualquer dado biométrico sensível</li>
          </ul>

          <h3 style={h2Style}>2. Finalidade do Uso dos Dados Garmin</h3>
          <p style={pStyle}>
            Os dados de atividades da Garmin são utilizados exclusivamente para:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Gerar painéis pessoais para cada usuário</li>
            <li style={liStyle}>Fornecer análises individuais de treino e desempenho</li>
            <li style={liStyle}>
              Exibir histórico de atividades e tendências ao longo do tempo
            </li>
            <li style={liStyle}>
              Ajudar o usuário a acompanhar sua própria evolução em corrida e ciclismo
            </li>
          </ul>
          <p style={pStyle}>
            Os dados são usados apenas para{" "}
            <strong>análise de performance pessoal</strong> e não são vendidos nem
            compartilhados com terceiros.
          </p>

          <h3 style={h2Style}>3. Visibilidade e Compartilhamento de Dados</h3>
          <p style={pStyle}>
            A SportPlatform limita rigorosamente a visibilidade dos dados Garmin:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Os dados de atividades Garmin são visíveis apenas para o próprio usuário
              autenticado.
            </li>
            <li style={liStyle}>
              <strong>Não</strong> exibimos dados Garmin de um usuário para outros
              usuários.
            </li>
            <li style={liStyle}>
              <strong>Não</strong> criamos rankings públicos ou placares públicos com
              base em dados Garmin.
            </li>
            <li style={liStyle}>
              <strong>Não</strong> compartilhamos dados Garmin com plataformas ou serviços
              externos.
            </li>
          </ul>

          <h3 style={h2Style}>4. Armazenamento e Segurança dos Dados</h3>
          <p style={pStyle}>
            Os dados Garmin são armazenados com segurança em nosso banco Supabase
            (PostgreSQL), utilizando:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Armazenamento protegido e gestão segura de credenciais e tokens
            </li>
            <li style={liStyle}>
              Row-Level Security (RLS) e políticas de controle de acesso
            </li>
            <li style={liStyle}>
              Acesso interno restrito aos dados de produção, apenas quando necessário
            </li>
          </ul>
          <p style={pStyle}>
            Tokens de acesso e atualização obtidos da Garmin são usados somente para
            sincronizar os dados do próprio usuário e nunca são compartilhados com
            terceiros.
          </p>

          <h3 style={h2Style}>5. Retenção de Dados Históricos</h3>
          <p style={pStyle}>
            A SportPlatform pode armazenar o histórico de atividades Garmin para gerar
            gráficos de evolução, relatórios de treino e estatísticas de longo prazo para
            cada usuário.
          </p>
          <p style={pStyle}>
            Esses dados são mantidos apenas enquanto forem necessários para a prestação do
            serviço e podem ser excluídos mediante solicitação do usuário.
          </p>

          <h3 style={h2Style}>6. Exclusão e Revogação de Acesso</h3>
          <p style={pStyle}>
            O usuário pode revogar o acesso da SportPlatform aos seus dados Garmin a
            qualquer momento nas configurações da própria conta Garmin.
          </p>
          <p style={pStyle}>
            O usuário também pode solicitar a exclusão de todos os dados relacionados à
            Garmin armazenados pela SportPlatform, enviando um e-mail para:
          </p>
          <p style={pStyle}>
            👉{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
          <p style={pStyle}>
            Após uma solicitação válida de exclusão, os dados provenientes da Garmin serão
            removidos dos nossos sistemas em prazo razoável.
          </p>

          <h3 style={h2Style}>7. Conformidade com as Políticas da Garmin</h3>
          <p style={pStyle}>
            A SportPlatform foi projetada para estar em conformidade com os requisitos do
            Garmin Connect Developer Program e com os padrões de privacidade de dados da
            Garmin:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              Os dados Garmin são usados apenas para a experiência individual do usuário.
            </li>
            <li style={liStyle}>
              Não solicitamos dados biométricos, de bem-estar, sono ou métricas médicas.
            </li>
            <li style={liStyle}>
              Não há redistribuição, revenda ou compartilhamento não autorizado de dados
              Garmin.
            </li>
          </ul>

          <h3 style={h2Style}>8. Contato</h3>
          <p style={pStyle}>
            Para dúvidas sobre como processamos dados da Garmin, entre em contato:
          </p>
          <p style={pStyle}>
            👉{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
        </article>
      </section>
    </div>
  );
}
