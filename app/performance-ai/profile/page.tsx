"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ProfileRow = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  health_notes: string | null;
  goal_text: string | null;
  goal_date: string | null;
  level: string | null;
  days_per_week: number | null;
  minutes_per_session: number | null;
  sports: string | null;
};

type WeightLogRow = {
  id: string;
  weight_kg: number;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [healthNotes, setHealthNotes] = useState("");

  const [goalText, setGoalText] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [level, setLevel] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [minutesPerSession, setMinutesPerSession] = useState("");
  const [sports, setSports] = useState("");

  const [weightLogs, setWeightLogs] = useState<WeightLogRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user ?? null;

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("performance_ai_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

      if (profile) {
        setProfileId(profile.id);
        setWeightKg(profile.weight_kg?.toString() ?? "");
        setHeightCm(profile.height_cm?.toString() ?? "");
        setAge(profile.age?.toString() ?? "");
        setGender(profile.gender ?? "");
        setGoal(profile.goal ?? "");
        setHealthNotes(profile.health_notes ?? "");

        setGoalText(profile.goal_text ?? "");
        setGoalDate(profile.goal_date ?? "");
        setLevel(profile.level ?? "");
        setDaysPerWeek(profile.days_per_week?.toString() ?? "");
        setMinutesPerSession(profile.minutes_per_session?.toString() ?? "");
        setSports(profile.sports ?? "");
      }

      const { data: weightData } = await supabase
        .from("performance_ai_weight_logs")
        .select("id, weight_kg, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setWeightLogs((weightData ?? []) as WeightLogRow[]);
      setLoading(false);
    };

    loadPage();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      user_id: userId,
      weight_kg: weightKg ? Number(weightKg) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      age: age ? Number(age) : null,
      gender: gender || null,
      goal: goal || null,
      health_notes: healthNotes || null,
      goal_text: goalText || null,
      goal_date: goalDate || null,
      level: level || null,
      days_per_week: daysPerWeek ? Number(daysPerWeek) : null,
      minutes_per_session: minutesPerSession ? Number(minutesPerSession) : null,
      sports: sports || null,
      updated_at: new Date().toISOString(),
    };

    if (profileId) {
      const { error } = await supabase
        .from("performance_ai_profiles")
        .update(payload)
        .eq("id", profileId);

      setMessage(error ? error.message : "Perfil salvo com sucesso.");
    } else {
      const { data, error } = await supabase
        .from("performance_ai_profiles")
        .insert(payload)
        .select("id")
        .single();

      if (!error && data?.id) {
        setProfileId(data.id);
      }

      setMessage(error ? error.message : "Perfil criado com sucesso.");
    }

    setSaving(false);
  };

  const handleAddWeight = async () => {
    if (!userId || !weightKg.trim()) return;

    setSavingWeight(true);
    setMessage(null);

    const weightNumber = Number(weightKg);
    if (Number.isNaN(weightNumber) || weightNumber <= 0) {
      setMessage("Digite um peso válido.");
      setSavingWeight(false);
      return;
    }

    const { data, error } = await supabase
      .from("performance_ai_weight_logs")
      .insert({
        user_id: userId,
        weight_kg: weightNumber,
      })
      .select("id, weight_kg, created_at")
      .single();

    if (!error && data) {
      setWeightLogs((prev) => [data as WeightLogRow, ...prev].slice(0, 20));
      setMessage("Peso registrado com sucesso.");
    } else {
      setMessage(error?.message ?? "Erro ao registrar peso.");
    }

    setSavingWeight(false);
  };

  const handleDeleteWeight = async (id: string) => {
    const { error } = await supabase
      .from("performance_ai_weight_logs")
      .delete()
      .eq("id", id);

    if (!error) {
      setWeightLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        Carregando...
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: 16 }}>
        <BackButton />
      </div>

      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Meu perfil</h2>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Dados do atleta</h3>

          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Peso (kg)"
            style={inputStyle}
          />

          <input
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="Altura (cm)"
            style={inputStyle}
          />

          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Idade"
            style={inputStyle}
          />

          <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
            <option value="">Gênero</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
          </select>

          <select value={goal} onChange={(e) => setGoal(e.target.value)} style={inputStyle}>
            <option value="">Objetivo geral</option>
            <option value="performance">Performance</option>
            <option value="weight_loss">Perda de peso</option>
            <option value="conditioning">Condicionamento</option>
            <option value="maintenance">Manutenção</option>
          </select>

          <textarea
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Observações importantes de saúde"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
          />
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Objetivo e planejamento</h3>

          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Ex: Fazer um Ironman em 6 meses"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
          />

          <input
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            style={inputStyle}
          />

          <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
            <option value="">Nível</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>

          <input
            type="number"
            placeholder="Dias por semana disponíveis"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Minutos por treino"
            value={minutesPerSession}
            onChange={(e) => setMinutesPerSession(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Modalidades (ex: corrida, bike, natação)"
            value={sports}
            onChange={(e) => setSports(e.target.value)}
            style={inputStyle}
          />

          <button onClick={handleSave} disabled={saving} style={darkButtonStyle}>
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Histórico de peso</h3>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Peso (kg)"
              style={{ ...inputStyle, maxWidth: 150 }}
            />

            <button onClick={handleAddWeight} disabled={savingWeight} style={darkButtonStyle}>
              {savingWeight ? "Salvando..." : "Atualizar peso"}
            </button>
          </div>

          {weightLogs.length === 0 ? (
            <div style={emptyTextStyle}>Nenhum peso registrado ainda.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {weightLogs.map((log) => (
                <div key={log.id} style={rowCardStyle}>
                  <div>
                    <div style={rowPrimaryStyle}>{Number(log.weight_kg).toFixed(1)} kg</div>
                    <div style={rowSecondaryStyle}>{new Date(log.created_at).toLocaleString()}</div>
                  </div>

                  <button onClick={() => handleDeleteWeight(log.id)} style={deleteButtonStyle}>
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {message ? <div style={globalMessageStyle}>{message}</div> : null}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#0f172a",
  padding: 16,
  paddingBottom: 100,
  fontFamily: "Montserrat, sans-serif",
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginBottom: 28,
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  margin: 0,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 16,
  display: "grid",
  gap: 12,
};

const rowCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
  background: "#f8fafc",
};

const rowPrimaryStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const rowSecondaryStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 4,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
};

const globalMessageStyle: React.CSSProperties = {
  position: "sticky",
  bottom: 16,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  padding: 12,
  fontSize: 13,
  color: "#475569",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  padding: "10px 12px",
  boxSizing: "border-box",
  fontFamily: "Montserrat, sans-serif",
};

const darkButtonStyle: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  background: "#0f172a",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#dc2626",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "Montserrat, sans-serif",
};
