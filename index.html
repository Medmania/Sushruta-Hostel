react
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, Search, Plus, Filter, Shield, UserCheck, 
  BedDouble, Wrench, Bell, PhoneCall, Upload, RefreshCw, 
  CheckCircle, AlertCircle, Clock, Trash2, Edit, ChevronRight, 
  MapPin, Phone, User, Calendar, DollarSign, FileText, Moon, Sun, 
  Sparkles, Check, X, ArrowRight, Eye, ShieldAlert, Laptop, LogOut,
  Database, Key, Lock, Copy, AlertTriangle, CheckSquare, Settings
} from 'lucide-react';

// --- DEFAULT EMPTY CONFIGURATION SKELETON ---
const DEFAULT_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
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

-- 3. CREATE ROOMS TABLE
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no TEXT NOT NULL,
  block TEXT NOT NULL,
  capacity INT DEFAULT 2,
  type TEXT DEFAULT 'Standard Double',
  UNIQUE(room_no, block)
);

-- 4. CREATE ROOM HISTORY TABLE (Audit Trail for Room Transfers)
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

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR PROFILES
-- Residents can ONLY view their own record if approved
CREATE POLICY "Residents read own profile" ON profiles
  FOR SELECT USING (auth.uid() = auth_id AND status = 'approved');

-- Admins and Authorized users can read/modify ALL profiles
CREATE POLICY "Admins full access on profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE auth_id = auth.uid() 
      AND role IN ('admin', 'authorized') 
      AND status = 'approved'
    )
  );

-- 8. RLS POLICIES FOR ROOM HISTORY
CREATE POLICY "Residents read own history" ON room_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = room_history.student_id 
      AND auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access on room_history" ON room_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE auth_id = auth.uid() 
      AND role IN ('admin', 'authorized') 
      AND status = 'approved'
    )
  );

