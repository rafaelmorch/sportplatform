export default function DeleteAccountPage() {
  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: 24, lineHeight: 1.7 }}>
      <h1>Run Club Community - Account Deletion</h1>

      <p>
        You can request deletion of your Run Club Community account
        and associated personal data.
      </p>

      <h2>How to request deletion</h2>

      <p>
        In the app, go to Profile, select Delete Account,
        and follow the instructions.
      </p>

      <p>
        If you cannot access the app, email{" "}
        <a href="mailto:contact@sportsplatform.app?subject=Run%20Club%20Community%20-%20Account%20Deletion">
          contact@sportsplatform.app
        </a>{" "}
        using the email address associated with your account.
        We may request additional verification to protect your account.
      </p>

      <h2>Subscriptions</h2>

      <p>
        Before requesting account deletion, cancel all active subscriptions.
        Deleting your account does not automatically cancel subscriptions.
        You may continue to be charged until they are canceled.
      </p>

      <h2>What happens to your data?</h2>

      <p>
        We process requests to delete your account and associated personal
        data, including your profile, connected fitness integrations,
        activity history, and health-related information.
      </p>

      <p>
        Some records may be retained when required by law, including
        applicable financial records. Shared community content may require
        separate review to protect other members' data.
      </p>

      <p>
        Your request will be reviewed and processed manually.
        We will contact you if additional information is needed.
      </p>
    </main>
  );
}
