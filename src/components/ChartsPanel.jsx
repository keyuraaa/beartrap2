import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function ChartsPanel({events}){
  // Severity breakdown - simple count
  const severityCounts = events.reduce((acc,e)=>{ 
    const sev = e.severity || 'info'
    acc[sev] = (acc[sev]||0)+1
    return acc 
  }, {})
  
  const severityData = [
    {name: 'High', count: severityCounts.high || 0, fill: '#ff4d4f'},
    {name: 'Medium', count: severityCounts.medium || 0, fill: '#ffa500'},
    {name: 'Low', count: severityCounts.low || 0, fill: '#ffd666'},
    {name: 'Info', count: severityCounts.info || 0, fill: '#69c0ba'}
  ].filter(item => item.count > 0)

  // Event type counts
  const eventTypeCounts = events.reduce((acc,e)=>{ 
    const type = e.event_type || e.type || 'traffic'
    acc[type] = (acc[type]||0)+1
    return acc 
  }, {})
  
  const typeData = Object.entries(eventTypeCounts).map(([k,v])=>({
    name: k.toUpperCase(), 
    value: v
  }))
  
  const COLORS = ['#00bfb3','#69c0ba','#ffa500','#ff4d4f','#9333ea']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Threat Level Bar Chart */}
      <div className="h-56">
        <h3 className="text-sm font-medium mb-2 text-elastic-text">Events by Severity</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{fill: '#98a1b3', fontSize: 12}}
              axisLine={{stroke: '#333'}}
            />
            <YAxis 
              tick={{fill: '#98a1b3', fontSize: 12}}
              axisLine={{stroke: '#333'}}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#161b22', 
                border: '1px solid #00bfb3',
                borderRadius: '6px',
                color: '#f0f2f5'
              }}
              cursor={{fill: 'rgba(0,191,179,0.1)'}}
              labelStyle={{color: '#00bfb3', fontWeight: 'bold'}}
            />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              label={{position: 'top', fill: '#f0f2f5', fontSize: 12}}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {severityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Event Types Pie Chart */}
      <div className="h-56">
        <h3 className="text-sm font-medium mb-2 text-elastic-text">Traffic Types</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={typeData} 
              dataKey="value" 
              nameKey="name"
              cx="50%" 
              cy="50%" 
              outerRadius={70}
              label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelStyle={{fontSize: 11, fill: '#f0f2f5'}}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {typeData.map((entry, idx) => (
                <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#161b22', 
                border: '1px solid #00bfb3',
                borderRadius: '6px'
              }}
              itemStyle={{color: '#f0f2f5'}}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
