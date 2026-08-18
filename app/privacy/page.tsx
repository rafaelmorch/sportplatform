"use client";

import { useEffect, useState } from "react";
import BackArrow from "@/components/BackArrow";

type Language = "pt" | "en";

const sectionTitleStyle = {
  margin: "30px 0 10px",
  fontSize: 19,
  lineHeight: 1.3,
  color: "#0f172a",
};

const paragraphStyle = {
  margin: "0 0 14px",
  color: "#334155",
};

export default function PrivacyPage() {
  const [language, setLanguage] = useState<Language>("pt");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("lang") === "en") {
      setLanguage("en");
    }
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);

    const url = new URL(window.location.href);

    if (nextLanguage === "en") {
      url.searchParams.set("lang", "en");
    } else {
      url.searchParams.delete("lang");
    }

    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  };

  const isEnglish = language === "en";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eef1f5 0%, #e5e7eb 45%, #dfe3e8 100%)",
        padding: "max(16px, env(safe-area-inset-top)) 16px 96px",
        boxSizing: "border-box",
        fontFamily: "Montserrat, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto 16px" }}>
        <BackArrow href="/profile" />
      </div>

      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "clamp(20px, 5vw, 38px)",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 24,
          boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
          lineHeight: 1.75,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(26px, 5vw, 36px)",
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            {isEnglish ? "Privacy Policy" : "Política de Privacidade"}
          </h1>

          <div
            style={{
              display: "flex",
              padding: 3,
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              gap: 3,
            }}
          >
            <button
              type="button"
              onClick={() => changeLanguage("pt")}
              style={{
                border: 0,
                borderRadius: 7,
                padding: "7px 11px",
                cursor: "pointer",
                fontWeight: 600,
                background: !isEnglish ? "#0f172a" : "transparent",
                color: !isEnglish ? "#ffffff" : "#475569",
              }}
            >
              Português
            </button>

            <button
              type="button"
              onClick={() => changeLanguage("en")}
              style={{
                border: 0,
                borderRadius: 7,
                padding: "7px 11px",
                cursor: "pointer",
                fontWeight: 600,
                background: isEnglish ? "#0f172a" : "transparent",
                color: isEnglish ? "#ffffff" : "#475569",
              }}
            >
              English
            </button>
          </div>
        </div>

        <div
          style={{
            color: "#64748b",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          {isEnglish
            ? "Last updated: August 17, 2026"
            : "Última atualização: 17 de agosto de 2026"}
        </div>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information."
            : "A Platform Sports respeita sua privacidade e está comprometida com a proteção de seus dados pessoais. Esta política explica como coletamos, utilizamos e protegemos suas informações."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Information We Collect" : "Informações que Coletamos"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We may collect personal information such as your name, email address, profile information, membership information, payment status and activity data when you use our platform. If you use Performance AI, we may also collect training history, heart-rate information, nutrition records, body measurements, weight history, laboratory information, health notes, PAR-Q responses, initial consultation responses and messages exchanged with the Coach AI."
            : "Podemos coletar informações pessoais como nome, endereço de e-mail, informações de perfil, dados de assinatura, status de pagamento e dados de atividades quando você utiliza nossa plataforma. Se você utilizar o Performance AI, também poderemos coletar histórico de treinamentos, informações de frequência cardíaca, registros de alimentação, medidas corporais, histórico de peso, informações laboratoriais, anotações de saúde, respostas ao PAR-Q, respostas da consulta inicial e mensagens trocadas com o Coach AI."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish
            ? "How We Use Your Information"
            : "Como Utilizamos suas Informações"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We use your data to provide and improve our services, personalize your experience, manage memberships and enable features such as groups, activities, challenges and performance tracking."
            : "Utilizamos seus dados para fornecer e melhorar nossos serviços, personalizar sua experiência, gerenciar assinaturas e oferecer recursos como grupos, atividades, desafios e acompanhamento de desempenho."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Payments" : "Pagamentos"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Payments may be processed by third-party payment providers such as Stripe, Apple App Store or Google Play, depending on where you purchase your subscription. Platform Sports does not directly store your full payment card details."
            : "Os pagamentos podem ser processados por provedores terceiros, como Stripe, Apple App Store ou Google Play, dependendo de onde sua assinatura for adquirida. A Platform Sports não armazena diretamente os dados completos do seu cartão de pagamento."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Data Sharing" : "Compartilhamento de Dados"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We do not sell your personal data. We only share information when necessary to operate the platform, provide integrated services, process payments or comply with legal obligations. Service providers may process information only as necessary to provide services to Platform Sports and subject to applicable privacy, security and contractual obligations. We do not permit service providers to sell Garmin or Strava data."
            : "Não vendemos seus dados pessoais. Compartilhamos informações apenas quando necessário para operar a plataforma, fornecer serviços integrados, processar pagamentos ou cumprir obrigações legais. Prestadores de serviço poderão processar informações somente quando necessário para prestar serviços à Platform Sports e sujeitos às obrigações aplicáveis de privacidade, segurança e contrato. Não permitimos que prestadores de serviço vendam dados provenientes do Garmin ou Strava."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Data Security" : "Segurança dos Dados"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, loss or disclosure."
            : "Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados contra acesso não autorizado, alteração, perda ou divulgação."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Strava Data Access" : "Acesso aos Dados do Strava"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports may connect to your Strava account only with your permission. When you connect Strava, we may access activity data such as activity type, distance, duration, elevation, pace, start date and related workout information."
            : "A Platform Sports poderá conectar-se à sua conta Strava somente com sua autorização. Ao conectar o Strava, poderemos acessar dados de atividades como tipo de atividade, distância, duração, elevação, ritmo, data de início e outras informações relacionadas ao treino."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We use this data to display your performance, rankings, group activity summaries, challenge completion and community progress inside the app."
            : "Utilizamos esses dados para apresentar seu desempenho, rankings, resumos de atividades de grupos, conclusão de desafios e progresso nas comunidades dentro do aplicativo."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We do not sell your Strava data. We do not share your Strava activity data with third parties for advertising purposes."
            : "Não vendemos seus dados do Strava e não compartilhamos seus dados de atividade do Strava com terceiros para fins publicitários."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "You can disconnect your Strava account at any time from the app or directly through your Strava account settings. You may also request deletion of your Strava-related data by contacting us."
            : "Você poderá desconectar sua conta Strava a qualquer momento pelo aplicativo ou diretamente pelas configurações da sua conta Strava. Também poderá solicitar a exclusão de dados relacionados ao Strava entrando em contato conosco."}
        </p>

        <h2
          id="garmin-data-access"
          style={sectionTitleStyle}
        >
          {isEnglish
            ? "Garmin Data Access"
            : "Acesso aos Dados do Garmin"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports may connect to your Garmin Connect account only with your authorization. When you connect Garmin Connect, Platform Sports may receive activity and health information that you authorize Garmin to share, including activity type, distance, duration, pace, heart rate, steps, calories, sleep, stress, body composition and other fitness or wellness metrics made available through the Garmin Connect APIs."
            : "A Platform Sports poderá conectar-se à sua conta Garmin Connect somente com sua autorização. Ao conectar o Garmin Connect, a Platform Sports poderá receber informações de atividade e saúde que você autorizar a Garmin a compartilhar, incluindo tipo de atividade, distância, duração, ritmo, frequência cardíaca, passos, calorias, sono, estresse, composição corporal e outras métricas de condicionamento físico ou bem-estar disponibilizadas pelas APIs do Garmin Connect."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We use Garmin data to provide features requested by you, including activity history, performance tracking, community features, challenges, rankings and personalized Performance AI insights."
            : "Utilizamos os dados Garmin para fornecer funcionalidades solicitadas por você, incluindo histórico de atividades, acompanhamento de desempenho, recursos de comunidade, desafios, rankings e análises personalizadas do Performance AI."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports does not sell or rent Garmin user, activity or health data. Garmin data is not used for advertising. Any processing by service providers is limited to what is necessary to provide Platform Sports services and is subject to the safeguards described in this Privacy Policy."
            : "A Platform Sports não vende nem aluga dados de usuários, atividades ou saúde provenientes do Garmin. Os dados Garmin não são utilizados para publicidade. Qualquer processamento realizado por prestadores de serviço é limitado ao necessário para fornecer os serviços da Platform Sports e está sujeito às proteções descritas nesta Política de Privacidade."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "You may revoke Platform Sports' access to your Garmin data through Garmin Connect or disconnect Garmin from Platform Sports. When you revoke authorization or request deletion of your Garmin-related data, Platform Sports will delete Garmin data associated with your account, except where retention is required by applicable law."
            : "Você poderá revogar o acesso da Platform Sports aos seus dados Garmin por meio do Garmin Connect ou desconectar o Garmin da Platform Sports. Quando você revogar a autorização ou solicitar a exclusão dos seus dados relacionados ao Garmin, a Platform Sports excluirá os dados Garmin associados à sua conta, exceto quando a retenção for exigida pela legislação aplicável."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Garmin data is accessed and processed only with your authorization and for the purposes described in this Privacy Policy."
            : "Os dados Garmin são acessados e processados somente com sua autorização e para as finalidades descritas nesta Política de Privacidade."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Garmin data may be processed by service providers used by Platform Sports solely as necessary to provide the requested services. These providers may include infrastructure, database and artificial intelligence providers such as Supabase and OpenAI. Such providers process information on behalf of Platform Sports subject to applicable contractual, privacy and security obligations. Platform Sports does not permit these providers to sell Garmin data or use it for advertising."
            : "Os dados Garmin poderão ser processados por prestadores de serviço utilizados pela Platform Sports exclusivamente quando necessário para fornecer os serviços solicitados. Esses prestadores poderão incluir fornecedores de infraestrutura, banco de dados e inteligência artificial, como Supabase e OpenAI. Esses fornecedores processam informações em nome da Platform Sports e estão sujeitos às obrigações aplicáveis de contrato, privacidade e segurança. A Platform Sports não permite que esses fornecedores vendam dados Garmin ou os utilizem para publicidade."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish
            ? "Performance AI and AI Processing"
            : "Performance AI e Processamento por Inteligência Artificial"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "When you use Performance AI, relevant account, training, nutrition, body, health and conversation data may be processed to generate personalized plans, summaries, insights and responses. This may include fitness and health information obtained from connected services such as Garmin Connect and Strava when you have authorized Platform Sports to access that information. Only information reasonably necessary to provide the requested feature should be sent for AI processing."
            : "Ao utilizar o Performance AI, dados relevantes de conta, treinamentos, alimentação, corpo, saúde e conversas poderão ser processados para gerar planos, resumos, análises e respostas personalizadas. Isso poderá incluir informações de condicionamento físico e saúde obtidas de serviços conectados como Garmin Connect e Strava quando você tiver autorizado a Platform Sports a acessar essas informações. Apenas informações razoavelmente necessárias para oferecer o recurso solicitado deverão ser enviadas para processamento por inteligência artificial."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports may use artificial intelligence service providers, including OpenAI, to process prompts and generate responses. These providers process information according to their applicable terms, privacy policies and data-processing commitments."
            : "A Platform Sports poderá utilizar prestadores de serviços de inteligência artificial, incluindo a OpenAI, para processar solicitações e gerar respostas. Esses fornecedores processam as informações de acordo com seus termos aplicáveis, políticas de privacidade e compromissos de processamento de dados."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "AI-generated responses may be stored with your Performance AI records so that your plan can be displayed, updated and used in later conversations. You should not submit information about another person unless you are authorized to do so."
            : "Respostas geradas por inteligência artificial poderão ser armazenadas junto aos seus registros do Performance AI para que seu plano possa ser exibido, atualizado e utilizado em conversas posteriores. Você não deverá enviar informações sobre outra pessoa sem estar autorizado a fazê-lo."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish
            ? "Health, Fitness and PAR-Q Information"
            : "Informações de Saúde, Condicionamento Físico e PAR-Q"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Information relating to health, physical readiness, laboratory results, nutrition, body composition and exercise may be sensitive. We use this information to personalize Performance AI, evaluate data context, display your records and support safety-related workflows such as the PAR-Q and assumption-of-risk acknowledgment."
            : "Informações relacionadas à saúde, prontidão física, resultados laboratoriais, alimentação, composição corporal e exercícios poderão ser consideradas sensíveis. Utilizamos essas informações para personalizar o Performance AI, avaliar o contexto dos dados, apresentar seus registros e apoiar fluxos relacionados à segurança, como o PAR-Q e o reconhecimento de assunção de risco."}
        </p>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Performance AI is not an emergency or medical service. The collection or processing of health-related information does not create a physician-patient, dietitian-client or other licensed professional relationship."
            : "O Performance AI não é um serviço médico nem de emergência. A coleta ou o processamento de informações relacionadas à saúde não cria uma relação médico-paciente, nutricionista-cliente ou qualquer outra relação com profissional licenciado."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish
            ? "Data Retention and Deletion"
            : "Retenção e Exclusão de Dados"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We retain personal information only for as long as necessary to provide the platform, comply with legal obligations, resolve disputes and enforce our agreements. You may request deletion of your account and associated personal data. If you disconnect Garmin Connect, revoke Platform Sports' authorization or request deletion of Garmin-related data, we will delete Garmin user, activity and health data associated with your account, except where retention is required by applicable law."
            : "Mantemos informações pessoais apenas pelo tempo necessário para fornecer a plataforma, cumprir obrigações legais, resolver disputas e fazer cumprir nossos acordos. Você poderá solicitar a exclusão da sua conta e dos dados pessoais associados. Se você desconectar o Garmin Connect, revogar a autorização da Platform Sports ou solicitar a exclusão dos dados relacionados ao Garmin, excluiremos os dados de usuário, atividade e saúde provenientes do Garmin associados à sua conta, exceto quando a retenção for exigida pela legislação aplicável."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Your Rights" : "Seus Direitos"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "You may request access to, correction of or deletion of your personal data. Depending on your location, additional privacy rights may apply."
            : "Você poderá solicitar acesso, correção ou exclusão de seus dados pessoais. Dependendo da sua localização, outros direitos relacionados à privacidade poderão ser aplicáveis."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Third-Party Services" : "Serviços de Terceiros"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "Platform Sports may use services such as Garmin Connect, Strava, Stripe, Apple, Google, Supabase, OpenAI and other service providers. Their handling of information may also be governed by their own privacy policies and applicable data-processing commitments."
            : "A Platform Sports poderá utilizar serviços como Garmin Connect, Strava, Stripe, Apple, Google, Supabase, OpenAI e outros prestadores. O tratamento das informações por esses serviços também poderá ser regido por suas próprias políticas de privacidade e compromissos aplicáveis de processamento de dados."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Changes to This Policy" : "Alterações desta Política"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "We may update this Privacy Policy when the platform, integrations or legal requirements change. The updated date will be displayed at the top of this page."
            : "Poderemos atualizar esta Política de Privacidade quando a plataforma, suas integrações ou os requisitos legais forem alterados. A data da atualização será exibida no topo desta página."}
        </p>

        <h2 style={sectionTitleStyle}>
          {isEnglish ? "Contact Us" : "Entre em Contato"}
        </h2>

        <p style={paragraphStyle}>
          {isEnglish
            ? "If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us at:"
            : "Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer seus direitos relacionados à privacidade, entre em contato conosco pelo e-mail:"}
          <br />
          support@platformsports.app
        </p>
      </article>
    </main>
  );
}
