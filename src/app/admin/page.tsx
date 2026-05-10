"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ELECTION_TYPES, ROLE_LABELS, getRolesForElectionType } from "@/lib/election-meta";

interface House {
  id: number;
  name: string;
  color: string;
}

interface Election {
  id: number;
  name: string;
  type: string;
  isVisible: boolean;
}

interface Candidate {
  id: number;
  name: string;
  symbolName: string;
  imageUrl: string;
  votes: number;
  role: string;
  electionId: number;
  houseId: number | null;
  house?: House | null;
  election?: Election | null;
}

type AdminTab = "votes" | "candidates" | "houses" | "settings";

const HOUSE_COLORS = ["RED", "GREEN", "BLUE", "YELLOW"];
const HOUSE_BADGES: Record<string, string> = {
  RED: "bg-red-500",
  GREEN: "bg-green-500",
  BLUE: "bg-blue-500",
  YELLOW: "bg-yellow-400 text-black",
};

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
        HOUSE_BADGES[color] ?? "bg-gray-500"
      }`}
    >
      {text}
    </span>
  );
}

async function uploadCandidateLogo(candidateId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/candidates/${candidateId}/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Failed to upload logo");
  }

  return response.json();
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("votes");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [cRes, hRes, rRes] = await Promise.all([
        fetch("/api/candidates", { cache: "no-store" }),
        fetch("/api/houses", { cache: "no-store" }),
        fetch("/api/results", { cache: "no-store" }),
      ]);

      if (!cRes.ok || !hRes.ok || !rRes.ok) {
        throw new Error("Failed to load admin data");
      }

      const cData = await cRes.json();
      const hData = await hRes.json();
      const rData = await rRes.json();

      setCandidates(cData.candidates ?? []);
      setHouses(hData.houses ?? []);
      setElections(
        (rData.elections ?? []).map((e: Election) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          isVisible: e.isVisible,
        }))
      );
    } catch {
      showMsg("Could not load admin data", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07071a] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07071a] text-white">
      <header className="border-b border-white/10 bg-[#07071a]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <span className="font-bold text-white">Admin Center</span>
            <span className="text-white/30 text-sm hidden sm:inline">
              — Euro School Election 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/40 hover:text-white/70 transition">
              View Dashboard
            </a>
            <button
              onClick={logout}
              className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {(["votes", "candidates", "houses", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition capitalize border-b-2 ${
                tab === t
                  ? "border-indigo-500 text-indigo-300 bg-indigo-500/10"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${
            msg.ok ? "bg-green-600/90 text-white" : "bg-red-600/90 text-white"
          }`}
        >
          {msg.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === "votes" && (
          <VotesTab candidates={candidates} onUpdate={load} showMsg={showMsg} />
        )}
        {tab === "candidates" && (
          <CandidatesTab
            candidates={candidates}
            elections={elections}
            houses={houses}
            onUpdate={load}
            showMsg={showMsg}
          />
        )}
        {tab === "houses" && <HousesTab houses={houses} onUpdate={load} showMsg={showMsg} />}
        {tab === "settings" && (
          <SettingsTab elections={elections} onUpdate={load} showMsg={showMsg} />
        )}
      </main>
    </div>
  );
}

