import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, Users, Search, Plus, UserCheck, 
  BedDouble, Wrench, Clock, Edit, MapPin, 
  Moon, Sun, Sparkles, X, Eye, 
  Upload, Database, Copy, Settings, LogOut, Lock, Mail,
  Map as MapIcon, Image as ImageIcon, Trash2, Calendar, CreditCard, Phone, User, FileText, CheckCircle, AlertCircle,
  Bell, Paperclip, MessageSquare, ShieldCheck, Filter, ChevronRight, Check, CornerDownRight, FileJson, Download, RefreshCw,
  ChevronDown, ChevronUp, SlidersHorizontal, Info, MoreVertical, Link2, Smartphone, Save, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://fojauvqvrqarxtwyrmtg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvamF1dnF2cnFhcnh0d3lybXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjczMDcsImV4cCI6MjEwODQ0MzMwN30.X9nNRtP2Q2AteCZXRYWPmADReq7Y5u9rxq5UortTtXA',
  appLogo: '', // Custom logo (base64 or URL)
};

const HOSTEL_BLOCKS = ['NCC Block', 'Office Block', 'Mathura (North)', 'Mathura (South)', 'Tennis Block', 'PG Block'];
const ADMIN_EMAILS = ['dr.ankitraj8558@gmail.com', 'ankit.raj@hostel.edu'];

// Files are served from the project's public/ folder
const REGISTER_PATHS = ['/data/OBH_ROOM_REGISTER.json', '/OBH_ROOM_REGISTER.json'];

// Words in occupant cells that are NOT residents
const NON_RESIDENT_WORDS = ['GUEST ROOM', 'TV ROOM', 'OFFICE', 'STORE ROOM', 'VACANT', 'NONE', 'NULL', 'UNDEFINED', 'NAN', '-'];

// --- BLOCK NAME NORMALIZER ---
const normalizeBlockName = (b) => {
  if (!b) return 'Office Block';
  const str = String(b).trim().toUpperCase();
  if (str.includes('NCC')) return 'NCC Block';
  if (str.includes('OFFICE') || str.includes('WING')) return 'Office Block';
  if (str.includes('NORTH')) return 'Mathura (North)';
  if (str.includes('SOUTH')) return 'Mathura (South)';
  if (str.includes('MATHURA')) return 'Mathura (North)';
  if (str.includes('TENNIS')) return 'Tennis Block';
  if (str.includes('PG')) return 'PG Block';
  return 'Office Block';
};

// --- JSON CLEANER ---
const sanitizeJSONText = (text) => {
  let t = String(text || '');
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  return t.replace(/([:\[,]\s*)-?(NaN|Infinity)(?=\s*[,}\]])/g, '$1null');
};

const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const pickField = (item, names) => {
  for (const key of Object.keys(item)) {
    if (names.includes(normKey(key))) {
      const v = item[key];
      if (v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'nan') {
        return v;
      }
    }
  }
  return undefined;
};

const isOccupantKey = (key) => {
  const k = normKey(key);
  return (
    k.includes('occupant') ||
    k.includes('student') ||
    k.includes('resident') ||
    k.startsWith('col') ||
    k.startsWith('unnamed') ||
    /^name\d+$/.test(k) ||
    /^bed\d*$/.test(k)
  );
};

