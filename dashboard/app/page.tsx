'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  Activity, Shield, Thermometer, Sun, DoorOpen, DoorClosed, 
  Volume2, Calendar, Heart, Award, CheckCircle, Clock, 
  Plus, X, Bell, User, UploadCloud, FileText, Trash2, Camera, Settings
} from 'lucide-react';

interface Reminder {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
  completed: boolean;
}

interface MedicalDoc {
  id: number;
  name: string;
  size: string;
  dateAdded: string;
  fileUrl: string; // Dynamic URL pointer to open files
}

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Profile Settings States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [petName, setPetName] = useState<string>('Buddy');
  const [petBreed, setPetBreed] = useState<string>('Golden Retriever');
  const [petPfp, setPetPfp] = useState<string>('https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100');
  
  // Document Management States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<MedicalDoc[]>([
    { id: 1, name: "Rabies_Certification_2025.pdf", size: "1.2 MB", dateAdded: "2026-01-15", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
    { id: 2, name: "Blood_Report_Q1.pdf", size: "840 KB", dateAdded: "2026-04-10", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
  ]);

  // Reminders & Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [newType, setNewType] = useState<string>('Vaccine');

  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, title: "Rabies Booster Shot", date: "2026-07-12", time: "10:00", type: "Vaccine", completed: false },
    { id: 2, title: "Routine Vet Checkup", date: "2026-08-05", time: "14:30", type: "Vet Visit", completed: false },
    { id: 3, title: "Deworming Preventative", date: "2026-06-17", time: "09:00", type: "Medication", completed: false },
  ]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const result = await res.json();
      if (result.success && result.telemetry) {
        const data = typeof result.telemetry === 'string' ? JSON.parse(result.telemetry) : result.telemetry;
        setTelemetry(data);
        if (result.history) setPacketHistory(result.history);
        setIsLoading(false);
      }
    } catch (e) { 
      console.error("Failed to establish stream synchronization:", e); 
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Proximity notification tracker (Fires alert 24h before event)
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date().getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const alerts: string[] = [];

      reminders.forEach(rem => {
        if (!rem.completed) {
          const targetDateTime = new Date(`${rem.date}T${rem.time || '00:00'}`).getTime();
          const timeDifference = targetDateTime - now;

          if (timeDifference > 0 && timeDifference <= oneDayInMs) {
            alerts.push(`Upcoming ${rem.type}: "${rem.title}" is due within 24 hours! (${rem.date} @ ${rem.time})`);
          }
        }
      });
      setActiveNotifications(alerts);
    };

    checkNotifications();
    const notificationInterval = setInterval(checkNotifications, 5000);
    return () => clearInterval(notificationInterval);
  }, [reminders]);

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;

    const created: Reminder = {
      id: Date.now(),
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
      completed: false
    };

    setReminders(prev => [created, ...prev]);
    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setIsModalOpen(false);
  };

  // Document Upload Configuration
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    setTimeout(() => {
      const localUrl = URL.createObjectURL(file);
      const newDoc: MedicalDoc = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dateAdded: new Date().toISOString().split('T')[0],
        fileUrl: localUrl
      };
      setDocuments(prev => [newDoc, ...prev]);
      setIsUploading(false);
    }, 2000);
  };

  const handleDeleteDoc = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open view mode on click
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Fixed Structural Extractor logic matching your exact terminal payload keys
  const currentSound = telemetry?.audio_analytics?.classified_sound || 'SILENCE';
  const confidenceScore = telemetry?.audio_analytics?.confidence ?? 100;
  
  const collarTemp = telemetry?.collar?.body_temp !== undefined ? telemetry.collar.body_temp : '--';
  const movement = telemetry?.collar?.movement_activity || 'STATIONARY';
  const collarNoise = telemetry?.collar?.noise_level_db !== undefined ? telemetry.collar.noise_level_db : '--';

  const roomTemp = telemetry?.central_module?.room_temp !== undefined 
    ? telemetry.central_module.room_temp 
    : (telemetry?.environment?.room_temp !== undefined ? telemetry.environment.room_temp : '--');

  const lightLevel = telemetry?.central_module?.light_lux !== undefined 
    ? telemetry.central_module.light_lux 
    : (telemetry?.environment?.light_lux !== undefined ? telemetry.environment.light_lux : '--');

  const isDoorOpen = telemetry?.central_module?.door_open ?? telemetry?.environment?.door_open ?? false;
  const lastSyncTime = telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : '--:--:--';

  const getStatusColor = (sound: string) => {
    switch (sound.toUpperCase()) {
      case 'BARK': return '#EF4444'; 
      case 'GROWL':
      case 'WHINE': return '#F59E0B'; 
      case 'HUMAN SPEECH': return '#3B82F6'; 
      default: return '#10B981'; 
    }
  };

  const healthScore = (() => {
    let score = 100;
    if (currentSound === 'BARK' || currentSound === 'GROWL') score -= 12;
    if (collarTemp !== '--' && (Number(collarTemp) > 39.2 || Number(collarTemp) < 37.8)) score -= 15;
    if (collarNoise !== '--' && Number(collarNoise) > 75) score -= 8;
    return Math.max(score, 45);
  })();

  return (
    <div style={{ backgroundColor: '#09090b', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2.5rem', position: 'relative' }}>
      
      {/* 24-HOUR REMINDER MODULE DISPATCHER */}
      {activeNotifications.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activeNotifications.map((note, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', padding: '1rem', borderRadius: '12px', color: '#FBBF24', fontSize: '0.85rem', fontWeight: 600 }}>
              <Bell size={18} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* HEADER SECTION WITH TOP CORNER CORNER PROFILE PLATFORM */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', borderBottom: '1px solid #27272a', paddingBottom: '1.5rem', position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={26} color="#10B981" />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              PawGuard <span style={{ color: '#10B981', fontWeight: 400 }}>Enterprise</span>
            </h1>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>Edge-ML Array & Automated Environmental Hub</p>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '0.5rem' }}>
            Simulator Last Packet: <span style={{ color: '#10B981', fontWeight: 'bold' }}>{lastSyncTime}</span>
          </div>
        </div>

        {/* PROFILE DESIGN PLACED ON THE EXTREME CORNER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#141417', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid #27272a' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLoading ? '#f59e0b' : '#10B981' }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e4e4e7' }}>Live Sync</span>
          </div>

          {/* Interactive Profile Action Target */}
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#141417', border: '1px solid #27272a', padding: '0.4rem 1rem', borderRadius: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            <img src={petPfp} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #10B981' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>{petName}</div>
              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>{petBreed}</div>
            </div>
            <Settings size={14} color="#71717a" style={{ marginLeft: '0.25rem' }} />
          </div>

          {/* EXTENDED CORNER CONFIGURATION WINDOW DROPDOWN */}
          {isProfileOpen && (
            <div style={{ position: 'absolute', top: '120%', right: 0, backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '16px', padding: '1.25rem', width: '260px', zIndex: 100, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a1a1aa' }}>Profile Settings</span>
                <X size={16} style={{ cursor: 'pointer', color: '#71717a' }} onClick={() => setIsProfileOpen(false)} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Avatar Photo Link</label>
                  <input type="text" value={petPfp} onChange={(e) => setPetPfp(e.target.value)} style={{ width: '90%', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Pet Name</label>
                  <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} style={{ width: '90%', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Breed Species</label>
                  <input type="text" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} style={{ width: '90%', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* THREE COLUMN ARCHITECTURE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '2rem' }}>
        
        {/* BLOCK 1: EDGE MIC HUB & DIGITAL DOCUMENT VAULT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* DIGITAL MICROPHONE CONSOLE BLOCK (Tagline Removed) */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '0.08em', display: 'block', marginBottom: '1.5rem' }}>
              INMP441 I2S Microphone
            </span>
            
            <div style={{ margin: '0.5rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Acoustic Classification</span>
              <h2 style={{ fontSize: '3.2rem', fontWeight: 900, margin: '0.15rem 0', color: getStatusColor(currentSound), transition: 'color 0.2s ease', letterSpacing: '-0.02em' }}>
                {currentSound}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
                <div style={{ flex: 1, height: '5px', backgroundColor: '#27272a', borderRadius: '999px' }}>
                  <div style={{ width: `${confidenceScore}%`, height: '100%', backgroundColor: getStatusColor(currentSound), borderRadius: '999px', transition: 'width 0.4s ease' }}></div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1aa' }}>{confidenceScore}% Match</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC FILE CLINIC STORAGE COMPONENT */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#3B82F6" /> Medical Document Center
            </h3>

            {/* Document Trigger Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed #27272a', borderRadius: '12px', padding: '1rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#18181b', transition: 'border-color 0.2s', marginBottom: '1rem' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10B981'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc" />
              <UploadCloud size={22} color="#71717a" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block' }}>
                {isUploading ? "Uploading file..." : "Upload medical record"}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#71717a', display: 'block', marginTop: '0.15rem' }}>PDF, Doc or Images</span>
            </div>

            {/* Uploaded Documents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  title="Click to view file"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', cursor: 'pointer', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f1f23'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileText size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e4e4e7' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#71717a' }}>{doc.size} • Added {doc.dateAdded}</div>
                    </div>
                  </div>
                  <button onClick={(e) => handleDeleteDoc(doc.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOCK 2: BIOMETRICS & INTERIOR TELEMETRY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SMART BIOMETRIC COLLAR MODULE */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={14} color="#EF4444" /> Smart Collar Array
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '0.72rem', color: '#71717a' }}>Core Body Temp</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem' }}>{collarTemp}°C</div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '0.72rem', color: '#71717a' }}>IMU Activity State</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.5rem', color: '#3B82F6' }}>{movement}</div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                  <span style={{ color: '#71717a' }}>Ambient Noise Amplitude</span>
                  <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{collarNoise} dB</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#27272a', borderRadius: '999px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: `${collarNoise !== '--' ? Math.min(Number(collarNoise), 100) : 0}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '999px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* BASE STATION REGIONAL SENSORS */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} color="#10B981" /> Central Module Sensors
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Thermometer color="#3B82F6" size={20} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Room Temp</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {roomTemp !== '--' ? `${roomTemp}°C` : '--'}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sun color="#F59E0B" size={20} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Light Lux</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {lightLevel !== '--' ? `${lightLevel} lx` : '--'}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isDoorOpen ? <DoorOpen color="#EF4444" size={20} /> : <DoorClosed color="#10B981" size={20} />}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Access Portal Status</div>
                    <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Magnetic contact perimeter loop</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px', backgroundColor: isDoorOpen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isDoorOpen ? '#EF4444' : '#10B981' }}>
                  {isDoorOpen ? 'OPEN' : 'SECURE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 3: ANALYTICAL CLINIC REPORTS & TIMELINES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ADVANCED HEALTH CALCULATOR GRAPHIC */}
          <div style={{ background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)', borderRadius: '20px', border: '1px solid #3f3f46', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Award size={16} color="#F59E0B" /> Wellness Index Card
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 500 }}>Live Assessment</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: '0.5rem 0' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(#10B981 ${healthScore}%, #27272a 0)`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#141417', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.15rem', fontWeight: 800 }}>
                  {healthScore}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                  {healthScore > 85 ? 'Optimal Standing' : healthScore > 65 ? 'Condition Normal' : 'Attention Urged'}
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#a1a1aa', lineHeight: '1.3' }}>
                  Dynamically aggregated from ambient auditory profiles and biometrics.
                </p>
              </div>
            </div>
          </div>

          {/* VACCINE & VET APPOINTMENT REGISTRY */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Calendar size={15} color="#A78BFA" /> Schedules & Reminders
              </h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {reminders.map((rem) => (
                <div key={rem.id} style={{ display: 'flex', alignItems: 'center', padding: '0.7rem', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', opacity: rem.completed ? 0.5 : 1, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div onClick={() => toggleReminder(rem.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {rem.completed ? <CheckCircle size={16} color="#10B981" /> : <Clock size={16} color="#71717a" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, textDecoration: rem.completed ? 'line-through' : 'none' }}>{rem.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{rem.type} • {rem.date} <span style={{ color: '#a1a1aa' }}>@{rem.time}</span></div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleReminder(rem.id)}
                    style={{ background: 'none', border: '1px solid #27272a', color: rem.completed ? '#10B981' : '#a1a1aa', fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {rem.completed ? 'Done' : 'Mark'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIOUS RECORDED HISTORICAL LOG ENTRIES */}
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={15} color="#E4E4E7" /> Historical Micro-Acoustics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '180px', flex: 1 }}>
              {packetHistory.length > 0 ? packetHistory.map((p, i) => {
                const sound = p.audio_analytics?.classified_sound || 'SILENCE';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', backgroundColor: '#18181b', borderRadius: '8px', borderLeft: `3px solid ${getStatusColor(sound)}` }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{sound}</div>
                    <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                      {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : 'Syncing Time...'}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#71717a', fontSize: '0.75rem', padding: '2rem 0' }}>
                  Awaiting edge node data stream chunks...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SCHEDULE INTERFACE CREATOR MODAL OVERLAY */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create New Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Reminder Description</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="e.g., Annual Rabies Shot"
                  required
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Category Type</label>
                <select 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Vaccine">Vaccine</option>
                  <option value="Vet Visit">Vet Visit</option>
                  <option value="Medication">Medication</option>
                  <option value="Grooming">Grooming</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Target Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)} 
                    required
                    style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Target Time</label>
                  <input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)} 
                    required
                    style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
              >
                Save Appointment Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}