"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";

interface Candidate {
  id: number;
  name: string;
  votes: number;
}

interface VoteBarChartProps {
  candidates: Candidate[];
  color?: string;
}

const colorMap: Record<string, { fill: string; glow: string; dim: string }> = {
  RED:     { fill: "#ef4444", glow: "#fca5a5", dim: "#7f1d1d" },
  GREEN:   { fill: "#22c55e", glow: "#86efac", dim: "#14532d" },
  BLUE:    { fill: "#3b82f6", glow: "#93c5fd", dim: "#1e3a8a" },
  YELLOW:  { fill: "#eab308", glow: "#fde047", dim: "#713f12" },
  DEFAULT: { fill: "#818cf8", glow: "#c7d2fe", dim: "#312e81" },
};

interface CustomLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}

function CustomLabel({ x = 0, y = 0, width = 0, value = 0 }: CustomLabelProps) {
  if (!value || value <= 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="rgba(255,255,255,0.85)"
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
    >
      {value.toLocaleString()}
    </text>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; votes: number; pct: number } }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
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
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        {d.votes.toLocaleString()} {d.votes === 1 ? "vote" : "votes"}
        {d.pct > 0 && (
          <span style={{ color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>
            ({d.pct.toFixed(1)}%)
          </span>
        )}
      </p>
    </div>
  );
}

export default function VoteBarChart({ candidates, color = "DEFAULT" }: VoteBarChartProps) {
  const total = candidates.reduce((s, c) => s + c.votes, 0);
  const data = [...candidates]
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
    .map((c) => ({
      name: c.name,
      shortName: c.name.length > 10 ? `${c.name.slice(0, 10)}…` : c.name,
      votes: c.votes,
      pct: total > 0 ? (c.votes / total) * 100 : 0,
    }));

  const maxVotes = Math.max(...data.map((d) => d.votes), 0);
  const yDomainMax = maxVotes === 0 ? 5 : Math.ceil(maxVotes * 1.2);
  const scheme = colorMap[color] ?? colorMap.DEFAULT;
  const avgVotes = total > 0 ? total / data.length : 0;

  if (data.length === 0) {
    return (
      <div className="h-[240px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/40">
        No candidates
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 32 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
          {avgVotes > 0 && (
            <ReferenceLine
              y={avgVotes}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 3"
              label={{
                value: "avg",
                fill: "rgba(255,255,255,0.3)",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
          )}
          <XAxis
            dataKey="shortName"
            interval={0}
            angle={data.length > 5 ? -25 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
            height={44}
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.40)", fontSize: 10 }}
            allowDecimals={false}
            width={28}
            domain={[0, yDomainMax]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="votes" radius={[6, 6, 2, 2]} maxBarSize={52}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.votes === maxVotes && maxVotes > 0 ? scheme.fill : scheme.dim}
                fillOpacity={entry.votes === maxVotes && maxVotes > 0 ? 0.95 : 0.55}
              />
            ))}
            <LabelList content={<CustomLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
