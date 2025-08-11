import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import TrafficPage from "./TrafficPage.jsx";

export default function App() {
  return (
    <BrowserRouter basename="/uk-traffic-viewer">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<TrafficPage />} />
      </Routes>
    </BrowserRouter>
  );
}
