"use client";

import CandidateCard from "./CandidateCard";
import VoteBarChart from "./VoteBarChart";
import VotePieChart from "./VotePieChart";
import { HOUSE_ROLE_ORDER, ROLE_LABELS, orderRoles } from "@/lib/election-meta";

interface Candidate {
  id: number;
  name: string;
  symbolName: string;
  imageUrl: string;
  votes: number;
  role: string;
  election?: { name: string; type: string } | null;
}

interface House {
  id: number;
  name: string;
  color: string;
  candidates: Candidate[];
}

interface HouseSectionProps {
  house: House;
}

const houseConfig: Record<string, {
  gradient: string;
  badge: string;
  emoji: string;
  roleHeaderBg: string;
  accent: string;
}> = {
  RED: {
    gradient: "from-red-950/70 via-red-900/20 to-transparent border-red-500/30",
    badge: "bg-red-500 text-white",
    emoji: "🔴",
    roleHeaderBg: "bg-red-900/20 border-red-500/15",
    accent: "text-red-300",
  },
  GREEN: {
    gradient: "from-green-950/70 via-green-900/20 to-transparent border-green-500/30",
    badge: "bg-green-500 text-white",
    emoji: "🟢",
    roleHeaderBg: "bg-green-900/20 border-green-500/15",
    accent: "text-green-300",
  },
  BLUE: {
    gradient: "from-blue-950/70 via-blue-900/20 to-transparent border-blue-500/30",
    badge: "bg-blue-500 text-white",
    emoji: "🔵",
    roleHeaderBg: "bg-blue-900/20 border-blue-500/15",
    accent: "text-blue-300",
  },
  YELLOW: {
    gradient: "from-yellow-950/70 via-yellow-900/20 to-transparent border-yellow-400/30",
    badge: "bg-yellow-400 text-black",
    emoji: "🟡",
    roleHeaderBg: "bg-yellow-900/20 border-yellow-400/15",
    accent: "text-yellow-300",
  },
};

const ROLE_ICONS: Record<string, string> = {
  HOUSE_CAPTAIN: "🏆",
  HOUSE_VICE_CAPTAIN: "⭐",
};

export default function HouseSection({ house }: HouseSectionProps) {
  const cfg = houseConfig[house.color] ?? houseConfig.BLUE;
  const roles = orderRoles(house.candidates.map((c) => c.role), HOUSE_ROLE_ORDER);
  const totalHouseVotes = house.candidates.reduce((s, c) => s + c.votes, 0);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${cfg.gradient} overflow-hidden`}>
      {/* House header */}
      <div className="px-6 py-5 flex items-center gap-4 border-b border-white/8">
        <span className="text-4xl">{cfg.emoji}</span>
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold text-white tracking-tight">{house.name} House</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              House Elections
            </span>
            <span className="text-xs text-white/40">
              {totalHouseVotes.toLocaleString()} total vote{totalHouseVotes !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {roles.map((role) => {
          const candidates = house.candidates
            .filter((c) => c.role === role)
            .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
          const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
          const maxVotes = Math.max(...candidates.map((c) => c.votes), 0);
          const icon = ROLE_ICONS[role] ?? "🌟";

          return (
            <div key={role} className="space-y-4">
              {/* Role header */}
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border ${cfg.roleHeaderBg}`}>
                <span className="text-lg">{icon}</span>
                <div>
                  <p className={`text-sm font-extrabold uppercase tracking-wider ${cfg.accent}`}>
                    {ROLE_LABELS[role] ?? role}
                  </p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} ·{" "}
                    {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Candidate cards */}
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))" }}
              >
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isLeading={c.votes === maxVotes && maxVotes > 0}
                    totalVotes={totalVotes}
                    houseColor={house.color}
                  />
                ))}
              </div>

              {/* Charts — only when there are multiple candidates */}
              {candidates.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-[11px] text-white/30 mb-2 text-center uppercase tracking-widest font-semibold">
                      Vote Count
                    </p>
                    <VoteBarChart candidates={candidates} color={house.color} />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/30 mb-2 text-center uppercase tracking-widest font-semibold">
                      Vote Share
                    </p>
                    <VotePieChart candidates={candidates} color={house.color} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {roles.length === 0 && (
          <p className="text-center text-white/30 py-8 text-sm">
            No candidates for this house yet.
          </p>
        )}
      </div>
    </div>
  );
}