-- 9. RLS POLICIES FOR TICKETS
CREATE POLICY "Residents read and create own tickets" ON maintenance_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = maintenance_tickets.student_id 
      AND auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all tickets" ON maintenance_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE auth_id = auth.uid() 
      AND role IN ('admin', 'authorized') 
      AND status = 'approved'
    )
  );`;

const HOSTEL_BLOCKS = ['Office Wing', 'Mathura (North)', 'Mathura (South)', 'Tennis Block'];

export default function App() {
  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('obh_app_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useState(false);

  // --- REAL DATA STORES (EMPTY BY DEFAULT) ---
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('obh_db_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('obh_db_complaints');
    return saved ? JSON.parse(saved) : [];
  });

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('obh_db_notices');
    return saved ? JSON.parse(saved) : [];
  });

  // --- AUTH & ACTIVE USER SESSION ---
  // Default session role can be switched to test different views: 'admin', 'authorized', 'resident', 'pending', 'unauthenticated'
  const [currentSession, setCurrentSession] = useState({
    isAuthenticated: true,
    user: {
      id: 'session_admin_01',
      name: 'Hostel Admin',
      email: 'admin@hostel.edu',
      role: 'admin', // 'admin' | 'authorized' | 'resident'
      status: 'approved', // 'approved' | 'pending' | 'rejected'
      block: 'Office Wing',
      roomNo: '12'
    }
  });

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'directory', 'approval', 'tickets', 'importer', 'sql'

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
  const [filterBlock, setFilterBlock] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterFee, setFilterFee] = useState('All');

  // LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem('obh_app_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('obh_db_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('obh_db_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('obh_db_notices', JSON.stringify(notices));
  }, [notices]);

  // Derived Statistics from Database
  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  const stats = useMemo(() => {
    const totalBeds = 150; // Total standard hostel room capacity
    const occupiedBeds = approvedStudents.length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const bdsCount = approvedStudents.filter(s => s.course === 'BDS').length;
    const mbbsCount = approvedStudents.filter(s => s.course === 'MBBS').length;
    const feePendingCount = approvedStudents.filter(s => s.feeStatus !== 'Paid').length;

    return { totalBeds, occupiedBeds, vacantBeds, bdsCount, mbbsCount, feePendingCount };
  }, [approvedStudents]);

  // Filtered Students List for Admin View
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.roomNo && s.roomNo.includes(searchQuery)) ||
                            (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (s.phone && s.phone.includes(searchQuery));
      const matchesBlock = filterBlock === 'All' || s.block === filterBlock;
      const matchesBatch = filterBatch === 'All' || s.batch === filterBatch;
      const matchesCourse = filterCourse === 'All' || s.course === filterCourse;
      const matchesFee = filterFee === 'All' || s.feeStatus === filterFee;

      return matchesSearch && matchesBlock && matchesBatch && matchesCourse && matchesFee;
    });
  }, [approvedStudents, searchQuery, filterBlock, filterBatch, filterCourse, filterFee]);

  // Handle Save / Add Student
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (editingStudent.id) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    } else {
      const newEntry = {
        ...editingStudent,
        id: 'std_' + Date.now(),
        status: 'approved',
        history: [{
          roomNo: editingStudent.roomNo || 'Unassigned',
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

  // Handle User Approval / Role Change
  const handleUpdateUserStatus = (id, newStatus, newRole = 'resident') => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: newStatus, role: newRole };
      }
      return s;
    }));
  };

  // Handle Room Transfer
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    const student = students.find(s => s.id === transferData.studentId);
    if (!student) return;

    const historyRecord = {
      oldRoom: student.roomNo || 'None',
      oldBlock: student.block || 'None',
      roomNo: transferData.targetRoom,
      block: transferData.targetBlock,
      date: new Date().toISOString().split('T')[0],
      reason: transferData.reason || 'Admin Re-allocation'
    };

    const updatedStudent = {
      ...student,
      roomNo: transferData.targetRoom,
      block: transferData.targetBlock,
      history: [historyRecord, ...(student.history || [])]
    };

    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    setIsTransferModalOpen(false);
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
  };

  // Handle Ticket Creation
  const handleCreateTicket = (e) => {
    e.preventDefault();
    const resident = currentSession.user;
    const ticket = {
      id: 'tkt_' + Date.now(),
      studentId: resident.id,
      studentName: resident.name,
      roomNo: resident.roomNo || 'N/A',
      block: resident.block || 'N/A',
      category: newTicket.category,
      title: newTicket.title,
      description: newTicket.description,
      priority: newTicket.priority,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setComplaints(prev => [ticket, ...prev]);
    setIsTicketModalOpen(false);
    setNewTicket({ category: 'Electrical', title: '', description: '', priority: 'Medium' });
  };

  // Get Active Resident Data (For Strict Privacy Mode)
  const currentResidentData = useMemo(() => {
    if (currentSession.user.role === 'resident') {
      return students.find(s => s.id === currentSession.user.id || s.email === currentSession.user.email);
    }
    return null;
  }, [students, currentSession]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col md:flex-row font-sans transition-colors duration-200`}>
      
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`w-full md:w-64 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-r border-b md:border-b-0 flex-shrink-0 flex flex-col justify-between`}>
        <div>
          {/* Header & Logo */}
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
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Config Setup Status Banner */}
          <div className="p-3 m-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Backend Config</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${config.supabaseUrl ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                {config.supabaseUrl ? 'Connected' : 'Setup Needed'}
              </span>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="w-full py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold flex items-center justify-center space-x-1.5 text-xs transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure API Keys</span>
            </button>
          </div>

          {/* Active Session Role Switcher */}
          <div className="p-3 m-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>ACTIVE SESSION ROLE</span>
              <span className="text-indigo-600 font-black">{currentSession.user.role}</span>
            </div>
            <select
              value={currentSession.user.role + '_' + currentSession.user.status}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'admin') {
                  setCurrentSession({
                    isAuthenticated: true,
                    user: { id: 'admin_1', name: 'Admin Warden', email: 'admin@hostel.edu', role: 'admin', status: 'approved' }
                  });
                } else if (val === 'authorized') {
                  setCurrentSession({
                    isAuthenticated: true,
                    user: { id: 'auth_1', name: 'Assistant Caretaker', email: 'caretaker@hostel.edu', role: 'authorized', status: 'approved' }
                  });
                } else if (val === 'resident_approved') {
                  // Link to resident or sample id
                  setCurrentSession({
                    isAuthenticated: true,
                    user: { id: students[0]?.id || 'res_1', name: students[0]?.name || 'Sample Resident', email: 'resident@hostel.edu', role: 'resident', status: 'approved', roomNo: students[0]?.roomNo || '1', block: students[0]?.block || 'Office Wing' }
                  });
                } else if (val === 'resident_pending') {
                  setCurrentSession({
                    isAuthenticated: true,
                    user: { id: 'pending_1', name: 'New Student', email: 'newbie@hostel.edu', role: 'resident', status: 'pending' }
                  });
                }
              }}
              className={`w-full p-1.5 text-xs rounded-lg border font-medium ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
            >
              <option value="admin">Admin / Warden View</option>
              <option value="authorized">Authorized Staff View</option>
              <option value="resident_approved">Verified Resident View</option>
              <option value="resident_pending">Pending Approval View</option>
            </select>
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1">
            {/* Resident or Admin Map/Grid */}
            {currentSession.user.status === 'approved' && (
              <>
                {(currentSession.user.role === 'admin' || currentSession.user.role === 'authorized') && (
                  <button
                    onClick={() => setActiveTab('grid')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <BedDouble className="w-4 h-4" />
                    <span>Hostel Grid & Map</span>
                  </button>
                )}

                {(currentSession.user.role === 'admin' || currentSession.user.role === 'authorized') && (
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Master Directory ({approvedStudents.length})</span>
                  </button>
                )}

                {currentSession.user.role === 'admin' && (
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

                {currentSession.user.role === 'admin' && (
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

        {/* Dark Mode Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-between text-xs text-slate-500">
          <span>OBH Skeleton v3.0</span>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        
        {/* TOP STATS BAR (Only visible to Admin/Authorized) */}
        {(currentSession.user.role === 'admin' || currentSession.user.role === 'authorized') && currentSession.user.status === 'approved' && (
          <div className={`p-4 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Est. Beds</p>
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

        {/* VIEW 1: PENDING USER APPROVAL SCREEN (Strict Privacy Lock) */}
        {currentSession.user.status === 'pending' && (
          <div className="p-8 max-w-xl mx-auto my-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black">Registration Pending Admin Approval</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Welcome, <strong className="text-slate-800 dark:text-slate-200">{currentSession.user.name}</strong>! Your account registration is currently pending authorization from the Hostel Warden or Caretaker.
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 text-left space-y-1 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Privacy Notice:</p>
              <p>• You cannot view room assignments or student directories until authorized.</p>
              <p>• Once approved, you will only see your individual profile, room history, and tickets.</p>
            </div>
          </div>
        )}

        {/* VIEW 2: VERIFIED RESIDENT ISOLATED PROFILE VIEW */}
        {currentSession.user.role === 'resident' && currentSession.user.status === 'approved' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Resident Personal Desk</span>
              <h2 className="text-2xl font-black">My Hostel Dashboard</h2>
            </div>

            {currentResidentData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-4 shadow-sm`}>
                  <div className="text-center space-y-2">
                    <img
                      src={currentResidentData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={currentResidentData.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500 shadow"
                    />
                    <h3 className="font-bold text-lg">{currentResidentData.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {currentResidentData.course} • Batch {currentResidentData.batch}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Room Allocation</span>
                      <span className="font-bold text-indigo-600">{currentResidentData.block}, Room {currentResidentData.room_no}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Roll Number</span>
                      <span className="font-mono">{currentResidentData.roll_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Phone</span>
                      <span className="font-semibold">{currentResidentData.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Father's Name</span>
                      <span className="font-semibold">{currentResidentData.father_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Fee Clearance</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        currentResidentData.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {currentResidentData.fee_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal History & Complaint Tickets Column */}
                <div className="md:col-span-2 space-y-6">
                  {/* Room Swap History Log */}
                  <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>My Room Transfer History</span>
                    </h4>
                    
                    <div className="space-y-2 border-l-2 border-indigo-500/30 pl-3 ml-2">
                      {currentResidentData.history && currentResidentData.history.length > 0 ? (
                        currentResidentData.history.map((h, i) => (
                          <div key={i} className="text-xs space-y-0.5 relative">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[17px] top-1"></div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{h.block}, Room {h.roomNo}</p>
                            <p className="text-slate-400 text-[11px]">{h.date} • {h.reason}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No room transfers on record.</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Maintenance Ticket */}
                  <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-indigo-500" />
                        <span>My Maintenance Tickets</span>
                      </h4>
                      <button
                        onClick={() => setIsTicketModalOpen(true)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
                      >
                        + File Issue
                      </button>
                    </div>

                    <div className="space-y-2">
                      {complaints.filter(c => c.studentId === currentResidentData.id).length > 0 ? (
                        complaints.filter(c => c.studentId === currentResidentData.id).map(ticket => (
                          <div key={ticket.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-start text-xs">
                            <div>
                              <span className="font-bold">{ticket.title}</span>
                              <p className="text-slate-400 mt-0.5">{ticket.description}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No active maintenance tickets filed.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                No resident record found for your logged-in profile. Please ask the hostel admin to register your details.
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ADMIN BLOCK GRID & MAP */}
        {activeTab === 'grid' && (currentSession.user.role === 'admin' || currentSession.user.role === 'authorized') && currentSession.user.status === 'approved' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Block & Room Grid</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time room availability calculated dynamically from registered database records.</p>
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
                {currentSession.user.role === 'admin' && (
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

            {/* Block Sections */}
            {HOSTEL_BLOCKS.map(blockName => {
              // Get residents in this block
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
                      No residents currently assigned to this block in the database.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 4: MASTER RESIDENT DIRECTORY */}
        {activeTab === 'directory' && (currentSession.user.role === 'admin' || currentSession.user.role === 'authorized') && currentSession.user.status === 'approved' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Resident Directory</h2>
                <p className="text-xs text-slate-500">Authorized personnel view for resident profiles, room assignments, and fees.</p>
              </div>

              {currentSession.user.role === 'admin' && (
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

            {/* Table */}
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
                          <img src={std.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-7 h-7 rounded-full object-cover border" />
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
                            std.fee_status === 'Paid' || std.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {std.fee_status || std.feeStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => setSelectedStudent(std)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          {currentSession.user.role === 'admin' && (
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
                        No registered resident records found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 5: USER REGISTRATION APPROVAL DESK */}
        {activeTab === 'approval' && currentSession.user.role === 'admin' && (
          <div className="p-6 space-y-4 max-w-4xl mx-auto">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pending User Registrations</h2>
              <p className="text-xs text-slate-500">Approve or reject newly registered accounts before granting access to resident data.</p>
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
                      <p className="text-xs text-slate-400">{user.email} • Batch {user.batch || 'N/A'} ({user.course || 'MBBS'})</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateUserStatus(user.id, 'approved', 'resident')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Approve Resident
                      </button>
                      <button
                        onClick={() => handleUpdateUserStatus(user.id, 'approved', 'authorized')}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Make Staff
                      </button>
                      <button
                        onClick={() => handleUpdateUserStatus(user.id, 'rejected')}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  No pending user registration requests at this time.
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
                <p className="text-xs text-slate-500">Track and update room repair requests across all blocks.</p>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
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
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{tkt.studentName} ({tkt.block}, Rm {tkt.roomNo})</span>
                      <span>{tkt.createdAt}</span>
                    </div>

                    {currentSession.user.role === 'admin' && (
                      <div className="pt-2 flex justify-end space-x-1">
                        <select
                          value={tkt.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComplaints(prev => prev.map(c => c.id === tkt.id ? { ...c, status: val } : c));
                          }}
                          className={`text-xs p-1 rounded border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  No maintenance tickets recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: GEMINI GOOGLE SHEET BULK IMPORTER */}
        {activeTab === 'importer' && currentSession.user.role === 'admin' && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <div className="flex items-center space-x-2 text-amber-500 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Gemini AI Helper</span>
              </div>
              <h2 className="text-xl font-bold">Bulk Google Sheet Importer</h2>
              <p className="text-xs text-slate-500 mt-1">Convert raw Google Sheet rows into database-ready JSON records.</p>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Gemini Prompt Template</span>
                <button
                  onClick={() => {
                    const text = `Convert my hostel room spreadsheet data into a valid JSON array of objects with keys: "name", "course", "batch", "block", "room_no", "phone", "father_name", "address", "fee_status". Here is my sheet data: [PASTE SHEET ROWS HERE]`;
                    navigator.clipboard.writeText(text);
                    alert('Prompt copied!');
                  }}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded"
                >
                  Copy Prompt
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {`Convert my hostel room spreadsheet data into a valid JSON array of objects with keys: "name", "course", "batch", "block", "room_no", "phone", "father_name", "address", "fee_status".`}
              </pre>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Paste JSON Payload from Gemini:</label>
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
    "address": "Delhi",
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
                        address: item.address || '',
                        fee_status: item.fee_status || 'Paid',
                        status: 'approved',
                        role: 'resident',
                        history: [{ roomNo: String(item.room_no || '1'), block: item.block || 'Office Wing', date: new Date().toISOString().split('T')[0], reason: 'Bulk Sheet Import' }]
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

        {/* VIEW 8: SUPABASE SQL SETUP GUIDE & RLS POLICIES */}
        {activeTab === 'sql' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Supabase PostgreSQL Schema & RLS Setup</h2>
                <p className="text-xs text-slate-500">Copy and run these SQL queries in your Supabase SQL Editor for production RLS security.</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  alert('SQL Schema & Policies copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL Script</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[60vh]">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}

      </main>

      {/* --- CONFIGURATION MODAL --- */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Backend & Auth Configuration</h3>
              <button onClick={() => setIsConfigOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">SUPABASE_URL</label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={config.supabaseUrl}
                  onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  placeholder="eyJhbG..."
                  value={config.supabaseAnonKey}
                  onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">GOOGLE_CLIENT_ID</label>
                <input
                  type="text"
                  placeholder="123456...apps.googleusercontent.com"
                  value={config.googleClientId}
                  onChange={e => setConfig({ ...config, googleClientId: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">GOOGLE_APPS_SCRIPT_URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/..."
                  value={config.googleAppsScriptUrl}
                  onChange={e => setConfig({ ...config, googleAppsScriptUrl: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT RESIDENT MODAL --- */}
      {isEditStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className={`w-full max-w-lg rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">{editingStudent.id ? 'Edit Resident Details' : 'Register New Resident'}</h3>
              <button type="button" onClick={() => setIsEditStudentModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
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
                <label className="font-bold block mb-1">Roll Number</label>
                <input
                  type="text"
                  value={editingStudent.roll_no || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, roll_no: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Course</label>
                <select
                  value={editingStudent.course || 'MBBS'}
                  onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="MBBS">MBBS</option>
                  <option value="BDS">BDS</option>
                  <option value="MD/MS">MD/MS</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Batch Year</label>
                <input
                  type="text"
                  value={editingStudent.batch || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, batch: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Hostel Block</label>
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
                  value={editingStudent.room_no || editingStudent.roomNo || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, room_no: e.target.value, roomNo: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingStudent.phone || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold block mb-1">Father's Name</label>
                <input
                  type="text"
                  value={editingStudent.father_name || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, father_name: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditStudentModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- RESIDENT PROFILE INSPECTOR & ROOM TRANSFER MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-start pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <img src={selectedStudent.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500" />
                <div>
                  <h3 className="font-bold text-base">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.course} • Batch {selectedStudent.batch}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
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

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Room Movement History</h4>
              <div className="space-y-1 text-xs border-l-2 border-indigo-500/30 pl-3">
                {selectedStudent.history && selectedStudent.history.length > 0 ? (
                  selectedStudent.history.map((h, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold">{h.block}, Room {h.roomNo}</span>
                      <span className="text-slate-400 block text-[10px]">{h.date} • {h.reason}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No transfer records found.</p>
                )}
              </div>
            </div>

            {currentSession.user.role === 'admin' && (
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
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 font-semibold rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TRANSFER ROOM MODAL --- */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Re-assign Room & Log History</h3>
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
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

              <div>
                <label className="font-bold block mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health request, Mutual Swap"
                  value={transferData.reason}
                  onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CREATE TICKET MODAL --- */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTicket} className={`w-full max-w-md rounded-2xl ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">File Maintenance Ticket</h3>
              <button type="button" onClick={() => setIsTicketModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Category</label>
                <select
                  value={newTicket.category}
                  onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Cleanliness">Cleanliness</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tap leaking"
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
                  placeholder="Details of the problem..."
                  value={newTicket.description}
                  onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
