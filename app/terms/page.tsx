// app/terms/page.tsx

export default function TermsPage() {
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
        padding: "120px 16px 40px", // espaço pro menu fixo, se usar
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
          boxShadow: "0 24px 70px rgba(0,0,5,0.85)",
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
            TERMS OF USE
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              marginBottom: "4px",
            }}
          >
            SportPlatform Terms of Use
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
            These Terms of Use (&quot;Terms&quot;) govern your access to and use
            of the SportPlatform website, web application, and related services
            (&quot;Services&quot;). By creating an account or using our
            Services, you agree to be bound by these Terms.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            1. About SportPlatform
          </h2>
          <p>
            SportPlatform is a training and performance ecosystem designed to
            support runners, multi-sport athletes, and active families through
            data-driven tools, training groups, and community features.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            2. Eligibility and Account Registration
          </h2>
          <p>
            To use our Services, you must be able to enter into a binding
            contract in your jurisdiction. Where applicable, accounts for minors
            should be created and used under the supervision and responsibility
            of a parent, legal guardian, or responsible adult.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your
            login credentials and for all activities that occur under your
            account. You agree to notify us promptly of any unauthorized access
            or suspected security incident.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            3. Use of the Services
          </h2>
          <p>You agree to use SportPlatform only for lawful purposes and to:</p>
          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>Provide accurate and up-to-date information during registration.</li>
            <li>
              Respect other users and refrain from any abusive, harassing, or
              discriminatory behavior.
            </li>
            <li>
              Not attempt to interfere with or disrupt the security, integrity,
              or performance of the Services.
            </li>
            <li>
              Not reverse engineer, decompile, or otherwise attempt to derive
              the source code or underlying ideas of the platform.
            </li>
          </ul>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            4. Third-Party Integrations
          </h2>
          <p>
            SportPlatform may integrate with third-party services such as
            Strava and, in the future, Garmin. These integrations are optional
            and require your explicit authorization.
          </p>
          <p>
            By connecting a third-party account, you authorize us to access and
            process data from that service solely for the purpose of providing
            SportPlatform features (for example, activity tracking and
            performance analytics). Your use of third-party services is also
            subject to their own terms and privacy policies.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            5. Health and Safety Notice
          </h2>
          <p>
            SportPlatform does not provide medical advice. Training
            recommendations, metrics, and insights are for informational and
            educational purposes only and should not be considered a substitute
            for professional medical evaluation, diagnosis, or treatment.
          </p>
          <p>
            You are responsible for exercising judgment when participating in
            training plans, events, or physical activities suggested through the
            platform. Always consult a qualified healthcare professional before
            starting or modifying any exercise program, especially if you have
            pre-existing health conditions.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            6. Intellectual Property
          </h2>
          <p>
            All content, trademarks, logos, graphics, and software used in
            SportPlatform are owned by us or our licensors and are protected by
            applicable intellectual property laws. You receive a personal,
            limited, non-transferable, and revocable license to use the Services
            solely as permitted under these Terms.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            7. User Content
          </h2>
          <p>
            You may be able to submit or generate content through the platform
            (for example, profile information, training notes, or participation
            in groups). You retain ownership of your content but grant
            SportPlatform a non-exclusive, worldwide, royalty-free license to
            use, display, and process such content as necessary to operate and
            improve the Services.
          </p>
          <p>
            You are responsible for ensuring that any content you provide does
            not infringe the rights of third parties or violate applicable laws.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            8. Service Availability and Changes
          </h2>
          <p>
            We aim to provide a reliable and high-quality service, but we do not
            guarantee uninterrupted availability. We may modify, suspend, or
            discontinue parts of the Services at any time, including to perform
            maintenance, improve functionality, or comply with legal
            requirements.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            9. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, SportPlatform and its
            owners, partners, and collaborators shall not be liable for any
            indirect, incidental, consequential, or special damages arising out
            of or in connection with your use of the Services, including but not
            limited to loss of data, loss of performance, or injuries related to
            physical activity.
          </p>
          <p>
            Our total liability for any claim related to the Services shall be
            limited, to the extent permitted by law, to the amount you have paid
            (if any) for access to SportPlatform during the twelve (12) months
            preceding the event giving rise to the claim.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            10. Termination
          </h2>
          <p>
            You may stop using the Services at any time and may request the
            deletion of your account. We may suspend or terminate your access to
            the Services if we reasonably believe that you have violated these
            Terms, engaged in fraudulent or abusive behavior, or compromised the
            security or integrity of the platform.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            11. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time to reflect changes in
            our Services, legal requirements, or business practices. When we
            make material changes, we will update the &quot;Last updated&quot;
            date at the top of this page. Your continued use of the Services
            after changes become effective constitutes acceptance of the
            updated Terms.
          </p>

          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginTop: "10px" }}
          >
            12. Contact
          </h2>
          <p>
            If you have any questions about these Terms or about SportPlatform,
            you can contact us at:
          </p>
          <p>
            <strong>SportPlatform</strong>
            <br />
            Email: support@sportplatform.app
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              marginTop: "8px",
            }}
          >
            These Terms of Use are provided for general informational purposes
            and do not constitute legal advice. You should consult legal counsel
            to ensure compliance with applicable laws in your jurisdiction.
          </p>
        </section>
      </div>
    </main>
  );
}
