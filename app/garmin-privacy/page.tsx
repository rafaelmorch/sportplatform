import BackButton from "@/components/BackButton";

export default function GarminPrivacyPolicy() {
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
        Garmin Data Privacy Policy
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        This Privacy Policy explains how SportsPlatform (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;) handles data received from Garmin
        Connect when you authorize the integration with your account.
        We are committed to protecting your privacy, handling your information
        responsibly and being transparent about how activity data is used
        within SportsPlatform.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        1. Data We Receive from Garmin
      </h2>

      <p style={{ lineHeight: 1.7, fontSize: 15, marginBottom: 16 }}>
        When you connect your Garmin account to SportsPlatform, we may receive
        the following data types, depending on your permissions:
      </p>

      <ul
        style={{
          marginLeft: 18,
          marginBottom: 18,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Activity summaries (running, cycling, swimming, etc.).</li>
        <li>Metrics such as distance, duration, pace and elevation.</li>
        <li>GPS or route data (when authorized).</li>
        <li>Device-generated performance metrics.</li>
        <li>Wellness or training-related insights provided by Garmin.</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        2. How We Use Garmin Data
      </h2>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        Garmin data is used exclusively to provide and improve SportsPlatform
        features, including:
      </p>

      <ul
        style={{
          marginLeft: 18,
          marginBottom: 18,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Displaying activity history and performance dashboards.</li>
        <li>Generating weekly and monthly training analytics.</li>
        <li>Calculating rankings, group metrics and challenge results.</li>
        <li>Helping you track long-term training progress.</li>
      </ul>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We do <strong>not</strong> alter Garmin data, use it for profiling
        unrelated to training, or process it for any advertising purposes.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        3. How We Store and Protect Your Data
      </h2>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        All data imported from Garmin is stored securely using encrypted
        infrastructure. We apply industry-standard security measures to prevent
        unauthorized access, loss or misuse of your information.
      </p>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        You may disconnect Garmin at any time. When disconnected, we stop
        receiving new data, and you may request deletion of previously imported
        data.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        4. Data Sharing
      </h2>

      <p style={{ lineHeight: 1.7, fontSize: 15, marginBottom: 16 }}>
        We do <strong>not</strong> share Garmin data with third parties, except:
      </p>

      <ul
        style={{
          marginLeft: 18,
          marginBottom: 18,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>When legally required by court order or regulation.</li>
        <li>
          With service providers that support infrastructure (without direct
          access to your activity data).
        </li>
        <li>
          When you explicitly authorize visibility (e.g., group rankings).
        </li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        5. Your Rights and Controls
      </h2>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        You may request at any time:
      </p>

      <ul
        style={{
          marginLeft: 18,
          marginBottom: 18,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Deletion of Garmin data stored in SportsPlatform.</li>
        <li>Disconnection of your Garmin account.</li>
        <li>Information on how your data is being used.</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 22 }}>
        6. Contact Information
      </h2>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        For any privacy-related questions or requests, please contact us at:
        <br />
        <strong>privacy@sportsplatform.app</strong>
        <br />
        <br />
        For general support or account-related questions:
        <br />
        <strong>rafael.morch@sportsplatform.app</strong>
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
