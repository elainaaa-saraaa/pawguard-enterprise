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
            localTime: new Date(p.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      }
    } catch (e) { console.error('Data sync error', e); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Data mapping
  const sound = telemetry?.audio_analytics?.classified_sound || 'SILENCE';
  const distance = telemetry?.edge_analytics?.distance_meters || 0;
  const isRunaway = telemetry?.edge_analytics?.runaway_alert === true || distance > 20; // 20m threshold
  
  // Dynamic Aesthetic Logic
  const getTheme = () => {
    if (isRunaway) return { bg: '#450a0a', border: '#991b1b', text: '#fca5a5', label: 'CRITICAL: BREACHED' };
    if (sound === 'GROWL' || sound === 'WHINE') return { bg: '#431407', border: '#9a3412', text: '#fdba74', label: 'ANXIOUS' };
    if (sound === 'BARK') return { bg: '#450a0a', border: '#991b1b', text: '#fca5a5', label: 'DISTRESSED' };
    return { bg: '#064e3b', border: '#059669', text: '#6ee7b7', label: 'COMFORTABLE' };
  };

  const theme = getTheme();

  return (
    <div style={{ padding: '2rem', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* AESTHETIC ALERT BANNER */}
      <div style={{ 
        backgroundColor: theme.bg, 
        border: `2px solid ${theme.border}`, 
        padding: '1.5rem', 
        borderRadius: '16px', 
        marginBottom: '2rem',
        boxShadow: `0 0 20px ${theme.border}40`,
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: theme.text, fontSize: '1.5rem' }}>{theme.label}</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>Current Status: {sound} | Proximity: {distance}m</p>
      </div>

      {/* METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'PROXIMITY', value: `${distance}m`, color: '#38bdf8' },
          { label: 'SOUND STATE', value: sound, color: '#fbbf24' },
          { label: 'CONFIDENCE', value: `${telemetry?.audio_analytics?.model_confidence_pct || 0}%`, color: '#818cf8' }
        ].map((item, i) => (
          <div key={i} style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>{item.label}</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}