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

      if (result.success) {

        const parsedData = typeof result.telemetry === 'string'

          ? JSON.parse(result.telemetry)

          : result.telemetry;

        setTelemetry(parsedData);

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

    const interval = setInterval(fetchTelemetry, 5000);

    return () => clearInterval(interval);

  }, []);



  return (

    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>

      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>

        <h1 style={{ color: '#38bdf8', margin: 0 }}>PawGuard Enterprise</h1>

        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Live System Software Diagnostics</p>

      </header>



      {loading && <p style={{ color: '#64748b' }}>Establishing database stream...</p>}

      {error && <div style={{ padding: '1rem', backgroundColor: '#991b1b', borderRadius: '6px', marginBottom: '1rem' }}>⚠️ Error: {error}</div>}



      {telemetry ? (

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>

         

          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>

            <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>Latest Hardware Event</h3>

            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#4ade80' }}>

              {telemetry.event || 'No Events Broadcasted'}

            </p>

          </div>



          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>

            <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>Last Transmission Timestamp</h3>

            <p style={{ fontSize: '1.1rem', margin: 0, color: '#cbd5e1' }}>

              {telemetry.timestamp ? new Date(telemetry.timestamp).toLocaleString() : 'N/A'}

            </p>

          </div>



          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155', gridColumn: '1 / -1' }}>

            <h3 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem' }}>Raw Database Record Payload</h3>

            <pre style={{ margin: 0, padding: '1rem', backgroundColor: '#0f172a', borderRadius: '4px', overflowX: 'auto', color: '#38bdf8' }}>

              {JSON.stringify(telemetry, null, 2)}

            </pre>

          </div>



        </div>

      ) : (

        !loading && <p style={{ color: '#64748b' }}>Waiting for incoming telemetry packets...</p>

      )}

    </div>

  );

}