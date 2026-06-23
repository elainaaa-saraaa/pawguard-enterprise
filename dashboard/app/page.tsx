 'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  Activity, Shield, Thermometer, Sun, DoorOpen, DoorClosed, 
  Volume2, Calendar, Heart, Award, CheckCircle, Clock, 
  Plus, X, Bell, User, UploadCloud, FileText, Trash2, Camera, Settings, AlertTriangle
} from 'lucide-react';

// Connect to your newly built Firebase config file
import { db, storage } from './utils/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface Reminder {
  id: string; 
  title: string;
  date: string;
  time: string;
  type: string;
  completed: boolean;
}

interface MedicalDoc {
  id: string; 
  name: string;
  size: string;
  dateAdded: string;
  fileUrl: string;
  storagePath: string; 
}

export default function PawGuardDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [packetHistory, setPacketHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Profile States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [petName, setPetName] = useState<string>('Buddy');
  const [petBreed, setPetBreed] = useState<string>('Golden Retriever');
  const [petPfp, setPetPfp] = useState<string>('https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100');
  
  // Custom Dynamic Geofence Parameter
  const [allowedRadius, setAllowedRadius] = useState<number>(15);

  // Dynamic Remote Firebase Sync Arrays
  const [documents, setDocuments] = useState<MedicalDoc[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Modal and Alert States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [newType, setNewType] = useState<string>('Vaccine');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 1. LIVE TELEMETRY SIMULATOR LISTENER
  useEffect(() => {
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
      } catch (e) { console.error(e); }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. LIVE REALTIME FIRESTORE SYNC LISTENERS
  useEffect(() => {
    if (!db) return;
    try {
      const unsubscribeReminders = onSnapshot(collection(db, 'reminders'), (snapshot) => {
        const remindersList: Reminder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remindersList.push({
            id: docSnap.id,
            title: data.title || '',
            date: data.date || '',
            time: data.time || '',
            type: data.type || 'Vaccine',
            completed: !!data.completed
          });
        });
        setReminders(remindersList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }, (error) => {
        console.error("Firestore Reminders Subscription Error:", error);
      });

      const unsubscribeDocs = onSnapshot(collection(db, 'medical_documents'), (snapshot) => {
        const docsList: MedicalDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          docsList.push({
            id: docSnap.id,
            name: data.name || '',
            size: data.size || '',
            dateAdded: data.dateAdded || '',
            fileUrl: data.fileUrl || '',
            storagePath: data.storagePath || ''
          });
        });
        setDocuments(docsList);
      }, (error) => {
        console.error("Firestore Documents Subscription Error:", error);
      });

      return () => {
        unsubscribeReminders();
        unsubscribeDocs();
      };
    } catch (e) {
      console.error("Real-time pipeline initialization error:", e);
    }
  }, []);

  // 3. 24h REMINDER WINDOW WARNING CHECKER
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

  // FIRESTORE DATABASE MUTATIONS WITH ERROR TRAPPING
  const toggleReminder = async (id: string, currentStatus: boolean) => {
    try {
      const reminderRef = doc(db, 'reminders', id);
      await updateDoc(reminderRef, { completed: !currentStatus });
    } catch (err: any) {
      alert(`Could not update reminder status: ${err.message}`);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;

    try {
      // Direct write operation to Firebase Firestore
      await addDoc(collection(db, 'reminders'), {
        title: newTitle,
        date: newDate,
        time: newTime,
        type: newType,
        completed: false
      });

      // Clear layout elements out on success
      setNewTitle(''); setNewDate(''); setNewTime('');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Firebase write error:", err);
      alert(`CRITICAL ERROR: Failed to write data into Firestore.\n\nReason: ${err.message}\n\nPlease check if your Firestore security rules are published!`);
      setIsModalOpen(false); // Force close modal so interface unfreezes
    }
  };

  // CLOUD STORAGE DEVICE FILE UPLOADS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    const storagePath = `medical_records/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null, 
      (error) => {
        alert(`Storage Upload Error: ${error.message}`);
        setIsUploading(false);
      }, 
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, 'medical_documents'), {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          dateAdded: new Date().toISOString().split('T')[0],
          fileUrl: downloadUrl,
          storagePath: storagePath
        });
        setIsUploading(false);
      }
    );
  };

  const handlePfpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    const storageRef = ref(storage, `profiles/avatar_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null, (err) => alert(err.message), async () => {
      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
      setPetPfp(downloadUrl);
    });
  };

  const handleDeleteDoc = async (id: string, storagePath: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      await deleteObject(ref(storage, storagePath));
      await deleteDoc(doc(db, 'medical_documents', id));
    } catch (err: any) { alert(`Delete Error: ${err.message}`); }
  };

  const formatTimeSafely = (timestampValue: any) => {
    if (!timestampValue) return '--:--:--';
    try {
      if (!isNaN(timestampValue) && Number(timestampValue) < 10000000000) {
        return new Date(Number(timestampValue) * 1000).toLocaleTimeString();
      }
      if (!isNaN(timestampValue)) return new Date(Number(timestampValue)).toLocaleTimeString();
      return new Date(timestampValue).toLocaleTimeString();
    } catch (error) { return '--:--:--'; }
  };

  // Telemetry Selectors
  const currentSound = telemetry?.audio_analytics?.detected_classification || telemetry?.audio_analytics?.classified_sound || 'SILENCE';
  const confidenceScore = telemetry?.audio_analytics?.inference_confidence_pct ?? telemetry?.audio_analytics?.confidence ?? 100;
  const roomTemp = (telemetry?.environment?.temperature_c ?? telemetry?.central_module?.room_temp ?? telemetry?.environment?.room_temp) ?? '--';
  const lightLevel = (telemetry?.environment?.ambient_light_lux ?? telemetry?.central_module?.light_lux ?? telemetry?.environment?.light_lux) ?? '--';
  const movement = (telemetry?.collar_metrics?.activity_state ?? telemetry?.collar?.movement_activity) || 'STATIONARY';
  const distance = telemetry?.collar_metrics?.distance_from_hub_meters ?? telemetry?.edge_analytics?.distance_meters ?? 0;
  const stressScore = telemetry?.edge_analytics?.stress_level || 'LOW';
  const lastSyncTime = formatTimeSafely(telemetry?.timestamp);

  const isGeofenceBreached = distance > allowedRadius;

  const getStatusColor = (sound: string, stress: string) => {
    const cleanSound = sound.toUpperCase();
    const cleanStress = stress.toUpperCase();
    if (cleanSound === 'BARK' || cleanSound === 'GROWL' || cleanStress === 'HIGH' || isGeofenceBreached) return '#EF4444'; 
    if (cleanSound === 'WHINE' || cleanSound === 'HUMAN SPEECH' || movement.toUpperCase() === 'RESTLESS') return '#F59E0B'; 
    return '#10B981'; 
  };

  const healthScore = (() => {
    let score = telemetry?.edge_analytics?.comfort_score_pct ?? 100;
    if (isGeofenceBreached) score = Math.min(score, 30);
    return score;
  })();

  return (
    <div style={{ backgroundColor: '#09090b', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', padding: isMobile ? '1.25rem' : '2.5rem', position: 'relative' }}>
      
      {/* BREACH BANNER */}
      {isGeofenceBreached && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '2px solid #EF4444', padding: '1rem', borderRadius: '14px', color: '#FCA5A5', fontSize: '0.9rem', fontWeight: 800 }}>
          <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
          <span>🚨 ALARM: GEOFENCE BREACH! Pet is {distance}m away (Limit: {allowedRadius}m)</span>
        </div>
      )}

      {/* NOTIFICATION DEADLINE BANNER */}
      {activeNotifications.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activeNotifications.map((note, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', padding: '1rem', borderRadius: '12px', color: '#FBBF24', fontSize: '0.85rem', fontWeight: 600 }}>
              <Bell size={18} style={{ flexShrink: 0 }} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* HEADER */}
      <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2.5rem', borderBottom: '1px solid #27272a', paddingBottom: '1.5rem', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={26} color={getStatusColor(currentSound, stressScore)} />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              PawGuard <span style={{ color: getStatusColor(currentSound, stressScore), fontWeight: 400 }}>Enterprise</span>
            </h1>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '0.5rem' }}>
            Simulator Last Packet: <span style={{ color: '#10B981', fontWeight: 'bold' }}>{lastSyncTime}</span>
          </div>
        </div>

        {/* PROFILE HANDLES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#141417', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid #27272a' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLoading ? '#f59e0b' : '#10B981' }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e4e4e7' }}>Live Sync</span>
          </div>

          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#141417', border: '1px solid #27272a', padding: '0.4rem 1rem', borderRadius: '14px', cursor: 'pointer' }}
          >
            <img src={petPfp} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${getStatusColor(currentSound, stressScore)}` }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>{petName}</div>
              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>{petBreed}</div>
            </div>
            <Settings size={14} color="#71717a" style={{ marginLeft: '0.25rem' }} />
          </div>

          {/* DROP DOWN BOX */}
          {isProfileOpen && (
            <div style={{ position: 'absolute', top: '120%', right: 0, backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '16px', padding: '1.25rem', width: '240px', zIndex: 100, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a1a1aa' }}>Profile Settings</span>
                <X size={16} style={{ cursor: 'pointer', color: '#71717a' }} onClick={() => setIsProfileOpen(false)} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Avatar Photo</label>
                  <div 
                    onClick={() => pfpInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#18181b', border: '1px solid #27272a', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <input type="file" ref={pfpInputRef} onChange={handlePfpUpload} style={{ display: 'none' }} accept="image/*" />
                    <Camera size={14} color="#10B981" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e4e4e7' }}>Upload Image</span>
                  </div>
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

      {/* THREE COLUMN SYSTEM CORES */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.2fr', gap: '2rem' }}>
        
        {/* COLUMN 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '0.08em', display: 'block', marginBottom: '1.5rem' }}>
              INMP441 I2S Microphone
            </span>
            <div style={{ margin: '0.5rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Acoustic Classification</span>
              <h2 style={{ fontSize: '3.2rem', fontWeight: 900, margin: '0.15rem 0', color: getStatusColor(currentSound, stressScore), letterSpacing: '-0.02em' }}>
                {currentSound}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
                <div style={{ flex: 1, height: '5px', backgroundColor: '#27272a', borderRadius: '999px' }}>
                  <div style={{ width: `${confidenceScore}%`, height: '100%', backgroundColor: getStatusColor(currentSound, stressScore), borderRadius: '999px' }}></div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1aa' }}>{confidenceScore}% Match</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f4f4f5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#3B82F6" /> Medical Document Center
            </h3>

            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed #27272a', borderRadius: '12px', padding: '1rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#18181b', marginBottom: '1rem' }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc" />
              <UploadCloud size={22} color="#71717a" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block' }}>
                {isUploading ? "Uploading to Cloud Bucket..." : "Upload medical record"}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#71717a', display: 'block', marginTop: '0.15rem' }}>PDF, Doc or Images</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileText size={16} color="#3B82F6" />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e4e4e7' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#71717a' }}>{doc.size} • Added {doc.dateAdded}</div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id, doc.storagePath, e); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={14} color="#EF4444" /> Smart Collar Analytics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#18181b', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>Collar State</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.25rem', color: getStatusColor(currentSound, stressScore) }}>{movement}</div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>Hub Proximity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.25rem' }}>{distance}m</div>
              </div>
            </div>

            {/* BOX TEXT CONTAINER */}
            <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '12px', border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="radius-input" style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Set Safe Radius Limit</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input 
                  id="radius-input" type="number" min="1" max="50000"
                  value={allowedRadius || ''} 
                  onChange={(e) => setAllowedRadius(Math.max(1, parseInt(e.target.value) || 0))} 
                  style={{ width: '100%', backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '8px', padding: '0.6rem 2.5rem 0.6rem 0.75rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
                <span style={{ position: 'absolute', right: '0.75rem', fontSize: '0.75rem', color: '#71717a', pointerEvents: 'none' }}>meters</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} color="#10B981" /> Central Module Sensors
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Thermometer color="#3B82F6" size={20} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Room Temp</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getStatusColor(currentSound, stressScore) }}>
                    {roomTemp !== '--' ? `${roomTemp}°C` : '--'}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sun color="#F59E0B" size={20} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Light Lux</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {lightLevel !== '--' ? `${lightLevel} lx` : '--'}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '1rem', borderRadius: '14px', border: '1px solid #27272a', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isGeofenceBreached ? <DoorOpen color="#EF4444" size={20} /> : <DoorClosed color="#10B981" size={20} />}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Boundary Assessment</div>
                    <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Spatial geofence calculation loop</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px', backgroundColor: isGeofenceBreached ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isGeofenceBreached ? '#EF4444' : '#10B981' }}>
                  {isGeofenceBreached ? 'BREACHED' : 'SECURE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)', borderRadius: '20px', border: '1px solid #3f3f46', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Award size={16} color="#F59E0B" /> Wellness Index Card
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 500 }}>Live Assessment</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: '0.5rem 0' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(${getStatusColor(currentSound, stressScore)} ${healthScore}%, #27272a 0)`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#141417', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.15rem', fontWeight: 800, color: getStatusColor(currentSound, stressScore) }}>
                  {healthScore}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: getStatusColor(currentSound, stressScore) }}>
                  {isGeofenceBreached ? 'Critical Boundary Breach' : stressScore === 'HIGH' ? 'Distressed Warning' : 'Optimal Standing'}
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#a1a1aa', lineHeight: '1.3' }}>
                  Acoustic profile: <span style={{ color: getStatusColor(currentSound, stressScore), fontWeight: 'bold' }}>{currentSound} ({stressScore} STRESS)</span>
                </p>
              </div>
            </div>
          </div>

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
                    <div onClick={() => toggleReminder(rem.id, rem.completed)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {rem.completed ? <CheckCircle size={16} color="#10B981" /> : <Clock size={16} color="#71717a" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, textDecoration: rem.completed ? 'line-through' : 'none' }}>{rem.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{rem.type} • {rem.date} <span style={{ color: '#a1a1aa' }}>@{rem.time}</span></div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteDoc(doc(db, 'reminders', rem.id))}
                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#141417', borderRadius: '20px', border: '1px solid #27272a', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={15} color="#E4E4E7" /> Historical Micro-Acoustics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '180px', flex: 1 }}>
              {packetHistory.length > 0 ? packetHistory.map((p, i) => {
                const sound = p.audio_analytics?.detected_classification || p.audio_analytics?.classified_sound || 'SILENCE';
                const stress = p.edge_analytics?.stress_level || 'LOW';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', backgroundColor: '#18181b', borderRadius: '8px', borderLeft: `3px solid ${getStatusColor(sound, stress)}` }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: getStatusColor(sound, stress) }}>{sound}</div>
                    <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                      {p.timestamp ? formatTimeSafely(p.timestamp) : 'Syncing Time...'}
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

      {/* MODAL WINDOW */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#141417', border: '1px solid #27272a', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Create New Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 600 }}>Description</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Annual Rabies Shot" required style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#f4f4f5', fontSize: '0.8rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 600 }}>Category</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#f4f4f5', fontSize: '0.8rem' }}>
                  <option value="Vaccine">Vaccine</option>
                  <option value="Vet Visit">Vet Visit</option>
                  <option value="Medication">Medication</option>
                  <option value="Grooming">Grooming</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 600 }}>Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem 0.5rem', color: '#f4f4f5', fontSize: '0.8rem', colorScheme: 'dark' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#a1a1aa', fontWeight: 600 }}>Time</label>
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem 0.5rem', color: '#f4f4f5', fontSize: '0.8rem', colorScheme: 'dark' }} />
                </div>
              </div>

              <button type="submit" style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', cursor: 'pointer' }}>
                Save Appointment Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
