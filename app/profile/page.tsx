// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import UserAvatar from "@/components/UserAvatar";

type ProfileRow = {
  full_name: string | null;
};

type MembershipRow = {
  id: string;
  community_id: string;
  status: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  app_membership_communities:
    | {
        name: string | null;
        price_cents: number | null;
        billing_interval: string | null;
      }
    | {
        name: string | null;
        price_cents: number | null;
        billing_interval: string | null;
      }[]
    | null;
};

type HealthFormRow = {
  id: string;
  community_id: string;
  form_version: string;
  completed_at: string;
  waiver_accepted: boolean;
  answers_certified: boolean;
  has_positive_answer: boolean;
};

type CoachSubscriptionRow = {
  id: string;
  status: string;
  current_period_end: string | null;
  health_form_completed_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return null;

  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);

  const [coachSubscription, setCoachSubscription] =
    useState<CoachSubscriptionRow | null>(null);
  const [loadingCoachSubscription, setLoadingCoachSubscription] =
    useState(true);
  const [cancelingCoachSubscription, setCancelingCoachSubscription] =
    useState(false);

  const [healthForms, setHealthForms] = useState<HealthFormRow[]>([]);
  const [loadingHealthForms, setLoadingHealthForms] = useState(true);

  const [cancelingMembershipId, setCancelingMembershipId] =
    useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);
      setSuccessMsg(null);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const user = session.user;

      setUserId(user.id);
      setEmail(user.email ?? null);

      try {
        const { data: profile, error: profileError } =
          await supabaseBrowser
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle<ProfileRow>();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        const fallbackName =
          (user.user_metadata as any)?.full_name ||
          (user.user_metadata as any)?.name ||
          "";

        setName(profile?.full_name || fallbackName || "");

        const { data: coachData, error: coachError } =
          await supabaseBrowser
            .from("performance_ai_subscriptions")
            .select("id,status,current_period_end,health_form_completed_at")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle<CoachSubscriptionRow>();

        if (coachError) {
          console.error(
            "Error fetching Coach IA subscription:",
            coachError
          );
          setCoachSubscription(null);
        } else {
          setCoachSubscription(coachData ?? null);
        }

        const { data: membershipData, error: membershipError } =
          await supabaseBrowser
            .from("app_membership_requests")
            .select(
              "id, community_id, status, subscription_status, stripe_subscription_id, current_period_end, app_membership_communities(name, price_cents, billing_interval)"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (membershipError) {
          console.error("Error fetching memberships:", membershipError);
          setMemberships([]);
        } else {
          setMemberships((membershipData as MembershipRow[]) ?? []);
        }

        const { data: healthFormData, error: healthFormError } =
          await supabaseBrowser
            .from("app_membership_health_forms")
            .select(
              "id, community_id, form_version, completed_at, waiver_accepted, answers_certified, has_positive_answer"
            )
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false });

        if (healthFormError) {
          console.error(
            "Error fetching Health & Safety forms:",
            healthFormError
          );
          setHealthForms([]);
        } else {
          setHealthForms((healthFormData as HealthFormRow[]) ?? []);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setErrorMsg("Unexpected error while loading profile.");
      } finally {
        setLoadingProfile(false);
        setLoadingMemberships(false);
        setLoadingCoachSubscription(false);
        setLoadingHealthForms(false);
      }
    };

    run();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = name.trim();

    if (!trimmed) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (trimmed.includes("@")) {
      setErrorMsg("Please enter your name (not an email).");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setErrorMsg("You must be logged in to save your profile.");
        router.replace("/login");
        return;
      }

      const { error: upsertError } = await supabaseBrowser
        .from("profiles")
        .upsert(
          {
            id: session.user.id,
            full_name: trimmed,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error("Error saving profile:", upsertError);
        setErrorMsg(
          upsertError.message || "Error saving profile data."
        );
        return;
      }

      setName(trimmed);
      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      console.error("Unexpected error saving profile:", err);
      setErrorMsg("Unexpected error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelMembership = async (
    membership: MembershipRow
  ) => {
    if (!userId) {
      setErrorMsg("You must be logged in to cancel a membership.");
      return;
    }

    const relation = membership.app_membership_communities;
    const community = Array.isArray(relation)
      ? relation[0]
      : relation;

    const confirmed = confirm(
      `Are you sure you want to cancel your membership${
        community?.name ? ` for ${community.name}` : ""
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setCancelingMembershipId(membership.id);
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await fetch(
        "/api/stripe/cancel-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            community_id: membership.community_id,
            user_id: userId,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to cancel membership."
        );
      }

      setMemberships((currentMemberships) =>
        currentMemberships.map((item) =>
          item.id === membership.id
            ? {
                ...item,
                subscription_status: "canceled",
              }
            : item
        )
      );

      setSuccessMsg("Membership canceled successfully.");
    } catch (error) {
      console.error("Error canceling membership:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Unexpected error while canceling membership."
      );
    } finally {
      setCancelingMembershipId(null);
    }
  };

  const handleCancelCoachSubscription = async () => {
    if (!userId) {
      setErrorMsg("You must be logged in to cancel your subscription.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to cancel your Coach IA subscription? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setCancelingCoachSubscription(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await fetch(
        "/api/performance-ai/cancel-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to cancel Coach IA subscription."
        );
      }

      setCoachSubscription(null);
      setSuccessMsg("Coach IA subscription canceled successfully.");
    } catch (error) {
      console.error(
        "Error canceling Coach IA subscription:",
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Unexpected error while canceling Coach IA subscription."
      );
    } finally {
      setCancelingCoachSubscription(false);
    }
  };
  const handleSignOut = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSigningOut(true);

      const { error } = await supabaseBrowser.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        setErrorMsg("Error signing out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error signing out:", err);
      setErrorMsg("Unexpected error while signing out.");
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete your account? This action is permanent and cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error deleting account.");
      }

      await supabaseBrowser.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Delete account error:", err);
      setErrorMsg("Error deleting account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const uniqueHealthForms = healthForms.filter(
    (form, index, forms) =>
      index ===
      forms.findIndex(
        (item) => item.community_id === form.community_id
      )
  );

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
        .wrap {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .section {
          padding: 28px 0;
          border-top: 1px solid #e5e7eb;
        }

        .section-label {
          margin: 0 0 18px;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: 0.11em;
          color: #64748b;
          text-transform: uppercase;
          font-family: Montserrat, sans-serif;
        }

        .row {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 0;
          border-bottom: 1px solid #eef2f7;
          box-sizing: border-box;
        }

        .row:last-child {
          border-bottom: none;
        }

        .row-title {
          margin: 0;
          color: #0f172a;
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
        }

        .row-detail {
          margin: 4px 0 0;
          color: #64748b;
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          line-height: 1.55;
        }

        .chevron {
          color: #94a3b8;
          font-size: 23px;
          line-height: 1;
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .section {
            padding: 32px 0;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          color: "#374151",
          padding: "30px 20px",
          paddingBottom:
            "calc(120px + env(safe-area-inset-bottom))",
          boxSizing: "border-box",
        }}
      >
        <div className="wrap">
          {/* PROFILE HERO */}
          <header
            style={{
              padding: "10px 0 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <UserAvatar name={name} size={76} />
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 22,
                lineHeight: 1.25,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {loadingProfile ? "My Profile" : name || "My Profile"}
            </h1>

            <div
              style={{
                marginTop: 5,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              My Profile
            </div>

            {email && (
              <div
                style={{
                  marginTop: 7,
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 12,
                  color: "#94a3b8",
                  wordBreak: "break-word",
                }}
              >
                {email}
              </div>
            )}
          </header>

          {/* PERSONAL INFORMATION */}
          <section className="section">
            <h2 className="section-label">
              Personal information
            </h2>

            {loadingProfile ? (
              <p className="row-detail">Loading profile...</p>
            ) : (
              <form onSubmit={handleSave}>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    height: 46,
                    boxSizing: "border-box",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "0 13px",
                    outline: "none",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 14,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      minHeight: 40,
                      border: "none",
                      borderRadius: 7,
                      padding: "0 17px",
                      background: "#1e3a8a",
                      color: "#ffffff",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.65 : 1,
                    }}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}

            {errorMsg && (
              <p
                style={{
                  margin: "14px 0 0",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 12,
                  color: "#dc2626",
                }}
              >
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p
                style={{
                  margin: "14px 0 0",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 12,
                  color: "#15803d",
                }}
              >
                {successMsg}
              </p>
            )}
          </section>

          {/* MY PLANS */}
          <section className="section">
            <h2 className="section-label">My plans</h2>

            <div
              style={{
                marginBottom: 8,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "#1e3a8a",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Coach IA
            </div>

            {loadingCoachSubscription ? (
              <p className="row-detail">
                Checking Coach IA subscription...
              </p>
            ) : coachSubscription ? (
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/performance-ai")}
                  className="row"
                  style={{
                    width: "100%",
                    borderLeft: "none",
                    borderRight: "none",
                    borderTop: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <p className="row-title">Performance AI</p>

                    <p className="row-detail">
                      <span
                        style={{
                          color: "#15803d",
                          fontWeight: 700,
                        }}
                      >
                        Active
                      </span>

                      {coachSubscription.current_period_end
                        ? ` · Renews ${formatDate(
                            coachSubscription.current_period_end
                          )}`
                        : ""}
                    </p>
                  </div>

                  <span className="chevron">›</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelCoachSubscription}
                  disabled={cancelingCoachSubscription}
                  style={{
                    marginTop: 8,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 11,
                    textDecoration: "underline",
                    cursor: cancelingCoachSubscription
                      ? "not-allowed"
                      : "pointer",
                    opacity: cancelingCoachSubscription ? 0.55 : 1,
                  }}
                >
                  {cancelingCoachSubscription
                    ? "Canceling..."
                    : "Cancel subscription"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  router.push("/performance-ai/subscribe")
                }
                className="row"
                style={{
                  width: "100%",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div>
                  <p className="row-title">Performance AI</p>
                  <p className="row-detail">
                    No active subscription
                  </p>
                </div>

                <span className="chevron">›</span>
              </button>
            )}

            <div
              style={{
                marginTop: 26,
                marginBottom: 8,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "#1e3a8a",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Communities
            </div>

            {loadingMemberships ? (
              <p className="row-detail">Loading memberships...</p>
            ) : memberships.length === 0 ? (
              <p className="row-detail">
                You do not have any memberships yet.
              </p>
            ) : (
              memberships.map((membership) => {
                const relation =
                  membership.app_membership_communities;

                const community = Array.isArray(relation)
                  ? relation[0]
                  : relation;

                const price =
                  typeof community?.price_cents === "number"
                    ? `$${(
                        community.price_cents / 100
                      ).toFixed(2)}`
                    : null;

                const status =
                  membership.subscription_status ||
                  membership.status ||
                  "pending";

                const isActive = ["active", "trialing"].includes(
                  membership.subscription_status ?? ""
                );

                return (
                  <div className="row" key={membership.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="row-title">
                        {community?.name || "Community"}
                      </p>

                      <p className="row-detail">
                        <span
                          style={{
                            color: isActive
                              ? "#15803d"
                              : "#64748b",
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {status}
                        </span>

                        {price
                          ? ` · ${price}/${
                              community?.billing_interval ||
                              "month"
                            }`
                          : ""}

                        {membership.current_period_end
                          ? ` · Renews ${formatDate(
                              membership.current_period_end
                            )}`
                          : ""}
                      </p>

                      {membership.stripe_subscription_id &&
                        isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelMembership(membership)
                            }
                            disabled={
                              cancelingMembershipId ===
                              membership.id
                            }
                            style={{
                              marginTop: 8,
                              padding: 0,
                              border: "none",
                              background: "transparent",
                              color: "#64748b",
                              fontFamily:
                                "Montserrat, sans-serif",
                              fontSize: 11,
                              textDecoration: "underline",
                              cursor:
                                cancelingMembershipId ===
                                membership.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                cancelingMembershipId ===
                                membership.id
                                  ? 0.55
                                  : 1,
                            }}
                          >
                            {cancelingMembershipId ===
                            membership.id
                              ? "Canceling..."
                              : "Cancel membership"}
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* HEALTH & SAFETY */}
          <section className="section">
            <h2 className="section-label">Health & Safety</h2>

            {coachSubscription && (
              <>
                <div
                  style={{
                    marginTop: 18,
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  Coach IA
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/performance-ai/health?view=1")}
                  className="row"
                  style={{
                    width: "100%",
                    borderLeft: "none",
                    borderRight: "none",
                    borderTop: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <p className="row-title">Performance AI</p>

                    <p className="row-detail">
                      <span
                        style={{
                          color: coachSubscription.health_form_completed_at
                            ? "#15803d"
                            : "#b45309",
                          fontWeight: 700,
                        }}
                      >
                        {coachSubscription.health_form_completed_at
                          ? "Completed"
                          : "Pending"}
                      </span>

                      {coachSubscription.health_form_completed_at
                        ? ` · ${formatDate(
                            coachSubscription.health_form_completed_at
                          )}`
                        : " · Complete your Health & Safety form"}
                    </p>
                  </div>

                  <span className="chevron">›</span>
                </button>

                <div
                  style={{
                    marginTop: 26,
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  Communities
                </div>
              </>
            )}

            {loadingHealthForms ? (
              <p className="row-detail">
                Loading health information...
              </p>
            ) : uniqueHealthForms.length === 0 ? (
              <p className="row-detail">
                No Health & Safety form completed yet.
              </p>
            ) : (
              uniqueHealthForms.map((form) => {
                const membership = memberships.find(
                  (item) =>
                    item.community_id === form.community_id
                );

                const relation =
                  membership?.app_membership_communities;

                const community = Array.isArray(relation)
                  ? relation[0]
                  : relation;

                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/groups/${form.community_id}/health`
                      )
                    }
                    className="row"
                    style={{
                      width: "100%",
                      borderLeft: "none",
                      borderRight: "none",
                      borderTop: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <p className="row-title">
                        {community?.name || "Health form"}
                      </p>

                      <p className="row-detail">
                        <span
                          style={{
                            color: "#15803d",
                            fontWeight: 700,
                          }}
                        >
                          Completed
                        </span>
                        {" · "}
                        {formatDate(form.completed_at)}
                      </p>
                    </div>

                    <span className="chevron">›</span>
                  </button>
                );
              })
            )}
          </section>

          {/* LEGAL */}
          <section className="section">
            <h2 className="section-label">Legal</h2>

            <a
              href="/terms"
              className="row"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <p className="row-title">Terms & Conditions</p>
              <span className="chevron">›</span>
            </a>

            <a
              href="/privacy"
              className="row"
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <p className="row-title">Privacy Policy</p>
              <span className="chevron">›</span>
            </a>
          </section>

          {/* ACCOUNT */}
          <section className="section">
            <h2 className="section-label">Account</h2>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="row"
              style={{
                width: "100%",
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                background: "transparent",
                textAlign: "left",
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.6 : 1,
              }}
            >
              <p
                className="row-title"
                style={{ color: "#1e3a8a" }}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </p>
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="row"
              style={{
                width: "100%",
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                background: "transparent",
                textAlign: "left",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <div>
                <p
                  className="row-title"
                  style={{ color: "#dc2626" }}
                >
                  {deleting
                    ? "Processing..."
                    : "Delete account"}
                </p>

                <p className="row-detail">
                  Permanently delete your account and data.
                </p>
              </div>
            </button>
          </section>
        </div>
      </main>
    </>
  );
}







