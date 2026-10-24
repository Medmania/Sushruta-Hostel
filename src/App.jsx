import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, Users, Search, Plus, UserCheck, 
  BedDouble, Wrench, Clock, Edit, MapPin, 
  Moon, Sun, Sparkles, X, Eye, 
  Upload, Database, Copy, Settings, LogOut, Lock, Mail,
  Map, Image as ImageIcon, Trash2, Calendar, CreditCard, Phone, User, FileText, CheckCircle, AlertCircle
} from 'lucide-react';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://fojauvqvrqarxtwyrmtg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvamF1dnF2cnFhcnh0d3lybXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjczMDcsImV4cCI6MjEwODQ0MzMwN30.X9nNRtP2Q2AteCZXRYWPmADReq7Y5u9rxq5UortTtXA',
  googleClientId: '',
  googleAppsScriptUrl: ''
};

// --- READY-TO-RUN SUPABASE SQL SCHEMA ---
const SUPABASE_SQL_SCHEMA = `-- 1. CREATE ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'authorized', 'resident');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE fee_status_type AS ENUM ('Paid', 'Pending', 'Partial');
CREATE TYPE ticket_status AS ENUM ('Pending', 'In Progress', 'Resolved');

-- 2. CREATE PROFILES TABLE
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
  joining_date DATE DEFAULT CURRENT_DATE,
  fee_status fee_status_type DEFAULT 'Pending',
  fee_amount NUMERIC DEFAULT 45000,
  paid_amount NUMERIC DEFAULT 0,
  photo_url TEXT,
  role user_role DEFAULT 'resident',
  status user_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE YEAR-WISE FEE LEDGER TABLE
CREATE TABLE fee_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  block TEXT,
  room_no TEXT,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  status fee_status_type DEFAULT 'Pending',
  payment_date DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE ROOM HISTORY TABLE WITH TRANSFER DATES
CREATE TABLE room_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_room TEXT,
  old_block TEXT,
  new_room TEXT NOT NULL,
  new_block TEXT NOT NULL,
  joining_date DATE,
  transfer_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  updated_by TEXT
);

-- 5. CREATE MAINTENANCE TICKETS TABLE
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

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_ledger ENABLE ROW LEVEL SECURITY;
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

  // Supabase Client Initialization
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

  // Auth & Session
  const [sessionUser, setSessionUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(false);

  // Capacity & Map Settings
  const [totalBedsCapacity, setTotalBedsCapacity] = useState(() => {
    const saved = localStorage.getItem('obh_total_beds');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [isBedCapacityModalOpen, setIsBedCapacityModalOpen] = useState(false);
  const [tempBedCapacity, setTempBedCapacity] = useState(totalBedsCapacity);

  const [hostelMapUrl, setHostelMapUrl] = useState(() => {
    return localStorage.getItem('obh_hostel_map') || '';
  });

  // Local Stores
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('obh_db_students');
    if (saved) return JSON.parse(saved);
    
    // Default initial seed data with year-wise ledger and dates
    return [
      {
        id: 'std_1',
        name: 'Ankit Raj',
        email: 'ankit.raj@hostel.edu',
        roll_no: '2023MBBS001',
        course: 'MBBS',
        batch: '2023',
        block: 'Office Wing',
        room_no: '23',
        phone: '+91 9876543210',
        father_name: 'S. K. Raj',
        joining_date: '2023-08-01',
        fee_status: 'Paid',
        status: 'approved',
        role: 'admin',
        fee_ledger: [
          { year: '2023-24', block: 'Office Wing', room_no: '23', amount: 45000, paid: 45000, status: 'Paid', date: '2023-08-05' },
          { year: '2024-25', block: 'Office Wing', room_no: '23', amount: 45000, paid: 45000, status: 'Paid', date: '2024-07-28' },
          { year: '2025-26', block: 'Office Wing', room_no: '23', amount: 45000, paid: 20000, status: 'Partial', date: '2025-08-10' }
        ],
        history: [
          { oldRoom: 'Initial', oldBlock: 'Office Wing', newRoom: '23', newBlock: 'Office Wing', date: '2023-08-01', reason: 'Initial Hostel Allocation' }
        ]
      }
    ];
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('obh_db_complaints');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation
  const [activeTab, setActiveTab] = useState('grid');

  // Modals & Forms
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ 
    studentId: '', 
    targetBlock: 'Office Wing', 
    targetRoom: '1', 
    transferDate: new Date().toISOString().split('T')[0],
    academicYear: '2026-27',
    reason: '' 
  });

  const [isNewFeeEntryModalOpen, setIsNewFeeEntryModalOpen] = useState(false);
  const [newFeeEntry, setNewFeeEntry] = useState({
    academicYear: '2026-27',
    amount: 45000,
    paid: 45000,
    status: 'Paid',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: 'Annual Hostel Fee'
  });

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'Electrical', title: '', description: '', priority: 'Medium' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Local Storage Sync
  useEffect(() => {
    localStorage.setItem('obh_app_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('obh_total_beds', totalBedsCapacity.toString());
  }, [totalBedsCapacity]);

  useEffect(() => {
    if (hostelMapUrl) localStorage.setItem('obh_hostel_map', hostelMapUrl);
    else localStorage.removeItem('obh_hostel_map');
  }, [hostelMapUrl]);

  useEffect(() => {
    localStorage.setItem('obh_db_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('obh_db_complaints', JSON.stringify(complaints));
  }, [complaints]);

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
        phone: '',
        father_name: '',
        joining_date: new Date().toISOString().split('T')[0],
        fee_status: 'Pending',
        fee_ledger: [
          { year: '2026-27', block: 'Office Wing', room_no: 'Unassigned', amount: 45000, paid: 0, status: 'Pending', date: '' }
        ],
        history: []
      };
      setSessionUser(newUser);
      setStudents(prev => [...prev, newUser]);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!supabase) {
      const isFirst = students.length === 0 || loginEmail.includes('admin');
      const mockUser = students.find(s => s.email === loginEmail) || {
        id: 'usr_' + Date.now(),
        email: loginEmail,
        name: loginEmail.split('@')[0],
        role: isFirst ? 'admin' : 'resident',
        status: isFirst ? 'approved' : 'pending',
        course: 'MBBS',
        batch: '2023',
        block: 'Office Wing',
        room_no: '23',
        phone: '+91 9876543210',
        father_name: 'S. K. Raj',
        joining_date: '2023-08-01',
        fee_status: 'Paid',
        fee_ledger: [
          { year: '2026-27', block: 'Office Wing', room_no: '23', amount: 45000, paid: 45000, status: 'Paid', date: '2026-08-01' }
        ],
        history: []
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
        alert('Registration link sent! Please check your email.');
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
      alert('Please configure SUPABASE credentials in API settings first!');
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

  // Stats calculation
  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  const stats = useMemo(() => {
    const totalBeds = totalBedsCapacity;
    const occupiedBeds = approvedStudents.length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const bdsCount = approvedStudents.filter(s => s.course === 'BDS').length;
    const mbbsCount = approvedStudents.filter(s => s.course === 'MBBS').length;
    const feePendingCount = approvedStudents.filter(s => {
      const currentYearLedger = s.fee_ledger?.[s.fee_ledger.length - 1];
      return currentYearLedger ? currentYearLedger.status !== 'Paid' : s.fee_status !== 'Paid';
    }).length;

    return { totalBeds, occupiedBeds, vacantBeds, bdsCount, mbbsCount, feePendingCount };
  }, [approvedStudents, totalBedsCapacity]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const roomVal = s.room_no || s.roomNo || '';
      const rollVal = s.roll_no || '';
      const phoneVal = s.phone || '';
      const fatherVal = s.father_name || '';
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             roomVal.includes(searchQuery) ||
             rollVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
             phoneVal.includes(searchQuery) ||
             fatherVal.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [approvedStudents, searchQuery]);

  // Save / Update Full Resident Details (ADMIN ONLY)
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Access Denied: Only Admins can edit resident records.');

    if (editingStudent.id) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    } else {
      const newEntry = {
        ...editingStudent,
        id: 'std_' + Date.now(),
        status: 'approved',
        fee_ledger: editingStudent.fee_ledger || [
          {
            year: '2026-27',
            block: editingStudent.block,
            room_no: editingStudent.room_no,
            amount: 45000,
            paid: editingStudent.fee_status === 'Paid' ? 45000 : 0,
            status: editingStudent.fee_status || 'Pending',
            date: new Date().toISOString().split('T')[0]
          }
        ],
        history: [{
          oldRoom: 'None',
          oldBlock: 'None',
          newRoom: editingStudent.room_no || 'Unassigned',
          newBlock: editingStudent.block || 'Office Wing',
          date: editingStudent.joining_date || new Date().toISOString().split('T')[0],
          reason: 'Initial Registration'
        }]
      };
      setStudents(prev => [...prev, newEntry]);
    }

    setIsEditStudentModalOpen(false);
    
    // Update selected profile view if open
    if (selectedStudent?.id === editingStudent.id) {
      setSelectedStudent(editingStudent);
    }
    setEditingStudent(null);
  };

  // Execute Room Transfer with Year-wise Fee & Stay Dates
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Access Denied: Admin role required.');

    const student = students.find(s => s.id === transferData.studentId);
    if (!student) return;

    const historyRecord = {
      oldRoom: student.room_no || 'None',
      oldBlock: student.block || 'None',
      newRoom: transferData.targetRoom,
      newBlock: transferData.targetBlock,
      date: transferData.transferDate,
      reason: transferData.reason || 'Annual Room Re-allocation'
    };

    // Append new Year-wise Fee Ledger for the new room session
    const newYearFee = {
      year: transferData.academicYear,
      block: transferData.targetBlock,
      room_no: transferData.targetRoom,
      amount: 45000,
      paid: 0,
      status: 'Pending',
      date: transferData.transferDate,
      remarks: `Allocated Room ${transferData.targetRoom} (${transferData.targetBlock})`
    };

    const updatedStudent = {
      ...student,
      room_no: transferData.targetRoom,
      block: transferData.targetBlock,
      joining_date: transferData.transferDate, // update active room joining date
      fee_ledger: [newYearFee, ...(student.fee_ledger || [])],
      history: [historyRecord, ...(student.history || [])]
    };

    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    setIsTransferModalOpen(false);
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  // Add Year-Wise Fee Entry
  const handleAddFeeEntry = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const updatedLedger = [
      {
        year: newFeeEntry.academicYear,
        block: selectedStudent.block,
        room_no: selectedStudent.room_no,
        amount: Number(newFeeEntry.amount),
        paid: Number(newFeeEntry.paid),
        status: newFeeEntry.status,
        date: newFeeEntry.paymentDate,
        remarks: newFeeEntry.remarks
      },
      ...(selectedStudent.fee_ledger || [])
    ];

    const updatedStudent = {
      ...selectedStudent,
      fee_status: newFeeEntry.status,
      fee_ledger: updatedLedger
    };

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    setIsNewFeeEntryModalOpen(false);
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

  // --- MAIN DASHBOARD ---
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col md:flex-row font-sans transition-colors duration-200`}>
      
      {/* SIDEBAR */}
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

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* STATS BAR */}
        {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className={`p-4 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Est. Beds</p>
                  {sessionUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setTempBedCapacity(totalBedsCapacity);
                        setIsBedCapacityModalOpen(true);
                      }}
                      className="text-indigo-600 dark:text-indigo-400"
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

        {/* TAB 1: ROOM GRID */}
        {activeTab === 'grid' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Block & Room Grid</h2>
                <p className="text-xs text-slate-500 mt-0.5">Click any resident card to view their full profile, joining date, and fee ledger.</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, room, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
                {sessionUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingStudent({ 
                        name: '', 
                        roll_no: '', 
                        course: 'MBBS', 
                        batch: '2023', 
                        block: 'Office Wing', 
                        room_no: '1', 
                        phone: '', 
                        father_name: '', 
                        joining_date: new Date().toISOString().split('T')[0],
                        fee_status: 'Paid'
                      });
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
                          {std.phone && <p className="text-[9px] text-slate-500 mt-1 truncate">{std.phone}</p>}
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

        {/* TAB 2: HOSTEL MAP */}
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
                        if (confirm('Delete current hostel map?')) setHostelMapUrl('');
                      }}
                      className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm min-h-[400px] flex items-center justify-center`}>
              {hostelMapUrl ? (
                <img src={hostelMapUrl} alt="Hostel Layout Map" className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-sm">No Hostel Map Uploaded</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MASTER DIRECTORY */}
        {activeTab === 'directory' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && sessionUser.status === 'approved' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Resident Directory</h2>
                <p className="text-xs text-slate-500">Complete directory with room numbers, contact info, and fee status.</p>
              </div>

              {sessionUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingStudent({ 
                      name: '', 
                      roll_no: '', 
                      course: 'MBBS', 
                      batch: '2023', 
                      block: 'Office Wing', 
                      room_no: '1', 
                      phone: '', 
                      father_name: '', 
                      joining_date: new Date().toISOString().split('T')[0],
                      fee_status: 'Paid'
                    });
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
                    <th className="p-3">Father's Name</th>
                    <th className="p-3">Joining Date</th>
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
                        onClick={() => setSelectedStudent(std)}
                      >
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{std.name}</td>
                        <td className="p-3 font-mono">
                          {std.roll_no || 'N/A'}
                          <span className="block text-[10px] font-sans text-slate-400">{std.course} • {std.batch}</span>
                        </td>
                        <td className="p-3 font-bold text-indigo-600">
                          Room {std.room_no || std.roomNo || 'Unassigned'}
                          <span className="block text-[10px] text-slate-400 font-normal">{std.block}</span>
                        </td>
                        <td className="p-3 font-mono">{std.phone || 'N/A'}</td>
                        <td className="p-3">{std.father_name || 'N/A'}</td>
                        <td className="p-3">{std.joining_date || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            std.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {std.fee_status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setSelectedStudent(std)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          {sessionUser.role === 'admin' && (
                            <button 
                              onClick={() => { setEditingStudent(std); setIsEditStudentModalOpen(true); }} 
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-600" />
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

        {/* OTHER TABS (APPROVAL, TICKETS, IMPORTER, SQL) */}
        {activeTab === 'approval' && sessionUser.role === 'admin' && (
          <div className="p-6 space-y-4 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold">Pending Registrations</h2>
            <div className="space-y-3">
              {pendingStudents.map(user => (
                <div key={user.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} flex justify-between items-center`}>
                  <div>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => setStudents(prev => prev.map(s => s.id === user.id ? { ...s, status: 'approved', role: 'resident' } : s))}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow"
                  >
                    Approve Resident
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="p-6 space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Maintenance Tickets</h2>
              <button onClick={() => setIsTicketModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow">+ New Ticket</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complaints.map(tkt => (
                <div key={tkt.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-1`}>
                  <h4 className="font-bold text-sm">{tkt.title}</h4>
                  <p className="text-xs text-slate-500">{tkt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'importer' && sessionUser.role === 'admin' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-bold">Bulk Google Sheet Importer</h2>
            <textarea id="jsonBulkArea" rows={8} className={`w-full p-3 font-mono text-xs rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`} placeholder={`[{"name":"Raj","course":"MBBS","batch":"2023","block":"Office Wing","room_no":"12","phone":"+91 9876543210","father_name":"R. K. Singh"}]`} />
            <button
              onClick={() => {
                const el = document.getElementById('jsonBulkArea');
                try {
                  const parsed = JSON.parse(el.value);
                  const formatted = parsed.map((item, idx) => ({
                    id: 'std_imp_' + Date.now() + '_' + idx,
                    name: item.name,
                    roll_no: item.roll_no || `2023MBBS${idx + 100}`,
                    course: item.course || 'MBBS',
                    batch: item.batch || '2023',
                    block: item.block || 'Office Wing',
                    room_no: String(item.room_no || '1'),
                    phone: item.phone || '',
                    father_name: item.father_name || '',
                    joining_date: item.joining_date || new Date().toISOString().split('T')[0],
                    fee_status: item.fee_status || 'Paid',
                    status: 'approved',
                    role: 'resident',
                    fee_ledger: [{ year: '2026-27', block: item.block || 'Office Wing', room_no: String(item.room_no || '1'), amount: 45000, paid: 45000, status: 'Paid', date: new Date().toISOString().split('T')[0] }],
                    history: []
                  }));
                  setStudents(prev => [...prev, ...formatted]);
                  alert(`Imported ${formatted.length} residents!`);
                  setActiveTab('directory');
                } catch(e) { alert('Invalid JSON'); }
              }}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
            >
              Parse & Append Records
            </button>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-bold">Supabase PostgreSQL Schema</h2>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[60vh]">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
      </main>

      {/* MODAL 1: FULL EDIT RESIDENT FORM (ADMIN ONLY) */}
      {isEditStudentModalOpen && editingStudent && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveStudent} className={`w-full max-w-lg rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl my-8`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">{editingStudent.id ? 'Edit Resident Profile' : 'Register New Resident'}</h3>
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
                  placeholder="+91 98765 43210"
                  value={editingStudent.phone || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Father's Name</label>
                <input
                  type="text"
                  value={editingStudent.father_name || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, father_name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Roll Number</label>
                <input
                  type="text"
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
                    placeholder="Batch"
                    value={editingStudent.batch || '2023'}
                    onChange={e => setEditingStudent({ ...editingStudent, batch: e.target.value })}
                    className={`w-1/2 p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Block</label>
                <select
                  value={editingStudent.block || 'Office Wing'}
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
                  value={editingStudent.room_no || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, room_no: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Room Joining Date</label>
                <input
                  type="date"
                  value={editingStudent.joining_date || new Date().toISOString().split('T')[0]}
                  onChange={e => setEditingStudent({ ...editingStudent, joining_date: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Current Year Fee Status</label>
                <select
                  value={editingStudent.fee_status || 'Paid'}
                  onChange={e => setEditingStudent({ ...editingStudent, fee_status: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow">
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: FULL RESIDENT COMPREHENSIVE PROFILE INSPECTOR */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-5 shadow-2xl my-8`}>
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStudent.course} • Batch {selectedStudent.batch} • Roll: {selectedStudent.roll_no || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Allocated Room</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{selectedStudent.block}, Rm {selectedStudent.room_no}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Joining Date</span>
                <span className="font-bold">{selectedStudent.joining_date || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-bold">{selectedStudent.phone || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Father's Name</span>
                <span className="font-bold truncate block">{selectedStudent.father_name || 'N/A'}</span>
              </div>
            </div>

            {/* Section 1: Year-Wise Fee History Ledger */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase text-indigo-500 tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Year-Wise Fee History & Room Ledger</span>
                </h4>

                {sessionUser.role === 'admin' && (
                  <button
                    onClick={() => setIsNewFeeEntryModalOpen(true)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Fee Record</span>
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-2">Academic Session</th>
                      <th className="p-2">Room Assigned</th>
                      <th className="p-2">Fee Due</th>
                      <th className="p-2">Amount Paid</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedStudent.fee_ledger && selectedStudent.fee_ledger.length > 0 ? (
                      selectedStudent.fee_ledger.map((ledger, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-2 font-bold">{ledger.year}</td>
                          <td className="p-2 font-semibold text-indigo-600">{ledger.block}, Rm {ledger.room_no}</td>
                          <td className="p-2">₹{ledger.amount}</td>
                          <td className="p-2 font-bold text-emerald-600">₹{ledger.paid}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              ledger.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {ledger.status}
                            </span>
                          </td>
                          <td className="p-2 text-slate-400">{ledger.date || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400 italic">No year-wise fee entries recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Room Stay & Movement History */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-indigo-500 tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Room Stay & Movement Timeline</span>
              </h4>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedStudent.history && selectedStudent.history.length > 0 ? (
                  selectedStudent.history.map((hist, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Moved from {hist.oldBlock} (Rm {hist.oldRoom}) → {hist.newBlock} (Rm {hist.newRoom})
                        </p>
                        <p className="text-[10px] text-slate-400">{hist.reason || 'Annual Allocation'}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg">
                        {hist.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 text-center border border-dashed rounded-xl">
                    No previous room transfers recorded for this resident.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            {sessionUser.role === 'admin' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  onClick={() => {
                    setTransferData({ 
                      studentId: selectedStudent.id, 
                      targetBlock: 'Office Wing', 
                      targetRoom: '1', 
                      transferDate: new Date().toISOString().split('T')[0],
                      academicYear: '2026-27',
                      reason: 'Annual Re-allocation' 
                    });
                    setIsTransferModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl font-bold text-xs shadow-sm flex items-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Transfer Room & Update Session</span>
                </button>

                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                    setIsEditStudentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
                >
                  Edit Profile Fields
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: ADD YEAR-WISE FEE ENTRY (ADMIN ONLY) */}
      {isNewFeeEntryModalOpen && selectedStudent && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddFeeEntry} className={`w-full max-w-sm rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Add Year-Wise Fee Record</h3>
              <button type="button" onClick={() => setIsNewFeeEntryModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Academic Year / Session</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-27"
                  value={newFeeEntry.academicYear}
                  onChange={e => setNewFeeEntry({ ...newFeeEntry, academicYear: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Total Fee Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newFeeEntry.amount}
                  onChange={e => setNewFeeEntry({ ...newFeeEntry, amount: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Paid Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newFeeEntry.paid}
                  onChange={e => setNewFeeEntry({ ...newFeeEntry, paid: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Status</label>
                <select
                  value={newFeeEntry.status}
                  onChange={e => setNewFeeEntry({ ...newFeeEntry, status: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Payment Date</label>
                <input
                  type="date"
                  value={newFeeEntry.paymentDate}
                  onChange={e => setNewFeeEntry({ ...newFeeEntry, paymentDate: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Save Fee Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: TRANSFER ROOM WITH DATES (ADMIN ONLY) */}
      {isTransferModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Re-assign Room & Log History</h3>
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
                <label className="font-bold block mb-1 text-slate-500">New Room Number</label>
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
                <label className="font-bold block mb-1 text-slate-500">Reason / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Year Swap"
                  value={transferData.reason}
                  onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Confirm Transfer & Update Ledger
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: EDIT BEDS CAPACITY */}
      {isBedCapacityModalOpen && sessionUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
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
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
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

      {/* MODAL 6: CREATE MAINTENANCE TICKET */}
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
          }} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">File Maintenance Ticket</h3>
              <button type="button" onClick={() => setIsTicketModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-500">Title</label>
                <input
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-500">Description</label>
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
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
