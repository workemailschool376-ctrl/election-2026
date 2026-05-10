"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface Candidate {
  id: number;
  name: string;
  symbolName: string;
  imageUrl: string;
  votes: number;
  role: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  isLeading: boolean;
  totalVotes: number;
  houseColor?: string;
}

const houseAccents: Record<string, { card: string; bar: string; ring: string }> = {
  RED:    { card: "from-red-500/15 to-red-950/30 border-red-500/30",    bar: "bg-red-400",    ring: "ring-red-400" },
  GREEN:  { card: "from-green-500/15 to-green-950/30 border-green-500/30",  bar: "bg-green-400",  ring: "ring-green-400" },
  BLUE:   { card: "from-blue-500/15 to-blue-950/30 border-blue-500/40",   bar: "bg-blue-400",   ring: "ring-blue-400" },
  YELLOW: { card: "from-yellow-400/15 to-yellow-950/30 border-yellow-400/30", bar: "bg-yellow-300", ring: "ring-yellow-300" },
};
const defaultAccent = { card: "from-indigo-500/15 to-indigo-950/30 border-indigo-500/30", bar: "bg-indigo-400", ring: "ring-indigo-400" };

export default function CandidateCard({
  candidate,
  isLeading,
  totalVotes,
  houseColor,
}: CandidateCardProps) {
  const [displayVotes, setDisplayVotes] = useState(candidate.votes);
  const [popped, setPopped] = useState(false);
  const previousVotesRef = useRef(candidate.votes);
  const pct = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
  const accent = houseColor ? (houseAccents[houseColor] ?? defaultAccent) : defaultAccent;
  const imageVersion = encodeURIComponent(candidate.imageUrl || "");
  const imageSrc = `/api/candidates/${candidate.id}/image?v=${imageVersion}`;
  const hasSymbol = candidate.symbolName.trim().length > 0;

  // Animate vote counter on change
  useEffect(() => {
    const startVotes = previousVotesRef.current;
    if (candidate.votes === startVotes) return;
    setPopped(true);
    setTimeout(() => setPopped(false), 500);
    const diff = candidate.votes - startVotes;
    const steps = Math.min(Math.abs(diff), 20);
    if (steps === 0) {
      setDisplayVotes(candidate.votes);
      previousVotesRef.current = candidate.votes;
      return;
    }
    const step = diff / steps;
    let current = startVotes;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      current += step;
      setDisplayVotes(Math.round(count < steps ? current : candidate.votes));
      if (count >= steps) clearInterval(timer);
    }, 40);
    previousVotesRef.current = candidate.votes;
    return () => clearInterval(timer);
  }, [candidate.votes]);

  return (
    <div
      className={`relative flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b ${accent.card} p-5 transition-all duration-500 ${
        isLeading
          ? `shadow-xl shadow-black/30 scale-[1.04] z-10`
          : "opacity-85 hover:opacity-100 hover:scale-[1.01]"
      }`}
    >
      {isLeading && (
        <div className="crown-badge absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-400 text-black text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
          👑 Leading
        </div>
      )}

      {/* Photo */}
      <div
        className={`relative h-24 w-24 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 ${
          isLeading ? `ring-4 ${accent.ring} ring-offset-2 ring-offset-[#07071a]` : ""
        }`}
      >
        <Image
          src={imageSrc}
          alt={candidate.name}
          fill
          className="object-cover"
          unoptimized
          onError={() => {}}
        />
      </div>

      {/* Name & symbol */}
      <div className="text-center space-y-0.5">
        <p className="text-base font-bold text-white leading-tight tracking-tight">{candidate.name}</p>
        <p className="text-[11px] text-white/45">
          {hasSymbol ? `🏷 ${candidate.symbolName}` : <span className="italic opacity-60">Logo pending</span>}
        </p>
      </div>

      {/* Vote count */}
      <div className="flex flex-col items-center -my-1">
        <span
          className={`text-5xl font-extrabold text-white tabular-nums leading-none ${popped ? "vote-pop" : ""}`}
        >
          {displayVotes.toLocaleString()}
        </span>
        <span className="text-[11px] text-white/35 mt-1 font-medium uppercase tracking-widest">
          votes
        </span>
      </div>

      {/* Vote share bar */}
      <div className="w-full mt-1">
        <div className="flex justify-between text-[11px] text-white/45 mb-1.5">
          <span>Vote share</span>
          <span className="font-bold text-white/70">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full ${accent.bar} bar-fill`}
            style={{ width: `${pct}%`, opacity: 0.8 }}
          />
        </div>
      </div>
    </div>
  );
}
