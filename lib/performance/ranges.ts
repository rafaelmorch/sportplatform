export type RangeKey = "7d" | "30d" | "6m" | "all";

export function startOfDayLocal(d: Date) {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );
}

export function isInRange(
  dateStr: string | null,
  range: RangeKey,
  now: Date
) {
  if (range === "all") return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return false;
  }

  const today = startOfDayLocal(now);
  const day = startOfDayLocal(d);

  const diffDays = Math.floor(
    (today.getTime() - day.getTime()) / 86400000
  );

  if (range === "7d") return diffDays >= 0 && diffDays <= 6;
  if (range === "30d") return diffDays >= 0 && diffDays <= 29;
  if (range === "6m") return diffDays >= 0 && diffDays <= 179;

  return true;
}
