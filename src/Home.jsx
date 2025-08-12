import React from "react";
import { Link } from "react-router-dom";

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4e1b1]">
      {/* Centered card area */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white text-gray-900 shadow-md rounded-lg p-6 text-center max-w-md">
          <img
            src={logoUrl}
            alt="Coach Drivers App Logo"
            className="mx-auto mb-4 w-24 h-24"
          />
          <h2 className="text-2xl font-bold mb-2">Coach Drivers App</h2>
          <h2 className="text-2xl font-bold mb-2">Live Traffic Updates</h2>
          <p className="text-gray-700 mb-4">
            Real-time UK traffic maps, live incidents powered by TomTom.
            Provided by Coach Drivers App.
          </p>
          <Link
            to="/traffic"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Check Out Live Traffic
          </Link>
        </div>
      </div>

      {/* Footer at bottom */}
      <footer className="text-center text-sm text-gray-600 py-2">
        © {new Date().getFullYear()} Coach Drivers App. All rights reserved.
        Version 1.0.0. Designed by Stephen Lewis
      </footer>
    </div>
  );
}
