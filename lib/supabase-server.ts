// lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Helper assíncrono. Hoje não estamos usando em lugar nenhum,
// mas ele fica pronto para uso futuro.
export async function supabaseServer() {
  const cookieStore = await cookies(); // 👈 repare no await aqui

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
