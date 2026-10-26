import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, Users, Search, Plus, UserCheck, 
  BedDouble, Wrench, Clock, Edit, MapPin, 
  Moon, Sun, Sparkles, X, Eye, 
  Upload, Database, Copy, Settings, LogOut, Lock, Mail,
  Map, Image as ImageIcon, Trash2, Calendar, CreditCard, Phone, User, FileText, CheckCircle, AlertCircle,
  Bell, Paperclip, MessageSquare, ShieldCheck, Filter, ChevronRight, Check, CornerDownRight
} from 'lucide-react';

// --- DEFAULT CONFIGURATION ---
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://fojauvqvrqarxtwyrmtg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvamF1dnF2cnFhcnh0d3lybXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjczMDcsImV4cCI6MjEwODQ0MzMwN30.X9nNRtP2Q2AteCZXRYWPmADReq7Y5u9rxq5UortTtXA',
};

const HOSTEL_BLOCKS = ['Office Wing', 'Mathura (North)', 'Mathura (South)', 'Tennis Block'];
const ADMIN_EMAILS = ['dr.ankitraj8558@gmail.com', 'ankit.raj@hostel.edu'];

export default function App() {
  // Configuration State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('obh_app_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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

  // Clean Data Stores (No Fake Data)
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('obh_db_students_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('obh_db_rooms');
    if (saved) return JSON.parse(saved);
    
    // Generate empty rooms layout without occupants
    const initialRooms = [];
    HOSTEL_BLOCKS.forEach(block => {
      for (let i = 1; i <= 10; i++) {
        initialRooms.push({
          id: `rm_${block}_${i}`,
          block: block,
          room_no: `${i}`,
          seater: i % 2 === 0 ? '2' : '1',
          notes: ''
        });
      }
    });
    return initialRooms;
  });

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('obh_db_notices');
    return saved ? JSON.parse(saved) : [];
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('obh_db_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [hostelMapUrl, setHostelMapUrl] = useState(() => localStorage.getItem('obh_hostel_map') || '');

  // Modal Control States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('details');
  const [selectedRoom, setSelectedRoom] = useState(null);
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

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', body: '', file_url: '', file_name: '', priority: 'General' });

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'Electrical', title: '', description: '' });

  const [ticketCommentText, setTicketCommentText] = useState({});

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterFeeStatus, setFilterFeeStatus] = useState('ALL');

  // Persistence Sync
  useEffect(() => localStorage.setItem('obh_db_students_v2', JSON.stringify(students)), [students]);
  useEffect(() => localStorage.setItem('obh_db_rooms', JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem('obh_db_notices', JSON.stringify(notices)), [notices]);
  useEffect(() => localStorage.setItem('obh_db_tickets', JSON.stringify(complaints)), [complaints]);
  useEffect(() => {
    if (hostelMapUrl) localStorage.setItem('obh_hostel_map', hostelMapUrl);
    else localStorage.removeItem('obh_hostel_map');
  }, [hostelMapUrl]);

  // Auth Sync Listener
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
    const isAdminUser = ADMIN_EMAILS.includes(userEmail) || userEmail.includes('admin') || students.length === 0;

    let profile = students.find(s => s.email?.toLowerCase() === userEmail);
    if (!profile) {
      profile = {
        id: authUser.id || 'usr_' + Date.now(),
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: isAdminUser ? 'admin' : 'resident',
        status: isAdminUser ? 'approved' : 'pending',
        course: 'MBBS',
        batch: '2023',
        block: 'Office Wing',
        room_no: 'Unassigned',
        phone: '',
        father_name: '',
        address: '',
        joining_date: new Date().toISOString().split('T')[0],
        fee_status: 'Pending',
        fee_ledger: [],
        history: []
      };
      setStudents(prev => [...prev, profile]);
    } else if (isAdminUser && profile.role !== 'admin') {
      profile = { ...profile, role: 'admin', status: 'approved' };
      setStudents(prev => prev.map(s => s.email?.toLowerCase() === userEmail ? profile : s));
    }
    setSessionUser(profile);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const userEmail = loginEmail.toLowerCase();
    const isAdminUser = ADMIN_EMAILS.includes(userEmail) || userEmail.includes('admin') || students.length === 0;

    if (!supabase) {
      let profile = students.find(s => s.email?.toLowerCase() === userEmail);
      if (!profile) {
        profile = {
          id: 'usr_' + Date.now(),
          email: loginEmail,
          name: loginEmail.split('@')[0],
          role: isAdminUser ? 'admin' : 'resident',
          status: isAdminUser ? 'approved' : 'pending',
          course: 'MBBS',
          batch: '2023',
          block: 'Office Wing',
          room_no: 'Unassigned',
          phone: '',
          father_name: '',
          address: '',
          joining_date: new Date().toISOString().split('T')[0],
          fee_status: 'Paid',
          fee_ledger: [],
          history: []
        };
        setStudents(prev => [...prev, profile]);
      } else if (isAdminUser && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin', status: 'approved' };
        setStudents(prev => prev.map(s => s.email?.toLowerCase() === userEmail ? profile : s));
      }
      setSessionUser(profile);
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
  };

  // Derived Approved / Pending lists
  const approvedStudents = useMemo(() => students.filter(s => s.status === 'approved'), [students]);
  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);

  // Occupancy Analysis
  const occupancyStats = useMemo(() => {
    let totalBedsCapacity = 0;
    let totalOccupiedBeds = approvedStudents.length;

    const blockBreakdown = {};
    HOSTEL_BLOCKS.forEach(b => {
      blockBreakdown[b] = { totalRooms: 0, totalCapacity: 0, occupied: 0, fullyVacant: 0, partialVacant: 0, fullyOccupied: 0 };
    });

    rooms.forEach(rm => {
      const capacity = parseInt(rm.seater, 10) || 1;
      const roomOccupants = approvedStudents.filter(s => s.block === rm.block && (s.room_no || s.roomNo) === rm.room_no);
      const count = roomOccupants.length;

      totalBedsCapacity += capacity;

      if (blockBreakdown[rm.block]) {
        blockBreakdown[rm.block].totalRooms += 1;
        blockBreakdown[rm.block].totalCapacity += capacity;
        blockBreakdown[rm.block].occupied += count;

        if (count === 0) blockBreakdown[rm.block].fullyVacant += 1;
        else if (count < capacity) blockBreakdown[rm.block].partialVacant += 1;
        else blockBreakdown[rm.block].fullyOccupied += 1;
      }
    });

    return {
      totalBedsCapacity,
      totalOccupiedBeds,
      totalVacantBeds: Math.max(0, totalBedsCapacity - totalOccupiedBeds),
      blockBreakdown
    };
  }, [rooms, approvedStudents]);

  // Master Directory Filters
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const roomVal = s.room_no || s.roomNo || '';
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            roomVal.includes(searchQuery) ||
                            (s.phone && s.phone.includes(searchQuery)) ||
                            (s.father_name && s.father_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBlock = filterBlock === 'ALL' || s.block === filterBlock;
      const matchesBatch = filterBatch === 'ALL' || s.batch === filterBatch;
      const matchesCourse = filterCourse === 'ALL' || s.course === filterCourse;
      const matchesFee = filterFeeStatus === 'ALL' || s.fee_status === filterFeeStatus;

      return matchesSearch && matchesBlock && matchesBatch && matchesCourse && matchesFee;
    });
  }, [approvedStudents, searchQuery, filterBlock, filterBatch, filterCourse, filterFeeStatus]);

  // Save/Update Resident Record with Capacity Validation
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Access Denied');

    const targetRoom = rooms.find(r => r.block === editingStudent.block && r.room_no === editingStudent.room_no);
    const capacity = targetRoom ? parseInt(targetRoom.seater, 10) : 1;
    const currentOccupants = approvedStudents.filter(s => s.block === editingStudent.block && s.room_no === editingStudent.room_no && s.id !== editingStudent.id);

    if (currentOccupants.length >= capacity) {
      alert(`Capacity Exceeded! Room ${editingStudent.room_no} in ${editingStudent.block} is a ${capacity}-seater and already has ${currentOccupants.length} resident(s).`);
      return;
    }

    if (editingStudent.id) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    } else {
      const newEntry = {
        ...editingStudent,
        id: 'std_' + Date.now(),
        status: 'approved',
        fee_ledger: [
          {
            year: '2026-27',
            block: editingStudent.block,
            room_no: editingStudent.room_no,
            amount: 45000,
            paid: editingStudent.fee_status === 'Paid' ? 45000 : 0,
            status: editingStudent.fee_status || 'Pending',
            date: editingStudent.joining_date
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
    if (selectedStudent?.id === editingStudent.id) setSelectedStudent(editingStudent);
    setEditingStudent(null);
  };

  // Direct Room Shifting
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (sessionUser?.role !== 'admin') return alert('Admin access required.');

    const student = students.find(s => s.id === transferData.studentId);
    if (!student) return;

    const targetRoom = rooms.find(r => r.block === transferData.targetBlock && r.room_no === transferData.targetRoom);
    const capacity = targetRoom ? parseInt(targetRoom.seater, 10) : 1;
    const currentOccupants = approvedStudents.filter(s => s.block === transferData.targetBlock && s.room_no === transferData.targetRoom && s.id !== student.id);

    if (currentOccupants.length >= capacity) {
      alert(`Cannot Shift! Room ${transferData.targetRoom} in ${transferData.targetBlock} is a ${capacity}-seater and is FULL.`);
      return;
    }

    const historyRecord = {
      oldRoom: student.room_no || 'None',
      oldBlock: student.block || 'None',
      newRoom: transferData.targetRoom,
      newBlock: transferData.targetBlock,
      date: transferData.transferDate,
      reason: transferData.reason || 'Room Shift'
    };

    const newYearFee = {
      year: transferData.academicYear,
      block: transferData.targetBlock,
      room_no: transferData.targetRoom,
      amount: 45000,
      paid: 0,
      status: 'Pending',
      date: transferData.transferDate,
      remarks: `Shifted to Rm ${transferData.targetRoom} (${transferData.targetBlock})`
    };

    const updatedStudent = {
      ...student,
      room_no: transferData.targetRoom,
      block: transferData.targetBlock,
      joining_date: transferData.transferDate,
      fee_ledger: [newYearFee, ...(student.fee_ledger || [])],
      history: [historyRecord, ...(student.history || [])]
    };

    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    setIsTransferModalOpen(false);
    if (selectedStudent?.id === student.id) setSelectedStudent(updatedStudent);
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

  // --- LOGIN VIEW ---
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
              <Building2 className="w-7 h-7" />
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
              {isSigningUp ? 'Already registered? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APPLICATION ---
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
                <h1 className="font-extrabold text-base leading-tight tracking-wide">OBH PORTAL</h1>
                <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Hostel Management</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

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
              <Map className="w-4 h-4" />
              <span>Hostel Map</span>
            </button>

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
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
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
        
        {/* VIEW 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="p-6 max-w-5xl mx-auto space-y-6 w-full">
            
            {/* User Profile Card */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
                  {(sessionUser.name || 'A').charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{sessionUser.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{sessionUser.course} • Batch {sessionUser.batch} • Roll: {sessionUser.roll_no || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900">
                  Room {sessionUser.room_no || 'Unassigned'} ({sessionUser.block})
                </div>
                <button
                  onClick={() => setSelectedStudent(sessionUser)}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
                >
                  My Profile & Ledger
                </button>
              </div>
            </div>

            {/* Admin High-Level Capacity Overview */}
            {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Hostel Capacity & Vacancy Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Total Capacity</p>
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
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1">
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {not.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{not.body}</p>
                      <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        <span>Posted by {not.posted_by} on {not.date}</span>
                        {not.file_url && (
                          <a href={not.file_url} target="_blank" rel="noreferrer" className="text-indigo-500 font-bold hover:underline flex items-center space-x-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{not.file_name || 'Download Attachment'}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic border border-dashed rounded-2xl">
                  No notices posted yet.
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: ROOM GRID & VACANCY ANALYSIS */}
        {activeTab === 'grid' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Rooms & Vacancy Dashboard</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage room allocations and view live room capacity.</p>
              </div>

              {sessionUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingStudent({ 
                      name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Wing', room_no: '1', 
                      phone: '', father_name: '', address: '', joining_date: new Date().toISOString().split('T')[0], fee_status: 'Paid' 
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

            {/* Block Wise Breakdown Table */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
              <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Block-Wise Vacancy & Seater Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {HOSTEL_BLOCKS.map(block => {
                  const bStat = occupancyStats.blockBreakdown[block];
                  return (
                    <div key={block} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span>{block}</span>
                        <span className="text-indigo-600">{bStat.occupied}/{bStat.totalCapacity} Beds</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${bStat.totalCapacity ? (bStat.occupied / bStat.totalCapacity) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                        <span>Vacant Rooms: <strong className="text-emerald-600">{bStat.fullyVacant}</strong></span>
                        <span>Partial: <strong className="text-amber-600">{bStat.partialVacant}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Room Grid */}
            {HOSTEL_BLOCKS.map(blockName => {
              const blockRooms = rooms.filter(r => r.block === blockName);

              return (
                <div key={blockName} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-base">{blockName}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                      {blockRooms.length} Configured Rooms
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {blockRooms.map(rm => {
                      const occupants = approvedStudents.filter(s => s.block === rm.block && (s.room_no || s.roomNo) === rm.room_no);
                      const capacity = parseInt(rm.seater, 10);
                      const isFull = occupants.length >= capacity;
                      const isEmpty = occupants.length === 0;

                      return (
                        <div
                          key={rm.id}
                          onClick={() => setSelectedRoom({ ...rm, occupants })}
                          className={`p-3 rounded-xl border transition cursor-pointer hover:border-indigo-500 ${
                            isFull 
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900' 
                              : isEmpty 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-black text-sm text-indigo-600">Rm {rm.room_no}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border shadow-sm">
                              {rm.seater}-Seater
                            </span>
                          </div>

                          <div className="mt-2 text-xs">
                            <p className="font-bold truncate">{occupants.length > 0 ? occupants[0].name : 'Vacant'}</p>
                            {occupants.length > 1 && <p className="text-[10px] text-slate-400">+ {occupants.length - 1} more</p>}
                          </div>

                          <div className="mt-2 flex justify-between items-center text-[9px] font-bold">
                            <span className={isFull ? 'text-rose-600' : isEmpty ? 'text-emerald-600' : 'text-amber-600'}>
                              {occupants.length} / {capacity} Occupied
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: MASTER DIRECTORY */}
        {activeTab === 'directory' && (sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Resident Directory</h2>
                <p className="text-xs text-slate-500">Filter and search residents by Block, Batch, Course, and Fee Status.</p>
              </div>

              {sessionUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingStudent({ 
                      name: '', roll_no: '', course: 'MBBS', batch: '2023', block: 'Office Wing', room_no: '1', 
                      phone: '', father_name: '', address: '', joining_date: new Date().toISOString().split('T')[0], fee_status: 'Paid' 
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

            {/* Filter Bar */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3 text-xs`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
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

            {/* Resident Directory Table */}
            <div className={`rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} overflow-x-auto shadow-sm`}>
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
                        <td className="p-3 text-right space-x-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setSelectedStudent(std); setProfileModalTab('details'); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          {sessionUser.role === 'admin' && (
                            <button onClick={() => { setEditingStudent(std); setIsEditStudentModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400 italic">No resident records found. Click "Register Resident" above to add residents.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: NOTICE BOARD */}
        {activeTab === 'notices' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Hostel Notice Board</h2>
                <p className="text-xs text-slate-500">Official circulars, fee deadlines, and hostel announcements.</p>
              </div>

              {(sessionUser.role === 'admin' || sessionUser.role === 'authorized') && (
                <button
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                        <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
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
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg flex items-center space-x-1 hover:underline text-[11px]"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{not.file_name || 'View Attachment'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 italic border border-dashed rounded-2xl">
                No notices available. Click "Post Notice" to create one.
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: COMPLAINTS DESK */}
        {activeTab === 'tickets' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Complaints & Student Queries Desk</h2>
                <p className="text-xs text-slate-500">Publicly visible query board with official replies.</p>
              </div>

              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
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
                          <span className="text-xs font-bold text-slate-400">{tkt.block}, Room {tkt.roomNo}</span>
                        </div>
                        <h3 className="font-bold text-base mt-1">{tkt.title}</h3>
                        <p className="text-[10px] text-slate-400">Filed by {tkt.studentName} on {tkt.created_at || 'Recent'}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          tkt.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : tkt.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
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

                    {/* Comments Thread */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-[11px] uppercase text-slate-400">Responses & Comments ({tkt.comments?.length || 0})</h4>

                      {tkt.comments?.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-slate-900 text-xs space-y-0.5 border border-indigo-100 dark:border-slate-800">
                          <div className="flex justify-between font-bold text-[11px]">
                            <span className="text-indigo-600 dark:text-indigo-400">{c.author}</span>
                            <span className="text-slate-400 text-[10px]">{c.date}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.text}</p>
                        </div>
                      ))}

                      {/* Add Comment Input */}
                      {(sessionUser.role === 'admin' || sessionUser.role === 'authorized' || sessionUser.id === tkt.studentId) && (
                        <div className="flex space-x-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={ticketCommentText[tkt.id] || ''}
                            onChange={e => setTicketCommentText({ ...ticketCommentText, [tkt.id]: e.target.value })}
                            className={`flex-1 p-2 text-xs rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                          />
                          <button
                            onClick={() => handleAddTicketComment(tkt.id)}
                            className="px-3 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow"
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
              <div className="p-12 text-center text-xs text-slate-400 italic border border-dashed rounded-2xl">
                No active complaints or queries.
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: HOSTEL MAP */}
        {activeTab === 'map' && (
          <div className="p-6 space-y-4 max-w-5xl mx-auto w-full">
            <h2 className="text-xl font-bold tracking-tight">Hostel Floor Plan & Layout Map</h2>
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

        {/* VIEW 7: APPROVAL DESK */}
        {activeTab === 'approval' && sessionUser.role === 'admin' && (
          <div className="p-6 max-w-4xl mx-auto space-y-4 w-full">
            <h2 className="text-xl font-bold">Pending Registrations</h2>
            <div className="space-y-3">
              {pendingStudents.length > 0 ? (
                pendingStudents.map(user => (
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
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-8 text-center border border-dashed rounded-2xl">No pending registration requests.</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: RESIDENT PROFILE */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-5 shadow-2xl my-8`}>
            
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
                  {(selectedStudent.name || 'A').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStudent.course} • Batch {selectedStudent.batch} • Roll: {selectedStudent.roll_no || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
              <button 
                onClick={() => setProfileModalTab('details')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${profileModalTab === 'details' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Resident Details
              </button>
              <button 
                onClick={() => setProfileModalTab('fee')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${profileModalTab === 'fee' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Year-Wise Fee Ledger
              </button>
              <button 
                onClick={() => setProfileModalTab('history')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${profileModalTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Room Movement History
              </button>
            </div>

            {profileModalTab === 'details' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Block & Room Number</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{selectedStudent.block}, Room {selectedStudent.room_no}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Room Allotment Date</span>
                  <span className="font-bold">{selectedStudent.joining_date || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Phone Number</span>
                  <span className="font-bold">{selectedStudent.phone || 'N/A'}</span>
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

            {profileModalTab === 'fee' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-2.5">Academic Session</th>
                      <th className="p-2.5">Room Held</th>
                      <th className="p-2.5">Amount Paid</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedStudent.fee_ledger?.map((leg, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{leg.year}</td>
                        <td className="p-2.5 text-indigo-600">{leg.block}, Rm {leg.room_no}</td>
                        <td className="p-2.5 font-bold">₹{leg.paid} / ₹{leg.amount}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leg.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {leg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {profileModalTab === 'history' && (
              <div className="space-y-2 text-xs">
                {selectedStudent.history?.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold">Shifted from {h.oldBlock} (Rm {h.oldRoom}) → {h.newBlock} (Rm {h.newRoom})</p>
                      <p className="text-[10px] text-slate-400">{h.reason}</p>
                    </div>
                    <span className="font-mono text-indigo-500 font-bold text-[11px]">{h.date}</span>
                  </div>
                ))}
              </div>
            )}

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
                      reason: 'Annual Room Shift' 
                    });
                    setIsTransferModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-xs"
                >
                  Direct Room Shift
                </button>
                <button
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                    setIsEditStudentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow"
                >
                  Edit Full Profile
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: ROOM OCCUPANTS */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-slate-800'} border p-6 space-y-4 shadow-2xl`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base">{selectedRoom.block} - Room {selectedRoom.room_no}</h3>
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
                    <button onClick={() => { setSelectedStudent(std); setSelectedRoom(null); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl">Room is currently vacant.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DIRECT ROOM SHIFT */}
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
                  placeholder="e.g. Shifted to Room 53 for 2nd Year"
                  value={transferData.reason}
                  onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Confirm Room Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CREATE NOTICE */}
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
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Post Notice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: LODGE COMPLAINT */}
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
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT STUDENT FORM */}
      {isEditStudentModalOpen && editingStudent && sessionUser.role === 'admin' && (
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

              <div className="col-span-2">
                <label className="font-bold block mb-1 text-slate-500">Permanent Address</label>
                <input
                  type="text"
                  value={editingStudent.address || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
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

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow">
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
