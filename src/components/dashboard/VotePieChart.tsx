"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Candidate {
  id: number;
  name: string;
  votes: number;
}

interface VotePieChartProps {
  candidates: Candidate[];
  color?: string;
}

const PALETTE: Record<string, string[]> = {
  RED:     ["#ef4444", "#f97316", "#dc2626", "#fca5a5", "#fee2e2", "#b91c1c", "#fcd34d"],
  GREEN:   ["#22c55e", "#34d399", "#16a34a", "#86efac", "#a7f3d0", "#15803d", "#6ee7b7"],
  BLUE:    ["#3b82f6", "#6366f1", "#2563eb", "#93c5fd", "#a5b4fc", "#1d4ed8", "#bfdbfe"],
  YELLOW:  ["#eab308", "#f59e0b", "#ca8a04", "#fde047", "#fcd34d", "#a16207", "#fef08a"],
  DEFAULT: ["#818cf8", "#a78bfa", "#6366f1", "#c4b5fd", "#7c3aed", "#4f46e5", "#e0e7ff"],
};

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
}

const RADIAN = Math.PI / 180;
function CustomLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0 }: CustomLabelProps) {
  if (!percent || percent < 0.05) return null;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.75)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { pct: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: "rgba(10,10,28,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        color: "#fff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{item.name}</p>
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        {item.value.toLocaleString()} {item.value === 1 ? "vote" : "votes"}
        <span style={{ color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>
          ({item.payload.pct.toFixed(1)}%)
        </span>
      </p>
    </div>
  );
}

export default function VotePieChart({ candidates, color = "DEFAULT" }: VotePieChartProps) {
  const sortedCandidates = [...candidates].sort(
    (a, b) => b.votes - a.votes || a.name.localeCompare(b.name)
  );
  const total = sortedCandidates.reduce((s, c) => s + c.votes, 0);

  if (total === 0) {
    // Show equal-sized placeholder slices when no votes
    const equalData = sortedCandidates.map((c) => ({ name: c.name, value: 1, pct: 0 }));
    const colors = PALETTE[color] ?? PALETTE.DEFAULT;
    return (
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={equalData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              stroke="none"
            >
              {equalData.map((_, index) => (
                <Cell
                  key={index}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.25}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-white/25 text-xs font-semibold">No votes yet</p>
          <p className="text-white/15 text-[10px] mt-0.5">Equal segments shown</p>
        </div>
      </div>
    );
  }

  const data = sortedCandidates.map((c) => ({
    name: c.name,
    value: c.votes,
    pct: total > 0 ? (c.votes / total) * 100 : 0,
  }));
  const colors = PALETTE[color] ?? PALETTE.DEFAULT;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={82}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={colors[index % colors.length]}
              fillOpacity={0.9}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          formatter={(value) => {
            const entry = data.find((d) => d.name === value);
            return (
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                {value}{" "}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>
                  {entry && entry.pct > 0 ? `(${entry.pct.toFixed(1)}%)` : "(0%)"}
                </span>
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
