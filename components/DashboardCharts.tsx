// components/DashboardCharts.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// tipo vindo do DashboardClient
import type { EvolutionPoint } from "./DashboardClient";

type DashboardChartsProps = {
  // novo jeito (o que estamos usando agora)
  evolutionData?: EvolutionPoint[];
  // props antigos, deixados opcionais só pra não quebrar nada
  dailyData?: any;
  sportData?: any;
};

export default function DashboardCharts({
  evolutionData,
}: DashboardChartsProps) {
  const data = evolutionData ?? [];

  const hasData = data && data.length > 0;

  return (
    <div style={{ width: "100%", minHeight: 360, height: "auto" }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          margin: "0 0 8px 0",
        }}
      >
        Workout Progress (min)
      </h2>
      <p
        style={{
          fontSize: 12,
          color: "#9ca3af",
          margin: "0 0 12px 0",
        }}
      >
        Daily workout minutes:{" "}
        <span style={{ color: "#4ade80" }}>you</span>,{" "}
        <span style={{ color: "#60a5fa" }}>group average</span> e{" "}
        <span style={{ color: "#f97316" }}>ranking leader</span>.
      </p>

      {!hasData ? (
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
          There is not enough data in this period to show workout
          progress.
        </p>
      ) : (
        <div style={{ width: "100%", height: 260 }}><ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={(v) => `${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #4b5563",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "#e5e7eb" }}
              formatter={(value: any) => [`${Number(value).toFixed(1)} min`, ""]}
            />
            <Legend
              verticalAlign="top"
              height={24}
              wrapperStyle={{ fontSize: 11, color: "#e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="userMinutes"
              name="You"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="groupAvgMinutes"
              name="Group Average"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="leaderMinutes"
              name="Ranking Leader"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer></div>
      )}
    </div>
  );
}

