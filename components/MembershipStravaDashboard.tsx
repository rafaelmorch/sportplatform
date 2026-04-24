"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  communityId: string;
};

export default function MembershipStravaDashboard({ communityId }: Props) {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!communityId) return;

      setLoading(true);

      const { data: athletes } = await supabase
        .from("membership_strava_athletes")
        .select("athlete_id")
        .eq("community_id", communityId);

      const athleteIds = (athletes || []).map((a: any) => Number(a.athlete_id));

      if (athleteIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const { data: acts } = await supabase
        .from("strava_activities")
        .select("*")
        .in("athlete_id", athleteIds)
        .order("start_date", { ascending: false })
        .limit(10);

      setActivities(acts || []);
      setLoading(false);
    };

    load();
  }, [communityId]);

  if (loading) {
    return <div style={{ color: "#64748b" }}>Loading Strava data...</div>;
  }

  if (activities.length === 0) {
    return <div style={{ color: "#64748b" }}>No Strava activities yet.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {activities.map((a) => (
        <div key={a.id} style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>{a.name}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {a.distance ? (a.distance / 1000).toFixed(2) + " km" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

