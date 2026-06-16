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

  const isRunaway = telemetry?.edge_analytics?.runaway_alert === true;
  const distance = telemetry?.edge_analytics?.distance_meters ?? 0;
  const sound = telemetry?.audio_analytics?.classified_sound ?? '---';
  const confidence = telemetry?.audio_analytics?.model_confidence_pct ?? 0;

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>PawGuard <span style={{ color: '#00df89' }}>Enterprise</span></h1>
          <p style={{ color: '#475569', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>Continuous Intelligent Pet Health Monitoring</p>
        </div>
        <div style={{ backgroundColor: '#0a111c', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid #141f32', fontSize: '0.75rem' }}>
          HUB ID: {telemetry?.device_info?.hub_id || 'PG-HUB-00192X'}
        </div>
      </header>

      {/* ALERT BANNER */}
      <div style={{ backgroundColor: isRunaway ? '#7f1d1d' : '#064e3b', border: `1px solid ${isRunaway ? '#b91c1c' : '#047857'}`, padding: '1.2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <strong>{isRunaway ? `🚨 CRITICAL ALERT: Geofence Breach! Pet is ${distance}m away!` : '🛡️ System Status: Secure (Containment Active)'}</strong>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: METRICS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3 style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Distance (RSSI)</h3>
              <p style={{ fontSize: '2.4rem', fontWeight: '800' }}>{distance} <span style={{ fontSize: '1rem', color: '#475569' }}>m</span></p>
            </div>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3 style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Audio Class</h3>
              <p style={{ fontSize: '2.1rem', fontWeight: '800', color: '#38bdf8' }}>{sound}</p>
            </div>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3 style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Confidence</h3>
              <p style={{ fontSize: '2.4rem', fontWeight: '800' }}>{confidence}%</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FEED */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1rem' }}>🛡️ LIVE TELEMETRY FEED</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {packetHistory.map((p, i) => (
              <div key={i} style={{ padding: '0.8rem', backgroundColor: '#060b13', borderRadius: '8px', border: '1px solid #141f32', fontSize: '0.85rem' }}>
                <span style={{ color: '#475569' }}>{p.localTime}</span> — {p.audio_analytics?.classified_sound} ({p.edge_analytics?.distance_meters}m)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}