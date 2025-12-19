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

  address_text: string | null;
  city: string | null;
  state: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;

  price_cents: number | null;
  organizer_whatsapp: string | null;

  image_path: string | null;
  image_url: string | null; // legado (se existir)

  organizer_id: string;
  created_at?: string | null;
};

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function formatPrice(priceCents: number | null): string {
  const cents = priceCents ?? 0;
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function ManageMyEventsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const empty = useMemo(() => !loading && events.length === 0 && !error, [loading, events, error]);

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
          "id,title,sport,date,address_text,city,state,capacity,waitlist_capacity,price_cents,organizer_whatsapp,image_path,image_url,organizer_id,created_at"
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
    const ok = window.confirm("Tem certeza que deseja apagar este evento? Essa ação não pode ser desfeita.");
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
          <Link href="/events/new" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
            Criar evento
          </Link>

          <Link href="/events" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
            Voltar
          </Link>
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">Carregando seus eventos…</div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Erro: {error}</div>
      )}

      {empty && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">Você ainda não criou nenhum evento.</div>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((ev) => {
            const img = getPublicImageUrl(ev.image_path) || ev.image_url || null;
            const addr = [ev.address_text, ev.city, ev.state].filter(Boolean).join(", ");
            const priceLabel = formatPrice(ev.price_cents);
            const waitOn = (ev.waitlist_capacity ?? 0) > 0;

            return (
              <li key={ev.id} className="rounded-xl border p-4">
                <div className="flex gap-4">
                  {/* Card clicável vai pra página do evento (inscrição) */}
                  <Link href={`/events/${ev.id}`} className="flex min-w-0 flex-1 gap-4" style={{ textDecoration: "none", color: "inherit" }}>
                    {img ? (
                      <img src={img} alt={ev.title ?? "Evento"} className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg border bg-gray-50" />
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold">{ev.title ?? "Sem título"}</h2>

                      <p className="mt-1 text-sm text-gray-600">
                        {ev.sport ? ev.sport : "Esporte livre"}
                        {ev.date ? ` • ${new Date(ev.date).toLocaleString()}` : ""}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">{addr || "Location TBD"}</p>

                      <p className="mt-2 text-sm text-gray-700">
                        Capacidade: {ev.capacity ?? "-"} {waitOn ? "• Waitlist: ON" : ""}
                        {" • "}
                        Preço: {priceLabel}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Botões */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/events/${ev.id}`} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                    Ver página
                  </Link>

                  <Link href={`/events/${ev.id}/edit`} className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
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
            );
          })}
        </ul>
      )}

      {!loading && userId && <p className="mt-8 text-xs text-gray-400">organizer_id = {userId}</p>}
    </main>
  );
}
