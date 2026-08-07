"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrainingDistanceChartPoint = {
  label: string;
  name: string;
  distanceKm: number;
};

type TrainingDistanceChartProps = {
  data: TrainingDistanceChartPoint[];
};

export default function TrainingDistanceChart({
  data,
}: TrainingDistanceChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 16,
            right: 14,
            left: -18,
            bottom: 4,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            stroke="#73737c"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#73737c"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `${Number(value).toFixed(0)}`
            }
          />

          <Tooltip
            cursor={{
              stroke: "rgba(212,175,55,0.20)",
              strokeWidth: 1,
            }}
            contentStyle={{
              backgroundColor: "#09090b",
              border:
                "1px solid rgba(212,175,55,0.28)",
              borderRadius: 10,
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.38)",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 11,
            }}
            labelStyle={{
              color: "#D4AF37",
              marginBottom: 5,
            }}
            formatter={(
              value: number | string,
              _name,
              props
            ) => [
              `${Number(value).toFixed(1)} km`,
              props.payload?.name ?? "Atividade",
            ]}
          />

          <Line
            type="monotone"
            dataKey="distanceKm"
            name="Distância"
            stroke="#D4AF37"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: "#050505",
              stroke: "#D4AF37",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#D4AF37",
              stroke: "#050505",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
