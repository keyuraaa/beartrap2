import React, {useEffect, useState, useRef} from 'react'
import Dashboard from './components/Dashboard'

export default function App(){
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-neon">BearTrap Admin</h1>
        <p className="text-slate-400">Realtime honeypot administration, attack visualization & GeoIP tracking</p>
      </header>
      <Dashboard />
    </div>
  )
}
