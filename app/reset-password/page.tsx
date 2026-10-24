"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;
    let completed = false;

    const fail = () => {
      if (!active || completed) return;
      setReady(false);
      setErrorMsg(
        "Invalid or expired recovery link. Please request a new one."
      );
    };

    const verified = () => {
      if (!active || completed) return;
      completed = true;
      setReady(true);
      setErrorMsg("");
      window.history.replaceState(null, "", "/reset-password");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        verified();
      }
    });

    async function validateRecovery() {
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      const hash = new URLSearchParams(
        url.hash.replace(/^#/, "")
      );

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const hashType = hash.get("type");

      if (
        url.searchParams.has("error") ||
        hash.has("error")
      ) {
        fail();
        return;
      }

      try {
        if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) throw error;
          verified();
          return;
        }


        if (
          hashType === "recovery" &&
          accessToken &&
          refreshToken
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          verified();
          return;
        }

        // Supabase may already be processing the recovery URL.
        // Wait for PASSWORD_RECOVERY before allowing a password change.
      } catch (error) {
        console.error("Password recovery validation failed:", error);
        fail();
      }
    }

    void validateRecovery();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!ready) return;

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Sign out after password reset:", signOutError);
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#020617",
    color: "#fff",
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Reset Password
        </h1>

        <p style={{ color: "#9ca3af", marginTop: 8 }}>
          Create a new password for your Run Club account.
        </p>

        {errorMsg && (
          <p style={{ color: "#fca5a5", marginTop: 20 }}>
            {errorMsg}
          </p>
        )}

        {success ? (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: "#86efac" }}>
              Password updated successfully!
            </p>
            <Link href="/login" style={{ color: "#22c55e" }}>
              Back to Sign In
            </Link>
          </div>
        ) : ready ? (
          <form
            onSubmit={handleReset}
            style={{ display: "grid", gap: 16, marginTop: 24 }}
          >
            <label>
              New Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 13,
                border: 0,
                borderRadius: 999,
                background: "#22c55e",
                color: "#020617",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : !errorMsg ? (
          <p style={{ marginTop: 20 }}>
            Verifying recovery link...
          </p>
        ) : null}

        <div style={{ marginTop: 24 }}>
          <Link href="/forgot-password" style={{ color: "#9ca3af" }}>
            Request a new recovery link
          </Link>
        </div>
      </div>
    </main>
  );
}
