// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import BottomNavbar from "@/components/BottomNavbar";

type Post = {
  id: string;
  created_at: string;
  author_name: string | null;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // posts que o usuário já curtiu
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // texto de comentário por post
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const [likeLoadingPostId, setLikeLoadingPostId] = useState<string | null>(
    null
  );
  const [commentLoadingPostId, setCommentLoadingPostId] = useState<
    string | null
  >(null);

  async function loadPosts() {
    setLoading(true);

    // 1) usuário logado
    const {
      data: { user },
      error: userError,
    } = await supabaseBrowser.auth.getUser();

    if (userError) {
      console.error("Erro ao carregar usuário:", userError);
    }

    setUserId(user?.id ?? null);

    if (user) {
      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
    }

    // 2) posts
    const { data: postsData, error: postsError } = await supabaseBrowser
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsError || !postsData) {
      console.error("Erro ao carregar posts:", postsError);
      setPosts([]);
      setLoading(false);
      return;
    }

    const rawPosts = postsData as Post[];
    const postIds = rawPosts.map((p) => p.id);

    // mapas para likes e comentários
    const likeCountMap: Record<string, number> = {};
    const commentCountMap: Record<string, number> = {};
    const likedByCurrentUser = new Set<string>();

    if (postIds.length > 0) {
      // 3) likes dos posts
      const { data: likesData, error: likesError } = await supabaseBrowser
        .from("feed_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      if (!likesError && likesData) {
        (likesData as any[]).forEach((row) => {
          const pid = row.post_id as string;
          likeCountMap[pid] = (likeCountMap[pid] ?? 0) + 1;

          if (user && row.user_id === user.id) {
            likedByCurrentUser.add(pid);
          }
        });
      }

      // 4) comentários dos posts
      const { data: commentsData, error: commentsError } =
        await supabaseBrowser
          .from("feed_comments")
          .select("post_id")
          .in("post_id", postIds);

      if (!commentsError && commentsData) {
        (commentsData as any[]).forEach((row) => {
          const pid = row.post_id as string;
          commentCountMap[pid] = (commentCountMap[pid] ?? 0) + 1;
        });
      }
    }

    const postsWithCounters = rawPosts.map((p) => ({
      ...p,
      likes: likeCountMap[p.id] ?? 0,
      comments_count: commentCountMap[p.id] ?? 0,
    }));

    setPosts(postsWithCounters);
    setLikedPosts(likedByCurrentUser);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  // ---------- CURTIR / DESCURTIR (1 por usuário) ----------
  async function handleLike(postId: string) {
    if (!userId) {
      alert("Faça login para curtir as postagens.");
      return;
    }

    const alreadyLiked = likedPosts.has(postId);
    setLikeLoadingPostId(postId);

    if (alreadyLiked) {
      // DESCURTIR
      const { error } = await supabaseBrowser
        .from("feed_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        console.error("Erro ao remover curtida:", error);
      } else {
        setLikedPosts((prev) => {
          const copy = new Set(prev);
          copy.delete(postId);
          return copy;
        });
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, likes: Math.max(0, post.likes - 1) }
              : post
          )
        );
      }
    } else {
      // CURTIR
      const { error } = await supabaseBrowser
        .from("feed_likes")
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        console.error("Erro ao registrar curtida:", error);
      } else {
        setLikedPosts((prev) => {
          const copy = new Set(prev);
          copy.add(postId);
          return copy;
        });
        setPosts((current) =>
          current.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
    }

    setLikeLoadingPostId(null);
  }

  // ---------- COMENTAR ----------
  async function handleSubmitComment(postId: string) {
    const text = (commentText[postId] || "").trim();

    if (!text) return;
    if (!userId) {
      alert("Faça login para comentar.");
      return;
    }

    setCommentLoadingPostId(postId);

    const { error } = await supabaseBrowser.from("feed_comments").insert({
      post_id: postId,
      user_id: userId,
      author_name: userName,
      content: text,
    });

    if (error) {
      console.error("Erro ao salvar comentário:", error);
    } else {
      // limpa campo e incrementa contador no front
      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    }

    setCommentLoadingPostId(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px", // espaço para a bottom navbar
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
          }}
        >
          {/* TÍTULO DA PÁGINA */}
          <div
            style={{
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                Feed de Treinos
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Registros em tempo real das sessões de treino dos atletas.
              </p>
            </div>

            <a
              href="/feed/new"
              style={{
                padding: "9px 14px",
                borderRadius: "999px",
                background: "#22c55e",
                color: "#020617",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Nova postagem
            </a>
          </div>

          {/* ESTADO DE CARREGAMENTO */}
          {loading && (
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              Carregando postagens…
            </p>
          )}

          {/* LISTA DE POSTS */}
          {!loading && posts.length === 0 && (
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              Nenhuma postagem ainda. Seja o primeiro a registrar seu treino.
            </p>
          )}

          <div
            style={{
              marginTop: posts.length > 0 ? "4px" : "0",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {posts.map((post) => {
              const isLiked = likedPosts.has(post.id);

              return (
                <article
                  key={post.id}
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #1e293b",
                    background: "#020617",
                    padding: "14px 14px 12px 14px",
                  }}
                >
                  {/* Header do post */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "999px",
                        background:
                          "radial-gradient(circle at 30% 30%, #22c55e, #0f172a)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0b1120",
                      }}
                    >
                      {(post.author_name || "AT")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {post.author_name || "Atleta"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                        }}
                      >
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Texto */}
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#e5e7eb",
                      marginBottom: post.image_url ? "10px" : "8px",
                      lineHeight: 1.5,
                    }}
                  >
                    {post.content}
                  </p>

                  {/* Imagem, se existir */}
                  {post.image_url && (
                    <div
                      style={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "1px solid #1e293b",
                        marginBottom: "8px",
                      }}
                    >
                      <img
                        src={post.image_url}
                        alt="Foto do treino"
                        style={{
                          width: "100%",
                          height: "220px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  {/* Ações */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        disabled={likeLoadingPostId === post.id}
                        style={{
                          border: "none",
                          background: isLiked
                            ? "rgba(34,197,94,0.15)"
                            : "transparent",
                          color: isLiked ? "#4ade80" : "#e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          opacity: likeLoadingPostId === post.id ? 0.7 : 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                        >
                          {isLiked ? "💚" : "🤍"}
                        </span>
                        <span>{isLiked ? "Você curtiu" : "Curtir"}</span>
                      </button>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {post.likes} curtida
                        {post.likes === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        color: "#64748b",
                      }}
                    >
                      <span>
                        {post.comments_count} comentário
                        {post.comments_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {/* Campo de comentário */}
                  <div style={{ marginTop: "8px" }}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitComment(post.id);
                      }}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Escreva um comentário…"
                        value={commentText[post.id] ?? ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          border: "1px solid #1e293b",
                          backgroundColor: "#020617",
                          color: "#e5e7eb",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={commentLoadingPostId === post.id}
                        style={{
                          fontSize: "12px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          border: "none",
                          background: "#22c55e",
                          color: "#020617",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          opacity:
                            commentLoadingPostId === post.id ? 0.7 : 1,
                        }}
                      >
                        {commentLoadingPostId === post.id
                          ? "Enviando..."
                          : "Enviar"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {/* NAV INFERIOR */}
      <BottomNavbar />
    </div>
  );
}
