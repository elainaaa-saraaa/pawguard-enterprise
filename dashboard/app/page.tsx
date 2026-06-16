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
        if (result.history) setPacketHistory(result.history);
      }
    } catch (e) { console.error('Polling error', e); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Logic Mappings
  const soundLabel = telemetry?.audio_analytics?.classified_sound || 'SILENCE';
  const confidence = telemetry?.audio_analytics?.model_confidence_pct ?? 0;
  const roomTemp = telemetry?.environment?.room_temp ?? '---';
  const doorStatus = telemetry?.environment?.door_open ? 'OPEN' : 'CLOSED';
  const lightLevel = telemetry?.environment?.light_lux ?? '---';
  
  const getStatusColor = (sound: string) => {
    if (sound === 'BARK') return '#ef4444';
    if (sound === 'WHINE' || sound === 'GROWL') return '#f97316';
    return '#00df89';
  };

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>PawGuard <span style={{ color: '#00df89' }}>Enterprise</span></h1>
          <p style={{ color: '#475569', fontSize: '0.85rem' }}>Continuous Intelligent Pet Health Monitoring Platform</p>
        </div>
        <div style={{ backgroundColor: '#0a111c', padding: '0.5rem 1.2rem', borderRadius: '50px', border: '1px solid #141f32', fontSize: '0.8rem', color: '#94a3b8' }}>
          HUB ID: PG-HUB-00192X (ONLINE)
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: WELL-BEING & ENVIRONMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: '#0a111c', padding: '2.2rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>CURRENT WELL-BEING INDEX</h3>
            <h1 style={{ fontSize: '4rem', fontWeight: '900', color: getStatusColor(soundLabel), margin: 0 }}>{soundLabel}</h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Model Confidence: {confidence}%</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2.5rem' }}>
              <div style={{ backgroundColor: '#060b13', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ color: '#475569', fontSize: '0.7rem' }}>ROOM TEMP</p>
                <h2 style={{ margin: 0 }}>{roomTemp}°C</h2>
              </div>
              <div style={{ backgroundColor: '#060b13', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ color: '#475569', fontSize: '0.7rem' }}>DOOR STATUS</p>
                <h2 style={{ margin: 0 }}>{doorStatus}</h2>
              </div>
              <div style={{ backgroundColor: '#060b13', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ color: '#475569', fontSize: '0.7rem' }}>LIGHT LEVEL</p>
                <h2 style={{ margin: 0 }}>{lightLevel} lux</h2>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TIMESTAMPED FEED */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1rem' }}>🛡️ LIVE TELEMETRY FEED</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {packetHistory.length > 0 ? packetHistory.map((p, i) => (
              <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid #141f32', fontSize: '0.85rem' }}>
                <span style={{ color: '#475569', marginRight: '0.5rem' }}>
                  {new Date(p.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <strong style={{ color: '#38bdf8' }}>{p.audio_analytics?.classified_sound}</strong>
              </div>
            )) : <p style={{ color: '#475569' }}>Waiting for data...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}