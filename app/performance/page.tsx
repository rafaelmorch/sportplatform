// app/performance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function PerformancePage() {
  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [eventsSummary, setEventsSummary] = useState({
    availableEvents: 0,
    userEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const { data: activitiesData } = await supabaseBrowser
        .from("strava_activities")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(500);

      const { count: availableEvents } = await supabaseBrowser
        .from("events")
        .select("*", { head: true, count: "exact" });

      const { count: userEvents } = await supabaseBrowser
        .from("event_registrations")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", userId);

      setActivities(activitiesData ?? []);
      setEventsSummary({
        availableEvents: availableEvents ?? 0,
        userEvents: userEvents ?? 0,
      });

      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: 16, color: "#e5e7eb" }}>
        Carregando performance...
      </div>
    );
  }

  return (
    <main style={{ padding: 16, paddingBottom: 80 }}>
      <DashboardClient
        activities={activities}
        eventsSummary={eventsSummary}
      />
    </main>
  );
}
