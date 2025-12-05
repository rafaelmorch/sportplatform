// app/about/page.tsx

export default function AboutPage() {
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
        padding: "120px 16px 40px", // espaço para o menu fixo do topo
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "820px",
          borderRadius: "24px",
          border: "1px solid #111827",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.94))",
          boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
          padding: "24px 24px 26px",
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
            ABOUT
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              marginBottom: "4px",
            }}
          >
            About SportPlatform
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            Training and performance ecosystem for runners, multi-sport
            athletes, and active families.
          </p>
        </header>

        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#d1d5db",
          }}
        >
          <p>
            <strong>SportPlatform</strong> is a training and performance
            ecosystem designed to support runners, multi-sport athletes, and
            active families through a modern and data-driven approach to health,
            fitness, and community engagement.
          </p>

          <p>
            We provide athletes with a centralized environment to monitor
            progress, join training groups, participate in challenges, and
            access tailored coaching insights. By integrating activity data with
            community-based training resources, SportPlatform helps athletes of
            all levels—from beginners to competitive performers—train smarter,
            stay motivated, and achieve long-term consistency.
          </p>

          <p>
            Our mission is to make structured training accessible, engaging, and
            rewarding for everyone. We believe that performance improves when
            athletes are supported by meaningful data, expert-designed programs,
            and a strong sense of community.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "10px",
              marginBottom: "2px",
            }}
          >
            What We Do
          </h2>

          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <li>Offer personalized and group-based training programs.</li>
            <li>
              Host outdoor fitness events, running clubs, and multi-sport
              activities.
            </li>
            <li>
              Provide dashboards and performance insights powered by real
              activity data.
            </li>
            <li>
              Foster a supportive environment for families, youth, and adults to
              stay active.
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
            Why Connect With Garmin
          </h2>

          <p>
            SportPlatform aims to integrate with Garmin’s ecosystem to deliver a
            richer and more seamless experience for athletes. Through this
            connection, users will be able to:
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
            <li>Sync their Garmin activity data into their SportPlatform profile.</li>
            <li>
              View performance metrics and trends within the SportPlatform
              dashboard.
            </li>
            <li>
              Access more precise insights and personalized training
              recommendations.
            </li>
          </ul>

          <p>
            This integration allows us to offer a complete, reliable, and
            advanced training experience backed by one of the most trusted names
            in the industry.
          </p>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "2px",
            }}
          >
            Our Commitment
          </h2>

          <p>
            SportPlatform is committed to data privacy, transparency, and the
            responsible use of athlete information. All personal and performance
            data handled within our platform is managed securely and in
            accordance with applicable guidelines.
          </p>
        </section>
      </div>
    </main>
  );
}
