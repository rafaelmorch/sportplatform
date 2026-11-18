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
          Last updated: November 17, 2026
        </div>

        <h2 style={sectionTitleStyle}>English</h2>

        <h3 style={sectionTitleStyle}>1. Acceptance</h3>
        <p style={paragraphStyle}>
          By creating an account, joining a community, starting a free trial or
          using Platform Sports, including MAIA Fitness, you confirm that you have read and accepted
          these Terms & Conditions and our Privacy Policy.
        </p>

        <h3 style={sectionTitleStyle}>2. Membership and free trial</h3>
        <p style={paragraphStyle}>
          Eligible memberships may include a free trial. The duration and
          conditions of any applicable trial will be displayed before checkout.
          Unless you cancel before the trial ends, your membership may
          automatically convert into a paid monthly subscription at the price
          displayed before checkout.
        </p>

        <h3 style={sectionTitleStyle}>3. Billing and automatic renewal</h3>
        <p style={paragraphStyle}>
          Paid memberships may be processed by Platform Sports or by third-party
          payment platforms, including Stripe, Apple App Store or Google Play,
          depending on the platform through which the subscription is
          purchased. The applicable price, billing frequency and trial terms
          are displayed before checkout. Taxes may apply where required.
        </p>

        <h3 style={sectionTitleStyle}>4. Cancellation</h3>
        <p style={paragraphStyle}>
          You may cancel your subscription through the platform where it was
          purchased. For Apple App Store subscriptions, manage or cancel your
          subscription in your Apple Account subscription settings. For other
          purchases, follow the cancellation instructions provided at checkout
          or in the applicable membership area. Cancel before a trial ends to
          avoid renewal charges. Cancellation prevents future renewals, and
          access generally continues until the end of the paid billing period,
          subject to the applicable store terms and subscription status.
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
          Questionnaire before participating in community activities. MAIA
          Fitness requires completion of the PAR-Q and applicable health and
          safety acknowledgments before accessing its AI coaching features.
          If your answers raise health concerns, consult a qualified healthcare
          professional before exercising. The PAR-Q is a screening tool and
          does not replace medical evaluation, diagnosis or professional advice.
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
          Platform Sports may integrate with third-party services such as
          Garmin Connect, Strava, Stripe, Supabase, Apple and Google. When you
          choose to connect or use a third-party service, your use of that
          service may also be subject to that provider's terms and privacy
          policies.
        </p>

        <h3 style={sectionTitleStyle}>
          10. Connected fitness and health data
        </h3>
        <p style={paragraphStyle}>
          If you choose to connect services such as Garmin Connect or Strava,
          Platform Sports may receive activity, fitness and health data
          authorized by you, including workouts, distance, duration, heart
          rate, steps, sleep and other available metrics. This information is
          used to provide features such as activity history, performance
          analysis, community features and personalized MAIA Fitness (formerly Performance AI)
          insights. Platform Sports does not sell Garmin or Strava activity or
          health data to third parties. Additional information about
          collection, use, retention and deletion is provided in our Privacy
          Policy.
        </p>

        <h3 style={sectionTitleStyle}>
          11. MAIA Fitness and artificial intelligence
        </h3>

        <p style={paragraphStyle}>
          MAIA Fitness, formerly Performance AI and Coach AI, provides automated
          information, suggestions and personalized plans based on the
          information available in your account. This may include profile
          information, training history, connected activity and health data
          from services such as Garmin Connect and Strava when authorized by
          you, nutrition records, body measurements, laboratory information,
          PAR-Q responses and information provided during conversations with
          the AI coach.
        </p>

        <p style={paragraphStyle}>
          MAIA Fitness is an informational and wellness-support tool. It does
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
          whenever appropriate. Do not rely on MAIA Fitness in an emergency
          or when experiencing pain, chest discomfort, fainting, severe
          shortness of breath or other concerning symptoms.
        </p>

        <h3 style={sectionTitleStyle}>
          12. MAIA Fitness subscription
        </h3>

        <p style={paragraphStyle}>
          MAIA Fitness is offered as a separate monthly auto-renewable paid
          subscription, independent of Run Club community memberships. The
          MAIA Fitness subscription has no free trial unless one is explicitly
          displayed before checkout. On iOS, purchases are processed through
          Apple's In-App Purchase system. The subscription is configured at
          US$9.99 per month in the United States; the actual localized price,
          billing period and any applicable offer are displayed by Apple before
          confirmation. Subscriptions automatically renew unless canceled in
          accordance with the applicable App Store terms.
        </p>

        <p style={paragraphStyle}>
          Canceling prevents future renewals but does not automatically refund
          previous charges. Refund requests for Apple purchases are handled
          under Apple's refund policies and applicable law. Access after
          cancellation generally remains available through the current paid
          billing period, subject to the subscription status and store terms.
        </p>

        <h3 style={sectionTitleStyle}>13. Changes and contact</h3>
        <p style={paragraphStyle}>
          We may update these Terms when the platform, memberships or legal
          requirements change. Questions may be sent to
          support@platformsports.app.
        </p>
      </article>
    </main>
  );
}




