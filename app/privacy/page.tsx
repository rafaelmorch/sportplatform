"use client";

export default function PrivacyPage() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "24px 16px 96px",
        color: "#e5e7eb",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Privacy Policy</h1>

      <p>
        Platform Sports respects your privacy and is committed to protecting your personal data.
        This policy explains how we collect, use, and safeguard your information.
      </p>

      <h2 style={{ marginTop: 32 }}>Information We Collect</h2>
      <p>
        We may collect personal information such as your name, email address, and activity data
        when you use our platform.
      </p>

      <h2 style={{ marginTop: 32 }}>How We Use Your Information</h2>
      <p>
        We use your data to provide and improve our services, personalize your experience,
        and enable features such as groups, activities, and performance tracking.
      </p>

      <h2 style={{ marginTop: 32 }}>Data Sharing</h2>
      <p>
        We do not sell your personal data. We only share information when necessary to operate
        the platform or comply with legal obligations.
      </p>

      <h2 style={{ marginTop: 32 }}>Data Security</h2>
      <p>
        We implement appropriate security measures to protect your data against unauthorized access,
        alteration, or disclosure.
      </p>

      {/* 🔥 NOVA SEÇÃO STRAVA */}
      <h2 style={{ marginTop: 32 }}>Strava Data Access</h2>

      <p>
        Platform Sports may connect to your Strava account only with your permission.
        When you connect Strava, we may access activity data such as activity type,
        distance, duration, elevation, pace, start date, and related workout information.
      </p>

      <p>
        We use this data to display your performance, rankings, group activity summaries,
        and community progress inside the app.
      </p>

      <p>
        We do not sell your Strava data. We do not share your Strava activity data with
        third parties for advertising purposes.
      </p>

      <p>
        You can disconnect your Strava account at any time from the app or directly
        through your Strava account settings. You may also request deletion of your
        Strava-related data by contacting us.
      </p>

      <p>
        Contact: support@platformsports.app
      </p>

      <h2 style={{ marginTop: 32 }}>Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal data. Please contact us
        if you wish to exercise these rights.
      </p>

      <h2 style={{ marginTop: 32 }}>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at:
        <br />
        support@platformsports.app
      </p>
    </div>
  );
}
