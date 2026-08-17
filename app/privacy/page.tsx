"use client";

import BackArrow from "@/components/BackArrow";

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
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(26px, 5vw, 36px)",
            lineHeight: 1.15,
            color: "#0f172a",
          }}
        >
          Privacy Policy
        </h1>

        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
          Política de Privacidade · Last updated / Última atualização: August 17, 2026
        </div>

        <p style={paragraphStyle}>
          Platform Sports respects your privacy and is committed to protecting
          your personal data. This policy explains how we collect, use, and
          safeguard your information.
        </p>

        <h2 style={sectionTitleStyle}>Information We Collect</h2>
        <p style={paragraphStyle}>
          We may collect personal information such as your name, email address,
          profile information, membership information, payment status and
          activity data when you use our platform. If you use Performance AI,
          we may also collect training history, heart-rate information,
          nutrition records, body measurements, weight history, laboratory
          information, health notes, PAR-Q responses, initial consultation
          responses and messages exchanged with the Coach AI.
        </p>

        <h2 style={sectionTitleStyle}>How We Use Your Information</h2>
        <p style={paragraphStyle}>
          We use your data to provide and improve our services, personalize
          your experience, manage memberships and enable features such as
          groups, activities, challenges and performance tracking.
        </p>

        <h2 style={sectionTitleStyle}>Payments</h2>
        <p style={paragraphStyle}>
          Payments may be processed by third-party payment providers such as
          Stripe, Apple App Store or Google Play, depending on where you
          purchase your subscription. Platform Sports does not directly store
          your full payment card details.
        </p>

        <h2 style={sectionTitleStyle}>Data Sharing</h2>
        <p style={paragraphStyle}>
          We do not sell your personal data. We only share information when
          necessary to operate the platform, provide integrated services,
          process payments or comply with legal obligations. Service providers
          may process information only as necessary to provide services to
          Platform Sports and subject to applicable privacy, security and
          contractual obligations. We do not permit service providers to sell
          Garmin or Strava data.
        </p>

        <h2 style={sectionTitleStyle}>Data Security</h2>
        <p style={paragraphStyle}>
          We implement appropriate technical and organizational measures to
          protect your data against unauthorized access, alteration, loss or
          disclosure.
        </p>

        <h2 style={sectionTitleStyle}>Strava Data Access</h2>

        <p style={paragraphStyle}>
          Platform Sports may connect to your Strava account only with your
          permission. When you connect Strava, we may access activity data such
          as activity type, distance, duration, elevation, pace, start date and
          related workout information.
        </p>

        <p style={paragraphStyle}>
          We use this data to display your performance, rankings, group
          activity summaries, challenge completion and community progress
          inside the app.
        </p>

        <p style={paragraphStyle}>
          We do not sell your Strava data. We do not share your Strava activity
          data with third parties for advertising purposes.
        </p>

        <p style={paragraphStyle}>
          You can disconnect your Strava account at any time from the app or
          directly through your Strava account settings. You may also request
          deletion of your Strava-related data by contacting us.
        </p>

        <h2 style={sectionTitleStyle}>Garmin Data Access</h2>

        <p style={paragraphStyle}>
          Platform Sports may connect to your Garmin Connect account only with
          your authorization. When you connect Garmin Connect, Platform Sports
          may receive activity and health information that you authorize
          Garmin to share, including activity type, distance, duration, pace,
          heart rate, steps, calories, sleep, stress, body composition and
          other fitness or wellness metrics made available through the Garmin
          Connect APIs.
        </p>

        <p style={paragraphStyle}>
          We use Garmin data to provide features requested by you, including
          activity history, performance tracking, community features,
          challenges, rankings and personalized Performance AI insights.
        </p>

        <p style={paragraphStyle}>
          Platform Sports does not sell or rent Garmin user, activity or
          health data. Garmin data is not used for advertising. Any processing
          by service providers is limited to what is necessary to provide
          Platform Sports services and is subject to the safeguards described
          in this Privacy Policy.
        </p>

        <p style={paragraphStyle}>
          You may revoke Platform Sports' access to your Garmin data through
          Garmin Connect or disconnect Garmin from Platform Sports. When you
          revoke authorization or request deletion of your Garmin-related
          data, Platform Sports will delete Garmin data associated with your
          account, except where retention is required by applicable law.
        </p>

        <p style={paragraphStyle}>
          Garmin data is accessed and processed only with your authorization
          and for the purposes described in this Privacy Policy.
        </p>

        <h2 style={sectionTitleStyle}>
          Performance AI and AI Processing
        </h2>

        <p style={paragraphStyle}>
          When you use Performance AI, relevant account, training, nutrition,
          body, health and conversation data may be processed to generate
          personalized plans, summaries, insights and responses. This may
          include fitness and health information obtained from connected
          services such as Garmin Connect and Strava when you have authorized
          Platform Sports to access that information. Only
          information reasonably necessary to provide the requested feature
          should be sent for AI processing.
        </p>

        <p style={paragraphStyle}>
          Platform Sports may use artificial intelligence service providers,
          including OpenAI, to process prompts and generate responses. These
          providers process information according to their applicable terms,
          privacy policies and data-processing commitments.
        </p>

        <p style={paragraphStyle}>
          AI-generated responses may be stored with your Performance AI records
          so that your plan can be displayed, updated and used in later
          conversations. You should not submit information about another person
          unless you are authorized to do so.
        </p>

        <h2 style={sectionTitleStyle}>
          Health, Fitness and PAR-Q Information
        </h2>

        <p style={paragraphStyle}>
          Information relating to health, physical readiness, laboratory
          results, nutrition, body composition and exercise may be sensitive.
          We use this information to personalize Performance AI, evaluate data
          context, display your records and support safety-related workflows
          such as the PAR-Q and assumption-of-risk acknowledgment.
        </p>

        <p style={paragraphStyle}>
          Performance AI is not an emergency or medical service. The collection
          or processing of health-related information does not create a
          physician-patient, dietitian-client or other licensed professional
          relationship.
        </p>

        <h2 style={sectionTitleStyle}>
          Performance AI / Coach IA — Português
        </h2>

        <p style={paragraphStyle}>
          Ao utilizar o Performance AI, dados relevantes da conta, perfil,
          treinamentos, alimentação, corpo, saúde, PAR-Q e conversas poderão ser
          processados para gerar planos, análises, resumos e respostas
          personalizadas. Isso poderá incluir dados de atividade física e saúde
          obtidos de serviços conectados como Garmin Connect e Strava quando
          você tiver autorizado a Platform Sports a acessar essas informações.
        </p>

        <p style={paragraphStyle}>
          A Platform Sports poderá utilizar fornecedores de inteligência
          artificial, incluindo a OpenAI, para processar solicitações e gerar
          respostas. Esses fornecedores tratam os dados de acordo com seus
          próprios termos, políticas de privacidade e compromissos de
          processamento de dados.
        </p>

        <p style={paragraphStyle}>
          Informações de saúde, exames, composição corporal, alimentação e
          prontidão física podem ser sensíveis. Elas são utilizadas para
          personalizar o serviço, apresentar o histórico do usuário e apoiar
          fluxos de segurança, incluindo o PAR-Q e o termo de responsabilidade.
          O Performance AI não é um serviço médico nem de emergência.
        </p>

        <h2 style={sectionTitleStyle}>Data Retention and Deletion</h2>
        <p style={paragraphStyle}>
          We retain personal information only for as long as necessary to
          provide the platform, comply with legal obligations, resolve disputes
          and enforce our agreements. You may request deletion of your account
          and associated personal data. If you disconnect Garmin Connect,
          revoke Platform Sports' authorization or request deletion of
          Garmin-related data, we will delete Garmin user, activity and health
          data associated with your account, except where retention is required
          by applicable law.
        </p>

        <h2 style={sectionTitleStyle}>Your Rights</h2>
        <p style={paragraphStyle}>
          You may request access to, correction of or deletion of your personal
          data. Depending on your location, additional privacy rights may
          apply.
        </p>

        <h2 style={sectionTitleStyle}>Third-Party Services</h2>
        <p style={paragraphStyle}>
          Platform Sports may use services such as Garmin Connect, Strava,
          Stripe, Apple, Google, Supabase, OpenAI and other service providers.
          Their handling of information may also be governed by their own
          privacy policies and applicable data-processing commitments.
        </p>

        <h2 style={sectionTitleStyle}>Changes to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy when the platform, integrations or
          legal requirements change. The updated date will be displayed at the
          top of this page.
        </p>

        <h2 style={sectionTitleStyle}>Contact Us</h2>
        <p style={paragraphStyle}>
          If you have questions about this Privacy Policy or wish to exercise
          your privacy rights, contact us at:
          <br />
          support@platformsports.app
        </p>
      </article>
    </main>
  );
}




