"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// --- SUPABASE CLIENT ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box", // ✅ evita estourar o card
  padding: "10px 11px",
  borderRadius: "12px",
  border: "1px solid #1f2933",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontSize: "13px",
};

export default function SignUpPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // status messages
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== password2) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(
        "Conta criada! Verifique seu e-mail para confirmar e fazer login."
      );

      setName("");
      setEmail("");
      setPassword("");
      setPassword2("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro inesperado ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 45%, #000000 100%)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "24px",
          border: "1px solid #111827",
          overflow: "hidden", // ✅ garante que nada “escape” do card
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.94))",
          boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
          padding: "24px 20px 22px",
          boxSizing: "border-box", // ✅ consistência no container
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: "6px",
          }}
        >
          Criar conta
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#9ca3af",
            marginBottom: "16px",
          }}
        >
          Comece sua jornada no SportPlatform.
        </p>

        {errorMsg && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(153,27,27,0.25)",
              fontSize: "12px",
              color: "#fecaca",
              boxSizing: "border-box",
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(34,197,94,0.45)",
              background: "rgba(21,128,61,0.25)",
              fontSize: "12px",
              color: "#bbf7d0",
              boxSizing: "border-box",
            }}
          >
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          {/* Nome */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="name" style={{ fontSize: "13px", color: "#d1d5db" }}>
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Senha */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              Senha
            </label>

            <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  padding: "10px 40px 10px 11px", // espaço pro ícone
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: 0,
                  lineHeight: 0,
                }}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar senha */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="password2"
              style={{ fontSize: "13px", color: "#d1d5db" }}
            >
              Confirmar senha
            </label>

            <input
              id="password2"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirme sua senha"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              borderRadius: "999px",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#020617",
              boxShadow: "0 14px 40px rgba(34,197,94,0.45)",
            }}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div
          style={{
            fontSize: "13px",
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Já tem uma conta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "13px",
              color: "#e5e7eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Fazer login
          </button>
        </div>
      </div>
    </main>
  );
}
