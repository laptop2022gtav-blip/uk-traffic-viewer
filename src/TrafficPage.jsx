import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";
import maplibregl from "maplibre-gl";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronDown,
  MousePointer,
  Layers,
} from "lucide-react";

const UK_CENTER = [54.5, -3];
const UK_ZOOM = 6;

// Raster tiles
const BASE_TEMPLATE =
  "https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?view=Unified&key={key}";
const FLOW_TEMPLATE =
  "https://api.tomtom.com/traffic/map/4/tile/flow/{style}/{z}/{x}/{y}.png?key={key}&thickness=32&tileSize=256";
const INCIDENT_RASTER =
  "https://api.tomtom.com/traffic/map/4/tile/incidents/{z}/{x}/{y}.png?key={key}";

// Vector tiles
const VECTOR_FLOW =
  "https://api.tomtom.com/traffic/map/4/tile/flow/{type}/{z}/{x}/{y}.pbf?key={key}";
const VECTOR_INCIDENTS =
  "https://api.tomtom.com/traffic/map/4/tile/incidents/{z}/{x}/{y}.pbf?key={key}";

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
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;
  return (
    <header className="w-full flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="CDA" className="h-9 w-9 rounded-2xl object-contain" />
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

function Controls({
  apiKey,
  setApiKey,
  flowStyle,
  setFlowStyle,
  showFlow,
  setShowFlow,
  showIncidents,
  setShowIncidents,
  autoRefresh,
  setAutoRefresh,
  refreshNow,
  roadTypes,
  setRoadTypes,
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="absolute top-3 left-3 z-[1000] w-[360px] max-w-[94vw]">
      <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/40 backdrop-blur shadow">
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3">
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
              {["relative0-dark", "relative0", "relative", "absolute", "relative-delay", "reduced-sensitivity"].map(
                (style) => (
                  <LayerPill key={style} active={flowStyle === style} onClick={() => setFlowStyle(style)}>
                    {style}
                  </LayerPill>
                )
              )}
              <button
                onClick={() => setShowFlow(!showFlow)}
                className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-black/10 dark:border-white/15"
              >
                {showFlow ? <Eye size={14} /> : <EyeOff size={14} />} {showFlow ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs opacity-70">Road types (vector):</span>
              <input
                value={roadTypes}
                onChange={(e) => setRoadTypes(e.target.value.trim())}
                placeholder="e.g. M,A"
                className="px-2 py-1 rounded border text-xs bg-transparent border-black/10 dark:border-white/15"
              />
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

            <div className="text-[11px] opacity-70">Data © TomTom. Don’t commit keys to public repos.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// INCIDENT LAYER with bbox tiler
function IncidentLayer({ apiKey, onCount }) {
  const [geojson, setGeojson] = useState(null);
  const [error, setError] = useState("");

  const KM_PER_LAT = 111.32;
  const kmPerLon = (latDeg) => 111.32 * Math.cos((latDeg * Math.PI) / 180);

  function splitBbox({ west, south, east, north }, targetAreaKm2 = 9000) {
    const midLat = (south + north) / 2;
    const widthKm = Math.max(0, east - west) * kmPerLon(midLat);
    const heightKm = Math.max(0, north - south) * KM_PER_LAT;
    const areaKm2 = widthKm * heightKm;
    if (areaKm2 <= targetAreaKm2) return [{ west, south, east, north }];
    const maxCellKm = Math.max(60, Math.sqrt(targetAreaKm2));
    const nx = Math.max(1, Math.ceil(widthKm / maxCellKm));
    const ny = Math.max(1, Math.ceil(heightKm / maxCellKm));
    const dx = (east - west) / nx;
    const dy = (north - south) / ny;
    const boxes = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        boxes.push({ west: west + i * dx, east: west + (i + 1) * dx, south: south + j * dy, north: south + (j + 1) * dy });
      }
    }
    return boxes;
  }

  function normalizeToFeatureCollection(resp) {
    if (!resp) return { type: "FeatureCollection", features: [] };
    if (resp.incidents && resp.incidents.type === "FeatureCollection") return resp.incidents;
    if (Array.isArray(resp.incidents)) return { type: "FeatureCollection", features: resp.incidents };
    if (resp.type === "FeatureCollection" && Array.isArray(resp.features)) return resp;
    return { type: "FeatureCollection", features: [] };
  }

  async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let i = 0;
    const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await worker(items[idx], idx);
      }
    });
    await Promise.all(runners);
    return results;
  }

  function MapWatcher() {
    const map = useMapEvents({
      moveend: () => fetchIncidents(map),
      zoomend: () => fetchIncidents(map),
      load:    () => fetchIncidents(map),
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
    const bounds = { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
    const boxes = splitBbox(bounds, 9000);

    if (boxes.length > 24) {
      setError("Zoom in to view incidents (viewport too wide).");
      setGeojson(null);
      onCount?.(0);
      return;
    }

    try {
      setError("");
      const results = await mapLimit(boxes, 6, async (box) => {
        const bboxStr = [box.west, box.south, box.east, box.north].join(",");
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bboxStr}&language=en-GB&timeValidityFilter=present`;
        const res = await fetch(url);
        if (!res.ok) return { type: "FeatureCollection", features: [] };
        const data = await res.json();
        return normalizeToFeatureCollection(data);
      });

      const seen = new Set();
      const merged = { type: "FeatureCollection", features: [] };
      for (const fc of results) {
        for (const f of (fc.features || [])) {
          const id = f?.properties?.id ?? JSON.stringify(f.geometry);
          if (seen.has(id)) continue;
          seen.add(id);
          merged.features.push(f);
        }
      }

      setGeojson(merged);
      onCount?.(merged.features.length || 0);
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
          {error}
        </div>
      )}
      {geojson && (
        <GeoJSON
          key={`incidents-${(geojson.features || []).length}`}
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
      <div className="font-semibold mb-1 flex items-center gap-2">
        <MousePointer size={14} /> Segment probe
      </div>
      <div>
        Speed: <b>{currentSpeed}</b> vs FF <b>{freeFlowSpeed}</b> (ratio {rel ? rel.toFixed(2) : "-"})
      </div>
      <div>
        Travel time: <b>{currentTravelTime}s</b> vs FF <b>{freeFlowTravelTime}s</b>
      </div>
      {confidence != null && (
        <div>
          Confidence: <b>{confidence}</b>
        </div>
      )}
      {frc != null && (
        <div>
          FRC: <b>{frc}</b>
        </div>
      )}
    </div>
  );
}

function LeafletRasterMap({ apiKey, flowStyle, showFlow, showIncidents, onIncidentCount, onProbe }) {
  // Leaflet CSS is imported globally above; remove runtime injection.

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
        } catch {
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
            <TileLayer url={BASE_TEMPLATE.replace("{key}", apiKey)} attribution="Map © TomTom" zIndex={600} />
            {showFlow && (
              <TileLayer
                url={FLOW_TEMPLATE.replace("{style}", flowStyle).replace("{key}", apiKey)}
                opacity={0.9}
                attribution="Traffic Flow © TomTom"
                zIndex={650}
              />
            )}
            {showIncidents && (
              <TileLayer
                url={INCIDENT_RASTER.replace("{key}", apiKey)}
                opacity={1}
                attribution="Incidents © TomTom"
                zIndex={700}
              />
            )}
            <IncidentLayer apiKey={apiKey} onCount={onIncidentCount} />
            <MapClickProbe />
          </>
        ) : (
          <TileLayer url={BASE_TEMPLATE.replace("{key}", "Your_API_Key")} attribution="Map © TomTom" />
        )}
      </MapContainer>
    </div>
  );
}

function MapLibreVectorMap({ apiKey, flowType, roadTypes }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !apiKey) return;
    const flowTiles =
      `https://api.tomtom.com/traffic/map/4/tile/flow/${flowType}/{z}/{x}/{y}.pbf?key=${apiKey}` +
      (roadTypes ? `&roadTypes=${encodeURIComponent(roadTypes)}` : "");

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
            tiles: [flowTiles],
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
                ["interpolate", ["linear"], ["get", "traffic_level"], 0, "#8b0000", 0.25, "#ff4500", 0.5, "#ffa500", 0.75, "#ffff00", 1, "#00c853"],
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
            paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2, 12, 6], "circle-opacity": 0.85 },
          },
        ],
      },
      center: [UK_CENTER[1], UK_CENTER[0]],
      zoom: UK_ZOOM,
      attributionControl: true,
    });

    mapRef.current = map;
    return () => map.remove();
  }, [apiKey, flowType, roadTypes]);

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 shadow">
      <div ref={containerRef} style={{ height: "72vh", width: "100%" }} />
    </div>
  );
}

