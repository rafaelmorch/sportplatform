import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim();
    const password = String(body.password || "");

    if (password !== "platform123") {
      return NextResponse.json(
        { error: "Senha inválida." },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Inscrição não informada." },
        { status: 400 }
      );
    }

    if (!["submitted", "approved"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("soccer_registrations")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: data,
    });
  } catch (error) {
    console.error("SOCCER STATUS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar a inscrição.",
      },
      { status: 500 }
    );
  }
}
