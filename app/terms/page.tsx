import BackButton from "@/components/BackButton";

export default function TermsOfUsePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 20px 32px",
        background: "radial-gradient(circle at top, #0f172a, #020617)",
        color: "#e2e8f0",
        maxWidth: 880,
        margin: "0 auto",
      }}
    >
      <BackButton />

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginTop: "12px",
          marginBottom: "16px",
          letterSpacing: "-0.03em",
        }}
      >
        Terms of Use
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        These Terms of Use (&quot;Terms&quot;) govern your access to and use of
        the SportsPlatform website, web application and related services
        (&quot;Services&quot;). By creating an account or using our platform,
        you agree to these Terms. If you do not agree, you must stop using the
        Services.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        1. Eligibility
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        You must be at least 13 years old to use SportsPlatform. If you are
        under 18, you may use the Services only with permission from a parent or
        legal guardian.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        2. Account and Security
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account.
        Notify us promptly if you suspect unauthorized access or any security
        issue related to your account.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        3. Use of the Services
      </h2>
      <p style={{ lineHeight: 1.7, fontSize: 15 }}>
        When using SportsPlatform, you agree NOT to:
      </p>
      <ul
        style={{
          marginLeft: 18,
          marginBottom: 16,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Use the Services for unlawful, fraudulent or harmful activities.</li>
        <li>Access or use another user&apos;s account without permission.</li>
        <li>
          Attempt to copy, reverse-engineer or exploit our software or
          underlying infrastructure.
        </li>
        <li>
          Upload or share content that is abusive, discriminatory, offensive or
          inappropriate in groups, chats or events.
        </li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        4. Third-Party Integrations
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        Some features require a connection to third-party services such as
        Strava. By connecting your account, you authorize us to access activity
        data required to provide dashboards, rankings and training insights.
        You may disconnect these integrations at any time by adjusting your
        settings with the respective provider.
      </p>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        Your use of third-party services is also governed by their own terms and
        privacy policies, which we encourage you to review.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        5. Training Data and Rankings
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        When you join groups, events or challenges, certain training metrics
        (such as distance, time, pace, elevation, points or ranking position)
        may be visible to other participants. By joining these experiences, you
        consent to this limited form of data visibility as part of the
        competitive and community features of the platform.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        6. Health and Safety Disclaimer
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        SportsPlatform does not provide medical advice. All recommendations,
        performance metrics and training suggestions are for informational
        purposes only. Always consult a qualified health professional before
        starting or changing any exercise program, especially if you have
        injuries, medical conditions or concerns about physical activity.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        7. Intellectual Property
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        All content, logos, code and design elements of SportsPlatform are
        protected by intellectual property laws. You may not reuse, reproduce
        or distribute any part of the Services without our prior written
        consent.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        8. Termination
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We may suspend or terminate your access to the Services at any time if
        you violate these Terms or engage in behavior that harms other users,
        the platform or our reputation. You may also request deletion of your
        account by contacting us.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        9. Changes to These Terms
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We may update these Terms periodically to reflect improvements, new
        features or legal requirements. When we make material changes, we will
        update the &quot;Last updated&quot; date below. Continued use of the
        Services after changes become effective means that you accept the
        revised Terms.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        10. Contact Us
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        If you have questions about these Terms or about SportsPlatform, please
        contact:
        <br />
        <strong>rafael.morch@sportsplatform.app</strong>
        <br />
        For privacy-specific matters, please contact:
        <br />
        <strong>privacy@sportsplatform.app</strong>
      </p>

      <p
        style={{
          marginTop: 28,
          marginBottom: 16,
          fontSize: 14,
          opacity: 0.7,
        }}
      >
        Last updated: {new Date().getFullYear()}
      </p>
    </main>
  );
}
