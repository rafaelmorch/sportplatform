"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const supabase = supabaseBrowser;

type EventRow = {
  id: string;
  title: string | null;
  sport: string | null;
  date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  capacity: number | null;
  waitlist: boolean | null;
  price: number | null;
  whatsapp: string | null;
  image_url: string | null; // se você já usa outro nome, troca aqui e no select
  organizer_id: string;
  created_at?: string | null;
};

export default function ManageMyEventsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const empty = useMemo(
    () => !loading && events.length === 0 && !error,
    [loading, events, error]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? null;

      if (!mounted) return;

      if (authErr || !uid) {
        setUserId(null);
        setLoading(false);
        router.push("/login");
        return;
      }

      setUserId(uid);

      const { data, error: qErr } = await supabase
        .from("events")
        .select(
          "id,title,sport,date,address,city,state,capacity,waitlist,price,whatsapp,image_url,organizer_id,created_at"
        )
        .eq("organizer_id", uid)
        .order("date", { ascending: true, nullsFirst: false });

      if (!mounted) return;

      if (qErr) {
        setError(qErr.message);
        setEvents([]);
      } else {
        setEvents((data ?? []) as EventRow[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleDelete(eventId: string) {
    const ok = window.confirm(
      "Tem certeza que deseja apagar este evento? Essa ação não pode ser desfeita."
    );
    if (!ok) return;

    try {
      setDeletingId(eventId);
      setError(null);

      const { error: delErr } = await supabase.from("events").delete().eq("id", eventId);

      if (delErr) {
        setError(delErr.message);
        return;
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Meus eventos</h1>

        <div className="flex items-center gap-2">
          <Link
            href="/events/new"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Criar evento
          </Link>

          <Link
            href="/events"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
          Carregando seus eventos…
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Erro: {error}
        </div>
      )}

      {empty && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
          Você ainda não criou nenhum evento.
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((ev) => (
            <li key={ev.id} className="rounded-xl border p-4">
              <div className="flex gap-4">
                {/* ✅ Agora a “área do card” é clicável e vai para a página de inscrição */}
                <Link
                  href={`/events/${ev.id}`}
                  className="flex gap-4 min-w-0 flex-1"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {ev.image_url ? (
                    <img
                      src={ev.image_url}
                      alt={ev.title ?? "Evento"}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg border bg-gray-50" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold">
                          {ev.title ?? "Sem título"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                          {ev.sport ? ev.sport : "Esporte livre"}
                          {ev.date ? ` • ${new Date(ev.date).toLocaleString()}` : ""}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {[ev.address, ev.city, ev.state].filter(Boolean).join(", ")}
                        </p>

                        <p className="mt-2 text-sm text-gray-700">
                          Capacidade: {ev.capacity ?? "-"}{" "}
                          {ev.waitlist ? "• Waitlist: ON" : ""}
                          {" • "}
                          Preço:{" "}
                          {ev.price != null ? `$${Number(ev.price).toFixed(2)}` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* ✅ Botões continuam separados (não mudam) */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/events/${ev.id}`}
                  className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  Ver página
                </Link>

                <Link
                  href={`/events/${ev.id}/edit`}
                  className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  Editar
                </Link>

                <Link
                  href={`/events/manage/${ev.id}/registrations`}
                  className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                >
                  Ver inscritos
                </Link>

                <button
                  onClick={() => handleDelete(ev.id)}
                  disabled={deletingId === ev.id}
                  className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  {deletingId === ev.id ? "Apagando..." : "Apagar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* só pra debug rápido, pode remover depois */}
      {!loading && userId && (
        <p className="mt-8 text-xs text-gray-400">organizer_id = {userId}</p>
      )}
    </main>
  );
}
