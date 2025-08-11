import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";
import maplibregl from "maplibre-gl";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  Map as MapIcon,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronDown,
  BarChart,
  MousePointer,
  Layers,
} from "lucide-react";

const UK_CENTER = [54.5, -3];
const UK_ZOOM = 6;

const BASE_TEMPLATE = "https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?view=Unified&key={key}";
const FLOW_TEMPLATE = "https://api.tomtom.com/traffic/map/4/tile/flow/{style}/{z}/{x}/{y}.png?key={key}";
const INCIDENT_RASTER = "https://api.tomtom.com/traffic/map/4/tile/incidents/{z}/{x}/{y}.png?key={key}";

const VECTOR_FLOW = "https://api.tomtom.com/traffic/map/4/tile/flow/{type}/{z}/{x}/{y}.pbf?key={key}";
const VECTOR_INCIDENTS = "https://api.tomtom.com/map/4/tile/incidents/{z}/{x}/{y}.pbf?key={key}";

const INCIDENT_FIELDS = encodeURIComponent(
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastReportTime}}}"
);

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function useUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function DarkToggle({ dark, setDark }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-black/10 dark:border-white/15 hover:shadow-sm"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light" : "Dark"}
    </button>
  );
}

function Header({ dark, setDark }) {
  return (
    <header className="w-full flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600" />
        <span className="font-semibold text-lg tracking-tight">CDA UK Traffic</span>
      </div>
      <div className="flex items-center gap-2">
        <DarkToggle dark={dark} setDark={setDark} />
      </div>
    </header>
  );
}

function Tabs({ active, setActive }) {
  const tabs = [
    { id: "leaflet", label: "Raster (Leaflet)" },
    { id: "vector", label: "Vector (MapLibre)" },
    { id: "analytics", label: "Analytics (Traffic Stats)" },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={`px-3 py-2 rounded-xl text-sm border ${
            active === t.id
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function LayerPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${
        active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Controls({ apiKey, setApiKey, flowStyle, setFlowStyle, showFlow, setShowFlow, showIncidents, setShowIncidents, autoRefresh, setAutoRefresh, refreshNow }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="absolute top-3 left-3 z-[1000] w-[360px] max-w-[94vw]">
      <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/40 backdrop-blur shadow">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Layers size={16} />
            <span className="font-semibold text-sm">Layers & Settings</span>
          </div>
          <ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`} size={16} />
        </button>
        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="text-xs opacity-70">TomTom API key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.trim())}
                placeholder="Paste your TomTom key"
                className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
              />
              <div className="mt-1 text-[11px] opacity-70">
                Reads from ?key= or ?tomtomKey= in the URL. Stored only in this browser.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs opacity-70">Traffic Flow (raster)</span>
              {["relative0-dark", "relative0", "relative", "absolute", "relative-delay", "reduced-sensitivity"].map((style) => (
                <LayerPill key={style} active={flowStyle === style} onClick={() => setFlowStyle(style)}>
                  {style}
                </LayerPill>
              ))}
              <button
                onClick={() => setShowFlow(!showFlow)}
                className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-black/10 dark:border-white/15"
              >
                {showFlow ? <Eye size={14} /> : <EyeOff size={14} />} {showFlow ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs opacity-70">Incident Tiles (raster)</span>
              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-black/10 dark:border-white/15"
              >
                {showIncidents ? <Eye size={14} /> : <EyeOff size={14} />} {showIncidents ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshNow}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-black/10 dark:border-white/15 hover:shadow-sm"
              >
                <RefreshCw size={14} /> Refresh incidents
              </button>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                Auto-refresh every 60s
              </label>
            </div>

            <div className="text-[11px] opacity-70">
              Data © TomTom. Don’t commit keys to public repos.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentLayer({ apiKey, onCount }) {
  const [geojson, setGeojson] = useState(null);
  const [error, setError] = useState("");

  function MapWatcher() {
    const map = useMapEvents({
      moveend: () => fetchIncidents(map),
      zoomend: () => fetchIncidents(map),
      load: () => fetchIncidents(map),
      "traffic-refresh": () => fetchIncidents(map),
    });
    useEffect(() => {
      const handler = () => fetchIncidents(map);
      window.addEventListener("traffic-refresh", handler);
      return () => window.removeEventListener("traffic-refresh", handler);
    }, [map]);
    return null;
  }

  async function fetchIncidents(map) {
  if (!apiKey) return;
  const b = map.getBounds();
  const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',');

  // minimal request first (no fields filter)
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&language=en-GB&timeValidityFilter=present`;

  try {
    setError("");
    const res = await fetch(url);
    if (!res.ok) {
      // read server message to see the real reason
      const msg = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${msg}`);
    }
    const data = await res.json();
    setGeojson(data);
    onCount?.(data?.incidents?.length || 0);
  } catch (e) {
    setError(e.message || "Failed to load incidents");
    setGeojson(null);
    onCount?.(0);
  }
}


  const categoryIcon = (cat) => {
    const m = { 1: "💥", 6: "🚗", 7: "🛑", 8: "⛔", 9: "🚧", 10: "💨", 11: "🌊" };
    return m[cat] || "⚠️";
  };

  return (
    <>
      <MapWatcher />
      {error && (
        <div className="absolute top-3 right-3 z-[1000] rounded-xl bg-red-600 text-white text-xs px-3 py-2 shadow">
          Error loading incidents: {error}
        </div>
      )}
      {geojson && (
        <GeoJSON
          key={`incidents-${(geojson.incidents || []).length}`}
          data={geojson}
          pointToLayer={(feature, latlng) => {
            const icon = L.divIcon({ html: `<div class="text-base">${categoryIcon(feature?.properties?.iconCategory)}</div>` });
            return L.marker(latlng, { icon });
          }}
          onEachFeature={(feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(
              `<div style="min-width:240px">
                <div style="font-weight:600;margin-bottom:4px">${p.events?.[0]?.description || "Incident"}</div>
                <div style="font-size:12px;opacity:.8">Delay: ${p.delay ?? "n/a"} sec • Magnitude: ${p.magnitudeOfDelay ?? "?"}</div>
                <div style="font-size:12px;opacity:.8">From: ${p.from ?? "?"}</div>
                <div style="font-size:12px;opacity:.8">To: ${p.to ?? "?"}</div>
                <div style="font-size:12px;opacity:.8">Roads: ${(p.roadNumbers || []).join(", ")}</div>
              </div>`
            );
          }}
        />
      )}
    </>
  );
}

