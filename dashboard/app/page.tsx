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
          setPacketHistory(result.history);
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // MAPPING YOUR SPECIFIC JSON DATA
  const isRunaway = telemetry?.edge_analytics?.runaway_alert === true;
  const distance = telemetry?.edge_analytics?.distance_meters ?? 0;
  const sound = telemetry?.audio_analytics?.classified_sound ?? 'SILENCE';

  return (
    <div style={{ padding: '2rem', backgroundColor: '#060b13', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>PawGuard <span style={{ color: '#00df89' }}>Enterprise</span></h1>
      </header>

      {/* ALERT SECTION */}
      <div style={{ 
        backgroundColor: isRunaway ? '#7f1d1d' : '#064e3b', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem', 
        border: '1px solid' 
      }}>
        {isRunaway ? "🚨 CRITICAL: GE FENCE BREACH" : "🛡️ SYSTEM SECURE"}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px' }}>
            <h3>SOUND</h3>
            <p style={{ fontSize: '1.5rem' }}>{sound}</p>
          </div>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px' }}>
            <h3>DISTANCE</h3>
            <p style={{ fontSize: '1.5rem' }}>{distance}m</p>
          </div>
          <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px' }}>
            <h3>CONFIDENCE</h3>
            <p style={{ fontSize: '1.5rem' }}>{telemetry?.audio_analytics?.model_confidence_pct ?? 0}%</p>
          </div>
        </div>

        {/* FEED */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px' }}>
          <h3>HISTORY</h3>
          {packetHistory.map((p, i) => (
            <div key={i} style={{ borderBottom: '1px solid #333', padding: '0.5rem 0' }}>
              {p.audio_analytics?.classified_sound} | {p.edge_analytics?.distance_meters}m
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}