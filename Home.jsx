import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // optional for custom styling

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <img src="/logo.png" alt="CDA Logo" className="home-logo" /> {/* replace with your actual logo path */}
      <h1>Welcome to CDA Live Traffic</h1>
      <p>
        Get the latest UK traffic updates, live incidents, and travel delays directly from
        TomTom’s live data feeds.
      </p>
      <button
        className="home-button"
        onClick={() => navigate("/traffic")}
      >
        🚦 Check Out Live Traffic
      </button>
    </div>
  );
}
