"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ProofRow = {
  id: string;
  community_id: string;
  challenge_id: string;
  user_id: string;
  proof_url: string | null;
  proof_path: string | null;
  notes: string | null;
  status: string;
  share_to_feed: boolean | null;
  created_at: string;
};

export default function ChallengeProofsAdminPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const params = useParams();

  const communityId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function loadProofs() {
      setLoading(true);
      setErrorText(null);

      if (!communityId) {
        setErrorText("Missing community.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("app_membership_challenge_proofs")
        .select("*")
        .eq("community_id", communityId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorText(error.message);
        setProofs([]);
        setLoading(false);
        return;
      }

      setProofs((data || []) as ProofRow[]);
      setLoading(false);
    }

    loadProofs();
  }, [communityId, supabase]);

  async function handleApprove(proof: ProofRow) {
    setErrorText(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorText("You must be logged in to approve proofs.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", proof.user_id)
      .maybeSingle();

    const authorName =
      profile?.full_name?.trim() || "Athlete";

    const { data: challengeData, error: challengeError } = await supabase
      .from("app_membership_challenges")
      .select("id, title, activity_type, deadline, points_active, points_late")
      .eq("id", proof.challenge_id)
      .maybeSingle();

    if (challengeError || !challengeData) {
      setErrorText("Challenge not found.");
      return;
    }

    const now = new Date();
    const deadline = new Date(challengeData.deadline);
    const points = now <= deadline ? challengeData.points_active : challengeData.points_late;

    const { error: checkinError } = await supabase
      .from("app_membership_checkins")
      .insert({
        community_id: proof.community_id,
        user_id: proof.user_id,
        author_name: authorName,
        activity_type: challengeData.activity_type || "manual",
        comment: proof.notes || `Completed challenge: ${challengeData.title}`,
        image_url: proof.proof_url,
        points,
        challenge_id: proof.challenge_id,
      });

    if (checkinError) {
      setErrorText(checkinError.message);
      return;
    }

    const { error: proofError } = await supabase
      .from("app_membership_challenge_proofs")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", proof.id);

    if (proofError) {
      setErrorText(proofError.message);
      return;
    }

    setProofs((current) => current.filter((item) => item.id !== proof.id));
  }
  async function handleReject(proofId: string) {
    const { error } = await supabase
      .from("app_membership_challenge_proofs")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proofId);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setProofs((current) => current.filter((proof) => proof.id !== proofId));
  }
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Montserrat, sans-serif",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <BackArrow />

        <section
          style={{
            marginTop: 16,
            background: "#ffffff",
            borderRadius: 24,
            padding: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>
            Admin Review
          </div>

          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
            Pending proofs
          </h1>

          {loading && (
            <div style={{ marginTop: 16, fontSize: 14, color: "#64748b" }}>
              Loading proofs...
            </div>
          )}

          {errorText && (
            <div style={{ marginTop: 16, fontSize: 14, color: "#b91c1c", fontWeight: 800 }}>
              {errorText}
            </div>
          )}

          {!loading && !errorText && proofs.length === 0 && (
            <div style={{ marginTop: 16, fontSize: 14, color: "#64748b" }}>
              No pending proofs.
            </div>
          )}

          <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
            {proofs.map((proof) => (
              <article
                key={proof.id}
                style={{
                  borderRadius: 18,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: 14,
                }}
              >
                {proof.proof_url && (
                  <img
                    src={proof.proof_url}
                    alt="Challenge proof"
                    style={{
                      width: "100%",
                      maxHeight: 360,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                )}

                <div style={{ marginTop: 12, fontSize: 12, fontWeight: 900, color: "#475569" }}>
                  Status: {proof.status}
                </div>

                <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
                  {proof.notes || "No notes provided."}
                </div>

                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Share to feed: {proof.share_to_feed ? "Yes" : "No"}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(proof)}
                    style={{
                      border: "0",
                      borderRadius: 999,
                      padding: "10px 14px",
                      background: "#dcfce7",
                      color: "#166534",
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(proof.id)}
                    style={{
                      border: "0",
                      borderRadius: 999,
                      padding: "10px 14px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}




