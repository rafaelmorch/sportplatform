import BackButton from "@/components/BackButton";

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
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

      <p style={{ marginBottom: 14, lineHeight: 1.7, fontSize: 15 }}>
        This Privacy Policy explains how Sports Platform (“we”, “our”, or
        “the platform”) collects, uses, and protects your information when
        you participate in our activities, challenges, and platform services.
        We are committed to maintaining the privacy and security of our users.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>
        1. Information We Collect
      </h2>
      <p style={{ marginBottom: 14, lineHeight: 1.7 }}>
        We may collect basic profile information (such as name and email) as well
        as activity data voluntarily synchronized by the user through third-party
        platforms (e.g., Strava, Fitbit, etc.). We only access data with your
        explicit consent.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>
        2. How We Use Your Data
      </h2>
      <p style={{ marginBottom: 14, lineHeight: 1.7 }}>
        The data we collect is used to provide activity tracking, group challenges,
        insights, leaderboards, and other features designed to enhance your
        training and community experience.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>
        3. Sharing of Information
      </h2>
      <p style={{ marginBottom: 14, lineHeight: 1.7 }}>
        We do not sell or share your data with third parties. Information is only
        shared with the third-party service you authorize for activity sync.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>
        4. Data Security
      </h2>
      <p style={{ marginBottom: 14, lineHeight: 1.7 }}>
        We use industry-standard measures to protect your information. All data
        transfers occur through secure and encrypted communication.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }}>
        5. Contact
      </h2>
      <p style={{ marginBottom: 14, lineHeight: 1.7 }}>
        For privacy-related questions, you may contact us at:
        <br />
        <strong>privacy@sportsplatform.app</strong>
      </p>
    </main>
  );
}
