'use client';
import { useEffect, useState } from 'react';

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const parsedData = typeof result.telemetry === 'string' 
          ? JSON.parse(result.telemetry) 
          : result.telemetry;
        setTelemetry(parsedData);
      } else if (result.success && !result.telemetry) {
        setTelemetry(null); // Database is empty, waiting for first packet
      } else {
        setError(result.error || 'Failed to read data stream.');
      }
    } catch (err) {
      setError('Network communication breakdown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000); // Polls every 3 seconds for lightning speed updates
    return () => clearInterval(interval);
  }, []);

  // Safe data extraction trackers supporting both flat and nested JSON structures
  const activityState = telemetry?.collar_metrics?.activity_state || telemetry?.activityState || '---';
  const movementScore = telemetry?.collar_metrics?.movement_score_pct || telemetry?.movementScore || '---';
  const ledStatus = telemetry?.collar_metrics?.led_status || telemetry?.ledStatus || 'OFFLINE';
  const radarDistance = telemetry?.collar_metrics?.distance_from_hub_meters ? `${telemetry.collar_metrics.distance_from_hub_meters}m` : (telemetry?.radarDistance || '---');
  const classification = telemetry?.audio_analytics?.detected_classification || telemetry?.inference || 'Silence';
  const confidence = telemetry?.audio_analytics?.inference_confidence_pct !== undefined ? `${telemetry.audio_analytics.inference_confidence_pct}%` : (telemetry?.confidence || '0%');
  const barks = telemetry?.audio_analytics?.historical_counts?.barks ?? telemetry?.barks ?? 0;
  const whines = telemetry?.audio_analytics?.historical_counts?.whines ?? telemetry?.whines ?? 0;
  const growls = telemetry?.audio_analytics?.historical_counts?.growls ?? telemetry?.growls ?? 0;
  const temp = telemetry?.environment?.temperature_c ? `${telemetry.environment.temperature_c}°C` : (telemetry?.temperature || '---');
  const pipelineStatus = telemetry?.device_info?.status ? `STREAMING PIPELINE ${telemetry.device_info.status.toUpperCase()}` : 'STREAMING PIPELINE STANDBY';
  
  // Dynamic header state tracking
  const geofence = telemetry?.collar_metrics?.geofence_status || 'SAFE';
  const systemHeadline = telemetry ? (geofence === 'BREACHED' ? 'CRITICAL BREACH' : 'SYSTEM OPERATIONAL') : 'AWAITING DATA';
  const headlineColor = systemHeadline === 'CRITICAL BREACH' ? '#ef4444' : (telemetry ? '#4ade80' : '#4ade80');

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#38bdf8', margin: 0, fontSize: '1.75rem' }}>PawGuard <span style={{color: '#4ade80', fontWeight: '300'}}>Enterprise</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>I2S Neural Acoustic Pet Classification Engine</p>
        </div>
        <div style={{ marginLeft: 'auto', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: telemetry ? '#eab308' : '#eab308' }}></span>
          {pipelineStatus}
        </div>
      </header>

      {error && <div style={{ padding: '1rem', backgroundColor: '#991b1b', borderRadius: '6px', marginBottom: '1rem' }}>⚠️ Error: {error}</div>}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        
        {/* CURRENT WELL-BEING INDEX CARD */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Current Well-Being Index</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0 0 1.5rem 0', color: headlineColor, letterSpacing: '-0.03em' }}>
            {systemHeadline}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>Activity State</p>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: '#f8fafc' }}>{activityState}</p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>Movement Score</p>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: '#f8fafc' }}>{movementScore}</p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>Collar LED Status</p>
              <span style={{ inlineBlock: 'true', marginTop: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: ledStatus === 'OFFLINE' ? '#0f172a' : '#14532d', color: ledStatus === 'OFFLINE' ? '#64748b' : '#4ade80' }}>
                {ledStatus}
              </span>
            </div>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>Radar Distance</p>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: '#f8fafc' }}>{radarDistance}</p>
            </div>
          </div>
        </div>

        {/* ACOUSTIC TELEMETRY FEED */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', gridRow: 'span 2' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>🔊 Acoustic Telemetry Feed</h3>
          <div style={{ height: '85%', display: 'flex', flexDirection: 'column', justifyContent: telemetry ? 'start' : 'center', alignItems: telemetry ? 'start' : 'center', color: '#64748b' }}>
            {telemetry ? (
              <div style={{ width: '100%' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '6px', borderLeft: '3px solid #38bdf8', marginBottom: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{telemetry.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'Live'}</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>Acoustic event parsed: <strong style={{color: '#38bdf8'}}>{classification}</strong></p>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Awaiting pipeline activation sequence...</p>
            )}
          </div>
        </div>

        {/* TINYML INFERENCE CARD */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>TinyML Inference</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#cbd5e1' }}>{classification}</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Model Confidence: <span style={{color: '#38bdf8'}}>{confidence}</span></p>
        </div>

        {/* ACOUSTIC AGGREGATES CARD */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>Acoustic Aggregates</h3>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <div>Barks: <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{barks}</span></div>
            <div>Whines: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{whines}</span></div>
            <div>Growls: <span style={{ color: '#eab308', fontWeight: 'bold' }}>{growls}</span></div>
          </div>
        </div>

        {/* AMBIENT TEMP CARD */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>Ambient Temp</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#f97316' }}>{temp}</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Target room baseline: 24°C</p>
        </div>

      </div>
    </div>
  );
}