"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import Link from "next/link";
import JourneyLevelCard from "@/components/membership/JourneyLevelCard";
import CommunityFeed from "@/components/membership/CommunityFeed";
import BadgesChallenges from "@/components/membership/BadgesChallenges";
import TriathlonChallenges from "@/components/membership/TriathlonChallenges";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { syncHealthConnect } from "@/lib/integrations/health-connect";

export const dynamic = "force-dynamic";

type CommunityRow = {
  id: string;
  name: string | null;
  created_by: string | null;
  journey_title: string | null;
};

type HighlightRow = {
  id: string;
  community_id: string;
  type: string | null;
  title: string;
  content: string | null;
  content_rich: { html?: string } | null;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  link_label: string | null;
  expires_at: string | null;
  created_at: string;
};

type CheckinRow = {
  id: string;
  community_id: string;
  user_id: string;
  author_name: string | null;
  activity_type: string;
  comment: string | null;
  image_url: string | null;
  image_path: string | null;
  points: number;
  created_at: string;
  challenge_id?: string | null;
  is_disregarded: boolean;
  disregarded_at: string | null;
  disregarded_by: string | null;
};

type RankingRow = {
  user_id: string;
  author_name: string;
  total_points: number;
  total_checkins: number;
  streak: number;
};

type LeaderRow = {
  user_id: string;
  author_name: string;
  total_points: number;
  total_checkins: number;
};

type ChallengeRow = {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  activity_type: string;
  goal_criteria: string | null;
  deadline: string;
  points_active: number;
  points_late: number;
  is_active: boolean;
  runner_level: string | null;
  validation_method: string | null;
  created_at: string;
};

type ProfileMini = {
  id: string;
  full_name: string | null;
  is_admin?: boolean | null;
};

function getTypeLabel(type: string | null): string {
  switch ((type || "").toLowerCase()) {
    case "announcement":
      return "Announcement";
    case "weekly_plan":
      return "Weekly Plan";
    case "challenge":
      return "Challenge";
    case "result":
      return "Result";
    case "update":
      return "Update";
    default:
      return "Highlight";
  }
}

function getTypeBadgeStyle(type: string | null): React.CSSProperties {
  switch ((type || "").toLowerCase()) {
    case "announcement":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
      };
    case "weekly_plan":
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
      };
    case "challenge":
      return {
        background: "#fef3c7",
        color: "#b45309",
        border: "1px solid #fcd34d",
      };
    case "result":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #c4b5fd",
      };
    case "update":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
      };
    default:
      return {
        background: "#e2e8f0",
        color: "#334155",
        border: "1px solid #cbd5e1",
      };
  }
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (Number.isNaN(time)) return false;
  return time < Date.now();
}

