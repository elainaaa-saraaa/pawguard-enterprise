'use client';
import { useEffect, useState } from 'react';

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<any[]>([]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DISTRESSED': return '#ef4444';
      case 'ANXIOUS': return '#f97316';
      case 'COMFORTABLE': return '#00df89';
      default: return '#00df89';
    }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const parsedData = typeof result.telemetry === 'string' ? JSON.parse(result.telemetry) : result.telemetry;
        setTelemetry(parsedData);
        if (result.history) setPacketHistory(result.history);
      } else {
        setTelemetry(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const isOutOfBounds = telemetry?.edge_analytics?.distance_meters > 20;
  const stressLevel = telemetry?.edge_analytics?.stress_level || 'LOW';
  const headline = telemetry ? (stressLevel === 'HIGH' ? 'DISTRESSED' : (stressLevel === 'MEDIUM' ? 'ANXIOUS' : 'COMFORTABLE')) : 'AWAITING DATA';
  const statusColor = getStatusColor(headline);

  const hubId = telemetry?.device_info?.hub_id || 'PG-HUB-00192X';
  const hubStatus = telemetry?.device_info?.status ? telemetry.device_info.status.toUpperCase() : 'ONLINE';
  const comfortScore = telemetry?.edge_analytics?.comfort_score_pct ? `${telemetry.edge_analytics.comfort_score_pct}%` : '91%';
  const activityState = telemetry?.collar_metrics?.activity_state || '---';
  const movementScore = telemetry?.collar_metrics?.movement_score_pct ? `${telemetry.collar_metrics.movement_score_pct}%` : '---';
  const ledStatus = telemetry?.collar_metrics?.led_status || 'OFFLINE';
  const batteryLevel = telemetry?.device_info?.battery_pct ? `${telemetry.device_info.battery_pct}%` : '---';
  const temp = telemetry?.environment?.temperature_c ? `${telemetry.environment.temperature_c}°C` : '---';
  const barksCount = telemetry?.audio_analytics?.historical_counts?.barks ?? '---';

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* GEOTRACKER ALERT */}
      {isOutOfBounds && (
        <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold', color: '#fca5a5' }}>
          🚨 CRITICAL ALERT: PET OUT OF BOUNDS
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>PawGuard <span style={{ color: '#00df89' }}>Enterprise</span></h1>
        </div>
        <div style={{ backgroundColor: '#0a111c', border: '1px solid #141f32', padding: '0.55rem 1.1rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>
          HUB ID: {hubId} ({hubStatus})
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: '#0a111c', padding: '2.2rem 2.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700' }}>CURRENT WELL-BEING INDEX</h3>
            <div style={{ fontSize: '4.2rem', fontWeight: '900', color: statusColor }}>{headline}</div>
            {telemetry && <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Score: {comfortScore}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2rem' }}>
              <div><p style={{ color: '#475569', fontSize: '0.8rem' }}>Activity</p><p style={{ fontWeight: '700' }}>{activityState}</p></div>
              <div><p style={{ color: '#475569', fontSize: '0.8rem' }}>Movement</p><p style={{ fontWeight: '700' }}>{movementScore}</p></div>
              <div><p style={{ color: '#475569', fontSize: '0.8rem' }}>LED</p><p style={{ fontWeight: '700' }}>{ledStatus}</p></div>
              <div><p style={{ color: '#475569', fontSize: '0.8rem' }}>Battery</p><p style={{ fontWeight: '700' }}>{batteryLevel}</p></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3>TEMP</h3><p style={{ fontSize: '2rem', fontWeight: '800' }}>{temp}</p>
            </div>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3>NOISE</h3><p style={{ fontSize: '2rem', fontWeight: '800' }}>41 dB</p>
            </div>
            <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
              <h3>BARKS</h3><p style={{ fontSize: '2rem', fontWeight: '800' }}>{barksCount}</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#0a111c', padding: '1.75rem', borderRadius: '12px', border: '1px solid #141f32' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1rem' }}>🛡️ LIVE TELEMETRY FEED</h3>
          {packetHistory.map((p, i) => <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #141f32' }}>Packet Received</div>)}
        </div>
      </div>
    </div>
  );
}