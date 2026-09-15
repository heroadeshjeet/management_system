import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Bell,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  Users,
  Building2,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';

export const NoticeCenter = ({ classes = [], selectedClassId = '', onClassSelect }) => {
  const { user, token, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [activeClassId, setActiveClassId] = useState(
    selectedClassId || (classes[0] ? classes[0]._id : '')
  );
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [isTest, setIsTest] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== activeClassId) {
      setActiveClassId(selectedClassId);
    }
  }, [selectedClassId, activeClassId]);

  // Load class scholars
  const loadClassScholars = useCallback(async () => {
    if (!activeClassId) return;

    try {
      const res = await fetch(`/api/classes/${activeClassId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const classStudents = data.class?.students || [];
        setStudents(classStudents);
        // By default select all students in the class
        setSelectedStudentIds(new Set(classStudents.map((s) => s._id)));
      }
    } catch (err) {
      console.error('Failed to load scholars for notices:', err);
    }
  }, [activeClassId, token]);

  // Load dispatched notices history
  const loadNoticesHistory = useCallback(async () => {
    if (!activeClassId) return;
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/notifications?classId=${activeClassId}&limit=20`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecentNotices(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notices history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeClassId, token]);

  useEffect(() => {
    loadClassScholars();
    loadNoticesHistory();
  }, [loadClassScholars, loadNoticesHistory]);

  // Toggle select all
  const handleToggleSelectAll = () => {
    sfx.playClick();
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s._id)));
    }
  };

  // Toggle single student
  const handleToggleStudent = (studentId) => {
    sfx.playClick();
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Dispatch Notice
  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      sfx.playError();
      setStatusMessage({ type: 'error', text: 'Notice message text is required.' });
      return;
    }

    if (selectedStudentIds.size === 0) {
      sfx.playError();
      setStatusMessage({ type: 'error', text: 'Select at least one recipient scholar.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || user?.fileNumber || 'Teacher',
          'x-actor-role': 'teacher',
        },
        body: JSON.stringify({
          classId: activeClassId,
          targetAudience: Array.from(selectedStudentIds),
          message: message.trim(),
          isTest,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        setMessage('');
        setIsTest(false);
        setStatusMessage({
          type: 'success',
          text: data.message || 'Notice dispatched successfully.',
        });
        loadNoticesHistory();
      } else {
        sfx.playError();
        setStatusMessage({ type: 'error', text: data.message || 'Failed to dispatch notice.' });
      }
    } catch (err) {
      sfx.playError();
      setStatusMessage({ type: 'error', text: 'Network error sending notice.' });
    } finally {
      setIsSending(false);
    }
  };

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
              <Bell className="w-5 h-5 text-brand-indigo" />
              <h2 className="text-xl font-black tracking-tight">
                Academic Messaging & MST Notice Center
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Broadcast batch announcements or trigger official Mid-Semester Test (MST) evaluation
              notices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-slate-400">Target Class:</label>
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

      {/* Status message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Notice Composer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipient Scholar Selection List */}
        <div
          className={`lg:col-span-5 p-5 rounded-3xl border flex flex-col ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Select Recipients ({selectedStudentIds.size}/{students.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-cyan hover:underline"
            >
              {selectedStudentIds.size === students.length ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>{selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 flex-1">
            {students.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No scholars currently enrolled in {currentClass?.className || 'this class'}.
              </div>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudentIds.has(student._id);

                return (
                  <label
                    key={student._id}
                    onClick={() => handleToggleStudent(student._id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                        : isAmoled
                        ? 'bg-neutral-900/40 border-white/5 text-slate-400 hover:bg-neutral-900/70'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent label onClick
                        className="rounded bg-neutral-800 border-neutral-700 text-brand-cyan focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-xs">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.fileNumber}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-400">
                      {student.points !== undefined ? student.points : 500} pts
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Composer & MST Trigger */}
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-cyan" />
              <span>Compose Class Notice</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Batch: <strong className="text-brand-cyan">{currentClass?.className}</strong>
            </span>
          </div>

          <form onSubmit={handleSendNotice} className="space-y-4">
            {/* Notice Message Textarea */}
            <div className="space-y-1.5">
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter assignment deadlines, class scheduling updates, or Mid-Semester Examination instructions..."
                className={`w-full p-4 rounded-2xl border text-xs focus:outline-none transition-all resize-none ${
                  isAmoled
                    ? 'bg-neutral-900/80 border-white/10 text-white focus:border-brand-cyan'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 px-1">
                <span>Markdown & plain text supported</span>
                <span>{message.length} characters</span>
              </div>
            </div>

            {/* CRUCIAL CHECKBOX: Mark as Test / MST Notification */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isTest
                  ? 'bg-purple-950/30 border-purple-500/40 text-purple-200 shadow-neon-purple/20'
                  : isAmoled
                  ? 'bg-neutral-900/40 border-white/10 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTest}
                  onChange={(e) => setIsTest(e.target.checked)}
                  className="mt-0.5 rounded bg-neutral-800 border-neutral-700 text-purple-500 focus:ring-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Zap className={`w-3.5 h-3.5 ${isTest ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>Mark as Test/MST Notification</span>
                    {isTest && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        PHASE 5 GRADING ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Flag this dispatch as an official examination test (MST). In Phase 5, this triggers
                    automated evaluation, submission tracking, and grading records.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                Delivering to <strong>{selectedStudentIds.size}</strong> recipients
              </div>

              <button
                type="submit"
                disabled={isSending || selectedStudentIds.size === 0 || !message.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-md ${
                  isTest
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                    : 'bg-gradient-to-r from-brand-cyan to-blue-600 text-black hover:opacity-90'
                }`}
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSending
                    ? 'Dispatching...'
                    : isTest
                    ? 'Dispatch MST Examination Notice'
                    : 'Send Notice'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dispatched Notices History Feed */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b border-current/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <h3 className="font-extrabold text-sm tracking-tight">
              Notice Broadcast Stream · {currentClass?.className}
            </h3>
          </div>
          <button
            onClick={loadNoticesHistory}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading notices stream...</div>
        ) : recentNotices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No notices broadcasted yet to this class.
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotices.map((notice) => (
              <div
                key={notice._id}
                className={`p-4 rounded-2xl border space-y-2 ${
                  notice.isTest
                    ? 'bg-purple-950/15 border-purple-500/30'
                    : isAmoled
                    ? 'bg-neutral-900/60 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {notice.isTest ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>TEST / MST NOTICE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
                        ANNOUNCEMENT
                      </span>
                    )}
                    <span className="font-bold text-slate-300">
                      {notice.senderName || 'Faculty'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {new Date(notice.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans pl-1">
                  {notice.message}
                </p>

                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    Delivered to {notice.targetAudience?.length || 0} scholars
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeCenter;
