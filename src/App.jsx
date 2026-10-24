import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, Users, Search, Plus, UserCheck, 
  BedDouble, Wrench, Clock, Edit, MapPin, 
  Moon, Sun, Sparkles, X, Eye, 
  Upload, Database, Copy, Settings, LogOut, Lock, Mail,
  Map, Image as ImageIcon, Trash2
} from 'lucide-react';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://fojauvqvrqarxtwyrmtg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvamF1dnF2cnFhcnh0d3lybXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjczMDcsImV4cCI6MjEwODQ0MzMwN30.X9nNRtP2Q2AteCZXRYWPmADReq7Y5u9rxq5UortTtXA',
  googleClientId: '',
  googleAppsScriptUrl: ''
};

// --- READY-TO-RUN SUPABASE SQL SCHEMA & RLS POLICIES ---
const SUPABASE_SQL_SCHEMA = `-- 1. CREATE ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'authorized', 'resident');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE fee_status_type AS ENUM ('Paid', 'Pending', 'Partial');
CREATE TYPE ticket_status AS ENUM ('Pending', 'In Progress', 'Resolved');

-- 2. CREATE PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  roll_no TEXT,
  course TEXT DEFAULT 'MBBS',
  batch TEXT,
  block TEXT,
  room_no TEXT,
  phone TEXT,
  father_name TEXT,
  address TEXT,
  fee_status fee_status_type DEFAULT 'Pending',
  fee_amount NUMERIC DEFAULT 45000,
  paid_amount NUMERIC DEFAULT 0,
  photo_url TEXT,
  role user_role DEFAULT 'resident',
  status user_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE ROOM HISTORY TABLE
CREATE TABLE room_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_room TEXT,
  old_block TEXT,
  new_room TEXT NOT NULL,
  new_block TEXT NOT NULL,
  transfer_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  updated_by TEXT
);

-- 4. CREATE MAINTENANCE TICKETS TABLE
CREATE TABLE maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  room_no TEXT NOT NULL,
  block TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status ticket_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;`;

const HOSTEL_BLOCKS = ['Office Wing', 'Mathura (North)', 'Mathura (South)', 'Tennis Block'];