function getInitials(name: string | null): string {
  if (!name) return "AT";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getAvatarBackground(seed: string): string {
  const palettes = [
    "radial-gradient(circle at 30% 30%, #38bdf8, #0f172a)",
    "radial-gradient(circle at 30% 30%, #22c55e, #0f172a)",
    "radial-gradient(circle at 30% 30%, #f59e0b, #0f172a)",
    "radial-gradient(circle at 30% 30%, #a78bfa, #0f172a)",
    "radial-gradient(circle at 30% 30%, #fb7185, #0f172a)",
  ];

  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return palettes[sum % palettes.length];
}

function getDisplayName(name: string | null): string {
  return name?.trim() ? name.trim() : "Athlete";
}

function formatActivityType(value: string): string {
  if (!value) return "Activity";
  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isCurrentMonth(dateString: string): boolean {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function toLocalDateKey(dateString: string): string | null {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStreakFromRows(rows: Array<{ created_at: string }>): number {
  const uniqueDays = Array.from(
    new Set(
      rows
        .map((row) => toLocalDateKey(row.created_at))
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDays.length === 0) return 0;

  let streak = 1;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = new Date(`${uniqueDays[i - 1]}T00:00:00`);
    const curr = new Date(`${uniqueDays[i]}T00:00:00`);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function formatEndsLabel(deadline: string): string {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return "Ends soon";
  return `Ends ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}


function getRunnerLevelLabel(level: string | null): string {
  switch ((level || "yellow").toLowerCase()) {
    case "orange":
      return "Orange";
    case "purple":
      return "Purple";
    case "dark_blue":
      return "Dark Blue";
    case "yellow":
    default:
      return "Yellow";
  }
}

function getRunnerLevelBadgeStyle(level: string | null): React.CSSProperties {
  switch ((level || "yellow").toLowerCase()) {
    case "orange":
      return { background: "#ffedd5", color: "#9a3412", border: "1px solid #fdba74" };
    case "purple":
      return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe" };
    case "dark_blue":
      return { background: "#dbeafe", color: "#1e3a8a", border: "1px solid #93c5fd" };
    case "yellow":
    default:
      return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" };
  }
}

function isChallengeExpired(deadline: string): boolean {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function sortChallenges(rows: ChallengeRow[]): ChallengeRow[] {
  return [...rows].sort((a, b) => {
    const aExpired = isChallengeExpired(a.deadline);
    const bExpired = isChallengeExpired(b.deadline);

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    const aTime = new Date(a.deadline).getTime();
    const bTime = new Date(b.deadline).getTime();

    if (!aExpired && !bExpired) {
      return aTime - bTime;
    }

    return bTime - aTime;
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function getHighlightPreview(item: HighlightRow): string {
  const rich = item.content_rich?.html ? stripHtml(item.content_rich.html) : "";
  const plain = item.content?.trim() || "";
  const base = rich || plain;

  if (!base) return "Open to view details.";
  return base.length > 120 ? `${base.slice(0, 120).trim()}...` : base;
}

export default function MembershipInsidePage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const params = useParams();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [journeyTitle, setJourneyTitle] = useState("Runner Journey");
  const [canManageHighlights, setCanManageHighlights] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
const [activityProvider, setActivityProvider] = useState<"strava" | "garmin" | "health_connect" | null>(null);
const [syncingActivities, setSyncingActivities] = useState(false);
  const [hasVideos, setHasVideos] = useState(false);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
const [checkinsLoading, setCheckinsLoading] = useState(true);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRow[]>([]);
  const [checkinTotalCount, setCheckinTotalCount] = useState(0);
  const [openCheckinImages, setOpenCheckinImages] = useState<Set<string>>(new Set());
  const [checkinActionId, setCheckinActionId] = useState<string | null>(null);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [runnerCurrentLevel, setRunnerCurrentLevel] = useState("yellow");

  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);

  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderRow, setLeaderRow] = useState<LeaderRow | null>(null);

  const [myStreak, setMyStreak] = useState(0);

  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);

  const yellowChallenges = challenges.filter((challenge) => (challenge.runner_level || "yellow") === "yellow");
  const orangeChallenges = challenges.filter((challenge) => challenge.runner_level === "orange");
  const purpleChallenges = challenges.filter((challenge) => challenge.runner_level === "purple");
  const darkBlueChallenges = challenges.filter((challenge) => challenge.runner_level === "dark_blue");

  const currentRunnerLevel = runnerCurrentLevel;
  const currentLevelChallenges = yellowChallenges;
  const currentLevelCompleted = 0;
  const currentLevelTotal = currentLevelChallenges.length;

  const [openChallenges, setOpenChallenges] = useState<Set<string>>(new Set());

  const dividerSectionStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(226,232,240,0.9)",
    paddingTop: 24,
  };

  async function loadVideosFlag(targetCommunityId: string) {
    const { data, error } = await supabase
      .from("app_membership_videos")
      .select("id")
      .eq("community_id", targetCommunityId)
      .eq("is_published", true)
      .limit(1);

    if (error) {
      console.error("Error loading membership videos flag:", error);
      setHasVideos(false);
      return;
    }

    setHasVideos(Boolean(data && data.length > 0));
  }

  async function loadCheckins(targetCommunityId: string, currentUserId: string | null, canManageCommunity: boolean) {
    setCheckinsLoading(true);

    const { data, error } = await supabase
      .from("app_membership_checkins")
      .select("*")
      .eq("community_id", targetCommunityId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error loading membership check-ins:", error);
      setRecentCheckins([]);
      setCheckinTotalCount(0);
      setCheckinsLoading(false);
      return;
    }

    const rows = (data as CheckinRow[]) ?? [];

    const visibleRows = rows.filter((row) => {
      if (!row.is_disregarded) return true;
      if (canManageCommunity) return true;
      if (currentUserId && row.user_id === currentUserId) return true;
      return false;
    });

    const publicRows = rows.filter((row) => !row.is_disregarded);

    setRecentCheckins(visibleRows.slice(0, 5));
    setCheckinTotalCount(canManageCommunity ? visibleRows.length : publicRows.length);
    const completedIds = new Set(
  publicRows
    .filter((row) => currentUserId && row.user_id === currentUserId && row.challenge_id)
    .map((row) => row.challenge_id as string)
);

setCompletedChallengeIds(completedIds);
    setCheckinsLoading(false);
  }

  async function loadRanking(targetCommunityId: string, creatorId: string | null, currentUserId: string | null) {
    setRankingLoading(true);

    const [{ data: memberRequests, error: membersError }, { data: checkinData, error: checkinError }] =
      await Promise.all([
        supabase
          .from("app_membership_requests")
          .select("user_id")
          .eq("community_id", targetCommunityId)
          .eq("status", "approved"),
        supabase
          .from("app_membership_checkins")
          .select("user_id, author_name, points, created_at, is_disregarded")
          .eq("community_id", targetCommunityId),
      ]);

    if (membersError || checkinError) {
      console.error("Error loading membership ranking:", membersError || checkinError);
      setRankingRows([]);
      setMyStreak(0);
      setRankingLoading(false);
      return;
    }

    const approvedUserIds = Array.from(
      new Set(
        ((memberRequests as Array<{ user_id: string }> | null) ?? []).map((row) => row.user_id).filter(Boolean)
      )
    );

    if (creatorId && !approvedUserIds.includes(creatorId)) {
      approvedUserIds.unshift(creatorId);
    }

    const { data: memberProfiles } =
      approvedUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", approvedUserIds)
        : { data: [] as ProfileMini[] };

    const profileNameMap = new Map<string, string>();
    ((memberProfiles as ProfileMini[]) ?? []).forEach((profile) => {
      profileNameMap.set(profile.id, getDisplayName(profile.full_name));
    });

    const activeCheckins = ((checkinData as Array<{
      user_id: string;
      author_name: string | null;
      points: number;
      created_at: string;
      is_disregarded: boolean;
    }>) ?? []).filter((row) => !row.is_disregarded);

    const grouped = new Map<
      string,
      RankingRow & { rawRows: Array<{ created_at: string }> }
    >();

    approvedUserIds.forEach((memberId) => {
      grouped.set(memberId, {
        user_id: memberId,
        author_name: profileNameMap.get(memberId) ?? "Athlete",
        total_points: 0,
        total_checkins: 0,
        streak: 0,
        rawRows: [],
      });
    });

    activeCheckins.forEach((row) => {
      const existing = grouped.get(row.user_id);

      if (!existing) {
        grouped.set(row.user_id, {
          user_id: row.user_id,
          author_name: getDisplayName(row.author_name) || profileNameMap.get(row.user_id) || "Athlete",
          total_points: row.points ?? 0,
          total_checkins: 1,
          streak: 0,
          rawRows: [{ created_at: row.created_at }],
        });
        return;
      }

      existing.total_points += row.points ?? 0;
      existing.total_checkins += 1;
      existing.rawRows.push({ created_at: row.created_at });

      const bestName = profileNameMap.get(row.user_id) ?? getDisplayName(row.author_name);
      if (bestName && bestName !== "Athlete") {
        existing.author_name = bestName;
      }
    });

    const ranking = Array.from(grouped.values()).map((row) => ({
      user_id: row.user_id,
      author_name: row.author_name,
      total_points: row.total_points,
      total_checkins: row.total_checkins,
      streak: calculateStreakFromRows(row.rawRows),
    }));

    ranking.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.total_checkins !== a.total_checkins) return b.total_checkins - a.total_checkins;
      return a.author_name.localeCompare(b.author_name);
    });

    setRankingRows(ranking);

    const mine = ranking.find((row) => row.user_id === currentUserId);
    setMyStreak(mine?.streak ?? 0);

    setRankingLoading(false);
  }

  async function loadLeaderOfMonth(targetCommunityId: string) {
    setLeaderLoading(true);

    const { data, error } = await supabase
      .from("app_membership_checkins")
      .select("user_id, author_name, points, created_at, is_disregarded")
      .eq("community_id", targetCommunityId);

    if (error || !data) {
      console.error("Error loading leader of the month:", error);
      setLeaderRow(null);
      setLeaderLoading(false);
      return;
    }

    const monthRows = (data as Array<{
      user_id: string;
      author_name: string | null;
      points: number;
      created_at: string;
      is_disregarded: boolean;
    }>)
      .filter((row) => !row.is_disregarded)
      .filter((row) => isCurrentMonth(row.created_at));

    if (monthRows.length === 0) {
      setLeaderRow(null);
      setLeaderLoading(false);
      return;
    }

    const grouped = new Map<string, LeaderRow>();

    monthRows.forEach((row) => {
      const existing = grouped.get(row.user_id);

      if (!existing) {
        grouped.set(row.user_id, {
          user_id: row.user_id,
          author_name: getDisplayName(row.author_name),
          total_points: row.points ?? 0,
          total_checkins: 1,
        });
        return;
      }

      existing.total_points += row.points ?? 0;
      existing.total_checkins += 1;

      if (existing.author_name === "Athlete" && getDisplayName(row.author_name) !== "Athlete") {
        existing.author_name = getDisplayName(row.author_name);
      }
    });

    const sorted = Array.from(grouped.values()).sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.total_checkins !== a.total_checkins) return b.total_checkins - a.total_checkins;
      return a.author_name.localeCompare(b.author_name);
    });

    setLeaderRow(sorted[0] ?? null);
    setLeaderLoading(false);
  }

  async function loadchallenges(targetCommunityId: string) {
    setChallengesLoading(true);

    const { data, error } = await supabase
      .from("app_membership_challenges")
      .select("*")
      .eq("community_id", targetCommunityId)
  .eq("is_badge", false)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error loading membership challenges:", error);
      setChallenges([]);
      setChallengesLoading(false);
      return;
    }

    const rows = sortChallenges((data as ChallengeRow[]) ?? []);
    setChallenges(rows);
    setChallengesLoading(false);
  }

  async function handleDisregardToggle(checkinId: string, shouldRestore: boolean) {
    if (!communityId || !userId || !canManageHighlights) return;

    setCheckinActionId(checkinId);

    const payload = shouldRestore
      ? {
          is_disregarded: false,
          disregarded_at: null,
          disregarded_by: null,
        }
      : {
          is_disregarded: true,
          disregarded_at: new Date().toISOString(),
          disregarded_by: userId,
        };

    const { error } = await supabase
      .from("app_membership_checkins")
      .update(payload)
      .eq("id", checkinId)
      .eq("community_id", communityId);

    if (error) {
      console.error("Error updating check-in disregard:", error);
      setCheckinActionId(null);
      return;
    }

    const { data: community } = await supabase
      .from("app_membership_communities")
      .select("created_by")
      .eq("id", communityId)
      .maybeSingle();

    await Promise.all([
      loadCheckins(communityId, userId, canManageHighlights),
      loadRanking(communityId, community?.created_by ?? null, userId),
      loadLeaderOfMonth(communityId),
    ]);

    setCheckinActionId(null);
  }

  useEffect(() => {
    async function checkAccessAndLoad() {
      const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

      if (!id || typeof id !== "string") {
        router.push("/memberships");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      await loadActivityProvider(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(profile?.full_name || null);
      setIsAdmin(profile?.is_admin === true);

      const { data: community } = await supabase
        .from("app_membership_communities")
        .select("id, name, created_by, journey_title")
        .eq("id", id)
        .single();

      if (!community) {
        router.push("/memberships");
        return;
      }

const typedCommunity = community as CommunityRow;
      const isCreator = typedCommunity.created_by === user.id;
      const canManageCommunity = profile?.is_admin === true || isCreator;

      if (!isCreator && profile?.is_admin !== true) {
        const { data: request } = await supabase
          .from("app_membership_requests")
          .select("status, subscription_status, stripe_subscription_id, current_period_end")
          .eq("community_id", id)
          .eq("user_id", user.id)
          .maybeSingle();


        setStripeSubscriptionId(request?.stripe_subscription_id ?? null);
        setSubscriptionStatus(request?.subscription_status ?? null);
        setCurrentPeriodEnd(request?.current_period_end ?? null);

        const hasValidAccess =
          request &&
          request.status === "active" &&
          ["active", "trialing"].includes(request.subscription_status ?? "");

        if (!hasValidAccess) {
          router.replace(`/groups/pending?community_id=${id}`);
          return;
        }

        const { data: healthForm, error: healthFormError } = await supabase
          .from("app_membership_health_forms")
          .select("id")
          .eq("community_id", id)
          .eq("user_id", user.id)
          .eq("answers_certified", true)
          .eq("waiver_accepted", true)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (healthFormError) {
          console.error("Error checking Health & Safety form:", healthFormError);
        }

        if (!healthForm) {
          router.replace(`/groups/${id}/health`);
          return;
        }
      }
      const { data: runnerProgress } = await supabase
        .from("app_membership_runner_progress")
        .select("current_level")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (runnerProgress?.current_level) {
        setRunnerCurrentLevel(runnerProgress.current_level);
      } else {
        await supabase.from("app_membership_runner_progress").insert({
          community_id: id,
          user_id: user.id,
          current_level: "yellow",
        });
        setRunnerCurrentLevel("yellow");
      }

      const { data: highlightRows } = await supabase
        .from("app_membership_highlights")
        .select(`
          id,
          community_id,
          type,
          title,
          content,
          content_rich,
          image_url,
          video_url,
          link_url,
          link_label,
          expires_at,
          created_at
        `)
        .eq("community_id", id)
        .order("created_at", { ascending: false });

      const visibleHighlights = ((highlightRows as HighlightRow[] | null) || []).filter(
        (item) => !isExpired(item.expires_at)
      );

      setCommunityId(id);
      setCommunityName(typedCommunity.name || null);
      setJourneyTitle(typedCommunity.journey_title || "Runner Journey");
      setCanManageHighlights(canManageCommunity);
      setHighlights(visibleHighlights);

      await Promise.all([
        loadCheckins(id, user.id, canManageCommunity),
        loadRanking(id, typedCommunity.created_by ?? null, user.id),
        loadLeaderOfMonth(id),
        loadchallenges(id),
        loadVideosFlag(id),
      ]);

      setAllowed(true);
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [params, supabase, router]);


  
async function loadActivityProvider(targetUserId: string) {
  try {
    const [
      { data: stravaRow, error: stravaError },
      { data: activitySource, error: activitySourceError },
    ] = await Promise.all([
      supabase
        .from("strava_tokens")
        .select("athlete_id")
        .eq("user_id", targetUserId)
        .maybeSingle(),

      supabase
        .from("user_activity_source")
        .select("provider")
        .eq("user_id", targetUserId)
        .maybeSingle(),
    ]);

    if (stravaError) {
      console.error("Error checking Strava connection:", stravaError);
    }

    if (activitySourceError) {
      console.error("Error checking activity source:", activitySourceError);
    }

    if (activitySource?.provider === "health_connect") {
      setActivityProvider("health_connect");
      return;
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!sessionError && sessionData.session?.access_token) {
      try {
        const garminResponse = await fetch("/api/garmin/status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (garminResponse.ok) {
          const garminJson = await garminResponse.json();

          if (garminJson?.connected) {
            setActivityProvider("garmin");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking Garmin connection:", error);
      }
    }

    if (stravaRow?.athlete_id) {
      setActivityProvider("strava");
      return;
    }

    setActivityProvider(null);
  } catch (error) {
    console.error("Error loading activity provider:", error);
    setActivityProvider(null);
  }
}

async function handleSyncActivities() {
  if (!activityProvider || activityProvider === "garmin") {
    return;
  }

  try {
    setSyncingActivities(true);

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token ?? null;

    if (!accessToken) {
      throw new Error("You need to be logged in to sync activities.");
    }

    if (activityProvider === "strava") {
      const response = await fetch("/api/strava/sync", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.message ?? "Could not sync activities."
        );
      }
    }

    if (activityProvider === "health_connect") {
      await syncHealthConnect(accessToken);
    }

    window.location.reload();
  } catch (error) {
    console.error("Error syncing activities:", error);

    window.alert(
      error instanceof Error
        ? error.message
        : "Unexpected error while syncing activities."
    );
  } finally {
    setSyncingActivities(false);
  }
}
async function handleCancelSubscription() {
    if (!communityId || !userId || !stripeSubscriptionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will lose access to this membership."
    );

    if (!confirmed) return;

    setCancelingSubscription(true);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          community_id: communityId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription.");
      }

      router.replace(`/groups/pending?community_id=${communityId}`);
    } catch (error) {
      console.error("Cancel subscription failed:", error);
      window.alert("We could not cancel your subscription. Please try again.");
      setCancelingSubscription(false);
    }
  }

function toggleCheckinImage(checkinId: string) {
    setOpenCheckinImages((prev) => {
      const copy = new Set(prev);
      if (copy.has(checkinId)) {
        copy.delete(checkinId);
      } else {
        copy.add(checkinId);
      }
      return copy;
    });
  }

  function toggleChallenge(challengeId: string) {
    setOpenChallenges((prev) => {
      const copy = new Set(prev);
      if (copy.has(challengeId)) {
        copy.delete(challengeId);
      } else {
        copy.add(challengeId);
      }
      return copy;
    });
  }

  if (loading) return null;
  if (!allowed) return null;

  const orderedRanking = rankingRows;

return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #000 !important;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }

        * {
          box-sizing: border-box;
        }

        .page { position: relative; } .page::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 190px; background: var(--group-header-image) center center / cover no-repeat; z-index: 0; } .page > * { position: relative; z-index: 1; } .page * {
          font-family: "Montserrat", Arial, sans-serif;
        }

        .highlight-rich-content {
          color: #0f172a;
          line-height: 1.8;
          font-size: 15px;
          word-break: break-word;
        }

        .highlight-rich-content p,
        .highlight-rich-content li,
        .highlight-rich-content h1,
        .highlight-rich-content h2,
        .highlight-rich-content h3,
        .highlight-rich-content h4,
        .highlight-rich-content h5,
        .highlight-rich-content h6,
        .highlight-rich-content span,
        .highlight-rich-content div {
          max-width: 100%;
          word-break: break-word;
        }

        .highlight-rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }

        .highlight-rich-content iframe {
          max-width: 100%;
          border: 0;
          border-radius: 12px;
        }.membership-checkin-scroll {
          max-height: 420px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .membership-checkin-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .membership-checkin-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .membership-checkin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        @media (max-width: 640px) {
          .membership-feed-shell::before,
          .membership-feed-shell::after {
            width: 24px;
          }

          .membership-feed-carousel,
          .membership-challenge-carousel {
            gap: 12px;
            padding: 8px 14px 18px 14px;
            margin: 0 -14px;
            scroll-padding-left: calc(50% - 140px);
            scroll-padding-right: calc(50% - 140px);
          }

          .membership-feed-carousel::before,
          .membership-feed-carousel::after,
          .membership-challenge-carousel::before,
          .membership-challenge-carousel::after {
            flex: 0 0 max(4px, calc(50% - 140px));
          }

          .membership-feed-card,
          .membership-challenge-card {
            flex: 0 0 280px;
            width: 280px;
            max-width: 280px;
          }

          .membership-checkin-scroll {
            max-height: 360px;
          }
        }
      `}</style>

      <main
        className="page"
        style={{
          "--group-header-image": communityName?.toLowerCase().includes("triathlon")
            ? 'url("/images/groups/triathlon-background.png")'
            : 'url("/images/groups/groups-background.png")',
          minHeight: "100vh",
          background: "#ffffff",
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          overflowX: "hidden",
        } as React.CSSProperties & { "--group-header-image": string }}
      >
<div
  style={{
    width: "100%",
    margin: "0 0 16px 0",
    paddingLeft: 18,
    paddingRight: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <BackArrow href="/groups" />

  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
  <a
    href="/integrations"
    style={{
      backgroundColor: activityProvider ? "#ffffff" : "#f97316",
      color: activityProvider ? "#0f172a" : "#ffffff",
      border: activityProvider ? "1px solid #cbd5e1" : "1px solid #f97316",
      padding: "8px 14px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      textDecoration: "none",
      boxShadow: activityProvider
        ? "0 3px 10px rgba(15,23,42,0.08)"
        : "none",
    }}
  >
    {activityProvider === "garmin"
      ? "Garmin Connected"
      : activityProvider === "strava"
        ? "Strava Connected"
        : activityProvider === "health_connect"
          ? "Health Connect Connected"
          : "Connect Device"}
  </a>

  {(activityProvider === "strava" ||
    activityProvider === "health_connect") && (
    <button
      type="button"
      onClick={handleSyncActivities}
      disabled={syncingActivities}
      style={{
        border: "1px solid #cbd5e1",
        background: "#ffffff",
        color: "#0f172a",
        padding: "7px 12px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        cursor: syncingActivities ? "default" : "pointer",
        opacity: syncingActivities ? 0.65 : 1,
        boxShadow: "0 3px 10px rgba(15,23,42,0.08)",
      }}
    >
      {syncingActivities ? "Syncing..." : "Sync Activities"}
    </button>
  )}

  {activityProvider === "garmin" && (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: "#ffffff",
        textShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }}
    >
      Automatic Sync
    </div>
  )}
</div>
</div>
<div
          style={{
            maxWidth: "100%",
            margin: "0",
           borderRadius: 0,
padding: "clamp(18px, 3vw, 24px)",
border: "none",
background: "transparent",
overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                fontSize: "clamp(34px, 6vw, 42px)",
fontWeight: 700,
                margin: 0,
                color: communityName?.toLowerCase().includes("triathlon") ? "#ffffff" : "#0f172a",
                lineHeight: 1.15,
              }}
            >
              {communityName}
            </h1>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {canManageHighlights && communityId && (
                <Link
                  href={`/groups/${communityId}/inside/challenges/new`}
                  style={{
                    textDecoration: "none",
                    borderRadius: 999,
                    padding: "10px 16px",
                    background: "#eef2f6",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    fontWeight: 700,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  New Challenge
                </Link>
              )}

              {canManageHighlights && communityId && (
                <Link
                  href={`/groups/${communityId}/inside/highlights/new`}
                  style={{
                    textDecoration: "none",
                    borderRadius: 999,
                    padding: "10px 16px",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  New Highlight
                </Link>
              )}
            </div>
          </div>

          {communityId && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 4,
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 22,
                flexWrap: "nowrap",
                maxWidth: "100%",
                padding: "6px 0 8px 0",
              }}
            >
              <Link
                href="/intro"
                style={{
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "7px 8px 9px",
                  borderRadius: 6,
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "1px solid #0f172a",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  position: "relative",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.18)",
                }}
              >
                Home
                <span
                  style={{
                    position: "absolute",
                    left: "28%",
                    right: "28%",
                    bottom: 5,
                    height: 3,
                    borderRadius: 999,
                    background: "#facc15",
                  }}
                />
              </Link>

              <Link
                href={`/groups/${communityId}/inside/chat`}
                style={{
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "7px 8px",
                  borderRadius: 6,
                  background: "#ffffff",
                  border: "1px solid #94a3b8",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Chat
              </Link>
              <Link
                href={`/groups/${communityId}/inside/feed`}
                style={{
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "7px 8px",
                  borderRadius: 6,
                  background: "#ffffff",
                  border: "1px solid #94a3b8",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Feed
              </Link>

              <Link
                href={`/groups/${communityId}/inside/performance`}
                style={{
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "7px 8px",
                  borderRadius: 6,
                  background: "#ffffff",
                  border: "1px solid #94a3b8",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Performance
              </Link>

              <Link
                href={`/groups/${communityId}/inside/events`}
                style={{
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "7px 8px",
                  borderRadius: 6,
                  background: "#ffffff",
                  border: "1px solid #94a3b8",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Events
              </Link>

              {hasVideos && (
                <Link
                  href={`/groups/${communityId}/inside/videos`}
                  style={{
                    textDecoration: "none",
                    color: "#0f172a",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "7px 8px",
                    borderRadius: 6,
                    background: "#ffffff",
                    border: "1px solid #94a3b8",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Videos
                </Link>
              )}
            </div>
          )}

                    {communityId && communityName?.toLowerCase().includes("triathlon") && (
            <TriathlonChallenges
              communityId={communityId}
              userId={userId}
            />
          )}

          <div
  style={{
    marginBottom: 28,
    display: communityName?.toLowerCase().includes("triathlon")
      ? "none"
      : "block",
  }}
>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    color: "#0f172a",
                  }}
                >
                  {journeyTitle}
                </h2>
                <div style={{ color: "#334155", fontSize: 13 }}>
                  Complete all challenges in your level to earn your runner shirt.
                </div>

                {isAdmin && communityId && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/groups/${communityId}/inside/challenges/proofs`)
                      }
                      style={{
                        border: "0",
                        borderRadius: 999,
                        padding: "9px 13px",
                        background: "#0f172a",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      ✅ Review Proofs
                    </button>
                  </div>
                )}
              </div>
            </div>


            {challengesLoading ? (
              <div style={{ color: "#334155", fontSize: 14 }}>Loading challenges...</div>
            ) : challenges.length === 0 ? (
              <div
                style={{
                  borderRadius: 0,
                  padding: 18,
                  background: "#eef2f6",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                No challenges yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <JourneyLevelCard
  communityId={communityId ?? undefined}
  title="🟨 Yellow Shirt"
  label="CURRENT SHIRT"
  challenges={yellowChallenges}
  completedCount={
    yellowChallenges.filter((challenge) =>
      completedChallengeIds.has(challenge.id)
    ).length
  }
    completedChallengeIds={completedChallengeIds}
/>

                <JourneyLevelCard
  communityId={communityId ?? undefined}
  locked={!isAdmin && !["orange", "purple", "dark_blue"].includes(runnerCurrentLevel)}
  title="🟧 Orange Shirt"
  label="NEXT LEVEL"
  challenges={orangeChallenges}
  completedCount={
    orangeChallenges.filter((challenge) =>
      completedChallengeIds.has(challenge.id)
    ).length
  }
    completedChallengeIds={completedChallengeIds}
/>

                <JourneyLevelCard
  communityId={communityId ?? undefined}
  locked={!isAdmin && !["purple", "dark_blue"].includes(runnerCurrentLevel)}
  title="🟪 Purple Shirt"
  label="ADVANCED LEVEL"
  challenges={purpleChallenges}
  completedCount={
    purpleChallenges.filter((challenge) =>
      completedChallengeIds.has(challenge.id)
    ).length
  }
    completedChallengeIds={completedChallengeIds}
/>

<JourneyLevelCard
  communityId={communityId ?? undefined}
  locked={!isAdmin && runnerCurrentLevel !== "dark_blue"}
  title="🟦 Dark Blue Shirt"
  label="ELITE LEVEL"
  challenges={darkBlueChallenges}
  completedCount={
    darkBlueChallenges.filter((challenge) =>
      completedChallengeIds.has(challenge.id)
    ).length
  }
    completedChallengeIds={completedChallengeIds}
/>
              </div>
            )}

          </div>

          <div style={{ height: 24, background: "#ffffff" }} />

          {communityId && (
            <div
              style={{
                background: "#f3f4f6",
                padding: "14px 0 0",
                marginBottom: 0,
                marginLeft: -16,
                marginRight: -16,
              }}
            >
              <BadgesChallenges
                communityId={communityId}
                userId={userId}
                userName={userName}
              />
            </div>
          )}

          <div
  style={{
    ...dividerSectionStyle,
    marginBottom: 28,
    borderRadius: 0,
    padding: 16,
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  }}
>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    color: "#0f172a",
                  }}
                >
                  Highlights
                </h2>
              </div>
            </div>

            {highlights.length === 0 ? (
              <div
                style={{
                  borderRadius: 0,
                  padding: 18,
                  background: "#eef2f6",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                No active highlights right now.
              </div>
            ) : (
              <div style={{ borderTop: "1px solid #e2e8f0" }}>
                {highlights.map((item) => (
                  <Link
                    key={item.id}
                    href={`/groups/${communityId}/inside/highlights/${item.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "92px minmax(0, 1fr)",
                      gap: 14,
                      alignItems: "center",
                      padding: "14px 0",
                      textDecoration: "none",
                      color: "inherit",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: 92,
                        height: 68,
                        borderRadius: 0,
                        overflow: "hidden",
                        background: "#eef2f7",
                        border: "1px solid #dbe2ea",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#334155",
                            fontWeight: 700,
                            textAlign: "center",
                            padding: 6,
                          }}
                        >
                          Highlight
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      ></div>

                      <div
                        style={{
                          fontSize: 15, fontWeight: 700, color: "#94a3b8", lineHeight: 1.25, marginBottom: 4, textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          fontSize: 15, color: "#000000", lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word",
                        }}
                      >
                        {getHighlightPreview(item)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>



{/* 
          <div style={{ ...dividerSectionStyle, marginBottom: 22 }}>
            {leaderLoading ? (
              <div style={{ color: "#334155", fontSize: 14 }}>Loading leader...</div>
            ) : leaderRow ? (
              <div
                style={{
                  borderRadius: 26,
                  padding: "18px 20px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #ffffff 100%)",
                  border: "1px solid #fcd34d",
                                    display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 999,
                      background: getAvatarBackground(leaderRow.author_name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f8fafc",
                      fontWeight: 800,
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(leaderRow.author_name)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#b45309",
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Leader of the Month
                    </div>

                    <div
                      style={{
                        fontSize: "clamp(18px, 3vw, 24px)",
                        fontWeight: 800,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 4,
                      }}
                    >
                      {leaderRow.author_name}
                    </div>

                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {leaderRow.total_checkins} check-in{leaderRow.total_checkins === 1 ? "" : "s"} this month
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px solid #fcd34d",
                    color: "#b45309",
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {leaderRow.total_points} pts
                </div>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  fontSize: 14,
                }}
              >
                No leader yet for this month. The first completed check-in of the month will start the race.
              </div>
            )}
          // </div> */}
{/* 
          <div
            style={{
              ...dividerSectionStyle,
              marginBottom: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 22,
                padding: 16,
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 6,
                }}
              >
                Your streak
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {myStreak} 🔥
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Consecutive active day{myStreak === 1 ? "" : "s"} based on your check-ins.
              </div>
            </div>

            <div
              style={{
                borderRadius: 22,
                padding: 16,
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                borderBottom: "1px solid #e2e8f0",
                             }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#16a34a",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 6,
                }}
              >
                Community pulse
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {checkinTotalCount}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Total visible check-ins registered by this membership.
              </div>
            </div>
          </div> */}

          {/* <div
  style={{
    ...dividerSectionStyle,
    marginBottom: 28,
    borderRadius: 0,
    padding: 16,
    background: "#eef2f6",
    borderBottom: "1px solid #e2e8f0",
  }}
>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    color: "#0f172a",
                  }}
                >
                  Check-in
                </h2>
                <div style={{ color: "#334155", fontSize: 13 }}>
                  Register your activity and earn points for the ranking.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
          {communityId && (
                  <Link
                    href={`/groups/${communityId}/inside/checkins`}
                    style={{
                      textDecoration: "none",
                      borderRadius: 999,
                      padding: "10px 16px",
                      background: "#e2e8f0",
                      color: "#0f172a",
                      fontWeight: 700,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    View History
                  </Link>
                )}

          {communityId && (
                  <Link
                    href={`/groups/${communityId}/inside/checkin/new`}
                    style={{
                      textDecoration: "none",
                      borderRadius: 999,
                      padding: "10px 16px",
                      background: "#0f172a",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    New Check-in
                  </Link>
                )}
              </div>
            </div>

            {checkinsLoading ? (
              <div style={{ color: "#334155", fontSize: 14 }}>Loading check-ins...</div>
            ) : recentCheckins.length === 0 ? (
              <div
                style={{
                  borderRadius: 0,
                  padding: 18,
                  background: "#eef2f6",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                No check-ins yet. Start registering activities to build the ranking.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "3px 8px",
                      background: "#dcfce7",
                      color: "#166534",
                      border: "1px solid #86efac",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {checkinTotalCount} visible check-in{checkinTotalCount === 1 ? "" : "s"}
                  </div>

                  <div
                    style={{
                      borderRadius: 999,
                      padding: "3px 8px",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      border: "1px solid #93c5fd",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Ranking ignores disregarded entries
                  </div>
                </div>

                <div className="membership-checkin-scroll">
                  <div style={{ display: "grid", gap: 6 }}>
                    {recentCheckins.map((item) => {
                      const authorLabel = getDisplayName(item.author_name);
                      const isImageOpen = openCheckinImages.has(item.id);
                      const isChallengeCheckin = Boolean(item.challenge_id);
                      const isMine = item.user_id === userId;

                      return (
                        <article
                          key={item.id}
                          style={{
                            borderRadius: 0,
                            padding: "8px 0",
                            background: item.is_disregarded
                              ? "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)"
                              : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 999,
                                  background: getAvatarBackground(authorLabel),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#f8fafc",
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(authorLabel)}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {authorLabel}
                                </div>

                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "#334155",
                                  }}
                                >
                                  {new Date(item.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  borderRadius: 999,
                                  padding: "3px 8px",
                                  background: "#ede9fe",
                                  color: "#6d28d9",
                                  border: "1px solid #c4b5fd",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatActivityType(item.activity_type)}
                              </div>

                              {isChallengeCheckin && (
                                <div
                                  style={{
                                    borderRadius: 999,
                                    padding: "3px 8px",
                                    background: "#dbeafe",
                                    color: "#1d4ed8",
                                    border: "1px solid #93c5fd",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Challenge
                                </div>
                              )}

                              <div
                                style={{
                                  borderRadius: 999,
                                  padding: "3px 8px",
                                  background: item.is_disregarded ? "#fee2e2" : "#fef3c7",
                                  color: item.is_disregarded ? "#b91c1c" : "#b45309",
                                  border: item.is_disregarded ? "1px solid #fca5a5" : "1px solid #fcd34d",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.is_disregarded ? "Disregarded" : `+${item.points} pts`}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: 4,
                            }}
                          >
                            <div
                              style={{
                                color: "#475569",
                                fontSize: 12,
                                lineHeight: 1.35,
                              }}
                            >
                              {item.comment?.trim()
                                ? item.comment
                                : isChallengeCheckin
                                ? "Challenge proof submitted."
                                : "Workout proof submitted."}
                            </div>

                            {item.is_disregarded && (
                              <div
                                style={{
                                  borderRadius: 14,
                                  padding: "10px 12px",
                                  background: "#fff7ed",
                                  border: "1px solid #fdba74",
                                  color: "#9a3412",
                                  fontSize: 12,
                                  lineHeight: 1.55,
                                }}
                              >
                                {isMine
                                  ? "This check-in was disregarded by an admin and is hidden from other members."
                                  : "This check-in is currently disregarded and hidden from regular members."}
                              </div>
                            )}

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              {item.image_url ? (
                                <button
                                  type="button"
                                  onClick={() => toggleCheckinImage(item.id)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#2563eb",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  {isImageOpen ? "Hide photo" : "View photo"}
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: "#64748b" }}>No photo attached</span>
                              )}

                              {canManageHighlights && (
                                <button
                                  type="button"
                                  onClick={() => handleDisregardToggle(item.id, item.is_disregarded)}
                                  disabled={checkinActionId === item.id}
                                  style={{
                                    border: item.is_disregarded ? "1px solid #86efac" : "1px solid #fdba74",
                                    background: item.is_disregarded ? "#f0fdf4" : "#fff7ed",
                                    color: item.is_disregarded ? "#166534" : "#9a3412",
                                    borderRadius: 999,
                                    padding: "8px 12px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    opacity: checkinActionId === item.id ? 0.7 : 1,
                                  }}
                                >
                                  {checkinActionId === item.id
                                    ? "Saving..."
                                    : item.is_disregarded
                                    ? "Add again"
                                    : "Disregard"}
                                </button>
                              )}
                            </div>
                          </div>

                          {isImageOpen && item.image_url && (
                            <div
                              style={{
                                marginTop: 12,
                                borderRadius: 18,
                                overflow: "hidden",
                                border: "1px solid #dbe2ea",
                                background: "#eef2f7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 8,
                              }}
                            >
                              <img
                                src={item.image_url}
                                alt="Check-in proof"
                                style={{
                                  width: "100%",
                                  maxHeight: 300,
                                  objectFit: "contain",
                                  display: "block",
                                  borderRadius: 0,
                                }}
                              />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div> */}
{/* 
          <div style={dividerSectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                    color: "#0f172a",
                  }}
                >
                  Ranking
                </h2>
                <div style={{ color: "#334155", fontSize: 13 }}>
                  Community points based on completed visible check-ins.
                </div>
              </div>
            </div>

            {rankingLoading ? (
              <div style={{ color: "#334155", fontSize: 14 }}>Loading ranking...</div>
            ) : rankingRows.length === 0 ? (
              <div
                style={{
                  borderRadius: 0,
                  padding: 18,
                  background: "#eef2f6",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                No ranking yet. Check-ins will appear here as soon as members start posting.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 22,
                  overflow: "hidden",
                  borderBottom: "1px solid #e2e8f0",
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                                  }}
              >
                {orderedRanking.map((row, index) => {
                  const authorLabel = getDisplayName(row.author_name);
                  const isTopThree = index < 3;
                  const rankLabel = index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`;

                  return (
                    <div
                      key={row.user_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "64px minmax(0, 1fr) auto",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderBottom:
                          index === orderedRanking.length - 1 ? "none" : "1px solid #eef2f7",
                        background: isTopThree
                          ? "linear-gradient(90deg, rgba(254,243,199,0.55) 0%, rgba(255,255,255,0) 100%)"
                          : "transparent",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: isTopThree ? "#b45309" : "#64748b",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {rankLabel}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            background: getAvatarBackground(authorLabel),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#f8fafc",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(authorLabel)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {authorLabel}
                          </div>

                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {row.total_checkins} check-in{row.total_checkins === 1 ? "" : "s"} • 🔥 {row.streak}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          borderRadius: 999,
                          padding: "8px 12px",
                          background: "#dcfce7",
                          color: "#166534",
                          border: "1px solid #86efac",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.total_points} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div> */}
          {!canManageHighlights && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/profile")}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                }}
              >
                Manage Subscription
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}



















































