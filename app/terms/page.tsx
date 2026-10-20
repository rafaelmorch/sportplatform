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
          Last updated: August 17, 2026
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
          analysis, community features and personalized Performance AI
          insights. Platform Sports does not sell Garmin or Strava activity or
          health data to third parties. Additional information about
          collection, use, retention and deletion is provided in our Privacy
          Policy.
        </p>

        <h3 style={sectionTitleStyle}>
          11. Performance AI and artificial intelligence
        </h3>

        <p style={paragraphStyle}>
          Performance AI, including the Coach AI, provides automated
          information, suggestions and personalized plans based on the
          information available in your account. This may include profile
          information, training history, connected activity and health data
          from services such as Garmin Connect and Strava when authorized by
          you, nutrition records, body measurements, laboratory information,
          PAR-Q responses and information provided during conversations with
          the Coach AI.
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
          12. Performance AI subscription
        </h3>

        <p style={paragraphStyle}>
          Performance AI is offered as a separate paid subscription. Unless
          otherwise displayed before checkout, the Performance AI subscription
          has no free trial and renews automatically until canceled. Payment
          may be processed through Stripe, Apple App Store or Google Play,
          depending on where the subscription is purchased. The price and
          billing frequency are displayed before payment.
        </p>

        <p style={paragraphStyle}>
          Canceling prevents future renewals but does not ordinarily create a
          refund for amounts already charged, except where required by law or
          expressly stated by Platform Sports. Access after cancellation will
          follow the subscription status and period displayed in the app.
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




