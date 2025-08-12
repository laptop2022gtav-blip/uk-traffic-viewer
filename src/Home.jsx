import React from "react";
import { Link } from "react-router-dom";

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#EEE2C9] dark:bg-[#2A2418]">
      <div className="w-[92vw] max-w-xl rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/30 backdrop-blur p-10 shadow">
        <img src={logoUrl} alt="CDA" className="mx-auto mb-4 h-24 w-24 rounded-2xl" />
        <h1 className="text-2xl font-semibold mb-2">CDA Live Traffic</h1>
        <p className="opacity-70 mb-6">
          Real-time UK traffic maps, live incidents powered by TomTom, Provided by Coach Drivers App.
        </p>
        <Link
          to="/traffic"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow"
        >
          Check Out Live Traffic
        </Link>
      </div>

      <footer className="absolute bottom-4 text-xs opacity-60">
        © {new Date().getFullYear()} Coach Drivers App, Version 1.0.0, Developed by Stephen Lewis.
      </footer>
    </div>
  );
}



