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
  const [loadingAuthor, setLoadingAuthor] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Busca o nome do usuário logado ao carregar a página
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setErrorMsg(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Erro ao buscar usuário:", userError);
          setErrorMsg("Erro ao carregar usuário.");
          setLoadingAuthor(false);
          return;
        }

        if (!user) {
          setErrorMsg("Você precisa estar logado para postar.");
          setLoadingAuthor(false);
          return;
        }

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
      } finally {
        setLoadingAuthor(false);
      }
    };

    loadProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const uploadImageIfNeeded = async (
    userId: string
  ): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("feed-images") // <- bucket no Supabase
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      throw new Error("Não foi possível enviar a imagem.");
    }

    const { data: publicData } = supabase.storage
      .from("feed-images")
      .getPublicUrl(filePath);

    return publicData?.publicUrl ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!authorName) {
      setErrorMsg("Não foi possível carregar o nome do perfil.");
      return;
    }

    if (!content.trim() && !imageFile) {
      setErrorMsg("Escreva algo ou selecione uma imagem para postar.");
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

      // Upload da imagem (se tiver)
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImageIfNeeded(user.id);
      }

      // INSERT na tabela feed_posts – sem o campo author_id (a coluna não existe)
      const { error: insertError } = await supabase.from("feed_posts").insert({
        content: content.trim() || null,
        author_name: authorName,
        image_url: imageUrl, // URL pública da imagem
        // se no futuro você criar uma coluna user_id na tabela,
        // pode adicionar aqui: user_id: user.id,
      });

      if (insertError) {
        console.error("Erro ao salvar post:", insertError);
        setErrorMsg("Erro ao salvar a postagem.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/feed");
    } catch (err: any) {
      console.error("Erro inesperado ao salvar post:", err);
      setErrorMsg(err.message || "Erro inesperado ao salvar a postagem.");
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
            {loadingAuthor ? "carregando..." : authorName ?? "—"}
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
          {/* Texto da postagem */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua postagem..."
            rows={4}
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

          {/* Upload de imagem */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <label
              htmlFor="image"
              style={{
                fontSize: 12,
                color: "#d1d5db",
              }}
            >
              Imagem (opcional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                fontSize: 12,
                color: "#e5e7eb",
              }}
            />
            {imagePreview && (
              <div
                style={{
                  marginTop: 6,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(55,65,81,0.9)",
                  maxHeight: 260,
                }}
              >
                <img
                  src={imagePreview}
                  alt="Pré-visualização"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                margin: 0,
              }}
            >
              Formatos suportados: JPG, PNG, etc. A imagem será exibida junto
              com sua postagem no feed.
            </p>
          </div>

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
            disabled={loading || loadingAuthor}
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
              cursor: loading || loadingAuthor ? "not-allowed" : "pointer",
              opacity: loading || loadingAuthor ? 0.6 : 1,
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
