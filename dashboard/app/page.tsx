'use client';
import { useEffect, useState } from 'react';

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<any[]>([]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const data = typeof result.telemetry === 'string' ? JSON.parse(result.telemetry) : result.telemetry;
        setTelemetry(data);
        
        if (result.history) {
          setPacketHistory(result.history.map((p: any) => ({
            ...p,
            localTime: new Date(p.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          })));
        }
      }
    } catch (e) { console.error('Polling error', e); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mapping the specific JSON structure you provided
  const isRunaway = telemetry?.edge_analytics?.runaway_alert === true;
  const distance = telemetry?.edge_analytics?.distance_meters ?? 0;
  const sound = telemetry?.audio_analytics?.classified_sound ?? 'SILENCE';
  const confidence = telemetry?.audio_analytics?.model_confidence_pct ?? 0;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#060b13', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>PawGuard <span style={{ color: '#00df89' }}>Enterprise</span></h1>
        <div style={{ fontSize: '0.8rem', color: '#475569' }}>HUB: {telemetry?.device_info?.hub_id || 'PG-HUB-00192X'}</div>
      </header>

      {/* ALERT BANNER */}
      <div style={{ 
        backgroundColor: isRunaway ? '#7f1d1d' : '#064e3b', 
        padding: '1.2rem', 
        borderRadius: '8px', 
        marginBottom: '2rem', 
        border: `1px solid ${isRunaway ? '#b91c1c' : '#047857'}` 
      }}>
        <strong style={{ fontSize: '1rem' }}>
          {isRunaway ? `🚨 ALERT: Geofence Breach! Pet is ${distance}m away!` : '🛡️ System Status: Secure (Containment Active)'}
        </strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>Distance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{distance}<span style={{ fontSize: '1rem', color: '#475569' }}>m</span></p>
          </div>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>Audio Class</h3>
            <p style={{ fontSize: '1.5rem', color: '#38bdf8', fontWeight: 'bold' }}>{sound}</p>
          </div>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>Confidence</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{confidence}%</p>
          </div>
        </div>

        {/* FEED */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px', border: '1px solid #141f32', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>LIVE TELEMETRY STREAM</h3>
          {packetHistory.map((p, i) => (
            <div key={i} style={{ borderBottom: '1px solid #141f32', padding: '0.7rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: '#475569' }}>{p.localTime}</span> — {p.audio_analytics?.classified_sound} — <span style={{ color: '#00df89' }}>{p.edge_analytics?.distance_meters}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}