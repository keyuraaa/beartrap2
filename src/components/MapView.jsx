import React, {useMemo} from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({events}){
  const markers = useMemo(()=>{
    // Filter events with valid geo coordinates and deduplicate by IP
    const ipMap = new Map()
    
    events.forEach(e => {
      if (e.geo && e.geo.lat !== 0 && e.geo.lon !== 0) {
        const existing = ipMap.get(e.src)
        if (!existing || existing.ts < e.ts) {
          ipMap.set(e.src, e)
        }
      }
    })
    
    return Array.from(ipMap.values()).slice(0,100)
  },[events])

  return (
    <MapContainer center={[20,0]} zoom={2} style={{height:'100%', borderRadius: 8}}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m,idx)=> {
        const severity = m.severity || 'low'
        const color = severity === 'high' ? '#ff5252' : severity === 'medium' ? '#ffa726' : '#00f6d8'
        
        return (
          <CircleMarker
            key={idx}
            center={[m.geo.lat, m.geo.lon]}
            radius={5 + (m.count||1)}
            pathOptions={{
              color: color, 
              fillColor: color,
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Tooltip>
              <div style={{minWidth: '150px'}}>
                <strong>{m.src}</strong><br/>
                {m.geo.city && <><span>{m.geo.city}, </span></>}
                <span>{m.geo.country || 'Unknown'}</span><br/>
                {m.geo.isp && <><small>ISP: {m.geo.isp}</small><br/></>}
                <small>Port: {m.port} | {m.proto}</small><br/>
                {m.url && <><small style={{color: '#00f6d8'}}>{m.url}</small><br/></>}
                <small style={{color: color}}>Severity: {severity}</small>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
