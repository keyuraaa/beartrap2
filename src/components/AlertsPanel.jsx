import React from 'react'

export default function AlertsPanel({events}){
  const high = events.filter(e=>e.severity === 'high').slice(0,5)
  const med = events.filter(e=>e.severity === 'medium').slice(0,5)

  return (
    <div className="card">
      <h3 className="mb-2">Alerts</h3>
      <div className="space-y-2">
        <div>
          <h4 className="text-sm text-slate-400">High</h4>
          {high.length===0 ? <div className="text-slate-500">No high alerts</div> : high.map((a,i)=>(<div key={i} className="text-red-400">{a.src} @ {new Date(a.ts).toLocaleTimeString()}</div>))}
        </div>
        <div>
          <h4 className="text-sm text-slate-400">Medium</h4>
          {med.length===0 ? <div className="text-slate-500">No medium alerts</div> : med.map((a,i)=>(<div key={i} className="text-yellow-300">{a.src} @ {new Date(a.ts).toLocaleTimeString()}</div>))}
        </div>
      </div>
    </div>
  )
}
