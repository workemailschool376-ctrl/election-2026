"use client";

import CandidateCard from "./CandidateCard";
import VoteBarChart from "./VoteBarChart";
import VotePieChart from "./VotePieChart";
import { ROLE_LABELS, orderRoles } from "@/lib/election-meta";

interface Candidate {
  id: number;
  name: string;
  symbolName: string;
  imageUrl: string;
  votes: number;
  role: string;
  house?: { name: string; color: string } | null;
}

interface Election {
  id: number;
  name: string;
  type: string;
  isVisible: boolean;
  candidates: Candidate[];
}

interface CategorySectionProps {
  election: Election;
  roleOrder?: string[];
}

const ROLE_ICONS: Record<string, string> = {
  HEAD_BOY: "👦",
  DEPUTY_HEAD_BOY: "🤝",
  HEAD_GIRL: "👧",
  DEPUTY_HEAD_GIRL: "🤝",
  SPORTS_CAPTAIN: "🏆",
  SPORTS_VICE_CAPTAIN: "⚡",
  HOUSE_CAPTAIN: "🏠",
  HOUSE_VICE_CAPTAIN: "🌟",
};

const ROLE_GRADIENT: Record<string, string> = {
  HEAD_BOY: "from-indigo-500/20 to-indigo-900/5 border-indigo-500/20",
  DEPUTY_HEAD_BOY: "from-violet-500/15 to-violet-900/5 border-violet-500/20",
  HEAD_GIRL: "from-pink-500/20 to-pink-900/5 border-pink-500/20",
  DEPUTY_HEAD_GIRL: "from-rose-500/15 to-rose-900/5 border-rose-500/20",
  SPORTS_CAPTAIN: "from-emerald-500/20 to-emerald-900/5 border-emerald-500/20",
  SPORTS_VICE_CAPTAIN: "from-teal-500/15 to-teal-900/5 border-teal-500/20",
};

export default function CategorySection({ election, roleOrder }: CategorySectionProps) {
  if (!election.isVisible) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-white/50">{election.name}</h3>
        <p className="text-white/30 text-sm mt-2">Results hidden by administrator</p>
      </div>
    );
  }

  const roles = orderRoles(
    election.candidates.map((c) => c.role),
    roleOrder
  );

  if (roles.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
        No candidates in this election yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {roles.map((role, roleIdx) => {
        const candidates = election.candidates
          .filter((c) => c.role === role)
          .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
        const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
        const maxVotes = Math.max(...candidates.map((c) => c.votes), 0);
        const gradient = ROLE_GRADIENT[role] ?? "from-white/5 to-white/0 border-white/10";
        const icon = ROLE_ICONS[role] ?? "🎯";

        return (
          <div
            key={role}
            className={`rounded-2xl border bg-gradient-to-br ${gradient} backdrop-blur-sm overflow-hidden fade-slide-in stagger-${Math.min(roleIdx + 1, 4)}`}
          >
            {/* Role header */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-white/5">
              <span className="text-2xl">{icon}</span>
              <div>
                <h3 className="text-lg font-extrabold text-white leading-tight tracking-tight">
                  {ROLE_LABELS[role] ?? role}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} ·{" "}
                  {totalVotes.toLocaleString()} total vote{totalVotes !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Candidate cards */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(170px, 1fr))`,
                }}
              >
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isLeading={c.votes === maxVotes && maxVotes > 0}
                    totalVotes={totalVotes}
                  />
                ))}
              </div>

              {/* Charts */}
              {candidates.length > 1 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3 font-semibold text-center">
                      Vote Count
                    </p>
                    <VoteBarChart candidates={candidates} />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3 font-semibold text-center">
                      Vote Share
                    </p>
                    <VotePieChart candidates={candidates} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