export default function TrafficPage() {
  const urlKey = useUrlParam("key") || useUrlParam("tomtomKey");
  const [apiKey, setApiKey] = useLocalStorage("tomtom_api_key", urlKey || "");
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useLocalStorage("tab", "leaflet");
  const [flowStyle, setFlowStyle] = useLocalStorage("flow_style", "relative0-dark");
  const [showFlow, setShowFlow] = useLocalStorage("show_flow", true);
  const [showIncidents, setShowIncidents] = useLocalStorage("show_incidents", true);
  const [autoRefresh, setAutoRefresh] = useLocalStorage("auto_refresh", true);
  const [incidentCount, setIncidentCount] = useState(0);
  const [probe, setProbe] = useState(null);
  const [roadTypes, setRoadTypes] = useLocalStorage("road_types", "");
  const [flowMeta, setFlowMeta] = useState(null);

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

  useEffect(() => {
    if (!apiKey) return;
    const url = `https://api.tomtom.com/traffic/map/4/flow/1/unified/metadata.json?key=${apiKey}`;
    fetch(url).then((r) => (r.ok ? r.json() : null)).then(setFlowMeta).catch(() => {});
  }, [apiKey]);

  return (
    <div className="min-h-screen bg-[#EEE2C9] dark:bg-[#2A2418]">
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
                roadTypes={roadTypes}
                setRoadTypes={setRoadTypes}
              />
              <div className="mt-3 text-sm opacity-80 flex items-center gap-3">
                <Activity size={16} /> <span>Incidents in view: {incidentCount}</span>
                <span className="mx-2">•</span>
                <span className="opacity-60">Zoom out is OK — bbox tiler merges multiple requests.</span>
              </div>
              <ProbeBadge probe={probe} />
            </>
          )}

          {activeTab === "vector" &&
            (apiKey ? (
              <MapLibreVectorMap
                apiKey={apiKey}
                flowType={flowStyle.includes("absolute") ? "absolute" : "relative"}
                roadTypes={roadTypes}
              />
            ) : (
              <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 text-sm opacity-80">
                Add your API key to view Vector Flow & Incident tiles.
              </div>
            ))}
        </div>

        <footer className="py-8 text-sm opacity-70">
          <div className="flex items-center gap-2 flex-wrap">
            <span>© {new Date().getFullYear()} Coach Drivers App, Version 1.0.0, Developed by Stephen Lewis.</span>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-flow/vector-flow-tiles" target="_blank" rel="noreferrer">Vector Flow Tiles</a>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/vector-incident-tiles" target="_blank" rel="noreferrer">Vector Incident Tiles</a>
            <span className="mx-1">•</span>
            <a className="underline hover:opacity-100" href="https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data" target="_blank" rel="noreferrer">Flow Segment Data</a>
            {flowMeta?.version && (<><span className="mx-1">•</span><span className="opacity-70">Flow meta v{flowMeta.version}</span></>)}
          </div>
        </footer>
      </div>
    </div>
  );
}
