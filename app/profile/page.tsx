"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Connection = {
  provider: string;
  expires_at: string | null;
};

export default function ProfilePage() {
  const supabase = supabaseBrowser;

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Record<string, Connection>>(
    {}
  );

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_oauth_connections")
      .select("provider, expires_at");

    if (!error && data) {
      const map: Record<string, Connection> = {};
      data.forEach((c) => {
        map[c.provider] = c;
      });
      setConnections(map);
    }

    setLoading(false);
  }

  function isConnected(provider: string) {
    return Boolean(connections[provider]);
  }

  function isExpired(provider: string) {
    const c = connections[provider];
    if (!c?.expires_at) return false;
    return new Date(c.expires_at) < new Date();
  }

  if (loading) {
    return <div className="p-6 text-white">Carregando perfil…</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-xl font-bold">Perfil</h1>

      {/* CONEXÕES */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Conexões</h2>

        {/* STRAVA */}
        <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-4">
          <div>
            <p className="font-medium">Strava</p>
            {isConnected("strava") ? (
              <p className="text-sm text-green-400">
                {isExpired("strava")
                  ? "Conexão expirada"
                  : "Conectado"}
              </p>
            ) : (
              <p className="text-sm text-red-400">Não conectado</p>
            )}
          </div>

          <a
            href="/api/strava/connect"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2 rounded"
          >
            {isConnected("strava") ? "Reconectar" : "Conectar"}
          </a>
        </div>

        {/* FITBIT */}
        <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-4">
          <div>
            <p className="font-medium">Fitbit</p>
            {isConnected("fitbit") ? (
              <p className="text-sm text-green-400">
                {isExpired("fitbit")
                  ? "Conexão expirada"
                  : "Conectado"}
              </p>
            ) : (
              <p className="text-sm text-red-400">Não conectado</p>
            )}
          </div>

          <a
            href="/api/fitbit/connect"
            className="bg-teal-400 hover:bg-teal-500 text-black font-semibold px-4 py-2 rounded"
          >
            {isConnected("fitbit") ? "Reconectar" : "Conectar"}
          </a>
        </div>
      </div>
    </div>
  );
}
