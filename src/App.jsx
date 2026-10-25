import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2, Users, Search, Plus, UserCheck, BedDouble, Wrench, Clock,
  Edit, MapPin, Moon, Sun, X, Eye, Upload, Database, Settings, LogOut,
  Lock, Mail, Map, Image as ImageIcon, Trash2, CreditCard, FileText,
  CheckCircle, AlertCircle, Bell, Filter, Home, User
} from 'lucide-react';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://fojauvqvrqarxtwyrmtg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvamF1dnF2cnFhcnh0d3lybXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjczMDcsImV4cCI6MjEwODQ0MzMwN30.X9nNRtP2Q2AteCZXRYWPmADReq7Y5u9rxq5UortTtXA',
};

const HOSTEL_BLOCKS = ['NCC', 'OFFICE', 'MATHURA (NORTH)', 'MATHURA (SOUTH)', 'TENNIS', 'PG'];

const SUPABASE_SQL_SCHEMA = `-- Run this in Supabase SQL Editor
CREATE TYPE user_role AS ENUM ('admin', 'authorized', 'resident');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE fee_status_type AS ENUM ('Paid', 'Pending', 'Partial');
CREATE TYPE ticket_status AS ENUM ('Pending', 'In Progress', 'Resolved');
CREATE TYPE seater_type AS ENUM ('1', '2', '3', '4');

CREATE TABLE IF NOT EXISTS profiles (
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
  role user_role DEFAULT 'resident',
  status user_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block TEXT NOT NULL,
  room_no TEXT NOT NULL,
  seater seater_type NOT NULL DEFAULT '1',
  is_special BOOLEAN DEFAULT false,
  special_label TEXT,
  notes TEXT,
  UNIQUE(block, room_no)
);

CREATE TABLE IF NOT EXISTS fee_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  block TEXT,
  room_no TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 45000,
  paid_amount NUMERIC DEFAULT 0,
  status fee_status_type DEFAULT 'Pending',
  payment_date DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_history (
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

CREATE TABLE IF NOT EXISTS room_occupancy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block TEXT NOT NULL,
  room_no TEXT NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name TEXT,
  from_date DATE,
  to_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  room_no TEXT,
  block TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status ticket_status DEFAULT 'Pending',
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  posted_by UUID REFERENCES profiles(id),
  posted_by_name TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_occupancy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON fee_ledger FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON room_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON room_occupancy_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON maintenance_tickets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON notices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public can read notices" ON notices FOR SELECT USING (true);
`;

