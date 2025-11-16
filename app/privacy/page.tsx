// app/privacy/page.tsx

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "20px" }}>
        Política de Privacidade – SportPlatform
      </h1>

      <p>
        A SportPlatform valoriza a privacidade e segurança dos dados de todos os usuários. 
        Esta Política de Privacidade explica como coletamos, armazenamos e utilizamos 
        informações provenientes da integração com o Strava, bem como outras interações dentro 
        da nossa plataforma.
      </p>

      <h2 style={{ marginTop: "30px" }}>1. Informações que Coletamos</h2>

      <p>Ao conectar sua conta Strava ao SportPlatform, podemos coletar:</p>

      <ul>
        <li>Dados do atleta: ID do atleta, nome, imagem de perfil</li>
        <li>
          Tokens de acesso necessários para comunicação entre Strava e SportPlatform 
          (access_token e refresh_token)
        </li>
        <li>
          Atividades esportivas públicas e privadas autorizadas: distância, tempo, ritmo, 
          velocidade, altimetria, mapa, data, tipo de atividade, calorias, entre outros
        </li>
      </ul>

      <p>
        Todos os dados são coletados exclusivamente após consentimento explícito do usuário 
        ao utilizar o botão “Conectar com Strava”.
      </p>

      <h2 style={{ marginTop: "30px" }}>2. Como Utilizamos os Dados</h2>

      <p>Os dados importados via API do Strava são utilizados exclusivamente para:</p>

      <ul>
        <li>Exibir ao próprio usuário um painel detalhado com suas atividades esportivas</li>
        <li>Gerar estatísticas de performance para uso pessoal</li>
        <li>Calcular métricas avançadas de evolução e condicionamento físico</li>
        <li>
          Oferecer insights de treinamento dentro da SportPlatform, sempre visíveis apenas 
          para o próprio usuário
        </li>
      </ul>

      <p>
        De acordo com os novos termos da API Strava (Nov/2024), <b>
        nenhum dado de um usuário será exibido para outros usuários da plataforma</b>.
      </p>

      <h2 style={{ marginTop: "30px" }}>3. Armazenamento e Segurança</h2>

      <p>
        Os dados são armazenados com segurança no Supabase (PostgreSQL com criptografia), 
        utilizando regras de segurança (RLS) e chaves protegidas. 
      </p>

      <ul>
        <li>Tokens são armazenados de forma segura</li>
        <li>Dados são protegidos por políticas de acesso restrito</li>
        <li>
          Nenhuma informação sensível é compartilhada com terceiros
        </li>
      </ul>

      <h2 style={{ marginTop: "30px" }}>4. Compartilhamento de Dados</h2>

      <p>
        A SportPlatform <b>não compartilha, vende ou distribui dados a terceiros</b>. 
        Os dados do atleta só são usados para fins internos da própria plataforma.
      </p>

      <h2 style={{ marginTop: "30px" }}>5. Exclusão e Revogação de Acesso</h2>

      <p>O usuário pode, a qualquer momento:</p>

      <ul>
        <li>Revogar o acesso da SportPlatform diretamente no Strava</li>
        <li>Solicitar a exclusão completa de todos os dados armazenados</li>
      </ul>

      <p>
        Para solicitar exclusão de dados, basta enviar um e-mail para:{" "}
        <a href="mailto:suporte@sportplatform.app">suporte@sportplatform.app</a>
      </p>

      <h2 style={{ marginTop: "30px" }}>6. Contato</h2>

      <p>
        Para dúvidas relacionadas à privacidade, entre em contato pelo e-mail:{" "}
        <a href="mailto:privacy@sportplatform.app">privacy@sportplatform.app</a>
      </p>

      <br />
      <p>
        Última atualização: <b>Novembro de 2024</b>
      </p>
    </div>
  );
}
