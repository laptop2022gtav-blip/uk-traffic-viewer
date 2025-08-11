import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(75%_100%_at_50%_0%,rgba(14,165,233,0.18),transparent_60%)]">
      <div className="w-[92vw] max-w-xl rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/50 backdrop-blur p-8 text-center shadow">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 grid place-items-center text-white font-extrabold text-xl">
          CDA
        </div>
        <h1 className="text-2xl font-semibold mb-2">CDA Live Traffic</h1>
        <p className="opacity-75 mb-6">
          Real‑time UK traffic maps, live incidents and analytics powered by TomTom.
        </p>
        <Link
          to="/traffic"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow"
        >
          🚦 Check Out Live Traffic
        </Link>
      </div>
      <footer className="absolute bottom-4 text-xs opacity-60">© {new Date().getFullYear()} CDA</footer>
    </div>
  )
}
