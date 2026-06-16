'use client';
import { useEffect, useState } from 'react';

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const parsedData = typeof result.telemetry === 'string' 
          ? JSON.parse(result.telemetry) 
          : result.telemetry;
        
        setTelemetry(parsedData);
        
        // Add unique event snapshots to the live feed container
        if (parsedData?.audio_analytics?.detected_classification) {
          const timestamp = parsedData.timestamp ? new Date(parsedData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
          const logMsg = `[${timestamp}] Inference updated: ${parsedData.audio_analytics.detected_classification} (${parsedData.audio_analytics.inference_confidence_pct || 0}% confidence)`;
          setLogs(prev => {
            if (prev[0] === logMsg) return prev;
            return [logMsg, ...prev.slice(0, 14)];
          });
        }
      }
    } catch (err) {
      console.error('Data stream read connection interrupted.', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000); // Polling index frame every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Safe data properties matching your nested database payload structure
  const pipelineStatus = telemetry?.device_info?.status ? `STREAMING PIPELINE ${telemetry.device_info.status.toUpperCase()}` : 'STREAMING PIPELINE STANDBY';
  const activityState = telemetry?.collar_metrics?.activity_state || '---';
  const movementScore = telemetry?.collar_metrics?.movement_score_pct !== undefined ? `${telemetry.collar_metrics.movement_score_pct}%` : '---';
  const ledStatus = telemetry?.collar_metrics?.led_status || 'OFFLINE';
  const radarDistance = telemetry?.collar_metrics?.distance_from_hub_meters !== undefined ? `${telemetry.collar_metrics.distance_from_hub_meters}m` : '---';
  
  const classification = telemetry?.audio_analytics?.detected_classification || 'Silence';
  const confidence = telemetry?.audio_analytics?.inference_confidence_pct !== undefined ? `${telemetry.audio_analytics.inference_confidence_pct}%` : '0%';
  
  const barks = telemetry?.audio_analytics?.historical_counts?.barks ?? 0;
  const whines = telemetry?.audio_analytics?.historical_counts?.whines ?? 0;
  const growls = telemetry?.audio_analytics?.historical_counts?.growls ?? 0;
  
  const temp = telemetry?.environment?.temperature_c !== undefined ? `${telemetry.environment.temperature_c}°C` : '---';

  // Headliner logic state tracking
  const systemHeadline = telemetry ? (telemetry?.collar_metrics?.geofence_status === 'BREACHED' ? 'CRITICAL BREACH' : 'SYSTEM OPERATIONAL') : 'AWAITING DATA';
  const headlineColor = systemHeadline === 'CRITICAL BREACH' ? '#f43f5e' : '#00df89';

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
            PawGuard <span style={{ color: '#00df89', fontWeight: '500' }}>Enterprise</span>
          </h1>
          <p style={{ color: '#475569', margin: '0.35rem 0 0 0', fontSize: '0.88rem', fontWeight: '500' }}>
            I2S Neural Acoustic Pet Classification Engine
          </p>
        </div>
        <div style={{ backgroundColor: '#0b1320', border: '1px solid #1e293b', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '0.04em' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: telemetry ? '#eab308' : '#eab308', boxShadow: '0 0 8px #eab308' }}></span>
          {pipelineStatus}
        </div>
      </header>

      {/* DASHBOARD LAYOUT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.75rem' }}>
        
        {/* LEFT COMPONENT LAYOUT BLOCK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* CURRENT WELL-BEING INDEX CARD */}
          <div style={{ backgroundColor: '#0a111c', padding: '2rem', borderRadius: '14px', border: '1px solid #141f32', position: 'relative' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em' }}>
              Current Well-Being Index
            </h3>
            <p style={{ fontSize: '4rem', fontWeight: '900', margin: '0 0 2rem 0', color: headlineColor, letterSpacing: '-0.02em', transition: 'color 0.3s ease' }}>
              {systemHeadline}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', borderTop: '1px solid #141f32', paddingTop: '1.5rem' }}>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.82rem', fontWeight: '500' }}>Activity State</p>
                <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>{activityState}</p>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.82rem', fontWeight: '500' }}>Movement Score</p>
                <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>{movementScore}</p>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.82rem', fontWeight: '500', marginBottom: '0.4rem' }}>Collar LED Status</p>
                <span style={{ display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: ledStatus === 'OFFLINE' ? '#141f32' : '#052e16', color: ledStatus === 'OFFLINE' ? '#64748b' : '#00df89', border: ledStatus === 'OFFLINE' ? '1px solid transparent' : '1px solid #14532d' }}>
                  {ledStatus}
                </span>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.82rem', fontWeight: '500' }}>Radar Distance</p>
                <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>{radarDistance}</p>
              </div>
            </div>
          </div>

          {/* LOWER THREE COLUMN METRICS CONTAINER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem' }}>
            
            {/* TINYML INFERENCE CARD */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '14px', border: '1px solid #141f32', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>TinyML Inference</h3>
                <span style={{ color: '#475569', fontSize: '0.9rem' }}>🔊</span>
              </div>
              <p style={{ fontSize: '2.2rem', fontWeight: '800', margin: '1.5rem 0 0.5rem 0', color: '#ffffff' }}>{classification}</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontWeight: '500' }}>Model Confidence: <span style={{ color: '#94a3b8' }}>{confidence}</span></p>
            </div>

            {/* ACOUSTIC AGGREGATES CARD */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '14px', border: '1px solid #141f32' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ margin: 0, color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>Acoustic Aggregates</h3>
                <span style={{ color: '#475569', fontSize: '0.9rem' }}>💬</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>Barks: <span style={{ color: '#f43f5e' }}>{barks}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>Whines: <span style={{ color: '#38bdf8' }}>{whines}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>Growls: <span style={{ color: '#eab308' }}>{growls}</span></div>
              </div>
            </div>

            {/* AMBIENT TEMPERATURE CARD */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.5rem', borderRadius: '14px', border: '1px solid #141f32', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>Ambient Temp</h3>
                <span style={{ color: '#f97316', fontSize: '0.9rem' }}>🔥</span>
              </div>
              <p style={{ fontSize: '2.2rem', fontWeight: '800', margin: '1.5rem 0 0.5rem 0', color: '#ffffff' }}>{temp}</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontWeight: '500' }}>Target room baseline: <span style={{ color: '#94a3b8' }}>24°C</span></p>
            </div>

          </div>
        </div>

        {/* RIGHT ACOUSTIC FEED SIDEBAR CONTAINER */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '14px', border: '1px solid #141f32', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ Acoustic Telemetry Feed
          </h3>
          
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '340px', paddingRight: '0.25rem' }}>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#060b13', borderRadius: '8px', borderLeft: '3px solid #38bdf8', fontSize: '0.8rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  {log}
                </div>
              ))
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
                Awaiting pipeline activation sequence...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}