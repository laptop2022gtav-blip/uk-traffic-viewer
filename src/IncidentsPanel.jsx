// src/IncidentsPanel.jsx
import React, { useMemo, useState } from "react";
import { Activity } from "lucide-react";

function pill(cls, active) {
  return `px-3 py-1.5 rounded-full text-xs border transition ${
    active
      ? "bg-black text-white dark:bg-white dark:text-black"
      : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
  } ${cls || ""}`;
}

export default function IncidentsPanel({ items = [] }) {
  const [filter, setFilter] = useState("all"); // all | closures | major

  const filtered = useMemo(() => {
    return items.filter((f) => {
      const p = f?.properties || {};
      const desc = (p.events?.[0]?.description || "").toLowerCase();

      if (filter === "closures") {
        // Heuristic: “closed/closure” in description OR explicit flag if present
        return /closed|closure/.test(desc) || p.roadClosure === true;
      }
      if (filter === "major") {
        // Heuristic: magnitude >= 3 or delay >= 300s
        const mag = Number(p.magnitudeOfDelay ?? -1);
        const delay = Number(p.delay ?? 0);
        return mag >= 3 || delay >= 300;
      }
      return true;
    });
  }, [items, filter]);

  return (
    <aside className="absolute top-3 right-3 z-[1000] w-[380px] max-w-[94vw]">
      <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-black/40 backdrop-blur shadow">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Activity size={16} />
            <span>Incidents & Closures</span>
          </div>
          <div className="flex gap-2">
            <button className={pill("", filter === "all")} onClick={() => setFilter("all")}>All</button>
            <button className={pill("", filter === "closures")} onClick={() => setFilter("closures")}>Closures</button>
            <button className={pill("", filter === "major")} onClick={() => setFilter("major")}>Major</button>
          </div>
        </div>

        <div className="px-3 pb-3 max-h-[60vh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-xs opacity-70 px-1 py-2">No items in view.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((f, i) => {
                const p = f.properties || {};
                const title = p.events?.[0]?.description || "Incident";
                const roads = Array.isArray(p.roadNumbers) ? p.roadNumbers.join(", ") : "";
                const delay = p.delay != null ? `${p.delay}s` : "n/a";
                const mag = p.magnitudeOfDelay != null ? p.magnitudeOfDelay : "–";
                return (
                  <li key={p.id ?? i} className="rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/30 px-3 py-2">
                    <div className="text-sm font-medium mb-0.5">{title}</div>
                    <div className="text-[11px] opacity-75">
                      {roads && <span>Roads: {roads} • </span>}
                      <span>Delay: {delay} • Mag: {mag}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
