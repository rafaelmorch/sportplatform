// app/garmin-privacy/page.tsx

export default function GarminPrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "120px 16px 40px", // espaço por causa do menu fixo
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          borderRadius: "24px",
          border: "1px solid #111827",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.94))",
          boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
          padding: "24px 24px 28px",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        <header style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: "6px",
            }}
          >
            PRIVACY POLICY
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              marginBottom: "4px",
            }}
          >
            SportPlatform Privacy Policy
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            Last updated: December 5, 2025
          </p>
        </header>

        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            color: "#d1d5db",
          }}
        >
          <p>
            This Privacy Policy explains how <strong>SportPlatform</strong>{" "}
            (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
            and protects personal data when you use our services, including our
            website, web application, and integrations with third-party
            platforms such as Strava and, in the future, Garmin.
          </p>

          <p>
            By creating an account or using SportPlatform, you agree to the
            practices described in this Privacy Policy.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "10px",
              marginBottom: "2px",
            }}
          >
            1. Data We Collect
          </h2>

          <p>We may collect the following categories of data:</p>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>
              <strong>Account information:</strong> name, email address, and
              password (stored securely as a hash).
            </li>
            <li>
              <strong>Profile and training information:</strong> sport
              preferences, training groups, goals, and participation in events
              or challenges.
            </li>
            <li>
              <strong>Activity data from third parties:</strong> when you
              connect accounts such as Strava (and, in the future, Garmin), we
              may receive activity details, including distance, duration, pace,
              elevation, heart rate, and related metrics.
            </li>
            <li>
              <strong>Usage and technical data:</strong> device information,
              approximate location (based on IP), and log data related to how
              you interact with our platform.
            </li>
          </ul>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            2. How We Use Your Data
          </h2>

          <p>We use the data we collect to:</p>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>Create and manage your SportPlatform account.</li>
            <li>
              Display dashboards, metrics, and performance trends related to
              your training.
            </li>
            <li>
              Enable your participation in training groups, events, and
              community challenges.
            </li>
            <li>
              Provide customer support and communicate important updates about
              the platform.
            </li>
            <li>
              Improve our services, features, and user experience through
              aggregated and anonymized analysis.
            </li>
          </ul>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            3. Third-Party Integrations (Strava and Garmin)
          </h2>

          <p>
            SportPlatform allows you to connect your account to third-party
            services, such as Strava and, in the future, Garmin. When you
            authorize these integrations:
          </p>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>
              We receive activity and performance data from your connected
              account in accordance with the permissions you grant.
            </li>
            <li>
              We use this data only to provide SportPlatform features, such as
              dashboards, statistics, and training insights.
            </li>
            <li>
              You can revoke access at any time from the third-party service
              (e.g., in your Strava or Garmin account settings).
            </li>
          </ul>

          <p>
            SportPlatform is not owned or controlled by Strava, Garmin, or any
            other third-party provider, and their use of your data is governed
            by their own privacy policies.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            4. Legal Basis and Purpose Limitation
          </h2>

          <p>
            We process your personal data to fulfill our contractual obligations
            to you (for example, providing access to your account and training
            features), based on your consent (for third-party integrations), and
            where necessary for our legitimate interests (such as maintaining
            the security and reliability of our services).
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            5. Data Storage and Security
          </h2>

          <p>
            SportPlatform uses reputable third-party providers to host and store
            data, including cloud infrastructure and database services. Access
            to personal data is restricted to authorized personnel and is
            protected through technical and organizational measures designed to
            prevent unauthorized access, loss, or misuse.
          </p>

          <p>
            While we take reasonable steps to protect your data, no online
            service can guarantee absolute security.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            6. Data Sharing
          </h2>

          <p>
            We do <strong>not</strong> sell your personal data. We may share
            data only in the following situations:
          </p>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>
              <strong>Service providers:</strong> with third-party vendors who
              help us operate the platform (for example, hosting, analytics, and
              email delivery), under appropriate data protection commitments.
            </li>
            <li>
              <strong>Legal requirements:</strong> when required by law or in
              response to valid legal processes.
            </li>
            <li>
              <strong>Protection of rights:</strong> when necessary to protect
              the rights, property, or safety of SportPlatform, our users, or
              others.
            </li>
          </ul>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            7. Data Retention
          </h2>

          <p>
            We retain personal data for as long as necessary to provide our
            services and for legitimate and essential business purposes, such as
            maintaining the performance of the platform, complying with legal
            obligations, and resolving disputes. You may request deletion of
            your account, and we will remove or anonymize your personal data,
            unless we are required to retain it by law.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            8. Your Rights
          </h2>

          <p>Depending on your jurisdiction, you may have the right to:</p>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate or incomplete information.</li>
            <li>Request deletion of your personal data, subject to legal limits.</li>
            <li>
              Withdraw consent for third-party integrations (e.g., disconnecting
              Strava or Garmin).
            </li>
          </ul>

          <p>
            To exercise any of these rights, please contact us using the details
            provided below.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            9. Children&apos;s Privacy
          </h2>

          <p>
            SportPlatform is not designed to be used by children without the
            consent and supervision of a parent, guardian, or responsible adult.
            Where applicable, accounts for minors should be created and managed
            by or under the guidance of an adult.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            10. Changes to This Policy
          </h2>

          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our services, legal requirements, or best practices. When
            we make material changes, we will update the &quot;Last updated&quot;
            date at the top of this page.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            11. Contact Us
          </h2>

          <p>
            If you have any questions about this Privacy Policy or how we handle
            your data, you can contact us at:
          </p>

          <p>
            <strong>SportPlatform</strong>
            <br />
            Email: support@sportplatform.app
            <br />
            (You may also contact us using the details provided in your account
            or on our website.)
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginTop: "8px",
            }}
          >
            This Privacy Policy is provided for informational purposes and does
            not constitute legal advice. You should consult legal counsel to
            ensure compliance with applicable laws in your jurisdiction.
          </p>
        </section>
      </div>
    </main>
  );
}
