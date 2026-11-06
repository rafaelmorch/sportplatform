import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing server configuration." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const token = authorization.slice(7).trim();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid user session." },
      { status: 401 }
    );
  }

  const [groupsResult, communitiesResult] = await Promise.all([
    supabase
      .from("app_groups")
      .select("id")
      .eq("created_by", user.id)
      .limit(1),
    supabase
      .from("app_membership_communities")
      .select("id")
      .eq("created_by", user.id)
      .limit(1),
  ]);

  if (groupsResult.error || communitiesResult.error) {
    return NextResponse.json(
      { error: "Unable to verify community ownership." },
      { status: 500 }
    );
  }

  if (
    (groupsResult.data?.length ?? 0) > 0 ||
    (communitiesResult.data?.length ?? 0) > 0
  ) {
    return NextResponse.json(
      {
        error:
          "Please transfer ownership of your groups or communities before deleting your account.",
      },
      { status: 409 }
    );
  }

  const { data: createdActivities, error: activitiesError } =
    await supabase
      .from("app_activities")
      .select("id")
      .eq("created_by", user.id);

  if (activitiesError) {
    return NextResponse.json(
      { error: "Unable to verify shared activities." },
      { status: 500 }
    );
  }

  const activityIds = (createdActivities ?? []).map((a) => a.id);

  if (activityIds.length > 0) {
    const { data: otherAttendees, error: attendeesError } =
      await supabase
        .from("app_activity_attendees")
        .select("activity_id")
        .in("activity_id", activityIds)
        .neq("user_id", user.id)
        .limit(1);

    if (attendeesError) {
      return NextResponse.json(
        { error: "Unable to verify activity participants." },
        { status: 500 }
      );
    }

    if ((otherAttendees?.length ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Your account has activities with other participants. Please contact support before deleting your account.",
        },
        { status: 409 }
      );
    }
  }
  const [membershipsResult, performanceResult] = await Promise.all([
    supabase
      .from("app_membership_requests")
      .select("stripe_subscription_id, subscription_status, payment_provider")
      .eq("user_id", user.id)
      .in("subscription_status", ["active", "trialing"]),
    supabase
      .from("performance_ai_subscriptions")
      .select("stripe_subscription_id, status, payment_provider")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"]),
  ]);

  if (membershipsResult.error || performanceResult.error) {
    return NextResponse.json(
      { error: "Unable to verify active subscriptions." },
      { status: 500 }
    );
  }

  const activeSubscriptions = [
    ...(membershipsResult.data ?? []),
    ...(performanceResult.data ?? []),
  ];

  if (activeSubscriptions.length > 0) {
    return NextResponse.json(
      {
        error:
          "Please cancel your active subscriptions before deleting your account.",
      },
      { status: 409 }
    );
  }

  const { error: requestError } = await supabase
    .from("account_deletion_requests")
    .insert({
      user_id: user.id,
      email: user.email ?? null,
      status: "pending",
    });

  if (requestError && requestError.code !== "23505") {
    return NextResponse.json(
      { error: "Unable to submit account deletion request." },
      { status: 500 }
    );
  }

  const { error: banError } = await supabase.auth.admin.updateUserById(
    user.id,
    { ban_duration: "876000h" }
  );

  if (banError) {
    console.error("Account suspension error:", banError);

    return NextResponse.json(
      {
        error: "Your deletion request was recorded, but account suspension failed. Please contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Your account deletion request has been submitted.",
  });
}
