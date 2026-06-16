'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Flame, Activity, Volume2, CloudLightning, MessageSquare, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const checkLocalStream = async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setLiveMetrics(data[0]);
            setLogs(data);
          }
        }
      } catch (err) {
        console.log("Waiting for local data tick...");
      }
    };

    const localInterval = setInterval(checkLocalStream, 1000);
    return () => clearInterval(localInterval);
  }, []);

  const isHighStress = liveMetrics?.edge_analytics?.stress_level === 'HIGH';
  const isBreached = liveMetrics?.collar_metrics?.geofence_status === 'BREACHED';
  
  const currentSoundClass = liveMetrics?.audio_analytics?.detected_classification || 'Silence';
  const soundConfidence = liveMetrics?.audio_analytics?.inference_confidence_pct || 0;

  // Visual highlights for critical acoustic tracking
  const isVocalizationAlert = ['Bark', 'Whine', 'Growl'].includes(currentSoundClass);
  
  const accentColor = isBreached ? 'text-red-500' : (isHighStress ? 'text-amber-500' : 'text-emerald-400');
  const borderGlow = isBreached ? 'border-red-500 shadow-red-500/20 bg-red-950/10' : (isHighStress ? 'border-amber-500/30 shadow-amber-500/10' : 'border-emerald-500/20 shadow-emerald-500/5');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* HEADER BAR */}
      <header className="max-w-7xl mx-auto flex justify-between items-center pb-6 mb-8 border-b border-slate-900">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            PawGuard <span className="text-emerald-500 font-semibold">Enterprise</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">I2S Neural Acoustic Pet Classification Engine</p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-full">
          <span className={`h-2 w-2 rounded-full animate-pulse ${isBreached ? 'bg-red-500' : (liveMetrics ? 'bg-emerald-400' : 'bg-amber-500')}`}></span>
          <span className="text-xs font-medium tracking-wide text-slate-300">
            {liveMetrics ? `DSP HARDWARE: ${liveMetrics.audio_analytics?.microphone_hardware || 'INMP441'}` : 'STREAMING PIPELINE STANDBY'}
          </span>
        </div>
      </header>

      {/* EMERGENCY GEOFENCE BANNER */}
      {isBreached && (
        <div className="max-w-7xl mx-auto mb-8 p-5 bg-red-950/80 border border-red-500 text-red-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse shadow-2xl shadow-red-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 text-white rounded-xl font-black text-xs tracking-wider animate-bounce">🚨 CRITICAL</div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">GEOFENCE BOUNDARY BREACHED</h4>
              <p className="text-xs text-red-400 mt-0.5">
                Pet has escaped safety perimeter! Radar location distance: 
                <span className="font-mono text-white font-bold mx-1.5 text-sm">{liveMetrics?.collar_metrics?.distance_from_hub_meters} meters</span> 
                away from primary hub router.
              </p>
            </div>
          </div>
          <button className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors">
            Trigger Drone Dispatch
          </button>
        </div>
      )}

      {/* MAIN LAYOUT SPLIT GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* WELL-BEING SUMMARY CARD */}
          <div className={`p-8 bg-slate-900/40 border rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-500 ${borderGlow}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Well-being Index</span>
            <div className="flex items-baseline gap-4 mt-2">
              <h2 className={`text-6xl font-black tracking-tight uppercase ${accentColor}`}>
                {liveMetrics ? (isBreached ? 'RUNAWAY ALERT' : (isHighStress ? 'Anxious' : 'Comfortable')) : 'AWAITING DATA'}
              </h2>
              <span className="text-slate-400 text-lg font-medium">
                {liveMetrics ? `Score: ${liveMetrics.edge_analytics?.comfort_score_pct}%` : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 border-t border-slate-900 pt-6">
              <div>
                <p className="text-xs text-slate-500 font-medium">Activity State</p>
                <p className="text-base font-bold text-slate-200 mt-1">{liveMetrics?.collar_metrics?.activity_state || '---'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Movement Score</p>
                <p className="text-base font-bold text-slate-200 mt-1">{liveMetrics ? `${liveMetrics.collar_metrics?.movement_score_pct}%` : '---'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Collar LED Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xxs font-bold uppercase tracking-wider mt-1.5 border
                  ${isBreached || liveMetrics?.collar_metrics?.led_status === 'RED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {liveMetrics?.collar_metrics?.led_status || 'OFFLINE'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Radar Distance</p>
                <p className="text-base font-bold text-slate-200 mt-1">{liveMetrics ? `${liveMetrics.collar_metrics?.distance_from_hub_meters} m` : '---'}</p>
              </div>
            </div>
          </div>

          {/* TINYML LIVE ACCOUSTIC INFERENCE PANEL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className={`p-5 border rounded-xl transition-all duration-300 ${isVocalizationAlert ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/30 border-slate-900'}`}>
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">TinyML Inference</span>
                <Volume2 className={`h-4 w-4 ${isVocalizationAlert ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              </div>
              <p className={`text-2xl font-black tracking-tight mt-3 ${isVocalizationAlert ? 'text-amber-400' : 'text-slate-100'}`}>
                {currentSoundClass}
              </p>
              <p className="text-xxs text-slate-500 mt-1.5">Model Confidence: <span className="font-mono text-slate-300">{soundConfidence}%</span></p>
            </div>

            <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Acoustic Aggregates</span>
                <MessageSquare className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Barks:</span><span className="font-bold text-slate-200">{liveMetrics?.audio_analytics?.historical_counts?.barks ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Whines:</span><span className="font-bold text-slate-300">{liveMetrics?.audio_analytics?.historical_counts?.whines ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Growls:</span><span className="font-bold text-red-400">{liveMetrics?.audio_analytics?.historical_counts?.growls ?? 0}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-xl">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ambient Temp</span>
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-slate-100 mt-3">{liveMetrics ? `${liveMetrics.environment?.temperature_c}°C` : '---'}</p>
              <p className="text-xxs text-slate-500 mt-1.5">Target room baseline: 24°C</p>
            </div>

          </div>
        </div>

        {/* LIVE AUDIO LOG STREAM */}
        <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col h-[440px]">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-900">
            <Shield className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Acoustic Telemetry Feed</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {logs.map((log, index) => {
              const logClass = log.audio_analytics?.detected_classification || 'Silence';
              const alertLog = ['Bark', 'Whine', 'Growl'].includes(logClass);
              
              return (
                <div key={log.id || index} className={`p-3 border rounded-lg text-xs space-y-1 bg-slate-900/60 ${alertLog ? 'border-amber-500/30 bg-amber-950/5' : 'border-slate-900'}`}>
                  <div className="flex justify-between items-center text-slate-500 text-xxs font-mono">
                    <span>REF: #{log.id ? String(log.id).slice(-4) : 'DSP'}</span>
                    <span>{new Date(log.timestamp * 1000).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-300 font-medium">Inference classification: 
                      <span className={`ml-1 font-bold ${alertLog ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {logClass}
                      </span>
                    </span>
                    <span className="text-slate-400">Conf: <span className="font-semibold text-slate-200">{log.audio_analytics?.inference_confidence_pct}%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}