function VotesTab({
  candidates,
  onUpdate,
  showMsg,
}: {
  candidates: Candidate[];
  onUpdate: () => void;
  showMsg: (t: string, ok?: boolean) => void;
}) {
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [updating, setUpdating] = useState<number | null>(null);

  const updateVote = async (candidateId: number, delta?: number, abs?: number) => {
    setUpdating(candidateId);

    const body: Record<string, unknown> = { candidateId };
    if (delta !== undefined) body.delta = delta;
    if (abs !== undefined) body.absoluteVotes = abs;

    const res = await fetch("/api/votes/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showMsg("Votes updated");
      onUpdate();
    } else {
      showMsg("Failed to update votes", false);
    }

    setUpdating(null);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    candidates.forEach((candidate) => {
      const key = `${candidate.election?.name ?? "Unknown"} — ${
        ROLE_LABELS[candidate.role] ?? candidate.role
      }`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(candidate);
    });
    return Array.from(map.entries());
  }, [candidates]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Vote Management</h2>
        <p className="text-xs text-white/40 mt-1">
          Quick increments, decrement, and exact vote entry
        </p>
      </div>

      {grouped.map(([group, rows]) => (
        <div
          key={group}
          className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-white/10 bg-white/5">
            <p className="text-sm font-semibold text-white/70">{group}</p>
          </div>
          <div className="divide-y divide-white/5">
            {rows
              .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
              .map((candidate) => (
                <div key={candidate.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <img
                    src={`/api/candidates/${candidate.id}/image?v=${encodeURIComponent(
                      candidate.imageUrl || ""
                    )}`}
                    alt={candidate.name}
                    className="h-10 w-10 rounded-full object-cover border border-white/15"
                  />
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-semibold text-white">{candidate.name}</p>
                    <p className="text-xs text-white/40">
                      {candidate.symbolName || "No symbol text"}
                    </p>
                  </div>

                  {candidate.house && <Badge color={candidate.house.color} text={candidate.house.name} />}

                  <span className="text-2xl font-extrabold text-white tabular-nums w-14 text-center">
                    {candidate.votes}
                  </span>

                  {[1, 5, 10].map((delta) => (
                    <button
                      key={delta}
                      disabled={updating === candidate.id}
                      onClick={() => updateVote(candidate.id, delta)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-300 text-sm font-bold transition disabled:opacity-40"
                    >
                      +{delta}
                    </button>
                  ))}
                  <button
                    disabled={updating === candidate.id}
                    onClick={() => updateVote(candidate.id, -1)}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-bold transition disabled:opacity-40"
                  >
                    −1
                  </button>

                  <input
                    type="number"
                    min={0}
                    value={custom[candidate.id] ?? ""}
                    onChange={(e) => setCustom({ ...custom, [candidate.id]: e.target.value })}
                    placeholder="Set…"
                    className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    disabled={updating === candidate.id || !custom[candidate.id]}
                    onClick={() => {
                      const value = parseInt(custom[candidate.id], 10);
                      if (!Number.isNaN(value) && value >= 0) {
                        updateVote(candidate.id, undefined, value);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition disabled:opacity-40"
                  >
                    Set
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      {candidates.length === 0 && (
        <p className="text-center text-white/30 py-12">
          No candidates yet. Add them in the Candidates tab.
        </p>
      )}
    </div>
  );
}

function CandidatesTab({
  candidates,
  elections,
  houses,
  onUpdate,
  showMsg,
}: {
  candidates: Candidate[];
  elections: Election[];
  houses: House[];
  onUpdate: () => void;
  showMsg: (t: string, ok?: boolean) => void;
}) {
  const blankForm = {
    name: "",
    symbolName: "",
    role: "",
    electionId: "",
    houseId: "",
  };

  const [form, setForm] = useState(blankForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCandidateId, setUploadingCandidateId] = useState<number | null>(null);
  const rowUploadRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const selectedElection = useMemo(
    () => elections.find((e) => String(e.id) === form.electionId) ?? null,
    [elections, form.electionId]
  );
  const roleOptions = useMemo(
    () => (selectedElection ? getRolesForElectionType(selectedElection.type) : []),
    [selectedElection]
  );

  useEffect(() => {
    if (!roleOptions.length) {
      if (form.role) setForm((prev) => ({ ...prev, role: "" }));
      return;
    }
    if (!roleOptions.includes(form.role)) {
      setForm((prev) => ({ ...prev, role: roleOptions[0] }));
    }
  }, [roleOptions, form.role]);

  useEffect(() => {
    if (selectedElection?.type !== ELECTION_TYPES.HOUSE && form.houseId) {
      setForm((prev) => ({ ...prev, houseId: "" }));
    }
  }, [selectedElection?.type, form.houseId]);

  const uploadForCandidate = async (candidateId: number, file: File, toastText: string) => {
    setUploadingCandidateId(candidateId);
    try {
      await uploadCandidateLogo(candidateId, file);
      showMsg(toastText);
      onUpdate();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : "Logo upload failed", false);
    } finally {
      setUploadingCandidateId(null);
    }
  };

  const save = async () => {
    const parsedElectionId = Number(form.electionId);
    const parsedHouseId = form.houseId ? Number(form.houseId) : null;

    if (!form.name.trim() || !form.role || !parsedElectionId || Number.isNaN(parsedElectionId)) {
      showMsg("Please fill name, election, and role", false);
      return;
    }
    if (selectedElection?.type === ELECTION_TYPES.HOUSE && !parsedHouseId) {
      showMsg("Please select a house for house-election candidates", false);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        symbolName: form.symbolName.trim(),
        role: form.role,
        electionId: parsedElectionId,
        houseId: parsedHouseId,
      };

      const url = editId ? `/api/candidates/${editId}` : "/api/candidates";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody.error ?? "Failed to save candidate");
      }

      const candidateId = editId ?? responseBody.candidate?.id;
      if (!candidateId) {
        throw new Error("Candidate saved but id was not returned");
      }

      if (logoFile) {
        await uploadCandidateLogo(candidateId, logoFile);
      }

      showMsg(editId ? "Candidate updated" : "Candidate added");
      setForm(blankForm);
      setLogoFile(null);
      setEditId(null);
      onUpdate();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : "Failed to save candidate", false);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this candidate?")) return;
    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    if (res.ok) {
      showMsg("Candidate deleted");
      onUpdate();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.error ?? "Delete failed", false);
    }
  };

  const startEdit = (candidate: Candidate) => {
    setForm({
      name: candidate.name,
      symbolName: candidate.symbolName,
      role: candidate.role,
      electionId: String(candidate.electionId),
      houseId: candidate.houseId ? String(candidate.houseId) : "",
    });
    setLogoFile(null);
    setEditId(candidate.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group candidates
  const groupedCandidates = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    candidates.forEach((candidate) => {
      const key = `${candidate.election?.name ?? "Unknown"} — ${
        ROLE_LABELS[candidate.role] ?? candidate.role
      }`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(candidate);
    });
    return Array.from(map.entries());
  }, [candidates]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">{editId ? "Edit Candidate" : "Add Candidate"}</h2>
        <p className="text-xs text-white/40 mt-1">
          Candidate logos are uploaded as bytes and stored in the database.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 shadow-lg">
        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">
            Full Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Darshit"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">
            Symbol Text (optional)
          </label>
          <input
            value={form.symbolName}
            onChange={(e) => setForm({ ...form, symbolName: e.target.value })}
            placeholder="Optional text label"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">
            Candidate Logo (Upload)
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Upload candidate logo"
            />
            <div className={`w-full rounded-xl border border-dashed px-3 py-2 text-sm text-center transition-all ${logoFile ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200' : 'border-white/20 bg-black/20 text-white/50 hover:bg-white/5'}`}>
              {logoFile ? `Selected: ${logoFile.name}` : "Click or drag logo here"}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">
            Election
          </label>
          <select
            value={form.electionId}
            onChange={(e) => setForm({ ...form, electionId: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a20] px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          >
            <option value="">— Select election —</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a20] px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            disabled={!roleOptions.length}
          >
            {!roleOptions.length && <option value="">Select election first</option>}
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-1.5 uppercase tracking-wider font-semibold">
            House {selectedElection?.type === ELECTION_TYPES.HOUSE ? "(required)" : "(optional)"}
          </label>
          <select
            value={form.houseId}
            onChange={(e) => setForm({ ...form, houseId: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a20] px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-40"
            disabled={selectedElection?.type !== ELECTION_TYPES.HOUSE}
          >
            <option value="">
              {selectedElection?.type === ELECTION_TYPES.HOUSE ? "— Select house —" : "— Not required —"}
            </option>
            {houses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name} ({house.color})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex gap-3 mt-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-indigo-900/20 transition-all"
          >
            {saving ? "Saving..." : editId ? "Update Candidate" : "Add Candidate"}
          </button>
          {editId && (
            <button
              onClick={() => {
                setForm(blankForm);
                setLogoFile(null);
                setEditId(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <h3 className="text-lg font-bold text-white">All Candidates</h3>
        <span className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full font-semibold">{candidates.length} total</span>
      </div>

      {groupedCandidates.map(([group, rows]) => (
        <div key={group} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-lg mb-6">
          <div className="px-5 py-3 border-b border-white/10 bg-black/20">
            <p className="text-sm font-semibold text-white/80">{group}</p>
          </div>
          <div className="divide-y divide-white/5">
            {rows
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((candidate) => (
                <div key={candidate.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white/10 bg-black/30 shrink-0">
                    <img
                      src={`/api/candidates/${candidate.id}/image?v=${encodeURIComponent(
                        candidate.imageUrl || ""
                      )}`}
                      alt={candidate.name}
                      className="object-cover w-full h-full"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/candidates/default.svg'; }}
                    />
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <p className="font-bold text-white text-base">{candidate.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {candidate.house && <Badge color={candidate.house.color} text={candidate.house.name} />}
                      <p className="text-xs text-white/40">
                        {candidate.symbolName ? `🏷 ${candidate.symbolName}` : <span className="italic opacity-60">No symbol</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => {
                        rowUploadRefs.current[candidate.id] = el;
                      }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadForCandidate(candidate.id, file, "Logo uploaded");
                        e.currentTarget.value = "";
                      }}
                    />
                    <button
                      onClick={() => rowUploadRefs.current[candidate.id]?.click()}
                      disabled={uploadingCandidateId === candidate.id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium transition-all disabled:opacity-40"
                    >
                      {uploadingCandidateId === candidate.id ? "Uploading..." : "Upload Logo"}
                    </button>
                    <button
                      onClick={() => startEdit(candidate)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-white transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(candidate.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {candidates.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-white/40 text-sm">No candidates added yet.</p>
        </div>
      )}
    </div>
  );
}

function HousesTab({
  houses,
  onUpdate,
  showMsg,
}: {
  houses: House[];
  onUpdate: () => void;
  showMsg: (t: string, ok?: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("RED");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    const res = await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      showMsg("House created");
      setName("");
      onUpdate();
    } else {
      const d = await res.json().catch(() => ({}));
      showMsg(d.error ?? "Failed to create house", false);
    }
    setSaving(false);
  };

  const rename = async (id: number) => {
    const res = await fetch("/api/houses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    });
    if (res.ok) {
      showMsg("House renamed");
      setEditId(null);
      onUpdate();
    } else {
      showMsg("Rename failed", false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">House Management</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">House Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apollo"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">
            Color Theme
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#07071a] px-3 py-2 text-sm text-white focus:outline-none"
          >
            {HOUSE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={create}
            disabled={saving || !name}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm transition"
          >
            {saving ? "Creating..." : "Create House"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {houses.map((house) => (
          <div
            key={house.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4"
          >
            <Badge color={house.color} text={house.color} />
            {editId === house.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="flex-1 font-semibold text-white">{house.name}</span>
            )}
            {editId === house.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => rename(house.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditId(house.id);
                  setEditName(house.name);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                Rename
              </button>
            )}
          </div>
        ))}
        {houses.length === 0 && (
          <p className="col-span-2 text-center text-white/30 py-8">No houses yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  elections,
  onUpdate,
  showMsg,
}: {
  elections: Election[];
  onUpdate: () => void;
  showMsg: (t: string, ok?: boolean) => void;
}) {
  const [resetting, setResetting] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const toggleVisibility = async (election: Election) => {
    setToggling(election.id);
    const res = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId: election.id, isVisible: !election.isVisible }),
    });
    if (res.ok) {
      showMsg(`Results ${!election.isVisible ? "shown" : "hidden"}`);
      onUpdate();
    } else {
      showMsg("Failed to update visibility", false);
    }
    setToggling(null);
  };

  const resetVotes = async () => {
    if (!confirm("Reset ALL votes to 0? This cannot be undone.")) return;
    setResetting(true);
    const res = await fetch("/api/reset", { method: "POST" });
    if (res.ok) {
      showMsg("All votes reset to 0");
      onUpdate();
    } else {
      showMsg("Reset failed", false);
    }
    setResetting(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h3 className="font-semibold text-white/70 text-sm uppercase tracking-wider">
          Dashboard Visibility
        </h3>
        {elections.map((election) => (
          <div key={election.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{election.name}</p>
              <p className="text-xs text-white/40">
                {election.isVisible ? "Results visible to students" : "Results hidden"}
              </p>
            </div>
            <button
              disabled={toggling === election.id}
              onClick={() => toggleVisibility(election)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
                election.isVisible ? "bg-indigo-600" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  election.isVisible ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
        {elections.length === 0 && <p className="text-white/30 text-sm">No elections found.</p>}
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-3">
        <h3 className="font-semibold text-red-400 text-sm uppercase tracking-wider">
          Danger Zone
        </h3>
        <p className="text-white/50 text-sm">
          This will permanently reset all candidate vote counts to zero.
        </p>
        <button
          onClick={resetVotes}
          disabled={resetting}
          className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold text-sm transition"
        >
          {resetting ? "Resetting..." : "Reset All Votes to 0"}
        </button>
      </div>
    </div>
  );
}