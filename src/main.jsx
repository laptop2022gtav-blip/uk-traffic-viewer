import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css"; // @import "tailwindcss";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";

import Home from "./Home.jsx";
import TrafficPage from "./TrafficPage.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/uk-traffic-viewer">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<TrafficPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
