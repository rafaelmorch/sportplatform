import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function generateConfirmationCode() {
  return `PS-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function getSlotByClinicAndTime(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  clinicId: "clinic1" | "clinic2",
  slotTime: string
) {
  const { data, error } = await supabase
    .from("beach_tennis_clinic_slots")
    .select("id, clinic_id, slot_time, capacity")
    .eq("clinic_id", clinicId)
    .eq("slot_time", slotTime)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Horário inválido para ${clinicId}.`);
  }

  return data;
}

async function countRegistrationsForSlot(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  slotId: string
) {
  const clinic1CountPromise = supabase
    .from("beach_tennis_registrations")
    .select("id", { count: "exact", head: true })
    .eq("clinic1_slot_id", slotId);

  const clinic2CountPromise = supabase
    .from("beach_tennis_registrations")
    .select("id", { count: "exact", head: true })
    .eq("clinic2_slot_id", slotId);

  const [clinic1CountResult, clinic2CountResult] = await Promise.all([
    clinic1CountPromise,
    clinic2CountPromise,
  ]);

  if (clinic1CountResult.error) {
    throw new Error(clinic1CountResult.error.message);
  }

  if (clinic2CountResult.error) {
    throw new Error(clinic2CountResult.error.message);
  }

  return (clinic1CountResult.count || 0) + (clinic2CountResult.count || 0);
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const formData = await request.formData();

    const participant1 = String(formData.get("participant1") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const clinic1Slot = String(formData.get("clinic1Slot") || "").trim() || null;
    const clinic2Slot = String(formData.get("clinic2Slot") || "").trim() || null;
    const termsAccepted = String(formData.get("termsAccepted") || "") === "true";

    if (!participant1 || !email || !phone) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "É necessário aceitar os termos." },
        { status: 400 }
      );
    }

    if (!clinic1Slot && !clinic2Slot) {
      return NextResponse.json(
        { error: "Selecione ao menos um horário." },
        { status: 400 }
      );
    }

    let clinic1SlotId: string | null = null;
    let clinic2SlotId: string | null = null;

    if (clinic1Slot) {
      const slot = await getSlotByClinicAndTime(supabase, "clinic1", clinic1Slot);
      const used = await countRegistrationsForSlot(supabase, slot.id);

      if (used >= slot.capacity) {
        return NextResponse.json(
          { error: `O horário ${clinic1Slot} da Clínica 1 já lotou.` },
          { status: 400 }
        );
      }

      clinic1SlotId = slot.id;
    }

    if (clinic2Slot) {
      const slot = await getSlotByClinicAndTime(supabase, "clinic2", clinic2Slot);
      const used = await countRegistrationsForSlot(supabase, slot.id);

      if (used >= slot.capacity) {
        return NextResponse.json(
          { error: `O horário ${clinic2Slot} da Clínica 2 já lotou.` },
          { status: 400 }
        );
      }

      clinic2SlotId = slot.id;
    }

    const originalTotal =
      (clinic1Slot ? 29.9 : 0) +
      (clinic2Slot ? 29.9 : 0);

    const totalAmount =
      clinic1Slot && clinic2Slot ? 49.9 : originalTotal;

    const confirmationCode = generateConfirmationCode();

    const insertResult = await supabase
      .from("beach_tennis_registrations")
      .insert({
        confirmation_code: confirmationCode,
        participant_1_name: participant1,
        contact_email: email,
        contact_phone: phone,
        clinic1_slot_id: clinic1SlotId,
        clinic2_slot_id: clinic2SlotId,
        terms_accepted: true,
        total_amount: totalAmount,
        status: "submitted",
      });

    if (insertResult.error) {
      return NextResponse.json(
        { error: insertResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, confirmationCode });
  } catch (error) {
    console.error("BEACH TENNIS ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao enviar inscrição.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}


