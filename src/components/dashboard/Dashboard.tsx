"use client";

import { useEffect, useState, useCallback } from "react";
import LiveBadge from "./LiveBadge";
import CategorySection from "./CategorySection";
import HouseSection from "./HouseSection";
import {
  ELECTION_TYPES,
  SPORTS_ROLE_ORDER,
  STUDENT_COUNCIL_ROLE_ORDER,
} from "@/lib/election-meta";

interface DashboardData {
  elections: Array<{
    id: number;
    name: string;
    type: string;
    isVisible: boolean;
    candidates: Array<{
      id: number;
      name: string;
      symbolName: string;
      imageUrl: string;
      votes: number;
      role: string;
      house?: { name: string; color: string } | null;
    }>;
  }>;
  houses: Array<{
    id: number;
    name: string;
    color: string;
    candidates: Array<{
      id: number;
      name: string;
      symbolName: string;
      imageUrl: string;
      votes: number;
      role: string;
      election?: { name: string; type: string } | null;
    }>;
  }>;
}

type DashboardTab = "student-council" | "sports" | "house-elections";

const DASHBOARD_TABS: Array<{
  key: DashboardTab;
  label: string;
  subtitle: string;
  icon: string;
  gradient: string;
  activeText: string;
  activeBorder: string;
  activeBg: string;
}> = [
  {
    key: "student-council",
    label: "Head Boy / Head Girl",
    subtitle: "Head Boy · Deputy Head Boy · Head Girl · Deputy Head Girl",
    icon: "🏫",
    gradient: "from-indigo-600/20 to-violet-600/10",
    activeText: "text-indigo-200",
    activeBorder: "border-indigo-400/60",
    activeBg: "bg-indigo-500/15",
  },
  {
    key: "sports",
    label: "Sports Elections",
    subtitle: "Sports Captain · Sports Vice-Captain",
    icon: "🏆",
    gradient: "from-emerald-600/20 to-teal-600/10",
    activeText: "text-emerald-200",
    activeBorder: "border-emerald-400/60",
    activeBg: "bg-emerald-500/15",
  },
  {
    key: "house-elections",
    label: "House Elections",
    subtitle: "Apollo · Zeus · Poseidon · Mercury",
    icon: "🏠",
    gradient: "from-amber-600/20 to-orange-600/10",
    activeText: "text-amber-200",
    activeBorder: "border-amber-400/60",
    activeBg: "bg-amber-500/15",
  },
];

