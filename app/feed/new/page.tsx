// app/feed/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

// Cliente Supabase para o navegador usando as envs públicas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  full_name: string | null;
};

export default function NewFeedPostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Busca o nome do usuário logado ao carregar a página
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Erro ao buscar usuário:", userError);
          setErrorMsg("Erro ao carregar usuário.");
          return;
        }

        if (!user) {
          setErrorMsg("Você precisa estar logado para postar.");
          return;
        }

        // 1) tenta na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
        }

        const nameFromProfile = profile?.full_name || null;
        const meta: any = user.user_metadata || {};
        const nameFromMeta = meta.full_name || meta.name || null;

        const finalName =
          nameFromProfile || nameFromMeta || user.email || "Atleta";

        setAuthorName(finalName);
      } catch (err) {
        console.error("Erro inesperado ao carregar perfil:", err);
        setErrorMsg("Erro inesperado ao carregar perfil.");
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!authorName) {
      setErrorMsg("Não foi possível carregar o nome do perfil.");
      return;
    }

    if (!content.trim()) {
      setErrorMsg("Escreva alguma coisa antes de postar.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg("Você precisa estar logado para postar.");
        setLoading(false);
        return;
      }

      // ⚠️ Ajuste o nome da tabela se o seu não for "feed_posts"
      const { error: insertError } = await supabase.from("feed_posts").insert({
        content: content.trim(),
        author_id: user.id,
        author_name: authorName, // vem do perfil, não de input livre
      });

      if (insertError) {
        console.error("Erro ao salvar post:", insertError);
        setErrorMsg("Erro ao salvar a postagem.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/feed");
    } catch (err) {
      console.error("Erro inesperado ao salvar post:", err);
      setErrorMsg("Erro inesperado ao salvar a postagem.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 16,
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Nova postagem
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 4,
            }}
          >
            Compartilhe um treino, uma conquista ou um recado com o seu grupo.
          </p>
        </header>

        {/* Nome do autor (somente leitura) */}
        <div
          style={{
            marginBottom: 12,
            fontSize: 13,
            color: "#9ca3af",
          }}
        >
          Publicando como{" "}
          <span
            style={{
              color: "#e5e7eb",
              fontWeight: 600,
            }}
          >
            {authorName ?? "carregando..."}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua postagem..."
            rows={5}
            style={{
              width: "100%",
              borderRadius: 12,
              padding: 10,
              border: "1px solid rgba(55,65,81,0.9)",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 13,
              resize: "vertical",
            }}
          />

          {errorMsg && (
            <p
              style={{
                fontSize: 12,
                color: "#fca5a5",
                margin: 0,
              }}
            >
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !authorName}
            style={{
              marginTop: 4,
              borderRadius: 999,
              padding: "10px 16px",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              background:
                "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
              color: "#0b1120",
              cursor: loading || !authorName ? "not-allowed" : "pointer",
              opacity: loading || !authorName ? 0.6 : 1,
              transition: "opacity 0.15s ease-out",
            }}
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </div>

      <BottomNavbar />
    </main>
  );
}
