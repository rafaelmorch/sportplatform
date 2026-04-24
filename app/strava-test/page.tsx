import MembershipStravaDashboard from "@/components/MembershipStravaDashboard";

export default function StravaTestPage() {
  return (
    <main style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ color: "#0f172a" }}>Strava Test</h1>

      <MembershipStravaDashboard communityId="b4a0739e-cd0e-4d52-bb85-abf4afac2c25" />
    </main>
  );
}
