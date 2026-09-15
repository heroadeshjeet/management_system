import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Minus,
  Search,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';

export const ManagePointsView = ({ classes = [], selectedClassId = '', onClassSelect }) => {
  const { user, token, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [activeClassId, setActiveClassId] = useState(
    selectedClassId || (classes[0] ? classes[0]._id : '')
  );
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== activeClassId) {
      setActiveClassId(selectedClassId);
    }
  }, [selectedClassId, activeClassId]);

  // Load class students
  const loadStudents = useCallback(async () => {
    if (!activeClassId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${activeClassId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.class?.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClassId, token]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Adjust Student Points (+ or -)
  const handleAdjustPoints = async (student, delta, reason = '') => {
    setProcessingId(student._id);
    sfx.playClick();

    try {
      const res = await fetch(`/api/students/${student._id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || user?.fileNumber || 'Teacher',
          'x-actor-role': 'teacher',
        },
        body: JSON.stringify({
          delta,
          reason: reason || (delta > 0 ? 'Merit & academic participation' : 'Behavioral infraction'),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        // Update local state
        setStudents((prev) =>
          prev.map((s) => (s._id === student._id ? { ...s, points: data.points } : s))
        );
        setActionNotice({
          type: 'success',
          text: `${delta >= 0 ? 'Awarded +' : 'Deducted '}${Math.abs(delta)} points for ${student.name}. New Balance: ${data.points} pts`,
        });
      } else {
        sfx.playError();
        setActionNotice({
          type: 'error',
          text: data.message || 'Failed to update student points.',
        });
      }
    } catch (err) {
      sfx.playError();
      setActionNotice({ type: 'error', text: 'Network error updating points.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.fileNumber && s.fileNumber.toLowerCase().includes(q))
    );
  });

  const currentClass = classes.find((c) => c._id === activeClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-3xl border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-cyan" />
              <h2 className="text-xl font-black tracking-tight">Student Behavioral Points</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Incentivize conduct, academic diligence, and participation across {activeBlock}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-slate-400">Class:</label>
            <select
              value={activeClassId}
              onChange={(e) => {
                sfx.playClick();
                setActiveClassId(e.target.value);
                if (onClassSelect) onClassSelect(e.target.value);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                isAmoled
                  ? 'bg-neutral-900 border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} ({c.studentCount || 0} scholars)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Notice banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter students by name or file number..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
            isAmoled
              ? 'bg-black/40 border-white/10 text-white focus:border-brand-cyan'
              : 'bg-white border-slate-200 text-slate-900 focus:border-brand-indigo'
          }`}
        />
      </div>

      {/* Students List with Point Controls */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 text-brand-cyan animate-spin" />
            <span className="text-xs">Loading scholars...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div
            className={`p-12 text-center rounded-3xl border ${
              isAmoled ? 'bg-neutral-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Users className="w-10 h-10 mx-auto opacity-30 text-brand-cyan mb-2" />
            <p className="font-bold text-sm">No scholars found matching your search.</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const points = student.points !== undefined ? student.points : 500;
            const isProcessing = processingId === student._id;

            return (
              <div
                key={student._id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isAmoled
                    ? 'glass-panel-amoled border-white/10 text-white hover:border-white/20'
                    : 'glass-panel-light border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
              >
                {/* Scholar Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-brand-cyan border border-cyan-500/30 flex items-center justify-center font-black text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{student.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      File ID: <span className="text-brand-cyan font-bold">{student.fileNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Points Badge & Adjustment Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {/* Current Points Badge */}
                  <div
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                      points >= 500
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : points >= 300
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{points} pts</span>
                  </div>

                  {/* Aesthetic +/- Control Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* -10 Button */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAdjustPoints(student, -10)}
                      title="Deduct 10 points"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 transition-all disabled:opacity-40"
                    >
                      -10
                    </button>

                    {/* -5 Button */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAdjustPoints(student, -5)}
                      title="Deduct 5 points"
                      className="p-1.5 rounded-lg text-xs font-extrabold border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 transition-all disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {/* +5 Button */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAdjustPoints(student, 5)}
                      title="Award 5 points"
                      className="p-1.5 rounded-lg text-xs font-extrabold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* +10 Button */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAdjustPoints(student, 10)}
                      title="Award 10 points"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManagePointsView;
