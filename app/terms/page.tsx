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

export default function TermsPage() {
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
          Terms & Conditions
        </h1>

        <div style={{ color: "#64748b", fontSize: 13 }}>
          Termos e Condições · Last updated / Última atualização: August 1, 2026
        </div>

        <h2 style={sectionTitleStyle}>English</h2>

        <h3 style={sectionTitleStyle}>1. Acceptance</h3>
        <p style={paragraphStyle}>
          By creating an account, joining a community, starting a free trial or
          using Platform Sports, you confirm that you have read and accepted
          these Terms & Conditions and our Privacy Policy.
        </p>

        <h3 style={sectionTitleStyle}>2. Membership and free trial</h3>
        <p style={paragraphStyle}>
          Eligible memberships include a 30-day free trial. Your payment method
          is collected securely by Stripe when you start the trial, but you
          will not be charged during the 30-day trial period. Unless you cancel
          before the trial ends, your membership will automatically convert
          into a paid monthly subscription at the price displayed before
          checkout. The first payment will be charged immediately after the
          trial period ends.
        </p>

        <h3 style={sectionTitleStyle}>3. Billing and automatic renewal</h3>
        <p style={paragraphStyle}>
          Paid memberships renew automatically each month using the payment
          method provided through Stripe. The applicable price, billing
          frequency and trial terms are displayed before checkout. Taxes may
          apply where required.
        </p>

        <h3 style={sectionTitleStyle}>4. Cancellation</h3>
        <p style={paragraphStyle}>
          You may cancel your membership at any time through the membership
          area of the Platform Sports app. If you cancel during the free trial,
          you will not be charged. If you cancel after the trial has converted
          into a paid subscription, your cancellation will prevent future
          renewals. Any remaining access will follow the cancellation
          information displayed inside the app.
        </p>

        <h3 style={sectionTitleStyle}>5. Physical activities and health</h3>
        <p style={paragraphStyle}>
          <strong>Your health comes first.</strong> Participation in running,
          training, challenges, events and other physical activities involves
          inherent risks. Platform Sports does not provide medical advice.
        </p>

        <p style={paragraphStyle}>
          Respect your limits and stop exercising if you experience pain,
          dizziness, unusual shortness of breath or other concerning symptoms.
          If you have any doubt about your health or physical condition,
          consult a physician before participating.
        </p>

        <h3 style={sectionTitleStyle}>6. PAR-Q</h3>
        <p style={paragraphStyle}>
          Members may be required to complete a Physical Activity Readiness
          Questionnaire before participating in community activities. The
          PAR-Q is a screening tool and does not replace medical evaluation,
          diagnosis or professional advice.
        </p>

        <h3 style={sectionTitleStyle}>
          7. Voluntary participation and responsibility
        </h3>
        <p style={paragraphStyle}>
          Your participation is voluntary. You are responsible for determining
          whether an activity is appropriate for your health, fitness,
          experience and current condition, and for following event rules and
          safety instructions.
        </p>

        <h3 style={sectionTitleStyle}>8. Community conduct</h3>
        <p style={paragraphStyle}>
          Members must treat others respectfully and must not publish unlawful,
          abusive, discriminatory, fraudulent or harmful content. Platform
          Sports may remove content or restrict accounts that violate these
          Terms or place other users at risk.
        </p>

        <h3 style={sectionTitleStyle}>9. Third-party services</h3>
        <p style={paragraphStyle}>
          Platform Sports may integrate with services such as Stripe, Strava,
          Supabase and Google. Your use of those services may also be governed
          by their own terms and privacy policies.
        </p>

        <h3 style={sectionTitleStyle}>
          10. Performance AI and artificial intelligence
        </h3>

        <p style={paragraphStyle}>
          Performance AI, including the Coach AI, provides automated
          information, suggestions and personalized plans based on the
          information available in your account. This may include profile
          information, training history, connected activity data, nutrition
          records, body measurements, laboratory information, PAR-Q responses
          and information provided during conversations with the Coach AI.
        </p>

        <p style={paragraphStyle}>
          Performance AI is an informational and wellness-support tool. It does
          not provide medical diagnosis, treatment, emergency assistance or
          professional medical, nutritional, physical therapy or psychological
          services. It does not replace consultation with a physician,
          registered dietitian, physical therapist, licensed coach or other
          qualified professional.
        </p>

        <p style={paragraphStyle}>
          Artificial intelligence may produce incomplete, inaccurate,
          inappropriate or outdated information. You must review recommendations
          carefully, respect your physical limits and seek professional advice
          whenever appropriate. Do not rely on Performance AI in an emergency
          or when experiencing pain, chest discomfort, fainting, severe
          shortness of breath or other concerning symptoms.
        </p>

        <h3 style={sectionTitleStyle}>
          11. Performance AI subscription
        </h3>

        <p style={paragraphStyle}>
          Performance AI is offered as a separate paid subscription. Unless
          otherwise displayed before checkout, the Performance AI subscription
          has no free trial, is billed monthly through Stripe and renews
          automatically until canceled. The price and billing frequency are
          displayed before payment.
        </p>

        <p style={paragraphStyle}>
          Canceling prevents future renewals but does not ordinarily create a
          refund for amounts already charged, except where required by law or
          expressly stated by Platform Sports. Access after cancellation will
          follow the subscription status and period displayed in the app.
        </p>

        <h3 style={sectionTitleStyle}>12. Changes and contact</h3>
        <p style={paragraphStyle}>
          We may update these Terms when the platform, memberships or legal
          requirements change. Questions may be sent to
          support@platformsports.app.
        </p>

        <div
          style={{
            height: 1,
            background: "#e2e8f0",
            margin: "38px 0",
          }}
        />

        <h2 style={sectionTitleStyle}>Português</h2>

        <h3 style={sectionTitleStyle}>1. Aceitação</h3>
        <p style={paragraphStyle}>
          Ao criar uma conta, entrar em uma comunidade, iniciar um período
          gratuito ou utilizar a Platform Sports, você confirma que leu e
          aceitou estes Termos e Condições e a nossa Política de Privacidade.
        </p>

        <h3 style={sectionTitleStyle}>
          2. Assinatura e período gratuito
        </h3>
        <p style={paragraphStyle}>
          Assinaturas elegíveis podem incluir 30 dias gratuitos. Nenhuma
          cobrança de mensalidade é feita no início do teste. Se você não
          cancelar antes do término do período gratuito, a assinatura será
          convertida automaticamente em uma assinatura mensal paga pelo valor
          apresentado antes do checkout.
        </p>

        <h3 style={sectionTitleStyle}>
          3. Cobrança e renovação automática
        </h3>
        <p style={paragraphStyle}>
          As assinaturas pagas são renovadas automaticamente todos os meses
          utilizando a forma de pagamento cadastrada no Stripe. O preço, a
          frequência da cobrança e as condições do teste são apresentados antes
          do checkout. Impostos poderão ser aplicados quando exigidos.
        </p>

        <h3 style={sectionTitleStyle}>4. Cancelamento</h3>
        <p style={paragraphStyle}>
          Você pode cancelar a qualquer momento na área de assinatura do
          aplicativo Platform Sports. O cancelamento impede novas renovações.
          O acesso restante após o cancelamento seguirá as informações
          apresentadas dentro do aplicativo.
        </p>

        <h3 style={sectionTitleStyle}>
          5. Atividades físicas e saúde
        </h3>
        <p style={paragraphStyle}>
          <strong>Sua saúde vem em primeiro lugar.</strong> A participação em
          corridas, treinamentos, desafios, eventos e outras atividades físicas
          envolve riscos inerentes. A Platform Sports não fornece orientação
          médica.
        </p>

        <p style={paragraphStyle}>
          Respeite seus limites e interrompa a atividade caso sinta dor,
          tontura, falta de ar incomum ou qualquer outro sintoma preocupante.
          Em caso de dúvida sobre sua saúde ou condição física, consulte um
          médico antes de participar.
        </p>

        <h3 style={sectionTitleStyle}>6. PAR-Q</h3>
        <p style={paragraphStyle}>
          O membro poderá ser solicitado a responder ao Questionário de
          Prontidão para Atividade Física antes de participar das atividades da
          comunidade. O PAR-Q é uma ferramenta de triagem e não substitui
          avaliação, diagnóstico ou orientação médica.
        </p>

        <h3 style={sectionTitleStyle}>
          7. Participação voluntária e responsabilidade
        </h3>
        <p style={paragraphStyle}>
          Sua participação é voluntária. Você é responsável por avaliar se cada
          atividade é adequada à sua saúde, condicionamento, experiência e
          condição atual, além de seguir as regras dos eventos e as orientações
          de segurança.
        </p>

        <h3 style={sectionTitleStyle}>8. Conduta na comunidade</h3>
        <p style={paragraphStyle}>
          Os membros devem tratar as demais pessoas com respeito e não podem
          publicar conteúdo ilegal, abusivo, discriminatório, fraudulento ou
          prejudicial. A Platform Sports poderá remover conteúdo ou restringir
          contas que violem estes Termos ou coloquem outros usuários em risco.
        </p>

        <h3 style={sectionTitleStyle}>9. Serviços de terceiros</h3>
        <p style={paragraphStyle}>
          A Platform Sports poderá integrar serviços como Stripe, Strava,
          Supabase e Google. O uso desses serviços também poderá estar sujeito
          aos termos e políticas de privacidade de cada fornecedor.
        </p>

        <h3 style={sectionTitleStyle}>
          10. Performance AI e inteligência artificial
        </h3>

        <p style={paragraphStyle}>
          O Performance AI, incluindo o Coach IA, fornece informações,
          sugestões e planos personalizados gerados automaticamente com base
          nos dados disponíveis na conta do usuário. Esses dados podem incluir
          perfil, histórico de treinamentos, atividades conectadas, registros
          de alimentação, medidas corporais, exames laboratoriais, respostas
          do PAR-Q e informações fornecidas nas conversas com o Coach IA.
        </p>

        <p style={paragraphStyle}>
          O Performance AI é uma ferramenta informativa e de apoio ao
          bem-estar. Ele não fornece diagnóstico, tratamento, atendimento de
          emergência nem serviços profissionais médicos, nutricionais,
          fisioterapêuticos ou psicológicos. Ele não substitui consulta com
          médico, nutricionista, fisioterapeuta, treinador habilitado ou outro
          profissional qualificado.
        </p>

        <p style={paragraphStyle}>
          Sistemas de inteligência artificial podem gerar informações
          incompletas, imprecisas, inadequadas ou desatualizadas. O usuário deve
          avaliar cuidadosamente as recomendações, respeitar seus limites
          físicos e procurar orientação profissional sempre que necessário.
          Não utilize o Performance AI em emergências ou diante de dor, pressão
          no peito, desmaio, falta de ar intensa ou outros sintomas
          preocupantes.
        </p>

        <h3 style={sectionTitleStyle}>
          11. Assinatura do Performance AI
        </h3>

        <p style={paragraphStyle}>
          O Performance AI é oferecido como uma assinatura paga independente.
          Salvo quando informado de forma diferente antes do checkout, a
          assinatura do Performance AI não possui período gratuito, é cobrada
          mensalmente pelo Stripe e renovada automaticamente até o
          cancelamento. O preço e a frequência da cobrança são apresentados
          antes do pagamento.
        </p>

        <p style={paragraphStyle}>
          O cancelamento impede cobranças futuras, mas normalmente não gera
          reembolso de valores já cobrados, exceto quando exigido por lei ou
          expressamente informado pela Platform Sports. O acesso após o
          cancelamento seguirá o status e o período da assinatura apresentados
          no aplicativo.
        </p>

        <h3 style={sectionTitleStyle}>
          12. Alterações e contato
        </h3>
        <p style={{ ...paragraphStyle, marginBottom: 0 }}>
          Estes Termos poderão ser atualizados quando houver mudanças na
          plataforma, nas assinaturas ou nas exigências legais. Dúvidas podem
          ser enviadas para support@platformsports.app.
        </p>
      </article>
    </main>
  );
}



