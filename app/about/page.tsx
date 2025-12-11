import BackButton from "@/components/BackButton";

export default function AboutPage() {
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
        About SportsPlatform
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        SportsPlatform was created with a simple idea: make training, movement
        and healthy competition easier to access for everyone. We connect
        runners, multi-sport athletes, coaches and local communities in a single
        environment where training, data and events live together.
      </p>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        The platform combines performance data from services like Strava with
        structured training groups, challenges and events. Our goal is to turn
        your training history into something practical: clear dashboards,
        meaningful metrics and tools that help you stay consistent week after
        week.
      </p>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        SportsPlatform is being built step-by-step together with real athletes
        and families in the Orlando area and beyond. We focus on:
      </p>

      <ul
        style={{
          marginLeft: 18,
          marginBottom: 16,
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        <li>Accessible training for beginners and experienced athletes.</li>
        <li>Simple, visual dashboards to understand your progress.</li>
        <li>
          Group training, local challenges and community-driven outdoor events.
        </li>
        <li>
          A responsible and privacy-focused approach to sports and activity
          data.
        </li>
      </ul>

      <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 15 }}>
        We believe that sport is one of the most powerful tools to build
        discipline, confidence and connection between people. That is why
        SportsPlatform is not just about numbers on a screen; it is about
        creating experiences that motivate you to move more, feel better and
        stay engaged with a community that shares the same goals.
      </p>

      <p style={{ lineHeight: 1.7, fontSize: 15 }}>
        If you have ideas, questions or would like to collaborate with us, feel
        free to reach out at{" "}
        <strong>rafael.morch@sportsplatform.app</strong>. Your feedback helps
        shape the future of SportsPlatform.
      </p>
    </main>
  );
}