export default function App() {
  // Configuration State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('obh_app_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('obh_app_config', JSON.stringify(config));
  }, [config]);

  // Supabase Client
  const supabase = useMemo(() => {
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        return createClient(config.supabaseUrl, config.supabaseAnonKey);
      } catch (e) {
        console.error("Supabase init error:", e);
        return null;
      }
    }
    return null;
  }, [config.supabaseUrl, config.supabaseAnonKey]);

  // Hidden File Input Ref for Manual JSON Upload & Logo Upload
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Auth State
  const [sessionUser, setSessionUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFetchingJson, setIsFetchingJson] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem('obh_last_synced') || '');
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // PWA Deferred Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // DATA STORES
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('obh_db_students_v3');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(s => ({ ...s, block: normalizeBlockName(s.block) }));
    } catch (e) {
      return [];
    }
  });

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('obh_db_rooms_v3');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(r => ({ ...r, block: normalizeBlockName(r.block) }));
    } catch (e) {
      return [];
    }
  });

  const studentsRef = useRef(students);
  studentsRef.current = students;

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('obh_db_notices_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('obh_db_tickets_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [hostelMapUrl, setHostelMapUrl] = useState(() => localStorage.getItem('obh_hostel_map_v3') || '');
  const [mapZoomLevel, setMapZoomLevel] = useState(1);

  // Modal Control States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('details');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Fee Ledger Editing State
  const [editingFeeEntry, setEditingFeeEntry] = useState(null); // null or index or 'new'
  const [feeFormData, setFeeFormData] = useState({
    year: '2026-27',
    amount: 45000,
    paid: 0,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Room Configuration Modal State
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ block: 'Office Block', room_no: '', seater: '1' });

  // Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapInputUrl, setMapInputUrl] = useState('');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ 
    studentId: '', 
    targetBlock: 'Office Block', 
    targetRoom: '', 
    transferDate: new Date().toISOString().split('T')[0],
    academicYear: '2026-27',
    reason: '' 
  });

  // Link Pending Resident State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingPendingUser, setLinkingPendingUser] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [selectedResidentToLink, setSelectedResidentToLink] = useState(null);

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', body: '', file_url: '', file_name: '', priority: 'General' });

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'Electrical', title: '', description: '' });

  const [ticketCommentText, setTicketCommentText] = useState({});

  // Master Directory Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterFeeStatus, setFilterFeeStatus] = useState('ALL');

  // Rooms View Filters
  const [roomFilterStatus, setRoomFilterStatus] = useState('ALL');
  const [roomSortOption, setRoomSortOption] = useState('ROOM_NO');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [collapsedBlocks, setCollapsedBlocks] = useState({});

  // Persistence Sync
  useEffect(() => localStorage.setItem('obh_db_students_v3', JSON.stringify(students)), [students]);
  useEffect(() => localStorage.setItem('obh_db_rooms_v3', JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem('obh_db_notices_v3', JSON.stringify(notices)), [notices]);
  useEffect(() => localStorage.setItem('obh_db_tickets_v3', JSON.stringify(complaints)), [complaints]);
  useEffect(() => {
    if (hostelMapUrl) localStorage.setItem('obh_hostel_map_v3', hostelMapUrl);
    else localStorage.removeItem('obh_hostel_map_v3');
  }, [hostelMapUrl]);

  // Initial Auto-load JSON
  useEffect(() => {
    if (rooms.length === 0) {
      loadJSONFromRepo(false);
    }
  }, []);

  // --- PWA SUPPORT: MANIFEST & SERVICE WORKER INJECTION ---
  useEffect(() => {
    const manifestObj = {
      name: "OBH Hostel Portal",
      short_name: "OBH Portal",
      description: "Hostel Management System for Resident Allotment, Notices & Complaints",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#4f46e5",
      icons: [
        {
          src: config.appLogo || "https://cdn-icons-png.flaticon.com/512/2858/2858022.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: config.appLogo || "https://cdn-icons-png.flaticon.com/512/2858/2858022.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };

    const manifestStr = URL.createObjectURL(new Blob([JSON.stringify(manifestObj)], { type: 'application/json' }));
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestStr;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_NAME = 'obh-portal-v1';
        self.addEventListener('install', (e) => {
          self.skipWaiting();
        });
        self.addEventListener('activate', (e) => {
          e.waitUntil(clients.claim());
        });
        self.addEventListener('fetch', (e) => {
          e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
        });
      `;
      const swBlob = new Blob([swCode], { type: 'text/javascript' });
      const swUrl = URL.createObjectURL(swBlob);
      navigator.serviceWorker.register(swUrl).catch(err => console.log('SW Registration skipped:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [config.appLogo]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Shared Data Parser
  const parseAndApplyJSON = (rawData, showPrompt = true) => {
    if (!Array.isArray(rawData) && typeof rawData === 'object' && rawData !== null) {
      const arrays = Object.values(rawData).filter(Array.isArray);
      if (arrays.length > 0) rawData = arrays.flat();
      else {
        if (showPrompt) alert("Invalid JSON: Expected an array of student/room records.");
        return false;
      }
    }

    if (!Array.isArray(rawData) || rawData.length === 0) {
      if (showPrompt) alert("Invalid JSON format or empty records array.");
      return false;
    }

    const importedStudents = [];
    const importedRoomsMap = new Map();
    let currentBlock = 'Office Block';
    let currentBatch = '2023';
    let skippedRows = 0;
    let idCounter = 0;

    rawData.forEach((item) => {
      if (!item || typeof item !== 'object') { skippedRows++; return; }

      const rawBlockVal = pickField(item, ['block', 'wing', 'hostelblock']);
      if (rawBlockVal !== undefined) currentBlock = String(rawBlockVal).trim();

      const rawBatchVal = pickField(item, ['batch', 'year']);
      if (rawBatchVal !== undefined) currentBatch = String(rawBatchVal).trim();

      const matchedBlock = normalizeBlockName(currentBlock);
      const roomRaw = pickField(item, ['roomno', 'room', 'roomnumber']);
      const roomNoVal = roomRaw !== undefined ? String(roomRaw).trim() : '';

      const occupants = [];
      Object.keys(item).forEach(key => {
        if (!isOccupantKey(key)) return;
        const val = String(item[key] ?? '').trim();
        if (!val) return;
        if (/^\d+(\.\d+)?$/.test(val)) return;
        if (NON_RESIDENT_WORDS.includes(val.toUpperCase())) return;
        const names = val
          .split('\n')
          .map(n => n.trim())
          .filter(n => n.length > 0 && !NON_RESIDENT_WORDS.includes(n.toUpperCase()));
        occupants.push(...names);
      });

      if (occupants.length === 0) {
        const nameVal = pickField(item, ['name', 'studentname', 'residentname']);
        if (nameVal !== undefined) occupants.push(String(nameVal).trim());
      }

      if (roomNoVal && roomNoVal.toLowerCase() !== 'unassigned') {
        const roomKey = `${matchedBlock}_${roomNoVal}`;
        const explicitSeater = parseInt(pickField(item, ['seater', 'capacity']), 10);
        const existingSeater = importedRoomsMap.get(roomKey)?.seater || 1;
        const calculatedSeater = explicitSeater || Math.max(parseInt(existingSeater, 10), occupants.length, 1);

        importedRoomsMap.set(roomKey, {
          id: `rm_${roomKey}`,
          block: matchedBlock,
          room_no: roomNoVal,
          seater: String(calculatedSeater),
          notes: ''
        });

        occupants.forEach((rawName) => {
          let course = 'MBBS';
          let cleanName = rawName;
          if (/\(\s*BDS\s*\)/i.test(rawName)) {
            course = 'BDS';
            cleanName = rawName.replace(/\(\s*BDS\s*\)/gi, '').trim();
          } else if (/\(\s*(MD\/MS|MD|MS)\s*\)/i.test(rawName)) {
            course = 'MD/MS';
            cleanName = rawName.replace(/\(\s*(MD\/MS|MD|MS)\s*\)/gi, '').trim();
          } else if (/\(\s*MBBS\s*\)/i.test(rawName)) {
            cleanName = rawName.replace(/\(\s*MBBS\s*\)/gi, '').trim();
          }
          if (!cleanName) return;

          idCounter += 1;
          const today = new Date().toISOString().split('T')[0];

          importedStudents.push({
            id: (occupants.length === 1 && item.id) ? item.id : `std_${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 5)}`,
            name: cleanName,
            email: item.email || `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@hostel.edu`,
            roll_no: item.roll_no || item.rollNo || '',
            course: item.course || course,
            batch: String(item.batch || currentBatch),
            block: matchedBlock,
            room_no: roomNoVal,
            phone: item.phone || '',
            father_name: item.father_name || item.fatherName || '',
            address: item.address || '',
            joining_date: item.joining_date || today,
            fee_status: item.fee_status || 'Pending',
            status: item.status || 'approved',
            role: item.role || 'resident',
            fee_ledger: item.fee_ledger || [],
            history: item.history || [
              {
                oldRoom: 'None',
                oldBlock: 'None',
                newRoom: roomNoVal,
                newBlock: matchedBlock,
                date: today,
                reason: 'Imported from JSON Register'
              }
            ]
          });
        });
      } else {
        skippedRows++;
      }
    });

    if (importedStudents.length === 0 && importedRoomsMap.size === 0) {
      if (showPrompt) alert("No valid room or resident records could be parsed from the JSON.");
      return false;
    }

    setStudents(prev => {
      const existingMap = new Map(prev.map(s => [`${s.name}_${normalizeBlockName(s.block)}_${s.room_no}`, s]));
      importedStudents.forEach(s => {
        const key = `${s.name}_${s.block}_${s.room_no}`;
        const existing = existingMap.get(key);
        existingMap.set(key, existing ? { ...s, ...existing } : s);
      });
      return Array.from(existingMap.values());
    });

    setRooms(prev => {
      const roomMap = new Map(prev.map(r => [`${normalizeBlockName(r.block)}_${r.room_no}`, r]));
      importedRoomsMap.forEach((r, k) => roomMap.set(k, r));
      return Array.from(roomMap.values());
    });

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSynced(nowStr);
    localStorage.setItem('obh_last_synced', nowStr);

    if (showPrompt) {
      alert(`Loaded ${importedStudents.length} residents & ${importedRoomsMap.size} rooms from JSON!` + (skippedRows > 0 ? `\n(${skippedRows} rows skipped)` : ''));
    }
    return true;
  };

  const loadJSONFromRepo = async (showPrompt = true) => {
    setIsFetchingJson(true);
    const errors = [];
    let found = false;

    for (const path of REGISTER_PATHS) {
      try {
        const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          errors.push(`${path} -> HTTP ${response.status}`);
          continue;
        }

        const text = await response.text();
        if (text.trim().startsWith('<')) {
          errors.push(`${path} -> returned HTML instead of JSON`);
          continue;
        }

        let rawData;
        try {
          rawData = JSON.parse(sanitizeJSONText(text));
        } catch (parseErr) {
          errors.push(`${path} -> invalid JSON (${parseErr.message})`);
          continue;
        }

        parseAndApplyJSON(rawData, showPrompt);
        found = true;
        break;
      } catch (e) {
        errors.push(`${path} -> ${e.message}`);
      }
    }

    setIsFetchingJson(false);

    if (!found && showPrompt) {
      alert(
        "Could not load OBH_ROOM_REGISTER.json.\n\n" +
        errors.join('\n') +
        "\n\nTip: You can use 'Upload Local JSON' to load the file directly."
      );
    }
  };

  const handleExportJSON = () => {
    const exportData = rooms.map(rm => {
      const occupants = students.filter(s => normalizeBlockName(s.block) === normalizeBlockName(rm.block) && s.room_no === rm.room_no);
      const record = {
        Block: rm.block,
        "Room No": rm.room_no,
        BATCH: occupants[0]?.batch || '2023',
        seater: rm.seater
      };
      occupants.forEach((occ, idx) => {
        let nameStr = occ.name;
        if (occ.course === 'BDS') nameStr += ' (BDS)';
        else if (occ.course === 'MD/MS') nameStr += ' (MD/MS)';
        record[`Occupant ${idx + 1}`] = nameStr;
      });
      return record;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "OBH_ROOM_REGISTER.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Auth Listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncUserProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) syncUserProfile(session.user);
      else setSessionUser(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const syncUserProfile = (authUser) => {
    const userEmail = authUser.email ? authUser.email.toLowerCase() : '';
    const isAdminUser = ADMIN_EMAILS.includes(userEmail);
    const existing = studentsRef.current.find(s => s.email?.toLowerCase() === userEmail);

    let profile;
    if (existing) {
      profile = {
        ...existing,
        block: normalizeBlockName(existing.block),
        role: isAdminUser ? 'admin' : existing.role || 'resident',
        status: isAdminUser ? 'approved' : existing.status || 'approved'
      };
    } else {
      profile = {
        id: authUser.id || 'usr_' + Date.now(),
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: isAdminUser ? 'admin' : 'resident',
        status: isAdminUser ? 'approved' : 'pending',
        course: 'MBBS',
        batch: '2023',
        roll_no: '',
        block: 'Office Block',
        room_no: 'Unassigned',
        phone: '',
        father_name: '',
        address: '',
        joining_date: new Date().toISOString().split('T')[0],
        fee_status: 'Pending',
        fee_ledger: [],
        history: []
      };
    }

    setSessionUser(profile);

    setStudents(prev => {
      const idx = prev.findIndex(s => s.email?.toLowerCase() === userEmail);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], block: profile.block, role: profile.role, status: profile.status };
        return updated;
      }
      return [...prev, profile];
    });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const userEmail = loginEmail.toLowerCase();
    const isAdminUser = ADMIN_EMAILS.includes(userEmail);

    if (!supabase) {
      const existing = studentsRef.current.find(s => s.email?.toLowerCase() === userEmail);
      let profile;
      if (existing) {
        profile = {
          ...existing,
          block: normalizeBlockName(existing.block),
          role: isAdminUser ? 'admin' : existing.role,
          status: 'approved'
        };
      } else {
        profile = {
          id: 'usr_' + Date.now(),
          email: loginEmail,
          name: loginEmail.split('@')[0],
          role: isAdminUser ? 'admin' : 'resident',
          status: 'approved',
          course: 'MBBS',
          batch: '2023',
          roll_no: '',
          block: 'Office Block',
          room_no: 'Unassigned',
          phone: '',
          father_name: '',
          address: '',
          joining_date: new Date().toISOString().split('T')[0],
          fee_status: 'Pending',
          fee_ledger: [],
          history: []
        };
      }
      setSessionUser(profile);
      setStudents(prev => {
        const idx = prev.findIndex(s => s.email?.toLowerCase() === userEmail);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = profile;
          return updated;
        }
        return [...prev, profile];
      });
      setAuthLoading(false);
      return;
    }

    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPassword });
        if (error) throw error;
        alert('Registration sent! Please check your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return alert('Configure Supabase settings first!');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSessionUser(null);
    setIsAdminToolsOpen(false);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(sanitizeJSONText(event.target.result));
        parseAndApplyJSON(rawData, true);
      } catch (err) {
        alert("Error parsing JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Logo = event.target.result;
      setConfig(prev => ({ ...prev, appLogo: base64Logo }));
      alert("App Logo updated successfully!");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Derived Approved / Pending lists
  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  // Occupancy Analysis
  const occupancyStats = useMemo(() => {
    let totalBedsCapacity = 0;
    let totalOccupiedBeds = 0;

    const blockBreakdown = {};
    HOSTEL_BLOCKS.forEach(b => {
      blockBreakdown[b] = { totalRooms: 0, totalCapacity: 0, occupied: 0, fullyVacant: 0, partialVacant: 0, fullyOccupied: 0 };
    });

    rooms.forEach(rm => {
      const normBlock = normalizeBlockName(rm.block);
      const capacity = parseInt(rm.seater, 10) || 1;
      const roomOccupants = approvedStudents.filter(s => 
        normalizeBlockName(s.block) === normBlock && 
        String(s.room_no || s.roomNo || '').trim() === String(rm.room_no).trim()
      );
      const count = roomOccupants.length;

      totalBedsCapacity += capacity;
      totalOccupiedBeds += count;

      if (blockBreakdown[normBlock]) {
        blockBreakdown[normBlock].totalRooms += 1;
        blockBreakdown[normBlock].totalCapacity += capacity;
        blockBreakdown[normBlock].occupied += count;

        if (count === 0) blockBreakdown[normBlock].fullyVacant += 1;
        else if (count < capacity) blockBreakdown[normBlock].partialVacant += 1;
        else blockBreakdown[normBlock].fullyOccupied += 1;
      }
    });

    return {
      totalBedsCapacity,
      totalOccupiedBeds,
      totalVacantBeds: Math.max(0, totalBedsCapacity - totalOccupiedBeds),
      blockBreakdown
    };
  }, [rooms, approvedStudents]);

  const totalMatchingRooms = useMemo(() => {
    if (!roomSearchQuery.trim()) return null;
    const q = roomSearchQuery.toLowerCase();
    let count = 0;
    HOSTEL_BLOCKS.forEach(blockName => {
      const blockRooms = rooms.filter(r => normalizeBlockName(r.block) === blockName);
      blockRooms.forEach(rm => {
        const occupants = approvedStudents.filter(s => 
          normalizeBlockName(s.block) === blockName && 
          String(s.room_no || s.roomNo || '').trim() === String(rm.room_no).trim()
        );
        const capacity = parseInt(rm.seater, 10) || 1;
        const occCount = occupants.length;

        if (roomFilterStatus === 'VACANT' && occCount > 0) return;
        if (roomFilterStatus === 'PARTIAL' && (occCount === 0 || occCount >= capacity)) return;
        if (roomFilterStatus === 'FULL' && occCount < capacity) return;

        const matchesRoom = rm.room_no.toLowerCase().includes(q);
        const matchesOccupant = occupants.some(occ => occ.name.toLowerCase().includes(q));
        if (matchesRoom || matchesOccupant) count++;
      });
    });
    return count;
  }, [rooms, approvedStudents, roomSearchQuery, roomFilterStatus]);

  // Master Directory Filters
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const roomVal = String(s.room_no || s.roomNo || '');
      const normBlock = normalizeBlockName(s.block);

      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            roomVal.includes(searchQuery) ||
                            (s.phone && s.phone.includes(searchQuery)) ||
                            (s.father_name && s.father_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBlock = filterBlock === 'ALL' || normBlock === filterBlock;
      const matchesBatch = filterBatch === 'ALL' || s.batch === filterBatch;
      const matchesCourse = filterCourse === 'ALL' || s.course === filterCourse;
      const matchesFee = filterFeeStatus === 'ALL' || s.fee_status === filterFeeStatus;

      return matchesSearch && matchesBlock && matchesBatch && matchesCourse && matchesFee;
    });
  }, [approvedStudents, searchQuery, filterBlock, filterBatch, filterCourse, filterFeeStatus]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterBlock !== 'ALL') count++;
    if (filterBatch !== 'ALL') count++;
    if (filterCourse !== 'ALL') count++;
    if (filterFeeStatus !== 'ALL') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [filterBlock, filterBatch, filterCourse, filterFeeStatus, searchQuery]);

  // FEE LEDGER CALCULATIONS
  const feeSummary = useMemo(() => {
    if (!selectedStudent || !selectedStudent.fee_ledger) {
      return { totalDue: 0, totalPaid: 0, balance: 0 };
    }
    const totalDue = selectedStudent.fee_ledger.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalPaid = selectedStudent.fee_ledger.reduce((sum, item) => sum + (Number(item.paid) || 0), 0);
    return {
      totalDue,
      totalPaid,
      balance: Math.max(0, totalDue - totalPaid)
    };
  }, [selectedStudent]);

  // FEE LEDGER EDIT HANDLERS
  const handleSaveFeeEntry = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'authorized') return alert('Access Denied');

    const entryToSave = {
      year: feeFormData.year.trim() || '2026-27',
      block: selectedStudent.block,
      room_no: selectedStudent.room_no || 'Unassigned',
      amount: Number(feeFormData.amount) || 0,
      paid: Number(feeFormData.paid) || 0,
      status: feeFormData.status,
      date: feeFormData.date || new Date().toISOString().split('T')[0],
      notes: feeFormData.notes || ''
    };

    let updatedLedger = [...(selectedStudent.fee_ledger || [])];

    if (editingFeeEntry === 'new') {
      updatedLedger.unshift(entryToSave);
    } else if (typeof editingFeeEntry === 'number') {
      updatedLedger[editingFeeEntry] = entryToSave;
    }

    let overallFeeStatus = 'Paid';
    const totalDue = updatedLedger.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalPaid = updatedLedger.reduce((s, i) => s + Number(i.paid || 0), 0);
    if (totalPaid === 0 && totalDue > 0) overallFeeStatus = 'Pending';
    else if (totalPaid < totalDue) overallFeeStatus = 'Partial';

    const updatedStudent = {
      ...selectedStudent,
      fee_status: overallFeeStatus,
      fee_ledger: updatedLedger
    };

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    setEditingFeeEntry(null);
  };

  const handleDeleteFeeEntry = (index) => {
    if (!selectedStudent) return;
    if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'authorized') return alert('Access Denied');

    if (window.confirm("Are you sure you want to delete this fee ledger entry?")) {
      const updatedLedger = selectedStudent.fee_ledger.filter((_, idx) => idx !== index);
      
      let overallFeeStatus = 'Paid';
      const totalDue = updatedLedger.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalPaid = updatedLedger.reduce((s, i) => s + Number(i.paid || 0), 0);
      if (totalPaid === 0 && totalDue > 0) overallFeeStatus = 'Pending';
      else if (totalPaid < totalDue) overallFeeStatus = 'Partial';

      const updatedStudent = {
        ...selectedStudent,
        fee_status: overallFeeStatus,
        fee_ledger: updatedLedger
      };

      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
    }
  };

  // DELETE RESIDENT HANDLER
  const handleDeleteResident = (studentToDelete) => {
    if (!studentToDelete) return;
    if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'authorized') return alert('Access Denied');

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete resident "${studentToDelete.name}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setSelectedStudent(null);
      alert(`Resident "${studentToDelete.name}" has been permanently deleted.`);
    }
  };

  // Add Dynamic Room
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Admin access required.');
    if (!newRoomData.room_no.trim()) return alert('Please enter room number.');

    const targetBlock = normalizeBlockName(newRoomData.block);
    const roomNoClean = newRoomData.room_no.trim();

    const roomExists = rooms.some(r => normalizeBlockName(r.block) === targetBlock && r.room_no.trim() === roomNoClean);
    if (roomExists) {
      return alert(`Room ${roomNoClean} already exists in ${targetBlock}.`);
    }

    const createdRoom = {
      id: `rm_${targetBlock}_${roomNoClean}_${Date.now()}`,
      block: targetBlock,
      room_no: roomNoClean,
      seater: newRoomData.seater,
      notes: ''
    };

    setRooms(prev => [...prev, createdRoom]);
    setIsAddRoomModalOpen(false);
    setNewRoomData({ block: 'Office Block', room_no: '', seater: '1' });
  };

  // Delete Room
  const handleDeleteRoom = (roomId) => {
    if (sessionUser?.role !== 'admin') return;
    if (window.confirm('Are you sure you want to delete this room configuration?')) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setSelectedRoom(null);
    }
  };

  // Save Map URL / Upload
  const handleSaveMapUrl = (e) => {
    e.preventDefault();
    if (mapInputUrl.trim()) {
      setHostelMapUrl(mapInputUrl.trim());
      setIsMapModalOpen(false);
      setMapInputUrl('');
    }
  };

  const handleMapFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHostelMapUrl(reader.result);
        setIsMapModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Resident
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin' && sessionUser?.role !== 'authorized') return alert('Access Denied');

    const normBlock = normalizeBlockName(editingStudent.block);
    const updatedRecord = { ...editingStudent, block: normBlock };

    if (updatedRecord.room_no && updatedRecord.room_no !== 'Unassigned') {
      const targetRoom = rooms.find(r => normalizeBlockName(r.block) === normBlock && r.room_no === updatedRecord.room_no);
      if (targetRoom) {
        const capacity = parseInt(targetRoom.seater, 10) || 1;
        const currentOccupants = approvedStudents.filter(s => normalizeBlockName(s.block) === normBlock && s.room_no === updatedRecord.room_no && s.id !== updatedRecord.id);

        if (currentOccupants.length >= capacity) {
          alert(`Capacity Exceeded! Room ${updatedRecord.room_no} in ${normBlock} is a ${capacity}-seater and already has ${currentOccupants.length} resident(s).`);
          return;
        }
      }
    }

    if (updatedRecord.id) {
      setStudents(prev => prev.map(s => s.id === updatedRecord.id ? updatedRecord : s));
    } else {
      const newEntry = {
        ...updatedRecord,
        id: 'std_' + Date.now(),
        status: 'approved',
        fee_status: updatedRecord.fee_status || 'Pending',
        fee_ledger: [],
        history: [{
          oldRoom: 'None',
          oldBlock: 'None',
          newRoom: updatedRecord.room_no || 'Unassigned',
          newBlock: normBlock,
          date: updatedRecord.joining_date || new Date().toISOString().split('T')[0],
          reason: 'Initial Registration'
        }]
      };
      setStudents(prev => [...prev, newEntry]);
    }

    setIsEditStudentModalOpen(false);
    if (selectedStudent?.id === updatedRecord.id) setSelectedStudent(updatedRecord);
    setEditingStudent(null);
  };

  // Direct Room Shifting
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Admin access required.');

    const student = students.find(s => s.id === transferData.studentId);
    if (!student) return;

    const targetBlock = normalizeBlockName(transferData.targetBlock);
    const targetRoom = rooms.find(r => normalizeBlockName(r.block) === targetBlock && r.room_no === transferData.targetRoom);
    
    if (targetRoom) {
      const capacity = parseInt(targetRoom.seater, 10) || 1;
      const currentOccupants = approvedStudents.filter(s => normalizeBlockName(s.block) === targetBlock && s.room_no === transferData.targetRoom && s.id !== student.id);

      if (currentOccupants.length >= capacity) {
        alert(`Cannot Shift! Room ${transferData.targetRoom} in ${targetBlock} is a ${capacity}-seater and is FULL.`);
        return;
      }
    }

    const historyRecord = {
      oldRoom: student.room_no || 'None',
      oldBlock: normalizeBlockName(student.block) || 'None',
      newRoom: transferData.targetRoom,
      newBlock: targetBlock,
      date: transferData.transferDate,
      reason: transferData.reason || 'Room Shift'
    };

    const updatedStudent = {
      ...student,
      room_no: transferData.targetRoom,
      block: targetBlock,
      joining_date: transferData.transferDate,
      history: [historyRecord, ...(student.history || [])]
    };

    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    setIsTransferModalOpen(false);
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  // Linking Pending User
  const handleConfirmLink = (pendingUser, existingResident) => {
    if (!pendingUser || !existingResident) return;

    const targetEmail = pendingUser.email;

    setStudents(prev => {
      const filtered = prev.filter(s => s.id !== pendingUser.id);
      return filtered.map(s => {
        if (s.id === existingResident.id) {
          return {
            ...s,
            email: targetEmail,
            status: 'approved',
            role: s.role || 'resident'
          };
        }
        return s;
      });
    });

    if (sessionUser && (sessionUser.id === pendingUser.id || sessionUser.email?.toLowerCase() === targetEmail?.toLowerCase())) {
      const updated = {
        ...existingResident,
        email: targetEmail,
        status: 'approved',
        role: existingResident.role || 'resident',
        block: normalizeBlockName(existingResident.block)
      };
      setSessionUser(updated);
    }

    setIsLinkModalOpen(false);
    setLinkingPendingUser(null);
    setSelectedResidentToLink(null);
    alert(`Successfully linked ${targetEmail} to ${existingResident.name}!`);
  };

  // Post Notice
  const handleCreateNotice = (e) => {
    e.preventDefault();
    const notice = {
      id: 'not_' + Date.now(),
      title: newNotice.title,
      body: newNotice.body,
      file_url: newNotice.file_url,
      file_name: newNotice.file_name || (newNotice.file_url ? 'Attachment Link' : ''),
      posted_by: sessionUser.name,
      date: new Date().toISOString().split('T')[0],
      priority: newNotice.priority
    };
    setNotices(prev => [notice, ...prev]);
    setIsNoticeModalOpen(false);
    setNewNotice({ title: '', body: '', file_url: '', file_name: '', priority: 'General' });
  };

  // Add Comment to Complaint
  const handleAddTicketComment = (ticketId) => {
    const text = ticketCommentText[ticketId];
    if (!text || !text.trim()) return;

    setComplaints(prev => prev.map(tkt => {
      if (tkt.id === ticketId) {
        const newComments = tkt.comments || [];
        return {
          ...tkt,
          comments: [...newComments, { author: sessionUser.name, text: text.trim(), date: new Date().toISOString().split('T')[0] }]
        };
      }
      return tkt;
    }));

    setTicketCommentText({ ...ticketCommentText, [ticketId]: '' });
  };

  // Update Complaint Status
  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    setComplaints(prev => prev.map(tkt => tkt.id === ticketId ? { ...tkt, status: newStatus } : tkt));
  };

  // Helper for active tab title
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Overview & Notices';
      case 'grid': return 'Rooms & Vacancy';
      case 'directory': return 'Master Directory';
      case 'notices': return 'Notice Board';
      case 'tickets': return 'Complaints Desk';
      case 'map': return 'Hostel Map';
      case 'approval': return 'Approval Desk';
      default: return 'Overview';
    }
  };

  // Toggle block collapse state
  const toggleBlockCollapse = (blockName) => {
    setCollapsedBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));
  };

  // App Logo Renderer Component
  const AppLogoIcon = ({ className = "w-5 h-5" }) => {
    if (config.appLogo) {
      return <img src={config.appLogo} alt="App Logo" className={`${className} object-contain rounded`} />;
    }
    return <Building2 className={className} />;
  };

  // --- LOGIN VIEW ---
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 overflow-hidden p-1">
              <AppLogoIcon className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2">OBH HOSTEL PORTAL</h1>
            <p className="text-xs text-slate-400">Sign in to access resident status, notices, and hostel desk.</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full min-h-[44px] py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">or sign in with email</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="dr.ankitraj8558@gmail.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[44px] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition"
            >
              {authLoading ? 'Signing In...' : (isSigningUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="text-indigo-400 font-bold hover:underline"
            >
              {isSigningUp ? 'Already registered? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APPLICATION ---
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col md:flex-row font-sans transition-colors duration-200 pb-20 md:pb-0`}>
      
      {/* Hidden File Input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".json,application/json" 
        onChange={handleImportJSON} 
        className="hidden" 
      />

      {/* Hidden File Input for Custom App Logo */}
      <input 
        type="file" 
        ref={logoInputRef} 
        accept="image/*" 
        onChange={handleLogoUpload} 
        className="hidden" 
      />

      {/* MOBILE STICKY TOP HEADER */}
      <header className={`md:hidden sticky top-0 z-40 ${darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-md border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md overflow-hidden">
            <AppLogoIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight">OBH PORTAL</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{getTabTitle(activeTab)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-bold shadow flex items-center space-x-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSelectedStudent(sessionUser)}
            className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow uppercase"
            aria-label="User Profile"
          >
            {(sessionUser.name || 'A').charAt(0)}
          </button>

          <button
            onClick={() => setIsAdminToolsOpen(true)}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            aria-label="Settings and Tools"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`hidden md:flex md:w-64 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-r flex-shrink-0 flex-col justify-between`}>
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md overflow-hidden">
                <AppLogoIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base leading-tight tracking-wide">OBH PORTAL</h1>
                <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Hostel Management</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {deferredPrompt && (
            <div className="m-3 p-3 rounded-xl bg-indigo-600 text-white text-xs space-y-1.5 shadow-md">
              <div className="flex items-center space-x-2 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Install OBH App</span>
              </div>
              <p className="text-[11px] text-indigo-100">Add to home screen for quick offline access.</p>
              <button
                onClick={handleInstallApp}
                className="w-full py-1.5 bg-white text-indigo-600 font-bold rounded-lg text-[11px] shadow hover:bg-indigo-50 transition"
              >
                Install Now
              </button>
            </div>
          )}

          <div className="p-3 m-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Active User</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">
                {sessionUser.role}
              </span>
            </div>
            <p className="font-bold text-xs truncate">{sessionUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{sessionUser.email}</p>
          </div>

          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Building2 className="w-4 h-4" />
              <span>Overview & Notices</span>
            </button>

            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <button
                onClick={() => setActiveTab('grid')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <BedDouble className="w-4 h-4" />
                <span>Hostel Rooms & Vacancy</span>
              </button>
            )}

            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <button
                onClick={() => setActiveTab('directory')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4" />
                <span>Master Directory</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('notices')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'notices' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Bell className="w-4 h-4" />
              <span>Notice Board</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Complaints Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Hostel Map</span>
            </button>

            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <button
                onClick={() => setActiveTab('approval')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'approval' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <UserCheck className="w-4 h-4" />
                <div className="flex-1 flex justify-between items-center">
                  <span>Approval Desk</span>
                  {pendingStudents.length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {pendingStudents.length}
                    </span>
                  )}
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2">
          {sessionUser.role === 'admin' && (
            <button
              onClick={() => setIsAdminToolsOpen(true)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center space-x-2 transition border border-slate-200 dark:border-slate-700"
            >
              <Settings className="w-4 h-4" />
              <span>Admin Tools & Data</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE FIXED BOTTOM TAB BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${darkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md border-t flex justify-around items-center py-2 px-1 shadow-lg`}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Overview</span>
        </button>

        <button
          onClick={() => {
            if (sessionUser.role === 'admin' || sessionUser.role === 'authorized') setActiveTab('grid');
            else alert('Access restricted to Authorized Personnel.');
          }}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'grid' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <BedDouble className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Rooms</span>
        </button>

        <button
          onClick={() => {
            if (sessionUser.role === 'admin' || sessionUser.role === 'authorized') setActiveTab('directory');
            else alert('Access restricted to Authorized Personnel.');
          }}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'directory' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'map' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <MapIcon className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Map</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'notices' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Bell className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Notices</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${activeTab === 'tickets' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] mt-1 font-medium">Complaints</span>
        </button>
      </nav>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* VIEW 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 w-full">
            
            {/* User Profile Summary Card */}
            <div className={`p-5 sm:p-6 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
                  {(sessionUser.name || 'A').charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{sessionUser.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{sessionUser.course} • Batch {sessionUser.batch} • Roll: {sessionUser.roll_no || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900">
                  Room {sessionUser.room_no || 'Unassigned'} ({normalizeBlockName(sessionUser.block)})
                </div>
                <button
                  onClick={() => setSelectedStudent(sessionUser)}
                  className="min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition active:scale-95"
                >
                  Profile & Ledger
                </button>
              </div>
            </div>

            {/* Admin High-Level Capacity Overview */}
            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Hostel Capacity & Vacancy Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Total Configured Capacity</p>
                    <p className="text-2xl font-black mt-1">{occupancyStats.totalBedsCapacity} Beds</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Occupied Beds</p>
                    <p className="text-2xl font-black mt-1">{occupancyStats.totalOccupiedBeds}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Vacant Beds</p>
                    <p className="text-2xl font-black mt-1">{occupancyStats.totalVacantBeds}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Active Notices</p>
                    <p className="text-2xl font-black mt-1">{notices.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Notices Feed */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Recent Hostel Notices</span>
                </h3>
                <button onClick={() => setActiveTab('notices')} className="text-xs text-indigo-500 font-bold hover:underline flex items-center space-x-0.5">
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.slice(0, 3).map(not => (
                    <div key={not.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-2 shadow-sm`}>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{not.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          not.priority === 'Urgent' || not.priority === 'Fee Notice'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {not.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{not.body}</p>
                      <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        <span>Posted by {not.posted_by} on {not.date}</span>
                        {not.file_url && (
                          <a href={not.file_url} target="_blank" rel="noreferrer" className="text-indigo-500 font-bold hover:underline flex items-center space-x-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{not.file_name || 'Attachment'}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No notices posted yet.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: IMPROVED ROOM GRID & VACANCY DASHBOARD */}
        {activeTab === 'grid' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Hostel Rooms & Vacancy Dashboard</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {occupancyStats.totalOccupiedBeds} beds occupied out of {occupancyStats.totalBedsCapacity} total • {occupancyStats.totalVacantBeds} beds available
                </p>
              </div>

              {sessionUser.role === 'admin' && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsAddRoomModalOpen(true)}
                    className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Room</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingStudent({ 
                        name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Block', room_no: '', 
                        phone: '', father_name: '', address: '', joining_date: new Date().toISOString().split('T')[0], fee_status: 'Pending' 
                      });
                      setIsEditStudentModalOpen(true);
                    }}
                    className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <User className="w-4 h-4" />
                    <span>Register Resident</span>
                  </button>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3 text-xs`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3 font-semibold text-[11px]">
                  <span className="text-slate-400">Legend:</span>
                  <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Vacant</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Partial</span>
                  </span>
                  <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Full</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search room / name..."
                      value={roomSearchQuery}
                      onChange={e => setRoomSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                  {roomSearchQuery.trim() !== '' && totalMatchingRooms !== null && (
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] whitespace-nowrap border border-indigo-200 dark:border-indigo-900">
                      {totalMatchingRooms} {totalMatchingRooms === 1 ? 'room' : 'rooms'} found
                    </span>
                  )}
                  <select
                    value={roomSortOption}
                    onChange={e => setRoomSortOption(e.target.value)}
                    className={`p-1.5 rounded-xl border text-xs font-medium ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="ROOM_NO">Sort: Room No</option>
                    <option value="OCCUPANCY">Sort: Occupancy</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pt-1">
                <span className="text-slate-400 font-bold text-[11px] mr-1">Filter:</span>
                {['ALL', 'VACANT', 'PARTIAL', 'FULL'].map(status => (
                  <button
                    key={status}
                    onClick={() => setRoomFilterStatus(status)}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition whitespace-nowrap ${
                      roomFilterStatus === status
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Rooms' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {HOSTEL_BLOCKS.map(blockName => {
              const bStat = occupancyStats.blockBreakdown[blockName];
              let blockRooms = rooms.filter(r => normalizeBlockName(r.block) === blockName);

              blockRooms = blockRooms.filter(rm => {
                const occupants = approvedStudents.filter(s => 
                  normalizeBlockName(s.block) === blockName && 
                  String(s.room_no || s.roomNo || '').trim() === String(rm.room_no).trim()
                );
                const capacity = parseInt(rm.seater, 10) || 1;
                const count = occupants.length;

                if (roomFilterStatus === 'VACANT' && count > 0) return false;
                if (roomFilterStatus === 'PARTIAL' && (count === 0 || count >= capacity)) return false;
                if (roomFilterStatus === 'FULL' && count < capacity) return false;

                if (roomSearchQuery.trim()) {
                  const q = roomSearchQuery.toLowerCase();
                  const matchesRoom = rm.room_no.toLowerCase().includes(q);
                  const matchesOccupant = occupants.some(occ => occ.name.toLowerCase().includes(q));
                  if (!matchesRoom && !matchesOccupant) return false;
                }

                return true;
              });

              blockRooms.sort((a, b) => {
                if (roomSortOption === 'OCCUPANCY') {
                  const occA = approvedStudents.filter(s => normalizeBlockName(s.block) === blockName && String(s.room_no || s.roomNo || '').trim() === String(a.room_no).trim()).length;
                  const occB = approvedStudents.filter(s => normalizeBlockName(s.block) === blockName && String(s.room_no || s.roomNo || '').trim() === String(b.room_no).trim()).length;
                  return occB - occA;
                }
                return a.room_no.localeCompare(b.room_no, undefined, { numeric: true });
              });

              const isSearching = roomSearchQuery.trim().length > 0;
              if (isSearching && blockRooms.length === 0) return null;

              const isCollapsed = isSearching ? false : collapsedBlocks[blockName];

              return (
                <div key={blockName} className={`p-4 sm:p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div 
                    onClick={() => toggleBlockCollapse(blockName)}
                    className="flex justify-between items-center pb-2 cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:opacity-90 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-base">{blockName}</h3>
                      {bStat.fullyVacant > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[10px]">
                          {bStat.fullyVacant} Vacant Rooms
                        </span>
                      )}
                      {isSearching && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold text-[10px]">
                          {blockRooms.length} Matched
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                        {bStat.occupied}/{bStat.totalCapacity} Beds ({Math.round((bStat.occupied / (bStat.totalCapacity || 1)) * 100)}%)
                      </span>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${bStat.totalCapacity ? (bStat.occupied / bStat.totalCapacity) * 100 : 0}%` }}
                        />
                      </div>

                      {blockRooms.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                          {blockRooms.map(rm => {
                            const occupants = approvedStudents.filter(s => 
                              normalizeBlockName(s.block) === blockName && 
                              String(s.room_no || s.roomNo || '').trim() === String(rm.room_no).trim()
                            );
                            const capacity = parseInt(rm.seater, 10) || 1;
                            const isFull = occupants.length >= capacity;
                            const isEmpty = occupants.length === 0;
                            const fillPercent = Math.min(100, (occupants.length / capacity) * 100);

                            return (
                              <div
                                key={rm.id}
                                onClick={() => setSelectedRoom({ ...rm, occupants })}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:border-indigo-500 hover:shadow-md flex flex-col justify-between ${
                                  isFull 
                                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                                    : isEmpty 
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                                }`}
                              >
                                <div>
                                  {/* PROMINENT ROOM NUMBER BADGE & CAPACITY */}
                                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-black/5 dark:border-white/5">
                                    <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs tracking-tight">
                                      Room {rm.room_no}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] border border-slate-300/50 dark:border-slate-700/50">
                                      {rm.seater} Seater
                                    </span>
                                  </div>

                                  {/* ALL OCCUPANTS LISTED INDIVIDUALLY & TAPPABLE */}
                                  <div className="my-2.5 space-y-1.5 min-h-[48px]">
                                    {occupants.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {occupants.map(std => (
                                          <button
                                            key={std.id}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedStudent(std);
                                              setProfileModalTab('details');
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 border border-slate-200/80 dark:border-slate-800 transition-colors flex items-center justify-between group shadow-2xs"
                                          >
                                            <div className="truncate pr-1">
                                              <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                                {std.name}
                                              </p>
                                              <p className="text-[9px] text-slate-400 font-medium">
                                                {std.course} • Batch {std.batch}
                                              </p>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-3 text-center bg-emerald-100/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                                        <p className="font-bold text-xs text-emerald-700 dark:text-emerald-400">Vacant Room</p>
                                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">Available for allotment</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* CARD FOOTER WITH PROGRESS BAR */}
                                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
                                  <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-rose-500' : isEmpty ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                      style={{ width: `${fillPercent}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className={isFull ? 'text-rose-600 dark:text-rose-400' : isEmpty ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                      {occupants.length}/{capacity} Beds Occupied
                                    </span>
                                    <span className="text-[10px] text-indigo-500 hover:underline flex items-center space-x-0.5 font-bold">
                                      <span>Inspect</span>
                                      <Eye className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 italic">
                          No matching rooms in {blockName}.
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: MASTER DIRECTORY */}
        {activeTab === 'directory' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Master Resident Directory</h2>
                <p className="text-xs text-slate-500">{filteredStudents.length} residents matching filters.</p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="md:hidden flex-1 min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700"
                >
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => {
                      setEditingStudent({ 
                        name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Block', room_no: '', 
                        phone: '', father_name: '', address: '', joining_date: new Date().toISOString().split('T')[0], fee_status: 'Pending' 
                      });
                      setIsEditStudentModalOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Resident</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Filter Bar */}
            <div className={`hidden md:block p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3 text-xs`}>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-400 block mb-1">Search Resident</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Name, room, phone..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Block</label>
                  <select
                    value={filterBlock}
                    onChange={e => setFilterBlock(e.target.value)}
                    className={`w-full p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="ALL">All Blocks</option>
                    {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Batch</label>
                  <select
                    value={filterBatch}
                    onChange={e => setFilterBatch(e.target.value)}
                    className={`w-full p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="ALL">All Batches</option>
                    {['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Course</label>
                  <select
                    value={filterCourse}
                    onChange={e => setFilterCourse(e.target.value)}
                    className={`w-full p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="ALL">All Courses</option>
                    <option value="MBBS">MBBS</option>
                    <option value="BDS">BDS</option>
                    <option value="MD/MS">MD/MS</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1">Fee Status</label>
                  <select
                    value={filterFeeStatus}
                    onChange={e => setFilterFeeStatus(e.target.value)}
                    className={`w-full p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(std => (
                  <div
                    key={std.id}
                    onClick={() => { setSelectedStudent(std); setProfileModalTab('details'); }}
                    className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-2.5 active:scale-[0.99] transition`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase">
                          {(std.name || 'A').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">{std.name}</h3>
                          <p className="text-[11px] text-slate-400 font-medium">{std.course} • Batch {std.batch}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          std.fee_status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {std.fee_status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">
                        Room {std.room_no || std.roomNo || 'Unassigned'} • <span className="font-normal text-slate-500">{normalizeBlockName(std.block)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {std.phone ? (
                          <a
                            href={`tel:${std.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-mono font-medium text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-indigo-500" />
                            <span>{std.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Phone</span>
                        )}

                        {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteResident(std);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Delete Resident"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No resident records found.</p>
                </div>
              )}
            </div>

            {/* Desktop Data Table */}
            <div className={`hidden md:block rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} overflow-x-auto shadow-sm`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} font-bold uppercase tracking-wider`}>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Course / Batch</th>
                    <th className="p-3">Block & Room</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Father's Name</th>
                    <th className="p-3">Allotment Date</th>
                    <th className="p-3">Fee Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(std => (
                      <tr 
                        key={std.id} 
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-900/50 cursor-pointer transition"
                        onClick={() => { setSelectedStudent(std); setProfileModalTab('details'); }}
                      >
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{std.name}</td>
                        <td className="p-3 font-mono">
                          {std.course} • Batch {std.batch}
                          <span className="block text-[10px] font-sans text-slate-400">Roll: {std.roll_no || 'N/A'}</span>
                        </td>
                        <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                          Room {std.room_no || std.roomNo || 'Unassigned'}
                          <span className="block text-[10px] text-slate-400 font-normal">{normalizeBlockName(std.block)}</span>
                        </td>
                        <td className="p-3 font-mono">{std.phone || 'N/A'}</td>
                        <td className="p-3">{std.father_name || 'N/A'}</td>
                        <td className="p-3">{std.joining_date || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            std.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}>
                            {std.fee_status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setSelectedStudent(std); setProfileModalTab('details'); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          </button>
                          {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                            <button onClick={() => { setEditingStudent(std); setIsEditStudentModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </button>
                          )}
                          {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                            <button onClick={() => handleDeleteResident(std)} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded text-rose-600 dark:text-rose-400" title="Delete Resident">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400 italic">No resident records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: NOTICE BOARD */}
        {activeTab === 'notices' && (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Hostel Notice Board</h2>
                <p className="text-xs text-slate-500">Official circulars, fee deadlines, and announcements.</p>
              </div>

              {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                <button
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow flex items-center space-x-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Notice</span>
                </button>
              )}
            </div>

            {notices.length > 0 ? (
              <div className="space-y-3">
                {notices.map(not => (
                  <div key={not.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          not.priority === 'Urgent' || not.priority === 'Fee Notice'
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950'
                            : 'text-amber-600 bg-amber-50 dark:bg-amber-950'
                        }`}>
                          {not.priority}
                        </span>
                        <h3 className="font-bold text-base mt-1.5">{not.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{not.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{not.body}</p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Posted by: <strong>{not.posted_by}</strong></span>

                      {not.file_url && (
                        <a
                          href={not.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg flex items-center space-x-1 hover:underline text-[11px]"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{not.file_name || 'View Attachment'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl space-y-3">
                <Bell className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-medium">No notices published yet.</p>
                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => setIsNoticeModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    Publish First Notice
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: COMPLAINTS DESK */}
        {activeTab === 'tickets' && (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Complaints & Queries Desk</h2>
                <p className="text-xs text-slate-500">Public query board with official responses.</p>
              </div>

              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow flex items-center space-x-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Lodge Complaint</span>
              </button>
            </div>

            {complaints.length > 0 ? (
              <div className="space-y-4">
                {complaints.map(tkt => (
                  <div key={tkt.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                            {tkt.category}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{normalizeBlockName(tkt.block)}, Room {tkt.roomNo}</span>
                        </div>
                        <h3 className="font-bold text-base mt-1">{tkt.title}</h3>
                        <p className="text-[10px] text-slate-400">Filed by {tkt.studentName} on {tkt.created_at || 'Recent'}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          tkt.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : tkt.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {tkt.status}
                        </span>

                        {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                          <select
                            value={tkt.status}
                            onChange={e => handleUpdateTicketStatus(tkt.id, e.target.value)}
                            className="text-xs p-1 rounded border bg-slate-900 text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">{tkt.description}</p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-[11px] uppercase text-slate-400">Responses ({tkt.comments?.length || 0})</h4>

                      {tkt.comments?.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-slate-900 text-xs space-y-0.5 border border-indigo-100 dark:border-slate-800">
                          <div className="flex justify-between font-bold text-[11px]">
                            <span className="text-indigo-600 dark:text-indigo-400">{c.author}</span>
                            <span className="text-slate-400 text-[10px]">{c.date}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.text}</p>
                        </div>
                      ))}

                      {(sessionUser.role === 'admin' || sessionUser.role === 'authorized' || sessionUser.id === tkt.studentId) && (
                        <div className="flex space-x-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={ticketCommentText[tkt.id] || ''}
                            onChange={e => setTicketCommentText({ ...ticketCommentText, [tkt.id]: e.target.value })}
                            className={`flex-1 p-2 text-xs rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                          />
                          <button
                            onClick={() => handleAddTicketComment(tkt.id)}
                            className="px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-medium">No complaints or queries filed.</p>
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                >
                  Lodge Complaint
                </button>
              </div>
            )}
          </div>
        )}

        {/* HOSTEL MAP VIEW */}
        {activeTab === 'map' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Hostel Floor Plan & Layout Map</h2>
                <p className="text-xs text-slate-500">Interactive visual layout reference for hostel blocks and room positions.</p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {hostelMapUrl && (
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setMapZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono px-1 font-bold">{Math.round(mapZoomLevel * 100)}%</span>
                    <button
                      onClick={() => setMapZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMapZoomLevel(1)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => setIsMapModalOpen(true)}
                    className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{hostelMapUrl ? 'Change Map' : 'Upload Map'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm min-h-[450px] flex items-center justify-center overflow-auto relative`}>
              {hostelMapUrl ? (
                <div className="w-full text-center overflow-auto py-2">
                  <img 
                    src={hostelMapUrl} 
                    alt="Hostel Layout Map" 
                    style={{ transform: `scale(${mapZoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}
                    className="w-full h-auto max-h-[75vh] object-contain rounded-xl mx-auto shadow-md" 
                  />
                </div>
              ) : (
                <div className="text-center space-y-3 p-8 max-w-sm">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <MapIcon className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-base">No Hostel Map Uploaded</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {(sessionUser.role === 'admin' || sessionUser.role === 'authorized')
                      ? 'Upload a floor plan image or image URL to give residents a clear visual map of the hostel blocks.' 
                      : 'The hostel authority has not uploaded a floor layout plan yet.'}
                  </p>
                  {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                    <button
                      onClick={() => setIsMapModalOpen(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      Upload Layout Image
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPROVAL DESK */}
        {activeTab === 'approval' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Pending Registrations</h2>
                <p className="text-xs text-slate-500">Approve new residents or link logged-in accounts to pre-existing resident records.</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingStudents.length > 0 ? (
                pendingStudents.map(user => (
                  <div key={user.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm`}>
                    <div>
                      <p className="font-bold text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setLinkingPendingUser(user);
                          setLinkSearchQuery('');
                          setSelectedResidentToLink(null);
                          setIsLinkModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-900 transition flex items-center justify-center space-x-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Link to Existing Resident</span>
                      </button>
                      <button
                        onClick={() => setStudents(prev => prev.map(s => s.id === user.id ? { ...s, status: 'approved', role: 'resident' } : s))}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                      >
                        Approve as New Resident
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-8 text-center border border-dashed rounded-2xl">No pending registration requests.</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}

      {/* LINK TO EXISTING RESIDENT MODAL */}
      {isLinkModalOpen && linkingPendingUser && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl my-8`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  <span>Link to Existing Resident</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Linking account <strong className="text-indigo-500">{linkingPendingUser.email}</strong>
                </p>
              </div>
              <button onClick={() => { setIsLinkModalOpen(false); setLinkingPendingUser(null); setSelectedResidentToLink(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedResidentToLink ? (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Name, Room, Block, Batch..."
                    value={linkSearchQuery}
                    onChange={e => setLinkSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                  {approvedStudents
                    .filter(std => {
                      if (!linkSearchQuery.trim()) return true;
                      const q = linkSearchQuery.toLowerCase();
                      return (
                        std.name.toLowerCase().includes(q) ||
                        (std.room_no || '').toLowerCase().includes(q) ||
                        normalizeBlockName(std.block).toLowerCase().includes(q) ||
                        (std.batch || '').toLowerCase().includes(q) ||
                        (std.course || '').toLowerCase().includes(q)
                      );
                    })
                    .map(std => (
                      <div key={std.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} flex justify-between items-center hover:border-indigo-500 transition`}>
                        <div>
                          <p className="font-bold text-sm">{std.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {normalizeBlockName(std.block)} • Rm {std.room_no || 'Unassigned'} • Batch {std.batch} ({std.course})
                          </p>
                          {std.email && !std.email.endsWith('@hostel.edu') && (
                            <p className="text-[10px] text-amber-500 font-medium mt-0.5">Linked: {std.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedResidentToLink(std)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                        >
                          Link Profile
                        </button>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                  <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Confirm Account Linking</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to link <strong className="text-indigo-500">{linkingPendingUser.email}</strong> to this resident?
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-extrabold text-sm">{selectedResidentToLink.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Block: {normalizeBlockName(selectedResidentToLink.block)} | Room: {selectedResidentToLink.room_no || 'Unassigned'} | Batch: {selectedResidentToLink.batch} ({selectedResidentToLink.course})
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedResidentToLink(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleConfirmLink(linkingPendingUser, selectedResidentToLink)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition"
                  >
                    Confirm & Link Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN TOOLS & DATA MODAL */}
      {isAdminToolsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span>Admin Settings & Data</span>
                </h3>
                {lastSynced && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Last synced from repo: {lastSynced}</p>
                )}
              </div>
              <button onClick={() => setIsAdminToolsOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-600 dark:text-slate-300">Custom App Logo</span>
                  {config.appLogo && (
                    <button 
                      onClick={() => setConfig(prev => ({ ...prev, appLogo: '' }))}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center p-1 shadow">
                    <AppLogoIcon className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs border border-indigo-200 dark:border-indigo-900 transition"
                  >
                    Upload New Logo
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  loadJSONFromRepo(true);
                  setIsAdminToolsOpen(false);
                }}
                disabled={isFetchingJson}
                className="w-full min-h-[44px] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingJson ? 'animate-spin' : ''}`} />
                <span>{isFetchingJson ? 'Fetching JSON...' : 'Sync Repo JSON'}</span>
              </button>

              <button
                onClick={() => {
                  handleExportJSON();
                  setIsAdminToolsOpen(false);
                }}
                className="w-full min-h-[44px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Register File</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsAdminToolsOpen(false);
                }}
                className="w-full min-h-[44px] py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
              >
                <FileJson className="w-4 h-4" />
                <span>Upload Local JSON</span>
              </button>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full min-h-[44px] py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MASTER DIRECTORY FILTERS MODAL */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className={`w-full rounded-t-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border-t p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span>Filter Residents</span>
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Search Resident</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Name, room, phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">Block</label>
                <select
                  value={filterBlock}
                  onChange={e => setFilterBlock(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="ALL">All Blocks</option>
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">Batch</label>
                <select
                  value={filterBatch}
                  onChange={e => setFilterBatch(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="ALL">All Batches</option>
                  {['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">Course</label>
                <select
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="ALL">All Courses</option>
                  <option value="MBBS">MBBS</option>
                  <option value="BDS">BDS</option>
                  <option value="MD/MS">MD/MS</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">Fee Status</label>
                <select
                  value={filterFeeStatus}
                  onChange={e => setFilterFeeStatus(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2">
              <button
                onClick={() => {
                  setFilterBlock('ALL');
                  setFilterBatch('ALL');
                  setFilterCourse('ALL');
                  setFilterFeeStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP UPLOAD MODAL */}
      {isMapModalOpen && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Upload Hostel Layout Map</h3>
              <button onClick={() => setIsMapModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Option 1: Upload Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMapFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div className="flex items-center">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                <span className="px-2 text-[10px] text-slate-400 font-bold uppercase">OR</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleSaveMapUrl} className="space-y-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-500">Option 2: Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/hostel-map.jpg"
                    value={mapInputUrl}
                    onChange={e => setMapInputUrl(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
                <button type="submit" className="w-full min-h-[44px] py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow">
                  Save Image URL
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROOM CONFIGURATION MODAL */}
      {isAddRoomModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddRoom} className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Configure New Room</h3>
              <button type="button" onClick={() => setIsAddRoomModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Hostel Block</label>
                <select
                  value={newRoomData.block}
                  onChange={e => setNewRoomData({ ...newRoomData, block: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or 23A"
                  value={newRoomData.room_no}
                  onChange={e => setNewRoomData({ ...newRoomData, room_no: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Seater Capacity</label>
                <select
                  value={newRoomData.seater}
                  onChange={e => setNewRoomData({ ...newRoomData, seater: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="1">1-Seater (Single Room)</option>
                  <option value="2">2-Seater (Double Room)</option>
                  <option value="3">3-Seater (Triple Room)</option>
                  <option value="4">4-Seater (Quad Room)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="min-h-[44px] px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Save Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESIDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
                  {(selectedStudent.name || 'A').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStudent.course} • Batch {selectedStudent.batch} • Roll: {selectedStudent.roll_no || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedStudent(null); setEditingFeeEntry(null); }}><X className="w-5 h-5" /></button>
            </div>

            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs overflow-x-auto">
              <button 
                onClick={() => setProfileModalTab('details')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${profileModalTab === 'details' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Resident Details
              </button>
              <button 
                onClick={() => setProfileModalTab('fee')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${profileModalTab === 'fee' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Year-Wise Fee Ledger
              </button>
              <button 
                onClick={() => setProfileModalTab('history')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${profileModalTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Room Movement History
              </button>
            </div>

            {profileModalTab === 'details' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Block & Room Number</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{normalizeBlockName(selectedStudent.block)}, Room {selectedStudent.room_no || 'Unassigned'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Room Allotment Date</span>
                  <span className="font-bold">{selectedStudent.joining_date || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Phone Number</span>
                  <span className="font-bold font-mono">{selectedStudent.phone || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Father's Name</span>
                  <span className="font-bold">{selectedStudent.father_name || 'N/A'}</span>
                </div>
                <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Permanent Address</span>
                  <span className="font-bold">{selectedStudent.address || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* FEE LEDGER */}
            {profileModalTab === 'fee' && (
              <div className="space-y-4 text-xs">
                
                {/* Summary Card */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Required</span>
                    <p className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 mt-0.5">₹{feeSummary.totalDue.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Paid</span>
                    <p className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 mt-0.5">₹{feeSummary.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase">Outstanding Balance</span>
                    <p className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400 mt-0.5">₹{feeSummary.balance.toLocaleString()}</p>
                  </div>
                </div>

                {/* Admin Add Fee Entry Button */}
                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && editingFeeEntry === null && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setEditingFeeEntry('new');
                        setFeeFormData({
                          year: '2026-27',
                          amount: 45000,
                          paid: 0,
                          status: 'Pending',
                          date: new Date().toISOString().split('T')[0],
                          notes: ''
                        });
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Fee Entry</span>
                    </button>
                  </div>
                )}

                {/* Add / Edit Fee Entry Form */}
                {editingFeeEntry !== null && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <form onSubmit={handleSaveFeeEntry} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 space-y-3">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                        {editingFeeEntry === 'new' ? 'New Fee Entry' : 'Edit Fee Entry'}
                      </h4>
                      <button type="button" onClick={() => setEditingFeeEntry(null)} className="text-slate-400 hover:text-slate-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Academic Year</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2026-27"
                          value={feeFormData.year}
                          onChange={e => setFeeFormData({ ...feeFormData, year: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Amount Due (₹)</label>
                        <input
                          type="number"
                          required
                          value={feeFormData.amount}
                          onChange={e => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Amount Paid (₹)</label>
                        <input
                          type="number"
                          required
                          value={feeFormData.paid}
                          onChange={e => setFeeFormData({ ...feeFormData, paid: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Payment Status</label>
                        <select
                          value={feeFormData.status}
                          onChange={e => setFeeFormData({ ...feeFormData, status: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Partial">Partial</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Payment Date</label>
                        <input
                          type="date"
                          value={feeFormData.date}
                          onChange={e => setFeeFormData({ ...feeFormData, date: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[10px] text-slate-400 block mb-1">Notes / Remarks</label>
                        <input
                          type="text"
                          placeholder="Optional notes..."
                          value={feeFormData.notes}
                          onChange={e => setFeeFormData({ ...feeFormData, notes: e.target.value })}
                          className={`w-full p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingFeeEntry(null)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 font-bold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Entry</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Ledger Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 font-bold uppercase text-slate-500 text-[10px]">
                      <tr>
                        <th className="p-2.5">Session</th>
                        <th className="p-2.5">Room</th>
                        <th className="p-2.5">Amount Paid</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Notes</th>
                        {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                          <th className="p-2.5 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedStudent.fee_ledger && selectedStudent.fee_ledger.length > 0 ? (
                        selectedStudent.fee_ledger.map((leg, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2.5 font-bold">{leg.year}</td>
                            <td className="p-2.5 text-indigo-600 dark:text-indigo-400">{normalizeBlockName(leg.block)}, Rm {leg.room_no}</td>
                            <td className="p-2.5 font-bold">₹{leg.paid?.toLocaleString()} / ₹{leg.amount?.toLocaleString()}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leg.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'}`}>
                                {leg.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400 text-[11px] truncate max-w-[120px]">{leg.notes || leg.remarks || '-'}</td>
                            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                              <td className="p-2.5 text-right space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingFeeEntry(idx);
                                    setFeeFormData({
                                      year: leg.year || '2026-27',
                                      amount: leg.amount || 45000,
                                      paid: leg.paid || 0,
                                      status: leg.status || 'Pending',
                                      date: leg.date || new Date().toISOString().split('T')[0],
                                      notes: leg.notes || leg.remarks || ''
                                    });
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                                  title="Edit Fee Entry"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFeeEntry(idx)}
                                  className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded"
                                  title="Delete Fee Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-400 italic">No fee ledger recorded yet. Click "Add Fee Entry" above to record payments.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {profileModalTab === 'history' && (
              <div className="space-y-2 text-xs">
                {selectedStudent.history && selectedStudent.history.length > 0 ? (
                  selectedStudent.history.map((h, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold">Shifted from {normalizeBlockName(h.oldBlock)} (Rm {h.oldRoom}) → {normalizeBlockName(h.newBlock)} (Rm {h.newRoom})</p>
                        <p className="text-[10px] text-slate-400">{h.reason}</p>
                      </div>
                      <span className="font-mono text-indigo-500 font-bold text-[11px]">{h.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-slate-400 italic">No movement history recorded yet.</p>
                )}
              </div>
            )}

            {/* ACTION BAR IN PROFILE MODAL */}
            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
                <button
                  onClick={() => handleDeleteResident(selectedStudent)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Resident</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setTransferData({ 
                        studentId: selectedStudent.id, 
                        targetBlock: 'Office Block', 
                        targetRoom: '', 
                        transferDate: new Date().toISOString().split('T')[0],
                        academicYear: '2026-27',
                        reason: 'Annual Room Shift' 
                      });
                      setIsTransferModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs hover:bg-indigo-100 transition"
                  >
                    Direct Room Shift
                  </button>
                  <button
                    onClick={() => {
                      setEditingStudent(selectedStudent);
                      setIsEditStudentModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ROOM INSPECTOR MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base">{normalizeBlockName(selectedRoom.block)} - Room {selectedRoom.room_no}</h3>
                <p className="text-xs text-slate-400">{selectedRoom.seater}-Seater Configuration</p>
              </div>
              <button onClick={() => setSelectedRoom(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-400 uppercase">Current Occupants ({selectedRoom.occupants.length})</h4>
              {selectedRoom.occupants.length > 0 ? (
                selectedRoom.occupants.map(std => (
                  <div key={std.id} className="p-3 rounded-xl bg-indigo-50/50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold">{std.name}</p>
                      <p className="text-[10px] text-slate-400">{std.course} • Batch {std.batch}</p>
                    </div>
                    <button onClick={() => { setSelectedStudent(std); setSelectedRoom(null); }} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                      <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl">Room is currently vacant.</p>
              )}
            </div>

            {sessionUser.role === 'admin' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteRoom(selectedRoom.id)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Room</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECT ROOM SHIFT MODAL */}
      {isTransferModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Shift Resident Room</h3>
              <button type="button" onClick={() => setIsTransferModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Target Block</label>
                <select
                  value={transferData.targetBlock}
                  onChange={e => setTransferData({ ...transferData, targetBlock: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Target Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 53"
                  value={transferData.targetRoom}
                  onChange={e => setTransferData({ ...transferData, targetRoom: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Transfer Date</label>
                <input
                  type="date"
                  required
                  value={transferData.transferDate}
                  onChange={e => setTransferData({ ...transferData, transferDate: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Academic Year Session</label>
                <input
                  type="text"
                  required
                  value={transferData.academicYear}
                  onChange={e => setTransferData({ ...transferData, academicYear: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Shifted for 2nd Year"
                  value={transferData.reason}
                  onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="min-h-[44px] px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Confirm Room Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateNotice} className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Publish Notice</h3>
              <button type="button" onClick={() => setIsNoticeModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Notice title..."
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Priority</label>
                <select
                  value={newNotice.priority}
                  onChange={e => setNewNotice({ ...newNotice, priority: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="General">General</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Fee Notice">Fee Notice</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter notice text..."
                  value={newNotice.body}
                  onChange={e => setNewNotice({ ...newNotice, body: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">File / Document URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={newNotice.file_url}
                  onChange={e => setNewNotice({ ...newNotice, file_url: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="min-h-[44px] px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Post Notice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LODGE COMPLAINT MODAL */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const ticket = {
              id: 'tkt_' + Date.now(),
              studentId: sessionUser.id,
              studentName: sessionUser.name,
              roomNo: sessionUser.room_no || 'N/A',
              block: normalizeBlockName(sessionUser.block || 'Office Block'),
              category: newTicket.category,
              title: newTicket.title,
              description: newTicket.description,
              status: 'Pending',
              comments: [],
              created_at: new Date().toISOString().split('T')[0]
            };
            setComplaints(prev => [ticket, ...prev]);
            setIsTicketModalOpen(false);
          }} className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Lodge Complaint / Query</h3>
              <button type="button" onClick={() => setIsTicketModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Category</label>
                <select
                  value={newTicket.category}
                  onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Internet / Wi-Fi">Internet / Wi-Fi</option>
                  <option value="General Query">General Query</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Subject / Title</label>
                <input
                  type="text"
                  required
                  placeholder="Brief title..."
                  value={newTicket.title}
                  onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain issue..."
                  value={newTicket.description}
                  onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="min-h-[44px] px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT STUDENT FORM MODAL */}
      {isEditStudentModalOpen && editingStudent && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveStudent} className={`w-full max-w-lg rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl my-8`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">{editingStudent.id ? 'Edit Resident Record' : 'Register New Resident'}</h3>
              <button type="button" onClick={() => setIsEditStudentModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-bold block mb-1 text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={editingStudent.phone || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Father's Name</label>
                <input
                  type="text"
                  placeholder="Father's Name"
                  value={editingStudent.father_name || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, father_name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold block mb-1 text-slate-500">Permanent Address</label>
                <input
                  type="text"
                  placeholder="Address"
                  value={editingStudent.address || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Roll Number</label>
                <input
                  type="text"
                  placeholder="Roll No"
                  value={editingStudent.roll_no || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, roll_no: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Course & Batch</label>
                <div className="flex space-x-2">
                  <select
                    value={editingStudent.course || 'MBBS'}
                    onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                    className={`w-1/2 p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="MBBS">MBBS</option>
                    <option value="BDS">BDS</option>
                    <option value="MD/MS">MD/MS</option>
                  </select>
                  <input
                    type="text"
                    value={editingStudent.batch || '2023'}
                    onChange={e => setEditingStudent({ ...editingStudent, batch: e.target.value })}
                    className={`w-1/2 p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Block</label>
                <select
                  value={normalizeBlockName(editingStudent.block)}
                  onChange={e => setEditingStudent({ ...editingStudent, block: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101 or Unassigned"
                  value={editingStudent.room_no || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, room_no: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Joining Date</label>
                <input
                  type="date"
                  value={editingStudent.joining_date || new Date().toISOString().split('T')[0]}
                  onChange={e => setEditingStudent({ ...editingStudent, joining_date: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Fee Status</label>
                <select
                  value={editingStudent.fee_status || 'Pending'}
                  onChange={e => setEditingStudent({ ...editingStudent, fee_status: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button type="submit" className="min-h-[44px] px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
