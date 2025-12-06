import BackButton from "@/components/BackButton";

export default function PrivacyPolicyPage() {
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
        Privacy Policy
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        This Privacy Policy explains how SportsPlatform (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;) collects, uses and protects your
        personal information when you use our website, mobile experience and
        related services.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        1. Information We Collect
      </h2>
      <p style={{ lineHeight: 1.7, fontSize: 15 }}>
        We may collect the following categories of information:
      </p>
      <ul
        style={{
          marginLeft: 18,
          marginBottom: 16,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>
          <strong>Account information:</strong> such as your name, e-mail
          address and password.
        </li>
        <li>
          <strong>Profile information:</strong> optional details you choose to
          add to your profile (e.g., avatar, city, preferred sports).
        </li>
        <li>
          <strong>Training and activity data:</strong> distance, time, pace and
          other metrics imported from third-party services like Strava, when
          you authorize the connection.
        </li>
        <li>
          <strong>Usage information:</strong> pages visited, features used and
          basic technical information about your device and browser.
        </li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        2. How We Use Your Information
      </h2>
      <p style={{ lineHeight: 1.7, fontSize: 15 }}>
        We use your information to:
      </p>
      <ul
        style={{
          marginLeft: 18,
          marginBottom: 16,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Provide access to your account and training dashboards.</li>
        <li>
          Synchronize and display your activities, statistics and progress.
        </li>
        <li>
          Create group rankings, challenges and events when you choose to
          participate.
        </li>
        <li>
          Improve the platform, fix technical issues and understand how the
          product is being used.
        </li>
        <li>
          Communicate with you about updates, security alerts or important
          changes to our services.
        </li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        3. Third-Party Integrations (e.g., Strava)
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        When you connect your account to Strava or other third-party services,
        we access only the data necessary to provide the features you have
        chosen to use (for example, importing your activities to show in your
        dashboard). You can disconnect these integrations at any time through
        the respective provider.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        4. Data Sharing
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We do not sell your personal data. We may share information only:
      </p>
      <ul
        style={{
          marginLeft: 18,
          marginBottom: 16,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>With service providers that help us operate the platform;</li>
        <li>
          When required by law, regulation or a valid legal request; or
        </li>
        <li>
          When you explicitly opt-in to participate in specific events or
          rankings where data visibility is part of the experience.
        </li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        5. Data Security and Retention
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We use technical and organizational measures to protect your data
        against unauthorized access, loss or misuse. We retain your information
        only for as long as necessary to provide our services or to comply with
        legal obligations.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        6. Your Rights
      </h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        Depending on your location, you may have the right to access, correct
        or delete your personal data, as well as to restrict or object to
        certain types of processing. You can also request to disconnect
        third-party integrations at any time.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20 }}>
        7. Contact
      </h2>
      <p style={{ lineHeight: 1.7, fontSize: 15 }}>
        For any questions about this Privacy Policy or how we handle your data,
        please contact us at:
        <br />
        <strong>privacy@sportsplatform.app</strong>
        <br />
        For general product or support questions, you can also reach us at{" "}
        <strong>support@sportsplatform.app</strong>.
      </p>
    </main>
  );
}
