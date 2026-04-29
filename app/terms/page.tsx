"use client";

export default function TermsPage() {
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
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Terms of Service</h1>

      <p>
        By accessing or using Platform Sports, you agree to be bound by these Terms of Service.
        If you do not agree, you may not use the platform.
      </p>

      <h2 style={{ marginTop: 32 }}>1. Use of the Platform</h2>
      <p>
        Platform Sports provides tools for managing sports activities, groups, events,
        and performance tracking. You agree to use the platform only for lawful purposes
        and in a manner that does not infringe the rights of others.
      </p>

      <h2 style={{ marginTop: 32 }}>2. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials
        and for all activities that occur under your account.
      </p>

      <h2 style={{ marginTop: 32 }}>3. Payments</h2>
      <p>
        Certain features may require payment. Payments are processed through third-party
        providers such as Stripe. We are not responsible for payment processing errors
        or issues caused by third-party services.
      </p>

      <h2 style={{ marginTop: 32 }}>4. Third-Party Services</h2>
      <p>
        The Service may integrate with third-party services, including Supabase,
        Google Sign-In, Stripe, and Strava. When you connect a third-party service,
        their terms and privacy policies may also apply.
      </p>

      <h2 style={{ marginTop: 32 }}>5. Strava Integration</h2>
      <p>
        If you connect your Strava account, Platform Sports may use your authorized
        activity data to display performance, rankings, group summaries, and community
        progress within the app.
      </p>

      <p>
        You can disconnect your Strava account at any time through the app or directly
        in your Strava account settings.
      </p>

      <h2 style={{ marginTop: 32 }}>6. Data and Privacy</h2>
      <p>
        Your use of the platform is also governed by our Privacy Policy. We are committed
        to protecting your data and using it responsibly.
      </p>

      <h2 style={{ marginTop: 32 }}>7. Limitation of Liability</h2>
      <p>
        Platform Sports is provided "as is" without warranties of any kind. We are not
        liable for any damages resulting from the use or inability to use the platform.
      </p>

      <h2 style={{ marginTop: 32 }}>8. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform
        after changes constitutes acceptance of the new Terms.
      </p>

      <h2 style={{ marginTop: 32 }}>9. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
        <br />
        support@platformsports.app
      </p>
    </div>
  );
}
