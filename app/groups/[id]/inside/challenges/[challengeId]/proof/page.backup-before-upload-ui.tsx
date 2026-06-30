"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SubmitChallengeProofPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const params = useParams();

  const communityId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const challengeId = Array.isArray(params?.challengeId)
    ? params.challengeId[0]
    : params?.challengeId;

  const [notes, setNotes] = useState("");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    if (!communityId || !challengeId) {
      setErrorText("Missing challenge information.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorText("You must be logged in to submit proof.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("app_membership_challenge_proofs").insert({
      community_id: communityId,
      challenge_id: challengeId,
      user_id: user.id,
      notes: notes.trim() || null,
      share_to_feed: shareToFeed,
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setSuccessText("Proof submitted for review.");
    setLoading(false);

    setTimeout(() => {
      router.push(`/groups/${communityId}/inside`);
    }, 900);
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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
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
            Manual Challenge Proof
          </div>

          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
            Submit proof
          </h1>

          <p style={{ marginTop: 8, fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            Add a short note explaining how you completed this challenge. Photo upload will be added next.
          </p>

          <label
            style={{
              display: "block",
              marginTop: 18,
              fontSize: 13,
              fontWeight: 800,
              color: "#334155",
              marginBottom: 8,
            }}
          >
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Example: I attended the Saturday run club event and completed the group workout."
            style={{
              width: "100%",
              minHeight: 140,
              borderRadius: 16,
              border: "1px solid #cbd5e1",
              padding: 14,
              fontSize: 14,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "Montserrat, sans-serif",
            }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 14,
              padding: 14,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={shareToFeed}
              onChange={(event) => setShareToFeed(event.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                Share this proof on the community feed
              </span>
              <span style={{ display: "block", marginTop: 3, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                If approved, this proof can be posted to the community feed.
              </span>
            </span>
          </label>
          {errorText && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13, fontWeight: 700 }}>
              {errorText}
            </div>
          )}

          {successText && (
            <div style={{ marginTop: 12, color: "#166534", fontSize: 13, fontWeight: 700 }}>
              {successText}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 16,
              width: "100%",
              border: "0",
              borderRadius: 999,
              padding: "14px 18px",
              background: loading ? "#94a3b8" : "#0f172a",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 900,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit proof"}
          </button>
        </section>
      </div>
    </main>
  );
}


