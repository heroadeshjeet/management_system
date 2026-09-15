import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Building2,
  Users,
  Activity,
  Database,
  CheckCircle2,
  Server,
  LogOut,
  Terminal,
  UserPlus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Cpu,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { API_BASE_URL } from '../../config/api';
import { ClassManagement } from '../classes/ClassManagement';

export const AdminDashboard = () => {
  const { user, token, activeBlock, logout } = useAuth();
  const { isAmoled } = useTheme();

  // Navigation tabs: 'overview' | 'teachers' | 'blackbox'
  const [activeTab, setActiveTab] = useState('teachers');

  // Teachers State
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    fileNumber: '',
    department: 'Department of Computer Science & Engineering',
    password: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [teacherActionMsg, setTeacherActionMsg] = useState(null);

  // Blackbox Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);

  // System Database Info
  const [dbInfo, setDbInfo] = useState({
    status: 'connected',
    host: 'adeshjeetscluster.acwuyxt.mongodb.net',
  });

  // Fetch teachers from backend
  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Admin',
          'x-actor-role': 'admin',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  }, [token, user]);

  // Fetch blackbox audit logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blackbox/logs?limit=150`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Admin',
          'x-actor-role': 'admin',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [token, user]);

  // Health check
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.database) {
          setDbInfo(data.database);
        }
      })
      .catch(() => {});
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchTeachers();
    fetchLogs();
  }, [fetchTeachers, fetchLogs]);

  // Optional auto-refresh for Blackbox terminal
  useEffect(() => {
    if (!autoRefreshLogs || activeTab !== 'blackbox') return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefreshLogs, activeTab, fetchLogs]);

  // Handle Add Teacher Form Submit
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.name.trim() || !newTeacher.fileNumber.trim()) {
      sfx.playError();
      setTeacherActionMsg({ type: 'error', text: 'Name and Teacher ID / File Number are required.' });
      return;
    }

    setFormSubmitting(true);
    setTeacherActionMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Admin',
          'x-actor-role': 'admin',
        },
        body: JSON.stringify({
          name: newTeacher.name.trim(),
          fileNumber: newTeacher.fileNumber.trim(),
          department: newTeacher.department.trim(),
          password: newTeacher.password.trim() || '123',
          block: activeBlock,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        setTeacherActionMsg({ type: 'success', text: data.message });
        setNewTeacher({
          name: '',
          fileNumber: '',
          department: 'Department of Computer Science & Engineering',
          password: '',
        });
        setShowAddModal(false);
        fetchTeachers();
        fetchLogs(); // refresh audit logs
      } else {
        sfx.playError();
        setTeacherActionMsg({ type: 'error', text: data.message || 'Failed to add teacher.' });
      }
    } catch (err) {
      sfx.playError();
      setTeacherActionMsg({ type: 'error', text: 'Network error communicating with server.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Teacher
  const handleRemoveTeacher = async (teacher) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove Faculty Member "${teacher.name}" (ID: ${teacher.fileNumber})?`
    );
    if (!confirmDelete) return;

    try {
      sfx.playClick();
      const res = await fetch(`${API_BASE_URL}/admin/teachers/${teacher._id || teacher.fileNumber}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Admin',
          'x-actor-role': 'admin',
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        setTeacherActionMsg({ type: 'success', text: data.message });
        fetchTeachers();
        fetchLogs(); // refresh audit logs
      } else {
        sfx.playError();
        setTeacherActionMsg({ type: 'error', text: data.message || 'Failed to remove teacher.' });
      }
    } catch (err) {
      sfx.playError();
      setTeacherActionMsg({ type: 'error', text: 'Server error while deleting teacher.' });
    }
  };

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.fileNumber && t.fileNumber.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q))
    );
  });

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.action === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Welcome & Facility Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl transition-all border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Command Center · Phase 2</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>
                Assigned Directorate: <strong>{activeBlock}</strong> (Suite 401)
              </span>
            </p>
          </div>

          {/* MongoDB Atlas Live Health Badge */}
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${
              isAmoled ? 'bg-neutral-900/90 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5"></span>
            </div>
            <div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>MongoDB Atlas Synced</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                aryabhatta_db @ {dbInfo?.host ? dbInfo.host.split('.')[0] : 'adeshjeetscluster'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Command Center Layout: Side Nav + Workspace Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-3xl border space-y-2 sticky top-24 ${
              isAmoled
                ? 'glass-panel-amoled border-white/10 text-white'
                : 'glass-panel-light border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Command Modules
            </div>

            {/* Manage Teachers Tab */}
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('teachers');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-brand-cyan border border-cyan-500/40 shadow-neon-cyan/20'
                  : isAmoled
                  ? 'text-slate-300 hover:bg-white/5 border border-transparent'
                  : 'text-slate-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Manage Teachers</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'teachers'
                    ? 'bg-cyan-500/30 text-cyan-200'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {teachers.length}
              </span>
            </button>

            {/* Blackbox Logs Tab */}
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('blackbox');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'blackbox'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-neon-purple/20'
                  : isAmoled
                  ? 'text-slate-300 hover:bg-white/5 border border-transparent'
                  : 'text-slate-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4" />
                <span>Blackbox Logs</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Classes & Student Excel Import Tab */}
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('classes');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'classes'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-neon-emerald/20'
                  : isAmoled
                  ? 'text-slate-300 hover:bg-white/5 border border-transparent'
                  : 'text-slate-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Classes & Students</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                EXCEL
              </span>
            </button>

            {/* Overview / Facilities Tab */}
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('overview');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40'
                  : isAmoled
                  ? 'text-slate-300 hover:bg-white/5 border border-transparent'
                  : 'text-slate-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Kalam Overview</span>
              </div>
            </button>

            <div className="pt-4 border-t border-current/10">
              {/* Logout Button */}
              <button
                onClick={() => {
                  sfx.playClick();
                  logout();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${
                  isAmoled
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Stage */}
        <main className="lg:col-span-9 space-y-6">
          {/* Action notification toast banner */}
          {teacherActionMsg && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-sm animate-fade-in ${
                teacherActionMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {teacherActionMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{teacherActionMsg.text}</span>
              </div>
              <button
                onClick={() => setTeacherActionMsg(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW 1: MANAGE TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Controls bar: Search, Add Teacher Trigger, Refresh */}
              <div
                className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                  isAmoled
                    ? 'glass-panel-amoled border-white/10 text-white'
                    : 'glass-panel-light border-slate-200 text-slate-900'
                }`}
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search by faculty name, teacher ID, or department..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                      isAmoled
                        ? 'bg-black/40 border-white/10 text-white focus:border-brand-cyan'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-brand-indigo'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sfx.playClick();
                      fetchTeachers();
                    }}
                    title="Refresh faculty list"
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isAmoled
                        ? 'border-white/10 hover:bg-white/10 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingTeachers ? 'animate-spin text-brand-cyan' : ''}`}
                    />
                  </button>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-cyan to-blue-600 text-black hover:opacity-90 transition-all shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New Teacher</span>
                  </button>
                </div>
              </div>

              {/* Add Teacher Modal Dialog */}
              {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                  <div
                    className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 ${
                      isAmoled
                        ? 'bg-neutral-950 border-white/15 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-current/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black tracking-tight">Register New Faculty</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Allocate record to {activeBlock}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddTeacher} className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeacher.name}
                          onChange={(e) =>
                            setNewTeacher({ ...newTeacher, name: e.target.value })
                          }
                          placeholder="e.g. Prof. Arvind Kumar"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                            isAmoled
                              ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                          }`}
                        />
                      </div>

                      {/* Teacher ID / File Number */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Teacher ID / File Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeacher.fileNumber}
                          onChange={(e) =>
                            setNewTeacher({ ...newTeacher, fileNumber: e.target.value })
                          }
                          placeholder="e.g. T102"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                            isAmoled
                              ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                          }`}
                        />
                        <p className="text-[11px] text-slate-400">
                          This fileNumber serves as the single-door login identifier.
                        </p>
                      </div>

                      {/* Department */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Department
                        </label>
                        <input
                          type="text"
                          value={newTeacher.department}
                          onChange={(e) =>
                            setNewTeacher({ ...newTeacher, department: e.target.value })
                          }
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                            isAmoled
                              ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                          }`}
                        />
                      </div>

                      {/* Password (Optional, default 123) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Initial Password
                        </label>
                        <input
                          type="text"
                          value={newTeacher.password}
                          onChange={(e) =>
                            setNewTeacher({ ...newTeacher, password: e.target.value })
                          }
                          placeholder="Default '123' if blank"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                            isAmoled
                              ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                          }`}
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={formSubmitting}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-cyan text-black hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
                        >
                          {formSubmitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          <span>Save & Deploy</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Teachers Data Table */}
              <div
                className={`rounded-3xl border overflow-hidden ${
                  isAmoled
                    ? 'glass-panel-amoled border-white/10 text-white'
                    : 'glass-panel-light border-slate-200 text-slate-900'
                }`}
              >
                <div className="p-5 border-b border-current/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-cyan" />
                    <h3 className="font-extrabold text-base tracking-tight">
                      Faculty Roster · Abdul Kalam Block
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-brand-cyan border border-cyan-500/20 font-bold">
                    {filteredTeachers.length} Active Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr
                        className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${
                          isAmoled ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <th className="px-6 py-4">Faculty Member</th>
                        <th className="px-6 py-4">Teacher ID</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Assigned Block</th>
                        <th className="px-6 py-4">Points</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-current/5">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="font-medium">No faculty members found.</p>
                            <p className="text-xs mt-1 text-slate-500">
                              Click "Add New Teacher" to register faculty into MongoDB.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((teacher) => (
                          <tr
                            key={teacher._id || teacher.fileNumber}
                            className={`transition-colors ${
                              isAmoled ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-brand-cyan border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                                  {teacher.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold">{teacher.name}</div>
                                  <div className="text-xs text-slate-400">
                                    {teacher.roleTitle || 'Faculty Member'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-xs text-brand-cyan">
                              {teacher.fileNumber}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                              {teacher.department || 'Computer Science'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
                                <Building2 className="w-3 h-3" />
                                <span>{teacher.block || activeBlock}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-xs text-emerald-400">
                              {teacher.points || 500} pts
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRemoveTeacher(teacher)}
                                title="Remove faculty member"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isAmoled
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: BLACKBOX AUDIT LOGS (TERMINAL STYLED) */}
          {activeTab === 'blackbox' && (
            <div className="space-y-4">
              {/* Terminal Window Header Card */}
              <div className="rounded-3xl border border-neutral-800 bg-black text-white shadow-2xl overflow-hidden font-mono">
                {/* Mac / Unix Terminal Window Titlebar */}
                <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    </div>
                    <div className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>blackbox-daemon@aryabhatta:~/logs</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Terminal Controls */}
                  <div className="flex items-center gap-3 text-xs">
                    {/* Action Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400 text-[11px]">Filter:</span>
                      <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded border border-neutral-700 focus:outline-none"
                      >
                        <option value="ALL">ALL EVENTS</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="TEACHER_ADDED">TEACHER_ADDED</option>
                        <option value="TEACHER_REMOVED">TEACHER_REMOVED</option>
                        <option value="SYSTEM_BOOTSTRAP">BOOTSTRAP</option>
                      </select>
                    </div>

                    {/* Auto-refresh toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-400 hover:text-neutral-200">
                      <input
                        type="checkbox"
                        checked={autoRefreshLogs}
                        onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                        className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                      />
                      <span className="text-[11px]">Stream 5s</span>
                    </label>

                    {/* Manual Refresh */}
                    <button
                      onClick={() => {
                        sfx.playClick();
                        fetchLogs();
                      }}
                      title="Fetch latest audit logs"
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-emerald-400' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Terminal Console Body */}
                <div className="p-5 max-h-[580px] overflow-y-auto space-y-2.5 text-xs select-text bg-[#030712] border-b border-neutral-800">
                  <div className="text-neutral-500 text-[11px] pb-2 border-b border-neutral-800/80">
                    # Aryabhatta Security Blackbox · Abdul Kalam Block Audit Log
                    <br /># Connected collection: aryabhatta_db.blackboxes · Sorted newest first
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500">
                      [INFO] No blackbox records matching filter.
                    </div>
                  ) : (
                    filteredLogs.map((log, idx) => {
                      const dateStr = new Date(log.timestamp || log.createdAt).toLocaleString();
                      const isLogin = log.action === 'LOGIN';
                      const isTeacherAdd = log.action === 'TEACHER_ADDED';
                      const isTeacherRemove = log.action === 'TEACHER_REMOVED';
                      const isBootstrap = log.action === 'SYSTEM_BOOTSTRAP';

                      const actionColor = isLogin
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : isTeacherAdd
                        ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                        : isTeacherRemove
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                        : isBootstrap
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-purple-400 bg-purple-500/10 border-purple-500/30';

                      return (
                        <div
                          key={log._id || idx}
                          className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-neutral-500 text-[11px]">[{dateStr}]</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${actionColor}`}
                              >
                                {log.action}
                              </span>
                              <span className="text-neutral-300 font-bold">
                                {log.actorName}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                ({log.role})
                              </span>
                            </div>
                            <p className="text-neutral-300 pl-1 text-[11px] leading-relaxed">
                              &gt; {log.details}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Terminal Status Bar */}
                <div className="px-5 py-2.5 bg-neutral-950 text-[11px] text-neutral-400 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Total Events Captured: {logs.length}</span>
                  </div>
                  <div className="text-neutral-500">
                    Kalam-SecOS v2.0 · MongoDB Mongoose Driver
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: OVERVIEW / CAMPUS METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className={`p-5 rounded-3xl border transition-all ${
                    isAmoled
                      ? 'bg-neutral-950/80 border-white/10 text-white'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Faculty
                    </span>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-brand-cyan">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tight">{teachers.length} Professors</div>
                  <div className="text-xs text-slate-400 mt-1">Verified in MongoDB Atlas</div>
                </div>

                <div
                  className={`p-5 rounded-3xl border transition-all ${
                    isAmoled
                      ? 'bg-neutral-950/80 border-white/10 text-white'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Blackbox Entries
                    </span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tight">{logs.length} Events</div>
                  <div className="text-xs text-slate-400 mt-1">Audit log records stored</div>
                </div>

                <div
                  className={`p-5 rounded-3xl border transition-all ${
                    isAmoled
                      ? 'bg-neutral-950/80 border-white/10 text-white'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Facility Status
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tight">100% Operational</div>
                  <div className="text-xs text-emerald-400 mt-1">Abdul Kalam Block Core</div>
                </div>
              </div>

              {/* Abdul Kalam Laboratories Roster */}
              <div
                className={`p-6 rounded-3xl border ${
                  isAmoled
                    ? 'glass-panel-amoled border-white/10 text-white'
                    : 'glass-panel-light border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-cyan" />
                    <span>Abdul Kalam Block Wing Status</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Optimal Operation
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      name: 'Kalam Advanced AI & Deep Learning Center',
                      floor: '4th Floor, Room 402',
                      capacity: '60 Workstations',
                      status: 'Online',
                      load: '82%',
                    },
                    {
                      name: 'Robotics & Embedded Automation Lab',
                      floor: '3rd Floor, Room 305',
                      capacity: '45 Workstations',
                      status: 'Online',
                      load: '65%',
                    },
                    {
                      name: 'Dr. APJ Abdul Kalam Central Seminar Hall',
                      floor: 'Ground Floor, Auditorium 1',
                      capacity: '350 Seats',
                      status: 'Reserved',
                      load: '100%',
                    },
                    {
                      name: 'Cloud Computing & Cyber Defense Center',
                      floor: '2nd Floor, Room 210',
                      capacity: '50 Workstations',
                      status: 'Online',
                      load: '40%',
                    },
                  ].map((facility, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAmoled ? 'bg-neutral-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold">{facility.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {facility.floor} · {facility.capacity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-brand-cyan">{facility.load} Load</div>
                          <div className="text-[10px] text-slate-400">{facility.status}</div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: CLASS MANAGEMENT & STUDENT EXCEL IMPORTER */}
          {activeTab === 'classes' && <ClassManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