function ProbeBadge({ probe }) {
  if (!probe) return null;
  const { currentSpeed, freeFlowSpeed, currentTravelTime, freeFlowTravelTime, confidence, frc } = probe;
  const rel = freeFlowSpeed ? currentSpeed / freeFlowSpeed : null;
  return (
    <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-black/60 backdrop-blur px-3 py-2 text-xs shadow">
      <div className="font-semibold mb-1 flex items-center gap-2"><MousePointer size={14}/> Segment probe</div>
      <div>Speed: <b>{currentSpeed}</b> vs FF <b>{freeFlowSpeed}</b> (ratio {rel ? rel.toFixed(2) : "-"})</div>
      <div>Travel time: <b>{currentTravelTime}s</b> vs FF <b>{freeFlowTravelTime}s</b></div>
      {confidence != null && <div>Confidence: <b>{confidence}</b></div>}
      {frc != null && <div>FRC: <b>{frc}</b></div>}
    </div>
  );
}

function LeafletRasterMap({ apiKey, flowStyle, showFlow, showIncidents, onIncidentCount, onProbe }) {
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  function MapClickProbe() {
    const map = useMapEvents({
      click: async (e) => {
        if (!apiKey) return;
        try {
          const zoom = Math.max(6, Math.round(map.getZoom()));
          const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/${zoom}/json?key=${apiKey}&point=${e.latlng.lat},${e.latlng.lng}&unit=KMPH&openLr=false`;
          const res = await fetch(url);
          const data = await res.json();
          onProbe?.(data.flowSegmentData || null);
        } catch (err) {
          onProbe?.(null);
        }
      },
    });
    return null;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 shadow relative">
      <MapContainer center={UK_CENTER} zoom={UK_ZOOM} style={{ height: "72vh", width: "100%" }}>
        {apiKey ? (
          <>
            <TileLayer url={BASE_TEMPLATE.replace("{key}", apiKey)} attribution='Map © TomTom' />
            {showFlow && (
              <TileLayer url={FLOW_TEMPLATE.replace("{style}", flowStyle).replace("{key}", apiKey)} opacity={0.9} attribution='Traffic Flow © TomTom' />
            )}
            {showIncidents && (
              <TileLayer url={INCIDENT_RASTER.replace("{key}", apiKey)} opacity={0.9} attribution='Incidents © TomTom' />
            )}
            <IncidentLayer apiKey={apiKey} onCount={onIncidentCount} />
            <MapClickProbe />
          </>
        ) : (
          <TileLayer url={BASE_TEMPLATE.replace("{key}", "Your_API_Key")} attribution='Map © TomTom' />
        )}
      </MapContainer>
    </div>
  );
}

function MapLibreVectorMap({ apiKey, flowType }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !apiKey) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          base: {
            type: "raster",
            tiles: [BASE_TEMPLATE.replace("{key}", apiKey)],
            tileSize: 256,
            attribution: "Map © TomTom",
          },
          flow: {
            type: "vector",
            tiles: [VECTOR_FLOW.replace("{type}", flowType).replace("{key}", apiKey)],
            minzoom: 0,
            maxzoom: 22,
            attribution: "Traffic Flow © TomTom",
          },
          incidents: {
            type: "vector",
            tiles: [VECTOR_INCIDENTS.replace("{key}", apiKey)],
            minzoom: 0,
            maxzoom: 22,
            attribution: "Incidents © TomTom",
          },
        },
        layers: [
          { id: "base", type: "raster", source: "base" },
          {
            id: "traffic-flow",
            type: "line",
            source: "flow",
            "source-layer": "Traffic flow",
            paint: {
              "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.0, 10, 2.0, 14, 3.0],
              "line-color": [
                "case",
                ["has", "traffic_level"],
                [
                  "interpolate",
                  ["linear"],
                  ["get", "traffic_level"],
                  0, "#8b0000",
                  0.25, "#ff4500",
                  0.5, "#ffa500",
                  0.75, "#ffff00",
                  1, "#00c853",
                ],
                "#999999",
              ],
              "line-opacity": 0.9,
            },
          },
          {
            id: "incidents-poi",
            type: "circle",
            source: "incidents",
            "source-layer": "Traffic incidents POI",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2, 12, 6],
              "circle-opacity": 0.85,
            },
          },
        ],
      },
      center: [UK_CENTER[1], UK_CENTER[0]],
      zoom: UK_ZOOM,
      attributionControl: true,
    });

    mapRef.current = map;
    return () => map.remove();
  }, [apiKey, flowType]);

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 shadow">
      <div ref={containerRef} style={{ height: "72vh", width: "100%" }} />
    </div>
  );
}

function AnalyticsPanel({ apiKey }) {
  const [jobId, setJobId] = useState("");
  const [jobState, setJobState] = useState("");
  const [series, setSeries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createDemoRouteJob() {
    if (!apiKey) { setError("Add your Traffic Stats API-enabled key."); return; }
    setError("");
    setBusy(true);
    try {
      const body = {
        jobName: "Demo UK route",
        distanceUnit: "KILOMETERS",
        routes: [{
          name: "M1 sample",
          start: { latitude: 51.5079, longitude: -0.1283 },
          via: [{ latitude: 52.4862, longitude: -1.8904 }],
          end: { latitude: 53.8008, longitude: -1.5491 },
          fullTraversal: false,
          zoneId: "Europe/London",
          probeSource: "ALL",
        }],
        dateRanges: [{ name: "Last 7 days", from: new Date(Date.now()-7*864e5).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) }],
        timeSets: [{ name: "All day", timeGroups: [{ days: ["MON","TUE","WED","THU","FRI","SAT","SUN"], times: ["00:00-23:59"] }] }],
      };
      const res = await fetch(`https://api.tomtom.com/traffic/trafficstats/routeanalysis/1?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || res.statusText);
      setJobId(data.jobId || "");
      setJobState(data.jobState || "SUBMITTED");
    } catch (e) {
      setError(e.message || "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  async function pollStatus() {
    if (!apiKey || !jobId) return;
    setBusy(true);
    try {
      const res = await fetch(`https://api.tomtom.com/traffic/trafficstats/status/1/${jobId}?key=${apiKey}`);
      const data = await res.json();
      setJobState(data.jobState || "");
      if (data.jobState === "DONE" && Array.isArray(data.urls)) {
        const jsonUrl = data.urls.find((u) => u.endsWith(".json"));
        if (jsonUrl) {
          const r = await fetch(jsonUrl);
          const d = await r.json();
          const summaries = (d?.routes?.[0]?.summaries || []).map((s, i) => ({ name: `set ${i+1}`, avg: s?.averageSpeed }));
          setSeries(summaries);
        }
      }
    } catch (e) {
      setError(e.message || "Status check failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/15 p-5">
      <div className="flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2"><BarChart size={16}/> Traffic Stats – Route Analysis</div>
        <div className="text-xs opacity-70">Asynchronous API – requires Traffic Stats access</div>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button onClick={createDemoRouteJob} className="rounded-xl px-3 py-2 text-xs border">Create demo job</button>
        <button onClick={pollStatus} className="rounded-xl px-3 py-2 text-xs border">Check status</button>
        <div className="text-xs opacity-70">Job: <b>{jobId || "(none)"}</b> • State: <b>{jobState || ""}</b></div>
      </div>

      {error && <div className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</div>}

      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Average speed (demo)</div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avg" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 text-xs opacity-70">
        Docs: Traffic Stats Route Analysis & status endpoints. Results provide JSON/GeoJSON/XLSX links you can download.
      </div>
    </div>
  );
}

export default function App() {
  const urlKey = useUrlParam("key") || useUrlParam("tomtomKey");
  const [apiKey, setApiKey] = useLocalStorage("tomtom_api_key", urlKey || "");
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useLocalStorage("tab", "leaflet");
  const [flowStyle, setFlowStyle] = useLocalStorage("flow_style", "relative0-dark");
  const [showFlow, setShowFlow] = useLocalStorage("show_flow", true);
  const [showIncidents, setShowIncidents] = useLocalStorage("show_incidents", false);
  const [autoRefresh, setAutoRefresh] = useLocalStorage("auto_refresh", true);
  const [incidentCount, setIncidentCount] = useState(0);
  const [probe, setProbe] = useState(null);

  useMemo(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => window.dispatchEvent(new Event("traffic-refresh")), 60000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-[radial-gradient(75%_100%_at_50%_0%,rgba(14,165,233,0.12),transparent_60%)] dark:bg-[radial-gradient(75%_100%_at_50%_0%,rgba(14,165,233,0.18),transparent_60%)]">
      <div className="max-w-6xl mx-auto px-4">
        <Header dark={dark} setDark={setDark} />

        <div className="flex items-center gap-3 mt-2">
          <Tabs active={activeTab} setActive={setActiveTab} />
        </div>

        <div className="mt-4 relative">
          {activeTab === "leaflet" && (
            <>
              <LeafletRasterMap
                apiKey={apiKey}
                flowStyle={flowStyle}
                showFlow={showFlow}
                showIncidents={showIncidents}
                onIncidentCount={setIncidentCount}
                onProbe={setProbe}
              />
              <Controls
                apiKey={apiKey}
                setApiKey={setApiKey}
                flowStyle={flowStyle}
                setFlowStyle={setFlowStyle}
                showFlow={showFlow}
                setShowFlow={setShowFlow}
                showIncidents={showIncidents}
                setShowIncidents={setShowIncidents}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                refreshNow={() => window.dispatchEvent(new Event("traffic-refresh"))}
              />
              <div className="mt-3 text-sm opacity-80 flex items-center gap-3">
                <Activity size={16} /> <span>Incidents in view: {incidentCount}</span>
                <span className="mx-2">•</span>
                <span className="opacity-60">Click the map to probe nearest segment (Flow Segment Data)</span>
              </div>
              <ProbeBadge probe={probe} />
            </>
          )}

          {activeTab === "vector" && (
            apiKey ? (
              <MapLibreVectorMap apiKey={apiKey} flowType={flowStyle.includes("absolute") ? "absolute" : "relative"} />
            ) : (
              <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 text-sm opacity-80">
                Add your API key to view Vector Flow & Incident tiles.
              </div>
            )
          )}

          {activeTab === "analytics" && <AnalyticsPanel apiKey={apiKey} />}
        </div>

        <footer className="py-8 text-sm opacity-70">
          <div className="flex items-center gap-2 flex-wrap">
            <span>© {new Date().getFullYear()} UK Traffic Viewer</span>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-flow/vector-flow-tiles" target="_blank" rel="noreferrer">Vector Flow Tiles</a>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/vector-incident-tiles" target="_blank" rel="noreferrer">Vector Incident Tiles</a>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data" target="_blank" rel="noreferrer">Flow Segment Data</a>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-stats/documentation/api/route-analysis" target="_blank" rel="noreferrer">Traffic Stats</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