const HOUSE_EMOJI: Record<string, string> = {
  RED: "🔴",
  GREEN: "🟢",
  BLUE: "🔵",
  YELLOW: "🟡",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("student-council");
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);

  const fetchFallback = useCallback(async () => {
    try {
      const res = await fetch("/api/results");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      setError(true);
    }
  }, []);

  // Immediately fetch data via HTTP on first mount so the dashboard
  // never shows a blank spinner while waiting for the SSE connection.
  useEffect(() => {
    fetchFallback();
  }, [fetchFallback]);

  useEffect(() => {
    let es: EventSource;
    let pollInterval: ReturnType<typeof setInterval>;

    const connect = () => {
      es = new EventSource("/api/sse");

      es.onopen = () => {
        setConnected(true);
        setError(false);
      };

      es.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          setData(json);
          setError(false);
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Fall back to polling every 10 s when SSE is unavailable
        pollInterval = setInterval(fetchFallback, 10000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearInterval(pollInterval);
    };
  }, [fetchFallback]);

  useEffect(() => {
    if (!data?.houses?.length) {
      setSelectedHouseId(null);
      return;
    }
    setSelectedHouseId((prev) => {
      if (prev && data.houses.some((h) => h.id === prev)) return prev;
      return data.houses[0].id;
    });
  }, [data]);

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#07071a]">
        <p className="text-4xl">⚠️</p>
        <p className="text-white/60 text-sm">Could not load results. Retrying…</p>
        <button
          onClick={fetchFallback}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition"
        >
          Retry now
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[#07071a]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-white/40 text-sm animate-pulse">Loading election data…</p>
      </div>
    );
  }

  const leadershipElection = data.elections.find((e) => e.type === ELECTION_TYPES.LEADERSHIP);
  const sportsElection = data.elections.find((e) => e.type === ELECTION_TYPES.SPORTS);
  const houseElection = data.elections.find((e) => e.type === ELECTION_TYPES.HOUSE);
  const selectedHouse =
    (selectedHouseId && data.houses.find((h) => h.id === selectedHouseId)) ??
    data.houses[0] ??
    null;

  const activeTabDef = DASHBOARD_TABS.find((t) => t.key === activeTab)!;

  return (
    <main className="min-h-screen bg-[#07071a] text-white">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#07071a]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 border border-white/10 flex items-center justify-center text-lg shadow-inner">
              🏫
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-none tracking-tight">
                Euro School
              </h1>
              <p className="text-[11px] text-white/35 mt-0.5 font-medium">
                Election 2026 — Live Results
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!connected && (
              <span className="hidden sm:inline text-[11px] text-yellow-300/70 font-medium">
                ⚡ Reconnecting…
              </span>
            )}
            <LiveBadge />
          </div>
        </div>
      </header>

      {/* ── HERO STATS BAR ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 gap-4 text-center">
          {[
            {
              label: "Total Candidates",
              value: data.elections.reduce((s, e) => s + e.candidates.length, 0),
              icon: "🧑‍🎓",
            },
            {
              label: "Total Votes Cast",
              value: data.elections.reduce((s, e) => s + e.candidates.reduce((v, c) => v + c.votes, 0), 0),
              icon: "🗳️",
            },
            {
              label: "Elections Running",
              value: data.elections.filter((e) => e.isVisible).length,
              icon: "⚡",
            },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-lg sm:text-xl">{stat.icon}</span>
              <span className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">
                {stat.value.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-white/35 font-medium hidden sm:block">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── TAB NAVIGATION ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 shadow-xl shadow-black/20">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {DASHBOARD_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative rounded-xl border px-4 py-3.5 text-left transition-all duration-200 overflow-hidden group ${
                    isActive
                      ? `${tab.activeBorder} ${tab.activeBg} shadow-lg`
                      : "border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15"
                  }`}
                >
                  {isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${tab.gradient} opacity-60 pointer-events-none`}
                    />
                  )}
                  <div className="relative flex items-start gap-3">
                    <span className={`text-2xl mt-0.5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                      {tab.icon}
                    </span>
                    <div>
                      <p
                        className={`text-sm font-extrabold leading-snug ${
                          isActive ? tab.activeText : "text-white/85"
                        }`}
                      >
                        {tab.label}
                      </p>
                      <p className="text-[11px] text-white/35 mt-1 leading-relaxed font-medium">
                        {tab.subtitle}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── SECTION TITLE ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/8" />
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeTabDef.icon}</span>
            <h2 className={`text-sm font-extrabold uppercase tracking-[0.25em] ${activeTabDef.activeText}`}>
              {activeTabDef.label}
            </h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/8" />
        </div>

        {/* ── STUDENT COUNCIL TAB ─────────────────────────────────────────────── */}
        {activeTab === "student-council" && (
          <section>
            {leadershipElection ? (
              <CategorySection
                election={leadershipElection}
                roleOrder={STUDENT_COUNCIL_ROLE_ORDER}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
                Student council election data not available.
              </div>
            )}
          </section>
        )}

        {/* ── SPORTS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "sports" && (
          <section>
            {sportsElection ? (
              <CategorySection election={sportsElection} roleOrder={SPORTS_ROLE_ORDER} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
                Sports election data not available.
              </div>
            )}
          </section>
        )}

        {/* ── HOUSE ELECTIONS TAB ──────────────────────────────────────────────── */}
        {activeTab === "house-elections" && (
          <section className="space-y-5">
            {!houseElection ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
                House election data not available.
              </div>
            ) : !houseElection.isVisible ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white/50">House Elections</h3>
                <p className="text-white/30 text-sm mt-2">Results hidden by administrator</p>
              </div>
            ) : !selectedHouse ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
                No houses configured yet.
              </div>
            ) : (
              <>
                {/* House selector */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="block text-xs uppercase tracking-widest text-white/35 mb-3 font-semibold">
                    Select House
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.houses.map((house) => {
                      const isSelected = house.id === selectedHouseId;
                      const emoji = HOUSE_EMOJI[house.color] ?? "🏠";
                      return (
                        <button
                          key={house.id}
                          onClick={() => setSelectedHouseId(house.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                            isSelected
                              ? "border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-lg"
                              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <span className="text-base">{emoji}</span>
                          {house.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <HouseSection house={selectedHouse} />
              </>
            )}
          </section>
        )}

        {!leadershipElection && !sportsElection && data.houses.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="text-6xl">🗳️</div>
            <h2 className="text-2xl font-bold text-white/50">No elections configured yet</h2>
            <p className="text-white/30 text-sm">
              Visit{" "}
              <a href="/admin" className="text-indigo-400 underline hover:text-indigo-300 transition">
                /admin
              </a>{" "}
              to set up candidates and elections.
            </p>
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-16 py-6 text-center">
        <div className="flex items-center justify-center gap-6">
          <span className="text-white/15 text-xs">Euro School Election 2026</span>
          <span className="text-white/10">·</span>
          <a
            href="/admin/login"
            className="text-white/15 hover:text-white/40 text-xs transition-colors font-medium"
          >
            Admin Login
          </a>
        </div>
      </footer>
    </main>
  );
}
