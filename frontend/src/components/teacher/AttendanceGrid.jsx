import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Building2,
  Users,
  RefreshCw,
  Save,
  Check,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { API_BASE_URL } from '../../config/api';

export const AttendanceGrid = ({ classes = [], selectedClassId = '', onClassSelect }) => {
  const { user, token, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [activeClassId, setActiveClassId] = useState(
    selectedClassId || (classes[0] ? classes[0]._id : '')
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [studentId]: 'present' | 'late' | 'absent' | 'leave' }
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isExistingRecord, setIsExistingRecord] = useState(false);

  // Sync selectedClassId prop if provided
  useEffect(() => {
    if (selectedClassId && selectedClassId !== activeClassId) {
      setActiveClassId(selectedClassId);
    }
  }, [selectedClassId, activeClassId]);

  // Load students and existing attendance for activeClassId and selectedDate
  const loadClassAttendance = useCallback(async () => {
    if (!activeClassId) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Fetch class details to get enrolled students
      const classRes = await fetch(`${API_BASE_URL}/classes/${activeClassId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const classData = await classRes.json();
      const classStudents = classData.class?.students || [];
      setStudents(classStudents);

      // 2. Fetch existing attendance for this date
      const attRes = await fetch(`${API_BASE_URL}/attendance/${activeClassId}/${selectedDate}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const attData = await attRes.json();

      const initialMap = {};

      if (attData.exists && attData.attendance?.records) {
        setIsExistingRecord(true);
        attData.attendance.records.forEach((r) => {
          const sId = r.studentId?._id || r.studentId;
          initialMap[sId] = r.status;
        });
        // For any student not in saved records, default present
        classStudents.forEach((s) => {
          if (!initialMap[s._id]) initialMap[s._id] = 'present';
        });
      } else {
        setIsExistingRecord(false);
        // Default all enrolled students to 'present'
        classStudents.forEach((s) => {
          initialMap[s._id] = 'present';
        });
      }

      setAttendanceRecords(initialMap);
    } catch (err) {
      console.error('Failed to load attendance grid:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load class attendance data.' });
    } finally {
      setLoading(false);
    }
  }, [activeClassId, selectedDate, token]);

  useEffect(() => {
    loadClassAttendance();
  }, [loadClassAttendance]);

  // 1-Click Batch Action: Mark All Present
  const handleMarkAllPresent = () => {
    sfx.playClick();
    haptics.tap(25);
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = 'present';
    });
    setAttendanceRecords(updated);
  };

  // 1-Click Batch Action: Mark All Absent
  const handleMarkAllAbsent = () => {
    sfx.playClick();
    haptics.tap(25);
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = 'absent';
    });
    setAttendanceRecords(updated);
  };

  // Individual Student Status Change
  const handleStatusChange = (studentId, status) => {
    sfx.playClick();
    haptics.tap(15);
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Submit Attendance
  const handleSubmitAttendance = async () => {
    if (!activeClassId || students.length === 0) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const records = students.map((s) => ({
      studentId: s._id,
      status: attendanceRecords[s._id] || 'present',
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || user?.fileNumber || 'Teacher',
          'x-actor-role': 'teacher',
        },
        body: JSON.stringify({
          classId: activeClassId,
          date: selectedDate,
          teacherId: user?._id,
          records,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        haptics.success();
        setIsExistingRecord(true);
        setStatusMessage({
          type: 'success',
          text: `Daily attendance for ${selectedDate} submitted successfully! (${data.summary?.present || 0} Present, ${data.summary?.absent || 0} Absent)`,
        });
      } else {
        sfx.playError();
        haptics.error();
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to submit attendance.',
        });
      }
    } catch (err) {
      sfx.playError();
      haptics.error();
      setStatusMessage({ type: 'error', text: 'Network error submitting attendance.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute live counts
  const counts = { present: 0, late: 0, absent: 0, leave: 0 };
  Object.values(attendanceRecords).forEach((st) => {
    if (counts[st] !== undefined) counts[st]++;
  });
  const total = students.length;
  const attendanceRate = total > 0 ? Math.round(((counts.present + counts.late * 0.5) / total) * 100) : 0;

  const currentClass = classes.find((c) => c._id === activeClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card: Class & Date Selector */}
      <div
        className={`p-6 rounded-3xl border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black tracking-tight">Daily Attendance Grid</h2>
              {isExistingRecord && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RECORDED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
              <span>
                {currentClass?.className || 'Selected Batch'} · {activeBlock}
              </span>
            </p>
          </div>

          {/* Selectors Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Dropdown */}
            <div className="flex items-center gap-2">
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

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-slate-400">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  sfx.playClick();
                  setSelectedDate(e.target.value);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                  isAmoled
                    ? 'bg-neutral-900 border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 1-Click Action Bar & Summary Counters */}
        <div className="mt-6 pt-5 border-t border-current/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* 1-Click Batch Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleMarkAllPresent}
              disabled={students.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={handleMarkAllAbsent}
              disabled={students.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-all disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" />
              <span>Mark All Absent</span>
            </button>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Present: {counts.present}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Late: {counts.late}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Absent: {counts.absent}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Leave: {counts.leave}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-extrabold">
              {attendanceRate}% Rate
            </div>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Attendance Table */}
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
            <h3 className="font-extrabold text-sm tracking-tight">
              Class Scholars Roster ({students.length} Enrolled)
            </h3>
          </div>

          {/* Submit Attendance Button */}
          <button
            onClick={handleSubmitAttendance}
            disabled={isSubmitting || students.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-black hover:opacity-90 transition-all disabled:opacity-40 shadow-md"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isExistingRecord ? 'Update Attendance' : 'Save & Submit Attendance'}</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 text-brand-cyan animate-spin" />
            <span className="text-xs">Loading scholars for {selectedDate}...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto opacity-30 text-brand-cyan" />
            <p className="font-bold text-sm">No students found in this class.</p>
            <p className="text-xs text-slate-500">
              Use the Excel Importer to onboard students into this batch first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                    isAmoled ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <th className="px-6 py-4">Scholar</th>
                  <th className="px-6 py-4">File Number</th>
                  <th className="px-6 py-4">Points</th>
                  <th className="px-6 py-4 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/5">
                {students.map((student) => {
                  const currentStatus = attendanceRecords[student._id] || 'present';

                  return (
                    <tr
                      key={student._id}
                      className={`transition-colors ${
                        isAmoled ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-brand-cyan border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold">{student.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {student.block || activeBlock}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* File Number */}
                      <td className="px-6 py-4 font-mono font-bold text-brand-cyan">
                        {student.fileNumber}
                      </td>

                      {/* Points */}
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        {student.points !== undefined ? student.points : 500} pts
                      </td>

                      {/* Status Selector Buttons */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center p-1 rounded-xl bg-black/20 border border-current/10 gap-1">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-500 text-black shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            Present
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-400 text-black shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-amber-400'
                            }`}
                          >
                            Late
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-500 text-white shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            Absent
                          </button>

                          {/* Leave */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'leave')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'leave'
                                ? 'bg-blue-500 text-white shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-blue-400'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceGrid;
