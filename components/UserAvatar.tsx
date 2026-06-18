type UserAvatarProps = {
  name?: string | null;
  userId?: string | null;
  size?: number;
};

function getInitials(name?: string | null) {
  const parts = (name || "Athlete").trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return (name || "AT").substring(0, 2).toUpperCase();
}

function getAvatarGradient(name?: string | null, userId?: string | null) {
  const palettes = [
    "radial-gradient(circle at 20% 20%, #38bdf8, #0ea5e9 40%, #0f172a 100%)",
    "radial-gradient(circle at 20% 20%, #34d399, #10b981 40%, #064e3b 100%)",
    "radial-gradient(circle at 20% 20%, #a78bfa, #8b5cf6 40%, #312e81 100%)",
    "radial-gradient(circle at 20% 20%, #fb7185, #f43f5e 40%, #881337 100%)",
    "radial-gradient(circle at 20% 20%, #fbbf24, #f59e0b 40%, #78350f 100%)",
    "radial-gradient(circle at 20% 20%, #2dd4bf, #14b8a6 40%, #134e4a 100%)",
    "radial-gradient(circle at 20% 20%, #60a5fa, #2563eb 40%, #172554 100%)",
    "radial-gradient(circle at 20% 20%, #c084fc, #a855f7 40%, #581c87 100%)",
  ];

  const key = (userId || name || "Athlete").trim();
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palettes[Math.abs(hash) % palettes.length];
}

export default function UserAvatar({ name, userId, size = 48 }: UserAvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: getAvatarGradient(name, userId),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.44),
        fontWeight: 600,
        fontFamily: "Montserrat, sans-serif",
        letterSpacing: "0.05em",
        textShadow: "0 1px 2px rgba(0,0,0,0.18)",
        color: "#ffffff",
        flex: "0 0 auto",
      }}
    >
      {getInitials(name)}
    </div>
  );
}
