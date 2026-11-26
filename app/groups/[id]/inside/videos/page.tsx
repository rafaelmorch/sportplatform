"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type CommunityRow = {
  id: string;
  name: string | null;
  created_by: string | null;
};

type VideoRow = {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sort_order: number | null;
  is_published: boolean;
  created_at: string;
};

function getVideoEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    if (url.includes("youtube.com/embed/")) return url;

    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      if (!id) return null;
      return `https://www.youtube.com/embed/${id}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (!v) return null;
      return `https://www.youtube.com/embed/${v}`;
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}`;
    }

    if (parsed.hostname.includes("drive.google.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const fileIndex = parts.findIndex((part) => part === "d");
      if (fileIndex >= 0 && parts[fileIndex + 1]) {
        return `https://drive.google.com/file/d/${parts[fileIndex + 1]}/preview`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

const demoSeries = [{"title":"Força e mobilidade","urls":["https://www.instagram.com/reel/DfZv7DKipfT/embed/","https://www.instagram.com/reel/DgLI_tRB4YZ/embed/","https://www.instagram.com/reel/DdjboqshZ_E/embed/"]},{"title":"Penteados","urls":["https://www.instagram.com/reel/Dfr4sruRJr_/embed/","https://www.instagram.com/reel/DgKtC6ABu3q/embed/","https://www.instagram.com/reel/DcmJRqEia8d/embed/"]},{"title":"42 aprendizados para 42km","urls":["https://www.instagram.com/reel/DaAaSyvxwV2/embed/","https://www.instagram.com/reel/DaDaisExnlp/embed/","https://www.instagram.com/reel/DaKtds7R9Kk/embed/"]}];
export default function MembershipVideosPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const params = useParams();

  const communityId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [canManageVideos, setCanManageVideos] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);

  useEffect(() => {
    async function load() {
      if (!communityId || typeof communityId !== "string") {
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      const { data: community } = await supabase
        .from("app_membership_communities")
        .select("id, name, created_by")
        .eq("id", communityId)
        .single();

      if (!community) {
        router.push("/memberships");
        return;
      }

      const typedCommunity = community as CommunityRow;
      const isCreator = typedCommunity.created_by === user.id;
      const isAdmin = profile?.is_admin === true;
      setCanManageVideos(isCreator || isAdmin);

      if (!isCreator && !isAdmin) {
        const { data: request } = await supabase
          .from("app_membership_requests")
          .select("status, payment_provider, current_period_end")
          .eq("community_id", communityId)
          .eq("user_id", user.id)
          .single();

        const appleSubscriptionValid =
          request?.payment_provider !== "apple" ||
          (request?.current_period_end != null &&
            Date.parse(request.current_period_end) > Date.now());

        if (
          !request ||
          !["approved", "active"].includes(request.status) ||
          !appleSubscriptionValid
        ) {
          router.push(`/memberships/${communityId}`);
          return;
        }
      }

      const { data: videoRows, error: videosError } = await supabase
        .from("app_membership_videos")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (videosError) {
        console.error("Error loading membership videos:", videosError);
        setVideos([]);
      } else {
        setVideos((videoRows as VideoRow[]) ?? []);
      }

      setCommunityName(typedCommunity.name || null);
      setAllowed(true);
      setLoading(false);
    }

    load();
  }, [communityId, router, supabase]);

  if (loading) return null;
  if (!allowed) return null;

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

        .series-grid {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .series-card {display:flex;flex-direction:column;position:relative;overflow:hidden;text-align:left;min-height:240px;padding:20px;border:0;border-radius:20px;color:white;cursor:pointer;box-shadow:0 8px 24px #0f172a18}
        .series-index {font-size:10px;letter-spacing:1.5px;font-weight:700;color:#cbd5e1}
        .series-art {font-size:76px;font-weight:800;line-height:1.1;color:#ffffff35;margin:12px 0}
        .series-title {font-size:19px;font-weight:700;line-height:1.25;margin-top:auto}
        .series-meta {display:flex;justify-content:space-between;align-items:center;width:100%;font-size:12px;color:#dbeafe;margin-top:16px}
        .series-back {background:#eff6ff;color:#1d4ed8;border:0;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer}
        .episode-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}
        .episode-card {border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;background:white;box-shadow:0 6px 20px #0f172a0c}
        .episode-label {display:flex;justify-content:space-between;gap:8px;padding:14px;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.6px}
        @media(max-width:600px){.series-grid{grid-template-columns:1fr}.series-card{min-height:160px}.series-art{position:absolute;right:18px;top:12px;font-size:90px}.series-title{max-width:75%;margin-top:32px}}
        .page * {
          font-family: "Montserrat", Arial, sans-serif;
        }
      `}</style>

      <main
        className="page"
        style={{
          minHeight: "100vh",
          background:
            "#ffffff",
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingRight: "max(16px, env(safe-area-inset-right))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          paddingLeft: "max(16px, env(safe-area-inset-left))",
          overflowX: "hidden",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto 16px auto" }}>
          <BackArrow />
        </div>

        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "clamp(18px, 3vw, 24px)",
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
                fontSize: "clamp(22px, 4vw, 24px)",
                fontWeight: 800,
                margin: 0,
                color: "#0f172a",
                lineHeight: 1.15,
              }}
            >
              {communityName}
            </h1>
          </div>

          {canManageVideos && communityId && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 16,
              }}
            >
              <Link
                href={`/groups/${communityId}/inside/videos/new`}
                style={{
                  textDecoration: "none",
                  borderRadius: 999,
                  padding: "10px 16px",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Add Video
              </Link>
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: "0 0 4px 0",
                color: "#0f172a",
              }}
            >
              Training Videos
            </h2>

            <div style={{ color: "#64748b", fontSize: 13 }}>
              Exclusive training content for approved members.
            </div>
          </div>

          {communityId === "a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1" && (
<section style={{margin:"24px 0"}}>
{selectedSeries===null ? <>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><strong style={{fontSize:17,color:"#0f172a"}}>Séries da Giovanna</strong><span style={{fontSize:12,color:"#64748b"}}>3 séries · 9 vídeos</span></div>
<div className="series-grid">{demoSeries.map((series,i)=><button key={series.title} onClick={()=>setSelectedSeries(i)} className="series-card" style={{background:["linear-gradient(145deg,#0f172a,#164e63)","linear-gradient(145deg,#172554,#4338ca)","linear-gradient(145deg,#0f172a,#1d4ed8)"][i]}}>
<span className="series-index">0{i+1} / SÉRIE</span>
<span className="series-art" aria-hidden="true">{["↗","✦","42"][i]}</span>
<span className="series-title">{series.title}</span>
<span className="series-meta">3 episódios <span aria-hidden="true">→</span></span>
</button>)}</div>
</> : <>
<button className="series-back" onClick={()=>setSelectedSeries(null)}>‹ Todas as séries</button>
<div style={{margin:"20px 0"}}><div style={{fontSize:12,fontWeight:700,color:"#2563eb",letterSpacing:1}}>DIÁRIO DA CORREDORA</div><h2 style={{fontSize:24,color:"#0f172a",margin:"8px 0"}}>{demoSeries[selectedSeries].title}</h2><span style={{fontSize:13,color:"#64748b"}}>3 episódios</span></div>
<div className="episode-grid">{demoSeries[selectedSeries].urls.map((url,i)=><article key={url} className="episode-card"><div className="episode-label"><span>EPISÓDIO {String(i+1).padStart(2,"0")}</span><span>Instagram</span></div><iframe src={url} title={"Episódio "+(i+1)} loading="lazy" style={{width:"100%",height:560,border:0,display:"block"}} allow="autoplay; encrypted-media; fullscreen" allowFullScreen/></article>)}</div>
</>}
</section>
)}
          {communityId === "a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1" ? null : videos.length === 0 ? (
            <div
              style={{
                marginTop: 24,
                padding: "24px 0",
                borderTop: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              No videos published yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 0,
                marginTop: 24,
              }}
            >
              {videos.map((video, index) => {
                const embedUrl = getVideoEmbedUrl(video.video_url);

                return (
                  <article
                    key={video.id}
                    style={{
                      paddingTop: index === 0 ? 0 : 28,
                      paddingBottom: 28,
                      borderTop:
                        index === 0 ? "none" : "1px solid #cbd5e1",
                    }}
                  >
                    {embedUrl ? (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          borderRadius: 18,
                          background: "#0f172a",
                          boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                        }}
                      >
                        <iframe
                          src={embedUrl}
                          title={video.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: 0,
                            display: "block",
                          }}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          borderRadius: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#64748b",
                          fontSize: 13,
                          textAlign: "center",
                          padding: 20,
                        }}
                      >
                        This video cannot be previewed inside the app.
                      </div>
                    )}

                    <div style={{ padding: "16px 2px 0" }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.35,
                        }}
                      >
                        {video.title}
                      </div>

                      {video.description && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 13,
                            color: "#64748b",
                            lineHeight: 1.6,
                          }}
                        >
                          {video.description}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

