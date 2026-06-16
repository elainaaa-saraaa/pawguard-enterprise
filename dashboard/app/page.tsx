'use client';
import { useEffect, useState } from 'react';

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<any[]>([]);

  // Aesthetic Logic: Map Status to Color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DISTRESSED': return '#ef4444'; // Red
      case 'ANXIOUS': return '#f97316';    // Orange
      case 'COMFORTABLE': return '#00df89'; // Green
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
        if (result.history && Array.isArray(result.history)) setPacketHistory(result.history);
      } else {
        setTelemetry(null); // Triggers "AWAITING DATA"
      }
    } catch (err) { console.error('Polling error:', err); }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mapped Values
  const isOutOfBounds = telemetry?.edge_analytics?.distance_meters > 20;
  const stressLevel = telemetry?.edge_analytics?.stress_level || 'LOW';
  const headline = telemetry ? (stressLevel === 'HIGH' ? 'DISTRESSED' : (stressLevel === 'MEDIUM' ? 'ANXIOUS' : 'COMFORTABLE')) : 'AWAITING DATA';
  const statusColor = getStatusColor(headline);

  // Original UI Values
  const hubId = telemetry?.device_info?.hub_id || 'PG-HUB-00192X';
  const hubStatus = telemetry?.device_info?.status ? telemetry.device_info.status.toUpperCase() : 'ONLINE';
  const comfortScore = telemetry?.edge_analytics?.comfort_score_pct !== undefined ? `${telemetry.edge_analytics.comfort_score_pct}%` : '---';
  const activityState = telemetry?.collar_metrics?.activity_state || '---';
  const movementScore = telemetry?.collar_metrics?.movement_score_pct !== undefined ? `${telemetry.collar_metrics.movement_score_pct}%` : '---';
  const ledStatus = telemetry?.collar_metrics?.led_status || '---';
  const batteryLevel = telemetry?.device_info?.battery_pct !== undefined ? `${telemetry.device_info.battery_pct}%` : '---';
  const temp = telemetry?.environment?.temperature_c !== undefined ? `${telemetry.environment.temperature_c}°C` : '---';
  const barksCount = telemetry?.audio_analytics?.historical_counts?.barks ?? '---';

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#060b13', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* NEW: AESTHETIC GEOTRACKER ALERT */}
      {isOutOfBounds && (
        <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold', color: '#fca5a5', boxShadow: '0 0 15px #991b1b' }}>
          🚨 CRITICAL ALERT: PET OUT OF BOUNDS (Geofence Breach)
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
            PawGuard <span style={{ color: '#00df89', fontWeight: '500' }}>Enterprise</span>
          </h1>
        </div>
        <div style={{ backgroundColor: '#0a111c', border: '1px solid #141f32', padding: '0.55rem 1.1rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>
          HUB ID: {hubId} ({hubStatus})
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: '#0a111c', padding: '2.2rem 2.5rem', borderRadius: '12px', border: '1px solid #141f32' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700' }}>CURRENT WELL-BEING INDEX</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0 0 2.2rem 0' }}>
              {/* DYNAMIC COLOR APPLIED HERE */}
              <span style={{ fontSize: '4.2rem', fontWeight: '900', color: statusColor, transition: 'color 0.3s ease' }}>
                {headline}
              </span>
              {telemetry && <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: '600' }}>Score: {comfortScore}</span>}
            </div>
            {/* ... Your original grid stays exactly the same ... */}
          </div>
        </div>
      </div>
    </div>
  );
}