export default function App() {
  const [config] = useState(DEFAULT_CONFIG);
  const supabase = useMemo(() => {
    try {
      return createClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch {
      return null;
    }
  }, [config]);

  // Auth
  const [sessionUser, setSessionUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [notices, setNotices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // UI
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterFee, setFilterFee] = useState('');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState({ targetBlock: 'NCC', targetRoom: '', transferDate: new Date().toISOString().split('T')[0], reason: '' });
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', body: '', file_url: '', file_name: '' });
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'Electrical', title: '', description: '', priority: 'Medium' });
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [newFee, setNewFee] = useState({ academic_year: '2026-27', total_amount: 45000, paid_amount: 0, status: 'Pending', payment_date: '', remarks: '' });

  // ========== DATA LOADERS ==========
  const loadAllData = useCallback(async () => {
    if (!supabase || !sessionUser) return;
    setLoadingData(true);
    try {
      const [profRes, roomRes, noticeRes, ticketRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name'),
        supabase.from('rooms').select('*').order('block').order('room_no'),
        supabase.from('notices').select('*').order('created_at', { ascending: false }),
        supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false })
      ]);
      if (profRes.data) setStudents(profRes.data);
      if (roomRes.data) setRooms(roomRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (ticketRes.data) setTickets(ticketRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [supabase, sessionUser]);

  // Auth listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) syncProfile(session.user);
      else setSessionUser(null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (sessionUser) loadAllData();
  }, [sessionUser, loadAllData]);

  const syncProfile = async (authUser) => {
    const { data } = await supabase.from('profiles').select('*').eq('email', authUser.email).maybeSingle();
    if (data) {
      setSessionUser(data);
    } else {
      // First time user → create pending profile
      const { data: newProf, error } = await supabase.from('profiles').insert({
        auth_id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'resident',
        status: 'pending',
        course: 'MBBS',
        batch: new Date().getFullYear().toString()
      }).select().single();
      if (!error && newProf) setSessionUser(newProf);
    }
  };

  // ========== AUTH HANDLERS ==========
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPassword });
        if (error) throw error;
        alert('Check your email for confirmation link.');
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

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setStudents([]);
    setRooms([]);
    setNotices([]);
    setTickets([]);
  };

  // ========== HELPERS ==========
  const isAdmin = sessionUser?.role === 'admin';
  const isAuthorized = sessionUser?.role === 'admin' || sessionUser?.role === 'authorized';
  const isResident = sessionUser?.role === 'resident';
  const isApproved = sessionUser?.status === 'approved';

  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  const occupancyMap = useMemo(() => {
    const map = {};
    approvedStudents.forEach(s => {
      if (!s.block || !s.room_no) return;
      const key = `\( {s.block}| \){s.room_no}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [approvedStudents]);

  const getOccupancy = (block, roomNo) => occupancyMap[`\( {block}| \){roomNo}`] || [];

  const vacancyStats = useMemo(() => {
    let full = 0, partial = 0, vacant = 0;
    rooms.forEach(r => {
      if (r.is_special) return;
      const occ = getOccupancy(r.block, r.room_no).length;
      const cap = parseInt(r.seater, 10);
      if (occ === 0) vacant++;
      else if (occ < cap) partial++;
      else full++;
    });
    return { full, partial, vacant, totalRooms: rooms.filter(r => !r.is_special).length };
  }, [rooms, occupancyMap]);

  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        s.name?.toLowerCase().includes(q) ||
        s.room_no?.includes(q) ||
        s.roll_no?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.father_name?.toLowerCase().includes(q);
      const matchBlock = !filterBlock || s.block === filterBlock;
      const matchBatch = !filterBatch || s.batch === filterBatch;
      const matchCourse = !filterCourse || s.course === filterCourse;
      const matchFee = !filterFee || s.fee_status === filterFee;
      return matchSearch && matchBlock && matchBatch && matchCourse && matchFee;
    });
  }, [approvedStudents, searchQuery, filterBlock, filterBatch, filterCourse, filterFee]);

  // ========== CRUD ==========
  const saveStudent = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert('Only Admin can edit residents');
    const payload = { ...editingStudent };
    delete payload.id;
    delete payload.created_at;
    if (editingStudent.id) {
      const { error } = await supabase.from('profiles').update(payload).eq('id', editingStudent.id);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from('profiles').insert({ ...payload, status: 'approved', role: 'resident' });
      if (error) return alert(error.message);
    }
    setIsEditStudentOpen(false);
    setEditingStudent(null);
    loadAllData();
  };

  const approveStudent = async (id) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
    loadAllData();
  };

  const executeTransfer = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedStudent) return;
    const targetOcc = getOccupancy(transferData.targetBlock, transferData.targetRoom).length;
    const targetRoom = rooms.find(r => r.block === transferData.targetBlock && r.room_no === transferData.targetRoom);
    if (targetRoom && !targetRoom.is_special) {
      const cap = parseInt(targetRoom.seater, 10);
      if (targetOcc >= cap) return alert(`Room is full (${cap}-seater)`);
    }

    // Close previous occupancy
    if (selectedStudent.block && selectedStudent.room_no) {
      await supabase.from('room_occupancy_history').insert({
        block: selectedStudent.block,
        room_no: selectedStudent.room_no,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        from_date: selectedStudent.joining_date,
        to_date: transferData.transferDate
      });
    }

    // History
    await supabase.from('room_history').insert({
      student_id: selectedStudent.id,
      old_room: selectedStudent.room_no,
      old_block: selectedStudent.block,
      new_room: transferData.targetRoom,
      new_block: transferData.targetBlock,
      transfer_date: transferData.transferDate,
      reason: transferData.reason || 'Room Transfer',
      updated_by: sessionUser.name
    });

    // Update profile
    await supabase.from('profiles').update({
      block: transferData.targetBlock,
      room_no: transferData.targetRoom,
      joining_date: transferData.transferDate
    }).eq('id', selectedStudent.id);

    setIsTransferOpen(false);
    setSelectedStudent(null);
    loadAllData();
  };

  const saveRoom = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const payload = { ...editingRoom };
    delete payload.id;
    if (editingRoom.id) {
      await supabase.from('rooms').update(payload).eq('id', editingRoom.id);
    } else {
      await supabase.from('rooms').insert(payload);
    }
    setIsRoomModalOpen(false);
    setEditingRoom(null);
    loadAllData();
  };

  const deleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return;
    await supabase.from('rooms').delete().eq('id', id);
    loadAllData();
  };

  const postNotice = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;
    await supabase.from('notices').insert({
      ...newNotice,
      posted_by: sessionUser.id,
      posted_by_name: sessionUser.name
    });
    setIsNoticeModalOpen(false);
    setNewNotice({ title: '', body: '', file_url: '', file_name: '' });
    loadAllData();
  };

  const deleteNotice = async (id) => {
    if (!isAuthorized) return;
    await supabase.from('notices').delete().eq('id', id);
    loadAllData();
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    await supabase.from('maintenance_tickets').insert({
      student_id: sessionUser.id,
      student_name: sessionUser.name,
      room_no: sessionUser.room_no,
      block: sessionUser.block,
      ...newTicket
    });
    setIsTicketModalOpen(false);
    setNewTicket({ category: 'Electrical', title: '', description: '', priority: 'Medium' });
    loadAllData();
  };

  const updateTicketStatus = async (id, status, comment = '') => {
    if (!isAuthorized) return;
    await supabase.from('maintenance_tickets').update({
      status,
      admin_comment: comment,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    loadAllData();
  };

  // ========== IMPORT FROM SHEET STYLE JSON ==========
  const handleBulkImport = async () => {
    const el = document.getElementById('jsonBulkArea');
    if (!el) return;
    try {
      const parsed = JSON.parse(el.value);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      const toInsert = rows.map((item, idx) => ({
        name: item.name || item.OCCUPANT || `Student ${idx}`,
        roll_no: item.roll_no || item.ROLL || null,
        course: item.course || (String(item.name || '').includes('BDS') ? 'BDS' : 'MBBS'),
        batch: String(item.batch || item.BATCH || '2023'),
        block: item.block || item.Block || 'NCC',
        room_no: String(item.room_no || item['Room No.'] || item.room || ''),
        phone: item.phone || '',
        father_name: item.father_name || '',
        address: item.address || '',
        joining_date: item.joining_date || new Date().toISOString().split('T')[0],
        fee_status: item.fee_status || 'Pending',
        status: 'approved',
        role: 'resident'
      }));
      const { error } = await supabase.from('profiles').insert(toInsert);
      if (error) alert(error.message);
      else {
        alert(`Imported ${toInsert.length} residents`);
        loadAllData();
        setActiveTab('directory');
      }
    } catch (err) {
      alert('Invalid JSON');
    }
  };

  // ========== RENDER ==========
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black">OBH HOSTEL PORTAL</h1>
            <p className="text-xs text-slate-400">Sign in to continue</p>
          </div>
          {authError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">{authError}</div>}
          <button onClick={handleGoogle} className="w-full py-3 bg-white text-slate-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-2">
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase font-bold">
            <div className="flex-1 border-t border-slate-800" /><span>or email</span><div className="flex-1 border-t border-slate-800" />
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
            <input type="email" required placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl" />
            <input type="password" required placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl" />
            <button type="submit" disabled={authLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl">
              {authLoading ? 'Please wait…' : (isSigningUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <button onClick={() => setIsSigningUp(!isSigningUp)} className="text-indigo-400 text-xs font-bold w-full text-center">
            {isSigningUp ? 'Already have account? Sign In' : "Don't have account? Register"}
          </button>
        </div>
      </div>
    );
  }

  // Pending residents see limited screen
  if (!isApproved && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Registration Pending</h2>
          <p className="text-sm text-slate-500">Your account is waiting for admin approval. You will get full access once approved.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col md:flex-row`}>
      {/* SIDEBAR */}
      <aside className={`w-full md:w-64 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border-r flex-shrink-0 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl"><Building2 className="w-5 h-5" /></div>
            <div>
              <h1 className="font-extrabold text-sm">OBH HOSTEL</h1>
              <p className="text-[10px] text-indigo-500 font-bold uppercase">Portal</p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-3 m-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Logged in</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">{sessionUser.role}</span>
          </div>
          <p className="font-bold truncate">{sessionUser.name}</p>
          <p className="text-[10px] text-slate-400 truncate">{sessionUser.email}</p>
        </div>

        <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
          {isAuthorized && (
            <>
              <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home className="w-4 h-4" />} label="Dashboard" />
              <NavBtn active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={<Users className="w-4 h-4" />} label={`Directory (${approvedStudents.length})`} />
              <NavBtn active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<BedDouble className="w-4 h-4" />} label="Rooms & Vacancy" />
              <NavBtn active={activeTab === 'approval'} onClick={() => setActiveTab('approval')} icon={<UserCheck className="w-4 h-4" />} label="Approvals" badge={pendingStudents.length} />
            </>
          )}
          <NavBtn active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} icon={<Bell className="w-4 h-4" />} label="Notice Board" />
          <NavBtn active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} icon={<Wrench className="w-4 h-4" />} label="Complaints" />
          {isResident && (
            <NavBtn active={activeTab === 'myprofile'} onClick={() => setActiveTab('myprofile')} icon={<User className="w-4 h-4" />} label="My Profile" />
          )}
          {isAdmin && (
            <>
              <NavBtn active={activeTab === 'importer'} onClick={() => setActiveTab('importer')} icon={<Upload className="w-4 h-4" />} label="Bulk Import" />
              <NavBtn active={activeTab === 'sql'} onClick={() => setActiveTab('sql')} icon={<Database className="w-4 h-4" />} label="SQL Schema" />
            </>
          )}
        </nav>

        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {loadingData && <div className="p-4 text-center text-sm text-slate-400">Loading…</div>}

        {/* DASHBOARD – clean first look */}
        {activeTab === 'dashboard' && isAuthorized && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold">Dashboard</h2>
              <p className="text-xs text-slate-500">Quick overview</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Residents" value={approvedStudents.length} color="indigo" />
              <StatCard label="Pending Approvals" value={pendingStudents.length} color="amber" />
              <StatCard label="Fully Vacant" value={vacancyStats.vacant} color="emerald" />
              <StatCard label="Partially Vacant" value={vacancyStats.partial} color="sky" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-3">Recent Notices</h3>
                {notices.slice(0, 3).map(n => (
                  <div key={n.id} className="mb-2 text-xs">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-slate-400 line-clamp-1">{n.body}</p>
                  </div>
                ))}
                {notices.length === 0 && <p className="text-xs text-slate-400">No notices yet</p>}
              </div>
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-3">Open Complaints</h3>
                {tickets.filter(t => t.status !== 'Resolved').slice(0, 3).map(t => (
                  <div key={t.id} className="mb-2 text-xs">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-slate-400">{t.student_name} • {t.status}</p>
                  </div>
                ))}
                {tickets.filter(t => t.status !== 'Resolved').length === 0 && <p className="text-xs text-slate-400">No open tickets</p>}
              </div>
            </div>
          </div>
        )}

        {/* DIRECTORY */}
        {activeTab === 'directory' && isAuthorized && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Master Directory</h2>
                <p className="text-xs text-slate-500">All approved residents</p>
              </div>
              {isAdmin && (
                <button onClick={() => { setEditingStudent({ name: '', course: 'MBBS', batch: '2023', block: 'NCC', room_no: '', fee_status: 'Pending' }); setIsEditStudentOpen(true); }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Resident
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name, room, phone…"
                  className={`pl-8 pr-3 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`} />
              </div>
              <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)} className={`px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option value="">All Blocks</option>
                {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className={`px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option value="">All Courses</option>
                <option value="MBBS">MBBS</option>
                <option value="BDS">BDS</option>
                <option value="MD/MS">MD/MS</option>
              </select>
              <select value={filterFee} onChange={e => setFilterFee(e.target.value)} className={`px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option value="">All Fee Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

            <div className={`rounded-xl border overflow-x-auto ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <table className="w-full text-left text-xs">
                <thead className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold uppercase`}>
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Batch / Course</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Father</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                      <td className="p-3 font-bold">{s.name}</td>
                      <td className="p-3">{s.batch} • {s.course}</td>
                      <td className="p-3 font-bold text-indigo-600">{s.block} / {s.room_no || '—'}</td>
                      <td className="p-3 font-mono">{s.phone || '—'}</td>
                      <td className="p-3">{s.father_name || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {s.fee_status}
                        </span>
                      </td>
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedStudent(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><Eye className="w-3.5 h-3.5" /></button>
                        {isAdmin && <button onClick={() => { setEditingStudent(s); setIsEditStudentOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><Edit className="w-3.5 h-3.5 text-indigo-600" /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ROOMS & VACANCY */}
        {activeTab === 'rooms' && isAuthorized && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Rooms & Vacancy</h2>
                <p className="text-xs text-slate-500">Manage capacity and view occupancy</p>
              </div>
              {isAdmin && (
                <button onClick={() => { setEditingRoom({ block: 'NCC', room_no: '', seater: '1', is_special: false }); setIsRoomModalOpen(true); }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Room
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="font-bold text-emerald-600">Fully Vacant</p>
                <p className="text-2xl font-black">{vacancyStats.vacant}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <p className="font-bold text-sky-600">Partial</p>
                <p className="text-2xl font-black">{vacancyStats.partial}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <p className="font-bold text-slate-600">Total Rooms</p>
                <p className="text-2xl font-black">{vacancyStats.totalRooms}</p>
              </div>
            </div>

            {HOSTEL_BLOCKS.map(block => {
              const blockRooms = rooms.filter(r => r.block === block);
              if (blockRooms.length === 0) return null;
              return (
                <div key={block} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" />{block}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {blockRooms.map(r => {
                      const occ = getOccupancy(r.block, r.room_no);
                      const cap = parseInt(r.seater, 10);
                      const isFull = occ.length >= cap;
                      const isEmpty = occ.length === 0;
                      return (
                        <div key={r.id} className={`p-2.5 rounded-xl border text-xs ${isEmpty ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : isFull ? 'border-slate-300 dark:border-slate-700' : 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'}`}>
                          <div className="flex justify-between items-start">
                            <span className="font-black">Rm {r.room_no}</span>
                            <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 px-1 rounded">{r.seater}S</span>
                          </div>
                          {r.is_special ? (
                            <p className="text-[10px] text-purple-600 font-bold mt-1">{r.special_label || 'Special'}</p>
                          ) : (
                            <>
                              <p className="text-[10px] mt-1">{occ.length}/{cap} occupied</p>
                              <div className="mt-1 space-y-0.5">
                                {occ.map(s => <p key={s.id} className="truncate text-[10px] font-medium">{s.name}</p>)}
                              </div>
                            </>
                          )}
                          {isAdmin && (
                            <div className="flex gap-1 mt-2">
                              <button onClick={() => { setEditingRoom(r); setIsRoomModalOpen(true); }} className="text-indigo-600"><Edit className="w-3 h-3" /></button>
                              <button onClick={() => deleteRoom(r.id)} className="text-rose-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* APPROVALS */}
        {activeTab === 'approval' && isAdmin && (
          <div className="p-6 space-y-4 max-w-2xl">
            <h2 className="text-xl font-bold">Pending Approvals</h2>
            {pendingStudents.length === 0 && <p className="text-sm text-slate-400">No pending registrations</p>}
            {pendingStudents.map(u => (
              <div key={u.id} className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <p className="font-bold text-sm">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <button onClick={() => approveStudent(u.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Approve</button>
              </div>
            ))}
          </div>
        )}

        {/* NOTICES */}
        {activeTab === 'notices' && (
          <div className="p-6 space-y-4 max-w-3xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Notice Board</h2>
              {isAuthorized && (
                <button onClick={() => setIsNoticeModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Post Notice
                </button>
              )}
            </div>
            {notices.map(n => (
              <div key={n.id} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{n.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.posted_by_name} • {new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                  {isAuthorized && <button onClick={() => deleteNotice(n.id)} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <p className="text-sm mt-3 whitespace-pre-wrap">{n.body}</p>
                {n.file_url && (
                  <a href={n.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-600 font-bold">
                    <FileText className="w-3.5 h-3.5" /> {n.file_name || 'Attachment'}
                  </a>
                )}
              </div>
            ))}
            {notices.length === 0 && <p className="text-sm text-slate-400">No notices posted yet</p>}
          </div>
        )}

        {/* TICKETS / COMPLAINTS */}
        {activeTab === 'tickets' && (
          <div className="p-6 space-y-4 max-w-3xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Maintenance & Complaints</h2>
              <button onClick={() => setIsTicketModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">+ Raise Ticket</button>
            </div>
            {tickets.filter(t => isAuthorized || t.student_id === sessionUser.id).map(t => (
              <div key={t.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{t.title}</h4>
                    <p className="text-[10px] text-slate-400">{t.student_name} • {t.block} Rm {t.room_no} • {t.category}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : t.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs mt-2">{t.description}</p>
                {t.admin_comment && <p className="text-xs mt-2 text-indigo-600">Admin: {t.admin_comment}</p>}
                {isAuthorized && t.status !== 'Resolved' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateTicketStatus(t.id, 'In Progress')} className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">In Progress</button>
                    <button onClick={() => updateTicketStatus(t.id, 'Resolved', prompt('Resolution comment') || '')} className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MY PROFILE (Resident) */}
        {activeTab === 'myprofile' && isResident && (
          <div className="p-6 max-w-lg">
            <h2 className="text-xl font-bold mb-4">My Profile</h2>
            <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <p><span className="text-slate-400 text-xs">Name</span><br /><span className="font-bold">{sessionUser.name}</span></p>
              <p><span className="text-slate-400 text-xs">Room</span><br /><span className="font-bold text-indigo-600">{sessionUser.block} / {sessionUser.room_no || 'Unassigned'}</span></p>
              <p><span className="text-slate-400 text-xs">Batch / Course</span><br /><span className="font-bold">{sessionUser.batch} • {sessionUser.course}</span></p>
              <p><span className="text-slate-400 text-xs">Phone</span><br /><span className="font-bold">{sessionUser.phone || '—'}</span></p>
              <p><span className="text-slate-400 text-xs">Father's Name</span><br /><span className="font-bold">{sessionUser.father_name || '—'}</span></p>
              <p><span className="text-slate-400 text-xs">Address</span><br /><span className="font-bold">{sessionUser.address || '—'}</span></p>
              <p><span className="text-slate-400 text-xs">Fee Status</span><br />
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${sessionUser.fee_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{sessionUser.fee_status}</span>
              </p>
              <p><span className="text-slate-400 text-xs">Allotment Date</span><br /><span className="font-bold">{sessionUser.joining_date || '—'}</span></p>
            </div>
          </div>
        )}

        {/* BULK IMPORT */}
        {activeTab === 'importer' && isAdmin && (
          <div className="p-6 max-w-3xl space-y-4">
            <h2 className="text-xl font-bold">Bulk Import from Google Sheet</h2>
            <p className="text-xs text-slate-500">Paste JSON array. Supported keys: name, batch, course, block, room_no, phone, father_name, address, fee_status</p>
            <textarea id="jsonBulkArea" rows={10} className={`w-full p-3 font-mono text-xs rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}
              placeholder={`[{"name":"Raj","batch":"2023","course":"MBBS","block":"NCC","room_no":"12","phone":"+91...","father_name":"..."}]`} />
            <button onClick={handleBulkImport} className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Parse & Import</button>
          </div>
        )}

        {/* SQL */}
        {activeTab === 'sql' && isAdmin && (
          <div className="p-6 max-w-4xl">
            <h2 className="text-xl font-bold mb-3">Supabase Schema</h2>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs overflow-x-auto max-h-[70vh]">{SUPABASE_SQL_SCHEMA}</pre>
          </div>
        )}
      </main>

      {/* ========== MODALS ========== */}

      {/* Student Profile Inspector */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl my-8 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">{selectedStudent.name?.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-lg">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.course} • Batch {selectedStudent.batch}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <InfoBox label="Room" value={`${selectedStudent.block}, Rm ${selectedStudent.room_no || '—'}`} />
              <InfoBox label="Joining" value={selectedStudent.joining_date || '—'} />
              <InfoBox label="Phone" value={selectedStudent.phone || '—'} />
              <InfoBox label="Father" value={selectedStudent.father_name || '—'} />
            </div>
            <p className="text-xs"><span className="text-slate-400">Address:</span> {selectedStudent.address || '—'}</p>
            {isAdmin && (
              <div className="flex gap-2 pt-3 border-t">
                <button onClick={() => { setTransferData({ ...transferData, targetBlock: selectedStudent.block || 'NCC', targetRoom: '' }); setIsTransferOpen(true); }}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Transfer Room
                </button>
                <button onClick={() => { setEditingStudent(selectedStudent); setIsEditStudentOpen(true); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Edit Profile</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student */}
      {isEditStudentOpen && editingStudent && isAdmin && (
        <Modal title={editingStudent.id ? 'Edit Resident' : 'Add Resident'} onClose={() => setIsEditStudentOpen(false)}>
          <form onSubmit={saveStudent} className="space-y-3 text-xs">
            <Input label="Full Name" value={editingStudent.name || ''} onChange={v => setEditingStudent({ ...editingStudent, name: v })} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" value={editingStudent.phone || ''} onChange={v => setEditingStudent({ ...editingStudent, phone: v })} />
              <Input label="Father's Name" value={editingStudent.father_name || ''} onChange={v => setEditingStudent({ ...editingStudent, father_name: v })} />
            </div>
            <Input label="Address" value={editingStudent.address || ''} onChange={v => setEditingStudent({ ...editingStudent, address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Roll No" value={editingStudent.roll_no || ''} onChange={v => setEditingStudent({ ...editingStudent, roll_no: v })} />
              <div>
                <label className="font-bold block mb-1 text-slate-500">Course</label>
                <select value={editingStudent.course || 'MBBS'} onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                  <option>MBBS</option><option>BDS</option><option>MD/MS</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Batch" value={editingStudent.batch || ''} onChange={v => setEditingStudent({ ...editingStudent, batch: v })} />
              <div>
                <label className="font-bold block mb-1 text-slate-500">Block</label>
                <select value={editingStudent.block || 'NCC'} onChange={e => setEditingStudent({ ...editingStudent, block: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                  {HOSTEL_BLOCKS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Room No" value={editingStudent.room_no || ''} onChange={v => setEditingStudent({ ...editingStudent, room_no: v })} />
              <Input label="Joining Date" type="date" value={editingStudent.joining_date || ''} onChange={v => setEditingStudent({ ...editingStudent, joining_date: v })} />
            </div>
            <div>
              <label className="font-bold block mb-1 text-slate-500">Fee Status</label>
              <select value={editingStudent.fee_status || 'Pending'} onChange={e => setEditingStudent({ ...editingStudent, fee_status: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option>Paid</option><option>Pending</option><option>Partial</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
          </form>
        </Modal>
      )}

      {/* Transfer */}
      {isTransferOpen && isAdmin && selectedStudent && (
        <Modal title="Transfer Room" onClose={() => setIsTransferOpen(false)}>
          <form onSubmit={executeTransfer} className="space-y-3 text-xs">
            <p className="text-slate-500">Moving <strong>{selectedStudent.name}</strong> from {selectedStudent.block} / {selectedStudent.room_no}</p>
            <div>
              <label className="font-bold block mb-1 text-slate-500">Target Block</label>
              <select value={transferData.targetBlock} onChange={e => setTransferData({ ...transferData, targetBlock: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                {HOSTEL_BLOCKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <Input label="New Room No" value={transferData.targetRoom} onChange={v => setTransferData({ ...transferData, targetRoom: v })} required />
            <Input label="Transfer Date" type="date" value={transferData.transferDate} onChange={v => setTransferData({ ...transferData, transferDate: v })} required />
            <Input label="Reason" value={transferData.reason} onChange={v => setTransferData({ ...transferData, reason: v })} />
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Confirm Transfer</button>
          </form>
        </Modal>
      )}

      {/* Room Modal */}
      {isRoomModalOpen && editingRoom && isAdmin && (
        <Modal title={editingRoom.id ? 'Edit Room' : 'Add Room'} onClose={() => setIsRoomModalOpen(false)}>
          <form onSubmit={saveRoom} className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-500">Block</label>
              <select value={editingRoom.block} onChange={e => setEditingRoom({ ...editingRoom, block: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                {HOSTEL_BLOCKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <Input label="Room Number" value={editingRoom.room_no || ''} onChange={v => setEditingRoom({ ...editingRoom, room_no: v })} required />
            <div>
              <label className="font-bold block mb-1 text-slate-500">Seater Type</label>
              <select value={editingRoom.seater || '1'} onChange={e => setEditingRoom({ ...editingRoom, seater: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option value="1">Single (1)</option>
                <option value="2">Double (2)</option>
                <option value="3">Triple (3)</option>
                <option value="4">Quadruple (4)</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!editingRoom.is_special} onChange={e => setEditingRoom({ ...editingRoom, is_special: e.target.checked })} />
              <span className="font-bold text-slate-500">Special Room (Guest / TV / Store / Office)</span>
            </label>
            {editingRoom.is_special && <Input label="Special Label" value={editingRoom.special_label || ''} onChange={v => setEditingRoom({ ...editingRoom, special_label: v })} />}
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save Room</button>
          </form>
        </Modal>
      )}

      {/* Notice Modal */}
      {isNoticeModalOpen && isAuthorized && (
        <Modal title="Post Notice" onClose={() => setIsNoticeModalOpen(false)}>
          <form onSubmit={postNotice} className="space-y-3 text-xs">
            <Input label="Title" value={newNotice.title} onChange={v => setNewNotice({ ...newNotice, title: v })} required />
            <div>
              <label className="font-bold block mb-1 text-slate-500">Body</label>
              <textarea rows={4} required value={newNotice.body} onChange={e => setNewNotice({ ...newNotice, body: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
            </div>
            <Input label="File URL (optional)" value={newNotice.file_url} onChange={v => setNewNotice({ ...newNotice, file_url: v })} />
            <Input label="File Name (optional)" value={newNotice.file_name} onChange={v => setNewNotice({ ...newNotice, file_name: v })} />
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Publish</button>
          </form>
        </Modal>
      )}

      {/* Ticket Modal */}
      {isTicketModalOpen && (
        <Modal title="Raise Complaint / Ticket" onClose={() => setIsTicketModalOpen(false)}>
          <form onSubmit={submitTicket} className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-slate-500">Category</label>
              <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                <option>Electrical</option><option>Plumbing</option><option>Carpentry</option><option>Cleaning</option><option>General</option>
              </select>
            </div>
            <Input label="Title" value={newTicket.title} onChange={v => setNewTicket({ ...newTicket, title: v })} required />
            <div>
              <label className="font-bold block mb-1 text-slate-500">Description</label>
              <textarea rows={3} required value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Submit</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ========== SMALL UI HELPERS ==========
function NavBtn({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-600',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <span className="text-slate-400 block font-medium">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl my-8">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="font-bold block mb-1 text-slate-500">{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
    </div>
  );
}
