// app/privacy/page.tsx

const containerStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 20px 80px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#0f172a",
};

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0f766e, #0369a1)",
  borderRadius: "18px",
  padding: "28px 24px",
  color: "#f9fafb",
  marginBottom: "32px",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.35)",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
  alignItems: "center",
};

const badgeStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "0.75rem",
  border: "1px solid rgba(148, 163, 184, 0.6)",
  backgroundColor: "rgba(15, 23, 42, 0.35)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: 700,
  marginBottom: "6px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  maxWidth: "640px",
  lineHeight: 1.5,
  opacity: 0.92,
};

const langTabsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
};

const langPillStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "0.8rem",
  border: "1px solid rgba(148, 163, 184, 0.75)",
  backgroundColor: "rgba(15, 23, 42, 0.18)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "20px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "22px 20px 26px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  marginBottom: "10px",
};

const updatedTextStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
  marginBottom: "16px",
};

const h2Style: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginTop: "20px",
  marginBottom: "6px",
};

const pStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: "8px",
};

const ulStyle: React.CSSProperties = {
  paddingLeft: "20px",
  marginTop: "4px",
  marginBottom: "8px",
};

const liStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  lineHeight: 1.5,
  marginBottom: "4px",
};

export default function PrivacyPage() {
  return (
    <div style={containerStyle}>
      {/* HERO */}
      <section style={heroStyle}>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>SportPlatform</span>
          <span style={badgeStyle}>Privacy Policy · Política de Privacidade</span>
        </div>
        <h1 style={titleStyle}>Privacy & Data Protection</h1>
        <p style={subtitleStyle}>
          This page explains how SportPlatform collects, uses and protects data from our
          integration with the Strava API. Below you can read the full policy in English
          and Portuguese.
        </p>
        <div style={langTabsStyle}>
          <span style={{ ...langPillStyle, backgroundColor: "rgba(15, 23, 42, 0.3)" }}>
            🇺🇸 English Version
          </span>
          <span style={{ ...langPillStyle, opacity: 0.9 }}>🇧🇷 Versão em Português</span>
        </div>
      </section>

      {/* GRID EN + PT */}
      <section style={gridStyle}>
        {/* ENGLISH CARD */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>SportPlatform – Privacy Policy (English)</h2>
          <p style={updatedTextStyle}>Last Updated: November 2024</p>

          <p style={pStyle}>
            Welcome to <strong>SportPlatform</strong> (“Platform”, “Application”, “we”, “our”).
            This Privacy Policy explains how we collect, use, store, and protect personal
            information obtained through our integration with the <strong>Strava API</strong>,
            as well as any information provided directly by the user.
          </p>
          <p style={pStyle}>
            By connecting your Strava account and using SportPlatform, you agree to the practices
            described below.
          </p>

          <h3 style={h2Style}>1. Information We Collect</h3>

          <h4 style={h2Style}>1.1 Information you provide</h4>
          <p style={pStyle}>We may collect:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Name</li>
            <li style={liStyle}>Email (if manually provided)</li>
            <li style={liStyle}>Basic authentication information used within SportPlatform</li>
          </ul>

          <h4 style={h2Style}>1.2 Information obtained through the Strava API</h4>
          <p style={pStyle}>
            When you authorize the “Connect with Strava” flow, we may collect:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Athlete ID</li>
            <li style={liStyle}>First and last name</li>
            <li style={liStyle}>Profile picture</li>
            <li style={liStyle}>
              Public and private activity details you have authorized, including distance, time,
              pace, speed, elevation, map polylines, activity type, date, calories and other
              metrics provided by Strava
            </li>
            <li style={liStyle}>Access token and refresh token (access_token, refresh_token)</li>
            <li style={liStyle}>Aggregated statistics returned by Strava</li>
          </ul>

          <p style={pStyle}>
            <strong>We do NOT collect or display data from other athletes.</strong> Each user can
            only see their own Strava data.
          </p>

          <h3 style={h2Style}>2. How We Use Your Data</h3>
          <p style={pStyle}>Data imported through Strava is used solely to:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Display a personal dashboard to the authenticated user</li>
            <li style={liStyle}>Generate individual training analytics and performance reports</li>
            <li style={liStyle}>Provide personal insights and metrics over time</li>
            <li style={liStyle}>Process new activities and keep your data up to date</li>
            <li style={liStyle}>Improve the overall user experience within SportPlatform</li>
          </ul>
          <p style={pStyle}>
            We <strong>do not</strong> share data with third parties, sell any information, display
            your activity data to other users, or make your data public.
          </p>

          <h3 style={h2Style}>3. Data Storage and Security</h3>
          <p style={pStyle}>
            All data is stored securely in our Supabase database (PostgreSQL with modern security
            features) using:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Encrypted storage where applicable</li>
            <li style={liStyle}>Row-Level Security (RLS) and access control</li>
            <li style={liStyle}>Secure management of API keys and tokens</li>
          </ul>
          <p style={pStyle}>
            Tokens are stored only to refresh your activity data and are never shared externally.
          </p>

          <h3 style={h2Style}>4. Data Sharing</h3>
          <p style={pStyle}>
            SportPlatform <strong>does not share, sell, or transfer</strong> user data to any
            third parties. Data is used exclusively to provide personal insights and analytics to
            the authenticated user.
          </p>

          <h3 style={h2Style}>5. Data Deletion and Revocation</h3>
          <p style={pStyle}>You may, at any time:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Revoke SportPlatform access from your Strava account</li>
            <li style={liStyle}>Request full deletion of your data from our systems</li>
          </ul>
          <p style={pStyle}>
            To request deletion, please email us at:{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>. All data
            will be removed within a reasonable timeframe.
          </p>

          <h3 style={h2Style}>6. Compliance with Strava API Terms</h3>
          <p style={pStyle}>
            SportPlatform fully complies with the{" "}
            <strong>Strava API Agreement (updated November 2024)</strong> and{" "}
            <strong>Strava Brand Guidelines</strong>.
          </p>
          <p style={pStyle}>
            As required by these terms, we only display activity data to the authenticated user,
            we never expose one user’s data to another, and we do not build public leaderboards
            or any public data-sharing features based on Strava data.
          </p>

          <h3 style={h2Style}>7. Contact</h3>
          <p style={pStyle}>
            For privacy-related questions, please contact us at:{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
        </article>

        {/* PORTUGUESE CARD */}
        <article style={cardStyle}>
          <h2 style={sectionTitleStyle}>SportPlatform – Política de Privacidade (Português)</h2>
          <p style={updatedTextStyle}>Última Atualização: Novembro de 2024</p>

          <p style={pStyle}>
            Bem-vindo à <strong>SportPlatform</strong> (“Plataforma”, “Aplicativo”, “nós”). 
            Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e 
            protegemos as informações obtidas por meio da integração com a{" "}
            <strong>API do Strava</strong>, bem como dados fornecidos diretamente pelo usuário.
          </p>
          <p style={pStyle}>
            Ao conectar sua conta Strava e utilizar a SportPlatform, você concorda com as práticas
            descritas abaixo.
          </p>

          <h3 style={h2Style}>1. Informações que Coletamos</h3>

          <h4 style={h2Style}>1.1 Informações fornecidas pelo usuário</h4>
          <p style={pStyle}>Podemos coletar:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Nome</li>
            <li style={liStyle}>E-mail (se fornecido voluntariamente)</li>
            <li style={liStyle}>Dados básicos de autenticação no SportPlatform</li>
          </ul>

          <h4 style={h2Style}>1.2 Informações obtidas por meio da API do Strava</h4>
          <p style={pStyle}>
            Ao autorizar o fluxo “Conectar com Strava”, podemos coletar:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>ID do atleta</li>
            <li style={liStyle}>Nome e foto de perfil</li>
            <li style={liStyle}>
              Detalhes de atividades esportivas autorizadas, incluindo distância, tempo, ritmo,
              velocidade, elevação, polilinhas de mapa, tipo de atividade, data, calorias e outras
              métricas fornecidas pelo Strava
            </li>
            <li style={liStyle}>Tokens de acesso e atualização (access_token e refresh_token)</li>
            <li style={liStyle}>Estatísticas agregadas retornadas pelo Strava</li>
          </ul>

          <p style={pStyle}>
            <strong>
              Não coletamos nem exibimos dados de outros atletas. Cada usuário visualiza apenas
              os próprios dados provenientes do Strava.
            </strong>
          </p>

          <h3 style={h2Style}>2. Como Utilizamos os Dados</h3>
          <p style={pStyle}>Utilizamos os dados exclusivamente para:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Exibir ao usuário um painel pessoal de atividades</li>
            <li style={liStyle}>Gerar estatísticas individuais de treino e desempenho</li>
            <li style={liStyle}>Fornecer análises e insights de evolução esportiva</li>
            <li style={liStyle}>Processar novas atividades e manter os dados atualizados</li>
            <li style={liStyle}>Melhorar a experiência de uso dentro da plataforma</li>
          </ul>
          <p style={pStyle}>
            Não compartilhamos dados com terceiros, não vendemos informações, não exibimos os seus
            dados para outros usuários e não tornamos seus dados públicos.
          </p>

          <h3 style={h2Style}>3. Armazenamento e Segurança</h3>
          <p style={pStyle}>
            Os dados são armazenados com segurança em nosso banco Supabase (PostgreSQL), utilizando:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Criptografia, sempre que aplicável</li>
            <li style={liStyle}>Row-Level Security (RLS) e controle de acesso</li>
            <li style={liStyle}>Gestão segura de chaves e tokens de API</li>
          </ul>
          <p style={pStyle}>
            Tokens são utilizados apenas para atualizar as atividades e nunca são compartilhados
            com terceiros.
          </p>

          <h3 style={h2Style}>4. Compartilhamento de Dados</h3>
          <p style={pStyle}>
            A SportPlatform <strong>não compartilha, vende ou transfere</strong> dados de usuários
            a terceiros. Os dados são usados unicamente para análises pessoais e recursos internos
            da própria plataforma.
          </p>

          <h3 style={h2Style}>5. Exclusão e Revogação</h3>
          <p style={pStyle}>Você pode, a qualquer momento:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Revogar o acesso da SportPlatform na sua conta Strava</li>
            <li style={liStyle}>Solicitar a exclusão completa dos seus dados dos nossos sistemas</li>
          </ul>
          <p style={pStyle}>
            Para solicitar exclusão, entre em contato pelo e-mail:{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>. Todos os
            dados serão removidos em prazo razoável.
          </p>

          <h3 style={h2Style}>6. Conformidade com o Strava API Agreement</h3>
          <p style={pStyle}>
            A SportPlatform está em total conformidade com o{" "}
            <strong>Strava API Agreement (atualizado em novembro de 2024)</strong> e com as{" "}
            <strong>Strava Brand Guidelines</strong>.
          </p>
          <p style={pStyle}>
            Em linha com esses termos, exibimos dados de atividades somente ao próprio usuário
            autenticado, não expomos dados de um usuário para outro e não criamos rankings
            públicos baseados em dados do Strava.
          </p>

          <h3 style={h2Style}>7. Contato</h3>
          <p style={pStyle}>
            Para dúvidas relacionadas à privacidade, entre em contato pelo e-mail:{" "}
            <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
          </p>
        </article>
      </section>
    </div>
  );
}
