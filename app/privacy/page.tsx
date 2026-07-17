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
        <BackArrow />
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
          Política de Privacidade · Last updated / Última atualização: July 16, 2026
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
          activity data when you use our platform.
        </p>

        <h2 style={sectionTitleStyle}>How We Use Your Information</h2>
        <p style={paragraphStyle}>
          We use your data to provide and improve our services, personalize
          your experience, manage memberships and enable features such as
          groups, activities, challenges and performance tracking.
        </p>

        <h2 style={sectionTitleStyle}>Payments</h2>
        <p style={paragraphStyle}>
          Payment information is processed securely by Stripe. Platform Sports
          does not directly store your full credit card details.
        </p>

        <h2 style={sectionTitleStyle}>Data Sharing</h2>
        <p style={paragraphStyle}>
          We do not sell your personal data. We only share information when
          necessary to operate the platform, provide integrated services,
          process payments or comply with legal obligations.
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

        <h2 style={sectionTitleStyle}>Data Retention and Deletion</h2>
        <p style={paragraphStyle}>
          We retain personal information only for as long as necessary to
          provide the platform, comply with legal obligations, resolve disputes
          and enforce our agreements. You may request deletion of your account
          and associated personal data.
        </p>

        <h2 style={sectionTitleStyle}>Your Rights</h2>
        <p style={paragraphStyle}>
          You may request access to, correction of or deletion of your personal
          data. Depending on your location, additional privacy rights may
          apply.
        </p>

        <h2 style={sectionTitleStyle}>Third-Party Services</h2>
        <p style={paragraphStyle}>
          Platform Sports may use services such as Stripe, Strava, Supabase,
          Google and other service providers. Their handling of information may
          also be governed by their own privacy policies.
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
