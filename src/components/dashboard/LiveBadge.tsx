"use client";

import { useEffect, useState } from "react";

interface LiveBadgeProps {
  clientCount?: number;
}

export default function LiveBadge({ clientCount }: LiveBadgeProps) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm">
      <span
        className={`h-2 w-2 rounded-full bg-green-400 transition-opacity duration-700 ${
          pulse ? "opacity-100" : "opacity-30"
        }`}
      />
      <span className="text-green-400 font-semibold">LIVE</span>
      {clientCount !== undefined && clientCount > 0 && (
        <span className="text-white/30 text-xs">{clientCount} watching</span>
      )}
    </div>
  );
}
