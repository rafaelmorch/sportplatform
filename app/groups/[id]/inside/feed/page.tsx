"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import CommunityFeed from "@/components/membership/CommunityFeed";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function GroupFeedPage() {
  const params = useParams();
  const communityId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const supabase = supabaseBrowser;

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const fallbackName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        null;

      setUserName(profile?.full_name ?? fallbackName);
    }

    void loadUser();
  }, [supabase]);

  if (!communityId || typeof communityId !== "string") {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Montserrat, Arial, sans-serif",
        background: "#f8fafc",
        padding: "18px 16px 32px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <BackArrow href={`/groups/${communityId}/inside`} />
        </div>

        <CommunityFeed
          communityId={communityId}
          userId={userId}
          userName={userName}
        />
      </div>
    </main>
  );
}