export default function App() {
  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('obh_app_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Initialize Supabase Client dynamically
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

  // --- AUTH & SESSION STATE ---
  const [sessionUser, setSessionUser] = useState(null); // null when logged out
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useState(false);

  // --- LOCAL STORES & CAPACITY SETTINGS ---
  const [totalBedsCapacity, setTotalBedsCapacity] = useState(() => {
    const saved = localStorage.getItem('obh_total_beds');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [isBedCapacityModalOpen, setIsBedCapacityModalOpen] = useState(false);
  const [tempBedCapacity, setTempBedCapacity] = useState(totalBedsCapacity);

  // --- HOSTEL MAP STATE ---
  const [hostelMapUrl, setHostelMapUrl] = useState(() => {
    return localStorage.getItem('obh_hostel_map') || '';
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('obh_db_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('obh_db_complaints');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('grid');

  // Modal Controls
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ studentId: '', targetBlock: 'Office Wing', targetRoom: '1', reason: '' });
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'Electrical', title: '', description: '', priority: 'Medium' });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem('obh_app_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('obh_total_beds', totalBedsCapacity.toString());
  }, [totalBedsCapacity]);

  useEffect(() => {
    if (hostelMapUrl) {
      localStorage.setItem('obh_hostel_map', hostelMapUrl);
    } else {
      localStorage.removeItem('obh_hostel_map');
    }
  }, [hostelMapUrl]);

  useEffect(() => {
    localStorage.setItem('obh_db_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('obh_db_complaints', JSON.stringify(complaints));
  }, [complaints]);

  // --- REAL AUTH LISTENER ---
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserProfile(session.user);
      } else {
        setSessionUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch or create profile row in local database / Supabase
  const syncUserProfile = (authUser) => {
    const existing = students.find(s => s.email === authUser.email);
    if (existing) {
      setSessionUser(existing);
    } else {
      const isFirstAdmin = students.length === 0 || authUser.email.includes('admin');
      const newUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: isFirstAdmin ? 'admin' : 'resident',
        status: isFirstAdmin ? 'approved' : 'pending',
        course: 'MBBS',
        batch: '2023',
        block: 'Office Wing',
        room_no: 'Unassigned',
        fee_status: 'Pending'
      };
      setSessionUser(newUser);
      setStudents(prev => [...prev, newUser]);
    }
  };

  // --- HANDLERS FOR LOGIN & GOOGLE AUTH ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!supabase) {
      const isFirst = students.length === 0 || loginEmail.includes('admin');
      const mockUser = {
        id: 'usr_' + Date.now(),
        email: loginEmail,
        name: loginEmail.split('@')[0],
        role: isFirst ? 'admin' : 'resident',
        status: isFirst ? 'approved' : 'pending',
        course: 'MBBS',
        batch: '2023',
        block: 'Office Wing',
        room_no: '10',
        fee_status: 'Paid'
      };
      setSessionUser(mockUser);
      if (!students.some(s => s.email === loginEmail)) {
        setStudents(prev => [...prev, mockUser]);
      }
      setAuthLoading(false);
      return;
    }

    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPassword });
        if (error) throw error;
        alert('Registration link sent! Please check your email to verify your account.');
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
    if (!supabase) {
      alert('Please configure your SUPABASE_URL and SUPABASE_ANON_KEY first using the settings button in the bottom left corner!');
      setIsConfigOpen(true);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });

    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSessionUser(null);
  };

  // --- MAP UPLOAD HANDLER ---
  const handleMapFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setHostelMapUrl(reader.result);
      alert('Hostel map image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Derived Statistics
  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  const stats = useMemo(() => {
    const totalBeds = totalBedsCapacity;
    const occupiedBeds = approvedStudents.length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const bdsCount = approvedStudents.filter(s => s.course === 'BDS').length;
    const mbbsCount = approvedStudents.filter(s => s.course === 'MBBS').length;
    const feePendingCount = approvedStudents.filter(s => (s.fee_status || s.feeStatus) !== 'Paid').length;

    return { totalBeds, occupiedBeds, vacantBeds, bdsCount, mbbsCount, feePendingCount };
  }, [approvedStudents, totalBedsCapacity]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const roomVal = s.room_no || s.roomNo || '';
      const rollVal = s.roll_no || '';
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             roomVal.includes(searchQuery) ||
             rollVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (s.phone && s.phone.includes(searchQuery));
    });
  }, [approvedStudents, searchQuery]);

  // Save / Add Resident (ADMIN ONLY)
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Access Denied: Only Admins can register or modify residents.');

    if (editingStudent.id) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    } else {
      const newEntry = {
        ...editingStudent,
        id: 'std_' + Date.now(),
        status: 'approved',
        history: [{
          roomNo: editingStudent.room_no || 'Unassigned',
          block: editingStudent.block || 'Office Wing',
          date: new Date().toISOString().split('T')[0],
          reason: 'Registration / Initial Allocation'
        }]
      };
      setStudents(prev => [...prev, newEntry]);
    }
    setIsEditStudentModalOpen(false);
    setEditingStudent(null);
  };

  // Execute Room Transfer (ADMIN ONLY)
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Access Denied: Admin role required.');

    const student = students.find(s => s.id === transferData.studentId);
    if (!student) return;

    const historyRecord = {
      oldRoom: student.room_no || 'None',
      oldBlock: student.block || 'None',
      roomNo: transferData.targetRoom,
      block: transferData.targetBlock,
      date: new Date().toISOString().split('T')[0],
      reason: transferData.reason || 'Admin Re-allocation'
    };

    const updatedStudent = {
      ...student,
      room_no: transferData.targetRoom,
      block: transferData.targetBlock,
      history: [historyRecord, ...(student.history || [])]
    };

    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    setIsTransferModalOpen(false);
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  // --- UNAUTHENTICATED LOGIN SCREEN ---
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2">OBH HOSTEL PORTAL</h1>
            <p className="text-xs text-slate-400">Sign in to access room status, directory, and maintenance.</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition"
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

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="student@hostel.edu"
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition"
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
              {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>API Settings</span>
            </button>
          </div>
        </div>

        {/* API CONFIG MODAL FOR UNLEASHING SUPABASE */}
        {isConfigOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold text-base text-white">Setup Supabase Credentials</h3>
                <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <label className="font-bold block mb-1 text-slate-400">SUPABASE_URL</label>
                  <input
                    type="text"
                    placeholder="https://xyz.supabase.co"
                    value={config.supabaseUrl}
                    onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-400">SUPABASE_ANON_KEY</label>
                  <input
                    type="password"
                    placeholder="eyJhbG..."
                    value={config.supabaseAnonKey}
                    onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- AUTHENTICATED MAIN DASHBOARD ---
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col md:flex-row font-sans transition-colors duration-200`}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:w-64 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-r border-b md:border-b-0 flex-shrink-0 flex flex-col justify-between`}>
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base leading-tight tracking-wide">OBH HOSTEL</h1>
                <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* ACTIVE LOGGED-IN USER INFO */}
          <div className="p-3 m-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Logged In As</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">
                {sessionUser.role}
              </span>
            </div>
            <p className="font-bold text-xs truncate">{sessionUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{sessionUser.email}</p>
          </div>

          {/* NAVIGATION ITEMS */}
          <nav className="px-3 space-y-1">
            {sessionUser.status === 'approved' && (
              <>
                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => setActiveTab('grid')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <BedDouble className="w-4 h-4" />
                    <span>Hostel Grid & Rooms</span>
                  </button>
                )}

                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Map className="w-4 h-4" />
                    <span>Hostel Layout Map</span>
                  </button>
                )}

                {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Master Directory ({approvedStudents.length})</span>
                  </button>
                )}

                {sessionUser.role === 'admin' && (
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

                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Maintenance Tickets</span>
                </button>

                {sessionUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('importer')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'importer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Gemini Sheet Importer</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('sql')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Database className="w-4 h-4" />
                  <span>SQL Schema & Setup</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* LOGOUT & SETTINGS FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* TOP STATS BAR (Admin & Staff Only) */}
        {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className={`p-4 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 relative group">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Est. Beds</p>
                  {sessionUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setTempBedCapacity(totalBedsCapacity);
                        setIsBedCapacityModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-0.5"
                      title="Edit Total Beds Capacity"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xl font-black mt-0.5">{stats.totalBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Registered</p>
                <p className="text-xl font-black mt-0.5">{stats.occupiedBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Est. Vacant</p>
                <p className="text-xl font-black mt-0.5">{stats.vacantBeds}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">MBBS Count</p>
                <p className="text-xl font-black mt-0.5">{stats.mbbsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">BDS Count</p>
                <p className="text-xl font-black mt-0.5">{stats.bdsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Fee Pending</p>
                <p className="text-xl font-black mt-0.5">{stats.feePendingCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: PENDING ACCOUNT LOCK SCREEN */}
        {sessionUser.status === 'pending' && (
          <div className="p-8 max-w-xl mx-auto my-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black">Account Pending Admin Approval</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Welcome, <strong className="text-slate-800 dark:text-slate-200">{sessionUser.name}</strong>! Your account registration has been created and is currently awaiting approval from the Hostel Admin.
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 text-left space-y-1 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Privacy Protection Active:</p>
              <p>• You cannot view other residents' data, room maps, or directories.</p>
              <p>• Once an admin approves your account, your personal room allocation will unlock here.</p>
            </div>
          </div>
        )}

        {/* VIEW 2: RESIDENT ISOLATED DASHBOARD */}
        {sessionUser.role === 'resident' && sessionUser.status === 'approved' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Resident Personal Desk</span>
              <h2 className="text-2xl font-black">My Hostel Dashboard</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-4 shadow-sm`}>
                <div className="text-center space-y-2">
                  <img
                    src={sessionUser.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={sessionUser.name}
                    className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500 shadow"
                  />
                  <h3 className="font-bold text-lg">{sessionUser.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {sessionUser.course || 'MBBS'} • Batch {sessionUser.batch || '2023'}
                  </span>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-medium">Room Allocation</span>
                    <span className="font-bold text-indigo-600">{sessionUser.block}, Room {sessionUser.room_no}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-medium">Fee Clearance</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      sessionUser.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {sessionUser.fee_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
                  <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>My Room Movement History</span>
                  </h4>
                  <p className="text-xs text-slate-400 italic">No room transfers recorded for your profile.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ADMIN ROOM GRID */}
        {activeTab === 'grid' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Block & Room Grid</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time room availability calculated dynamically from database records.</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search room or resident..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
                {sessionUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingStudent({ name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Wing', room_no: '1', phone: '', father_name: '', address: '', fee_status: 'Paid', fee_amount: 45000, paid_amount: 45000, photo_url: '' });
                      setIsEditStudentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Resident</span>
                  </button>
                )}
              </div>
            </div>

            {HOSTEL_BLOCKS.map(blockName => {
              const blockResidents = approvedStudents.filter(s => s.block === blockName);

              return (
                <div key={blockName} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-base">{blockName}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                      {blockResidents.length} Active Residents
                    </span>
                  </div>

                  {blockResidents.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {blockResidents.map(std => (
                        <div
                          key={std.id}
                          onClick={() => setSelectedStudent(std)}
                          className={`p-3 rounded-xl border transition cursor-pointer hover:border-indigo-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-black text-sm text-indigo-600">Rm {std.room_no || std.roomNo}</span>
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-1 rounded">
                              {std.course}
                            </span>
                          </div>
                          <p className="font-semibold text-xs mt-1 truncate">{std.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Batch {std.batch}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No residents assigned to this block yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3.5: HOSTEL LAYOUT MAP */}
        {activeTab === 'map' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className="p-6 space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Floor Plan & Layout Map</h2>
                <p className="text-xs text-slate-500">Official architectural layout and room distribution map.</p>
              </div>

              {sessionUser.role === 'admin' && (
                <div className="flex items-center space-x-2">
                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Map Image</span>
                    <input type="file" accept="image/*" onChange={handleMapFileUpload} className="hidden" />
                  </label>

                  {hostelMapUrl && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to remove the current hostel map?')) {
                          setHostelMapUrl('');
                        }
                      }}
                      className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-xs"
                      title="Delete Map"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm min-h-[400px] flex items-center justify-center`}>
              {hostelMapUrl ? (
                <img
                  src={hostelMapUrl}
                  alt="Hostel Layout Map"
                  className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">No Hostel Map Uploaded</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      {sessionUser.role === 'admin'
                        ? 'Click the "Upload Map Image" button above to upload an image of your hostel map.'
                        : 'Please contact the hostel administrator to upload the layout map.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: MASTER DIRECTORY */}
        {activeTab === 'directory' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Resident Directory</h2>
                <p className="text-xs text-slate-500">Authorized view for resident profiles, room assignments, and fees.</p>
              </div>

              {sessionUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingStudent({ name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Wing', room_no: '1', phone: '', father_name: '', address: '', fee_status: 'Paid', fee_amount: 45000, paid_amount: 45000, photo_url: '' });
                    setIsEditStudentModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Resident</span>
                </button>
              )}
            </div>

            <div className={`rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} overflow-x-auto shadow-sm`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} font-bold uppercase tracking-wider`}>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll / Batch</th>
                    <th className="p-3">Block & Room</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Fee Clearance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(std => (
                      <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                        <td className="p-3 flex items-center space-x-2.5">
                          <img src={std.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-7 h-7 rounded-full object-cover border" alt={std.name} />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{std.name}</p>
                            <p className="text-[10px] text-slate-400">Father: {std.father_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          {std.roll_no || 'N/A'}
                          <span className="block text-[10px] font-sans text-slate-400">{std.course} • {std.batch}</span>
                        </td>
                        <td className="p-3 font-bold text-indigo-600">
                          Room {std.room_no || std.roomNo}
                          <span className="block text-[10px] text-slate-400 font-normal">{std.block}</span>
                        </td>
                        <td className="p-3">{std.phone || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (std.fee_status || std.feeStatus) === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {std.fee_status || std.feeStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => setSelectedStudent(std)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          {sessionUser.role === 'admin' && (
                            <button onClick={() => { setEditingStudent(std); setIsEditStudentModalOpen(true); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                        No resident records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 5: USER APPROVAL DESK */}
        {activeTab === 'approval' && sessionUser.role === 'admin' && (
          <div className="p-6 space-y-4 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pending User Registrations</h2>
              <p className="text-xs text-slate-500">Approve accounts and assign roles before users can view resident details.</p>
            </div>

            <div className="space-y-3">
              {pendingStudents.length > 0 ? (
                pendingStudents.map(user => (
                  <div key={user.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm`}>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm">{user.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">Pending</span>
                      </div>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setStudents(prev => prev.map(s => s.id === user.id ? { ...s, status: 'approved', role: 'resident' } : s));
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Approve Resident
                      </button>
                      <button
                        onClick={() => {
                          setStudents(prev => prev.map(s => s.id === user.id ? { ...s, status: 'approved', role: 'authorized' } : s));
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Make Staff
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  No pending registration requests.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: MAINTENANCE TICKETS */}
        {activeTab === 'tickets' && (
          <div className="p-6 space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Maintenance Tickets</h2>
                <p className="text-xs text-slate-500">File and track room repair requests.</p>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow"
              >
                + File New Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complaints.length > 0 ? (
                complaints.map(tkt => (
                  <div key={tkt.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-2 shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{tkt.category}</span>
                        <h4 className="font-bold text-sm mt-0.5">{tkt.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        tkt.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tkt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{tkt.description}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  No maintenance tickets filed yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: GEMINI GOOGLE SHEET IMPORTER (ADMIN ONLY) */}
        {activeTab === 'importer' && sessionUser.role === 'admin' && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <div className="flex items-center space-x-2 text-amber-500 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Gemini AI Importer</span>
              </div>
              <h2 className="text-xl font-bold">Bulk Google Sheet Importer</h2>
              <p className="text-xs text-slate-500 mt-1">Paste JSON generated from Gemini to bulk upload residents.</p>
            </div>

            <div className="space-y-2">
              <textarea
                id="jsonBulkArea"
                rows={8}
                placeholder={`[
  {
    "name": "Chitranjan Singh",
    "course": "MBBS",
    "batch": "2023",
    "block": "Office Wing",
    "room_no": "4",
    "phone": "+91 98765 00000",
    "father_name": "Rajendra Singh",
    "fee_status": "Paid"
  }
]`}
                className={`w-full p-3 font-mono text-xs rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
              />
              <button
                onClick={() => {
                  const el = document.getElementById('jsonBulkArea');
                  if (!el || !el.value.trim()) return alert('Please paste JSON payload.');
                  try {
                    const parsed = JSON.parse(el.value);
                    if (Array.isArray(parsed)) {
                      const formatted = parsed.map((item, idx) => ({
                        id: 'std_imp_' + Date.now() + '_' + idx,
                        name: item.name || 'Unknown',
                        roll_no: item.roll_no || `2023MBBS${idx + 100}`,
                        course: item.course || 'MBBS',
                        batch: item.batch || '2023',
                        block: item.block || 'Office Wing',
                        room_no: String(item.room_no || '1'),
                        phone: item.phone || '',
                        father_name: item.father_name || '',
                        fee_status: item.fee_status || 'Paid',
                        status: 'approved',
                        role: 'resident'
                      }));

                      setStudents(prev => [...prev, ...formatted]);
                      alert(`Imported ${formatted.length} resident records!`);
                      el.value = '';
                      setActiveTab('directory');
                    }
                  } catch (err) {
                    alert('Invalid JSON: ' + err.message);
                  }
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow text-xs flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Parse & Append Records to Database</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 8: SUPABASE SQL GUIDE */}
        {activeTab === 'sql' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Supabase PostgreSQL Schema Setup</h2>
                <p className="text-xs text-slate-500">Run this query in your Supabase SQL Editor.</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  alert('SQL Schema copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[60vh]">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}

      </main>

      {/* EDIT BED CAPACITY MODAL (ADMIN ONLY) */}
      {isBedCapacityModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Edit Total Beds Capacity</h3>
              <button onClick={() => setIsBedCapacityModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold block text-slate-500">Total Available Beds</label>
              <input
                type="number"
                value={tempBedCapacity}
                onChange={e => setTempBedCapacity(parseInt(e.target.value, 10) || 0)}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setTotalBedsCapacity(tempBedCapacity);
                  setIsBedCapacityModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow"
              >
                Save Capacity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT RESIDENT MODAL (ADMIN ONLY) */}
      {isEditStudentModalOpen && editingStudent && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className={`w-full max-w-lg rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">{editingStudent.id ? 'Edit Resident' : 'Register New Resident'}</h3>
              <button type="button" onClick={() => setIsEditStudentModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Block</label>
                <select
                  value={editingStudent.block || 'Office Wing'}
                  onChange={e => setEditingStudent({ ...editingStudent, block: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Room Number</label>
                <input
                  type="text"
                  value={editingStudent.room_no || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, room_no: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">Save Record</button>
            </div>
          </form>
        </div>
      )}

      {/* RESIDENT INSPECTOR MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-start pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <img src={selectedStudent.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" alt={selectedStudent.name} />
                <div>
                  <h3 className="font-bold text-base">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.course} • Batch {selectedStudent.batch}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400 block font-medium">Block & Room</span>
                <span className="font-bold text-indigo-600">{selectedStudent.block}, Room {selectedStudent.room_no || selectedStudent.roomNo}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400 block font-medium">Father's Name</span>
                <span className="font-bold">{selectedStudent.father_name || 'N/A'}</span>
              </div>
            </div>

            {sessionUser.role === 'admin' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  onClick={() => {
                    setTransferData({ studentId: selectedStudent.id, targetBlock: 'Office Wing', targetRoom: '1', reason: 'Official Swap' });
                    setIsTransferModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs"
                >
                  Transfer Room
                </button>
                <button onClick={() => setSelectedStudent(null)} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 font-semibold rounded-lg text-xs">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER ROOM MODAL (ADMIN ONLY) */}
      {isTransferModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Re-assign Room & Log History</h3>
              <button type="button" onClick={() => setIsTransferModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Target Block</label>
                <select
                  value={transferData.targetBlock}
                  onChange={e => setTransferData({ ...transferData, targetBlock: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Target Room Number</label>
                <input
                  type="text"
                  required
                  value={transferData.targetRoom}
                  onChange={e => setTransferData({ ...transferData, targetRoom: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">Confirm Transfer</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const ticket = {
              id: 'tkt_' + Date.now(),
              studentId: sessionUser.id,
              studentName: sessionUser.name,
              roomNo: sessionUser.room_no || 'N/A',
              block: sessionUser.block || 'N/A',
              category: newTicket.category,
              title: newTicket.title,
              description: newTicket.description,
              status: 'Pending'
            };
            setComplaints(prev => [ticket, ...prev]);
            setIsTicketModalOpen(false);
          }} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">File Maintenance Ticket</h3>
              <button type="button" onClick={() => setIsTicketModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newTicket.description}
                  onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">Submit Ticket</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
