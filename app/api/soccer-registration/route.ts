import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function generateConfirmationCode() {
  return `SC-${Math.floor(100000 + Math.random() * 900000)}`;
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const formData = await request.formData();

    const teamName = String(formData.get("teamName") || "").trim();
    const responsibleName = String(
      formData.get("responsibleName") || ""
    ).trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const proof = formData.get("proof");

    if (!teamName || !responsibleName || !email || !phone) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!(proof instanceof File)) {
      return NextResponse.json(
        { error: "Anexe o comprovante de pagamento." },
        { status: 400 }
      );
    }

    if (proof.size <= 0) {
      return NextResponse.json(
        { error: "O comprovante enviado está vazio." },
        { status: 400 }
      );
    }

    const confirmationCode = generateConfirmationCode();
    const extension = getFileExtension(proof.name || "proof");
    const safeTeamName = teamName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const filePath = `soccer/${confirmationCode}-${safeTeamName || "team"}.${extension}`;

    const fileBuffer = Buffer.from(await proof.arrayBuffer());

    const uploadResult = await supabase.storage
      .from("registration-proofs")
      .upload(filePath, fileBuffer, {
        contentType: proof.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadResult.error) {
      return NextResponse.json(
        { error: uploadResult.error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("registration-proofs")
      .getPublicUrl(filePath);

    const insertResult = await supabase
      .from("soccer_registrations")
      .insert({
        confirmation_code: confirmationCode,
        team_name: teamName,
        responsible_name: responsibleName,
        contact_email: email,
        contact_phone: phone,
        total_amount: 450,
        status: "submitted",
        payment_proof_path: filePath,
        payment_proof_url: publicUrlData?.publicUrl || null,
      });

    if (insertResult.error) {
      await supabase.storage
        .from("registration-proofs")
        .remove([filePath]);

      return NextResponse.json(
        { error: insertResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      confirmationCode,
    });
  } catch (error) {
    console.error("SOCCER REGISTRATION ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao enviar inscrição.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
