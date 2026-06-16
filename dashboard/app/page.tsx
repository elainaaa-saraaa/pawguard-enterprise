'use client';
import { useEffect, useState } from 'react';

interface TelemetryPacket {
  id: string;
  time: string;
  stress: string;
  comfort: string;
}

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<TelemetryPacket[]>([]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const parsedData = typeof result.telemetry === 'string' 
          ? JSON.parse(result.telemetry) 
          : result.telemetry;
        
        setTelemetry(parsedData);

        if (parsedData?.timestamp) {
          // Parse the true incoming database timestamp
          const dateObj = new Date(parsedData.timestamp);
          
          // Formats time exactly as HH:MM:SS PM/AM matching your locale
          const packetTime = dateObj.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
          });

          const shortId = parsedData?.device_info?.hub_id 
            ? parsedData.device_info.hub_id.slice(-4) 
            : '192X';
          
          const newPacket: TelemetryPacket = {
            id: shortId,
            time: packetTime,
            stress: parsedData?.edge_analytics?.stress_level || 'LOW',
            comfort: parsedData?.edge_analytics?.comfort_score_pct !== undefined ? `${parsedData.edge_analytics.comfort_score_pct}%` : '91%'
          };

          setPacketHistory(prev => {
            // Prevent duplicate entries if the packet timestamp hasn't changed
            if (prev.length > 0 && prev[0].time === packetTime) return prev;
            // Keeps the latest packet on top, rolling down previous updates
            return [newPacket, ...prev.slice(0, 5)];
          });
        }
      }
    } catch (err) {
      console.error('Data pipeline polling interrupted.', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Structural mappings to real JSON keys
  const hubId = telemetry?.device_info?.hub_id || 'PG-HUB-00192X';
  const hubStatus = telemetry?.device_info?.status ? telemetry.device_info.status.toUpperCase() : 'ONLINE';
  const comfortScore = telemetry?.edge_analytics?.comfort_score_pct !== undefined ? `${telemetry.edge_analytics.comfort_score_pct}%` : '91%';
  const stressLevel = telemetry?.edge_analytics?.stress_level || 'LOW';
  
  const headline = telemetry ? (stressLevel === 'LOW' ? 'COMFORTABLE' : 'DISTRESSED') : 'AWAITING DATA';

  const activityState = telemetry?.collar_metrics?.activity_state || '---';
  const movementScore = telemetry?.collar_metrics?.movement_score_pct !== undefined ? `${telemetry.collar_metrics.movement_score_pct}%` : '---';
  const ledStatus = telemetry?.collar_metrics?.led_status || 'OFFLINE';
  const batteryLevel = telemetry?.device_info?.battery_pct !== undefined ? `${telemetry.device_info.battery_pct}%` : '---';
  
  const temp = telemetry?.environment?.temperature_c !== undefined ? `${telemetry.environment.temperature_c}°C` : '---';
  const barksCount = telemetry?.audio_analytics?.historical_counts?.barks ?? '---';

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
            PawGuard <span style={{ color: '#00df89', fontWeight: '500' }}>Enterprise</span>
          </h1>
          <p style={{ color: '#475569', margin: '0.2rem 0 0 0', fontSize: '0.85rem', fontWeight: '500' }}>
            Continuous Intelligent Pet Health Monitoring Platform
          </p>
        </div>
        
        <div style={{ backgroundColor: '#0a111c', border: '1px solid #141f32', padding: '0.55rem 1.1rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.02em' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00df89', boxShadow: '0 0 8px #00df89' }}></span>
          HUB ID: {hubId} ({hubStatus})
        </div>
      </header>

      {/* TWO COLUMN GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COMPONENT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* MAIN WELL-BEING CARD */}
          <div style={{ backgroundColor: '#0a111c', padding: '2.2rem 2.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>
              CURRENT WELL-BEING INDEX
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0 0 2.2rem 0' }}>
              <span style={{ fontSize: '4.2rem', fontWeight: '900', color: '#00df89', letterSpacing: '-0.02em' }}>
                {headline}
              </span>
              {telemetry && (
                <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: '600' }}>
                  Score: {comfortScore}
                </span>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.4rem' }}>Activity State</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#ffffff' }}>{activityState}</p>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.4rem' }}>Movement Score</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#ffffff' }}>{movementScore}</p>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.5rem' }}>Collar LED Status</p>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: ledStatus === 'GREEN' ? '#052e16' : '#141f32', color: ledStatus === 'GREEN' ? '#00df89' : '#64748b', border: ledStatus === 'GREEN' ? '1px solid #14532d' : 'none' }}>
                  {ledStatus}
                </span>
              </div>
              <div>
                <p style={{ color: '#475569', margin: 0, fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.4rem' }}>Battery Level</p>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#ffffff' }}>{batteryLevel}</p>
              </div>
            </div>
          </div>

          {/* TRI-CARD METRIC GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            
            {/* AMBIENT TEMP */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32', position: 'relative' }}>
              <span style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: '#f97316', fontSize: '1.1rem' }}>🔥</span>
              <h3 style={{ margin: '0 0 1.2rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.04em' }}>AMBIENT TEMP</h3>
              <p style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0 0 0.6rem 0', color: '#ffffff' }}>{temp}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Target room baseline: 24°C</p>
            </div>

            {/* NOISE LEVEL */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32', position: 'relative' }}>
              <span style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: '#38bdf8', fontSize: '1.1rem' }}>🔊</span>
              <h3 style={{ margin: '0 0 1.2rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.04em' }}>NOISE LEVEL</h3>
              <p style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0 0 0.6rem 0', color: '#ffffff' }}>{telemetry ? '41 dB' : '---'}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Spikes indicate disruptions</p>
            </div>

            {/* TOTAL BARKS */}
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32', position: 'relative' }}>
              <span style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: '#6366f1', fontSize: '1.1rem' }}>📈</span>
              <h3 style={{ margin: '0 0 1.2rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.04em' }}>TOTAL BARKS</h3>
              <p style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0 0 0.6rem 0', color: '#ffffff' }}>{barksCount}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>Cumulative daily metrics</p>
            </div>

          </div>
        </div>

        {/* RIGHT LIVE TELEMETRY FEED SIDEBAR */}
        <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ LIVE TELEMETRY FEED
          </h3>
          
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', maxHeight: '420px' }}>
            {packetHistory.length > 0 ? (
              packetHistory.map((packet, idx) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: '#060b13', borderRadius: '8px', border: '1px solid #141f32', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: '500', marginBottom: '0.5rem' }}>
                    <span>PACKET ID: #{packet.id}</span>
                    <span>{packet.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span style={{ color: '#ffffff' }}>Stress Index: <span style={{ color: '#00df89' }}>{packet.stress}</span></span>
                    <span style={{ color: '#ffffff' }}>Comfort: <span style={{ color: '#94a3b8' }}>{packet.comfort}</span></span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
                Awaiting telemetry uplink pipeline...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}