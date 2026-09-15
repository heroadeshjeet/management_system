import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  Save,
  Trophy,
  Zap,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { API_BASE_URL } from '../../config/api';
import { TestLeaderboardModal } from './TestLeaderboardModal';

export const GradeTestView = ({
  notificationId: propNotificationId,
  notification: initialNotice,
  onBack,
  onGraded,
}) => {
  const { user, token } = useAuth();
  const { isAmoled } = useTheme();

  // Extract notificationId from props or window.location.pathname
  const notificationId = useMemo(() => {
    if (propNotificationId) return propNotificationId;
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/teacher\/grade-test\/([^/?#]+)/);
      if (match) return match[1];
    }
    return null;
  }, [propNotificationId]);

  const [notice, setNotice] = useState(initialNotice || null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Configuration controls
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);

  // Student scores: { [studentId]: marksNumber }
  const [scores, setScores] = useState({});
  const [studentList, setStudentList] = useState([]);

  // Leaderboard modal state
  const [savedTestResult, setSavedTestResult] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Fetch notice details, students in class, and any existing test marks
  const loadTestData = useCallback(async () => {
    if (!notificationId) {
      setLoading(false);
      setStatusMessage({ type: 'error', text: 'No Test Notification ID specified.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Fetch Notice Details (if not provided)
      let currentNotice = notice;
      if (!currentNotice) {
        const noticeRes = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (noticeRes.ok) {
          const noticeData = await noticeRes.json();
          currentNotice = noticeData.notification;
          setNotice(currentNotice);
        }
      }

      const classId = currentNotice?.classId?._id || currentNotice?.classId;

      // 2. Fetch existing marks for this test
      const marksRes = await fetch(`${API_BASE_URL}/tests/marks/${notificationId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const marksData = await marksRes.json();

      let existingScoresMap = {};
      if (marksRes.ok && marksData.exists && marksData.testResult) {
        setSavedTestResult(marksData.testResult);
        setTotalMarks(marksData.testResult.totalMarks || 100);
        setPassingMarks(marksData.testResult.passingMarks || 40);

        (marksData.testResult.scores || []).forEach((s) => {
          const sId = s.studentId?._id || s.studentId;
          existingScoresMap[sId] = s.marksObtained;
        });
      }

      // 3. Fetch Class Scholars list
      if (classId) {
        const classRes = await fetch(`${API_BASE_URL}/classes/${classId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (classRes.ok) {
          const classData = await classRes.json();
          const enrolled = classData.class?.students || [];
          setStudentList(enrolled);

          // Populate initial scores state
          const initialMap = {};
          enrolled.forEach((stu) => {
            initialMap[stu._id] =
              existingScoresMap[stu._id] !== undefined ? existingScoresMap[stu._id] : '';
          });
          setScores(initialMap);
        }
      } else if (marksData.testResult?.scores) {
        // Fallback from testResult scores if class wasn't directly found
        const extracted = marksData.testResult.scores.map((s) => s.studentId);
        setStudentList(extracted);
        setScores(existingScoresMap);
      }
    } catch (err) {
      console.error('Failed to load test grading data:', err);
      setStatusMessage({ type: 'error', text: 'Error loading test evaluation data.' });
    } finally {
      setLoading(false);
    }
  }, [notificationId, notice, token]);

  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  // Handle Score Change
  const handleScoreChange = (studentId, value) => {
    // Numeric clamp between 0 and totalMarks
    if (value === '') {
      setScores((prev) => ({ ...prev, [studentId]: '' }));
      return;
    }
    const num = Math.min(Number(totalMarks), Math.max(0, Number(value)));
    setScores((prev) => ({ ...prev, [studentId]: num }));
  };

  // Quick fill all with a percentage or benchmark
  const handleBatchFill = (pct) => {
    sfx.playClick();
    haptics.tap(20);
    const benchmark = Math.round((Number(totalMarks) * pct) / 100);
    const updated = {};
    studentList.forEach((stu) => {
      updated[stu._id] = benchmark;
    });
    setScores(updated);
  };

  // Submit test marks
  const handleSubmitMarks = async (e) => {
    e.preventDefault();

    if (passingMarks > totalMarks) {
      sfx.playError();
      setStatusMessage({
        type: 'error',
        text: 'Passing marks cannot exceed total examination marks.',
      });
      return;
    }

    if (studentList.length === 0) {
      sfx.playError();
      setStatusMessage({ type: 'error', text: 'No students available to grade.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const scoresPayload = studentList.map((stu) => ({
        studentId: stu._id,
        marksObtained: scores[stu._id] === '' ? 0 : Number(scores[stu._id]),
      }));

      const classId = notice?.classId?._id || notice?.classId;

      const res = await fetch(`${API_BASE_URL}/tests/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || user?.fileNumber || 'Teacher',
          'x-actor-role': 'teacher',
        },
        body: JSON.stringify({
          notificationId,
          classId,
          teacherId: user?._id,
          totalMarks: Number(totalMarks),
          passingMarks: Number(passingMarks),
          scores: scoresPayload,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        haptics.success();
        setSavedTestResult(data.testResult);
        setStatusMessage({
          type: 'success',
          text: `Marks saved successfully! ${data.stats?.passedCount || 0}/${studentList.length} scholars passed.`,
        });

        if (onGraded) onGraded(data.testResult);

        // Immediately trigger celebration leaderboard
        setShowLeaderboard(true);
      } else {
        sfx.playError();
        haptics.error();
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to submit test evaluation.',
        });
      }
    } catch (err) {
      console.error('Submit marks error:', err);
      sfx.playError();
      haptics.error();
      setStatusMessage({ type: 'error', text: 'Server error while submitting marks.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time calculation of pass/fail counts
  const stats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let totalAssigned = 0;

    studentList.forEach((stu) => {
      const val = scores[stu._id];
      if (val !== '' && val !== undefined) {
        totalAssigned++;
        if (Number(val) >= Number(passingMarks)) {
          passed++;
        } else {
          failed++;
        }
      }
    });

    const passRate =
      totalAssigned > 0 ? Math.round((passed / totalAssigned) * 100) : 0;

    return { passed, failed, totalAssigned, passRate };
  }, [studentList, scores, passingMarks]);

  const handleBack = () => {
    sfx.playClick();
    // Revert browser URL if it was on grade-test
    if (typeof window !== 'undefined' && window.location.pathname.includes('/teacher/grade-test')) {
      window.history.pushState({}, '', '/');
    }
    if (onBack) onBack();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm ${
            isAmoled
              ? 'bg-neutral-900 border-white/10 hover:bg-neutral-800 text-slate-300'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Faculty Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          {savedTestResult && (
            <button
              onClick={() => {
                sfx.playClick();
                setShowLeaderboard(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-md"
            >
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>View Leaderboard 🥇</span>
            </button>
          )}

          <button
            onClick={loadTestData}
            disabled={loading}
            className={`p-2 rounded-2xl border text-slate-400 hover:text-white transition-all ${
              isAmoled ? 'border-white/10' : 'border-slate-200'
            }`}
            title="Reload evaluation data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Banner / Examination Info */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Test / MST Evaluation Engine · Phase 5</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Class Examination Grading & Evaluation
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {notice ? (
                <>
                  Official MST Notice: <span className="font-semibold text-white">"{notice.message}"</span>
                  {notice.classId?.className && (
                    <> · Class: <strong>{notice.classId.className}</strong></>
                  )}
                </>
              ) : (
                'Assign grades, calibrate passing thresholds, and automatically broadcast celebratory leaderboards.'
              )}
            </p>
          </div>

          <div
            className={`px-4 py-3 rounded-2xl border text-xs font-semibold shrink-0 ${
              isAmoled
                ? 'bg-neutral-900/90 border-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Enrolled Scholars
            </span>
            <span className="text-lg font-black text-brand-cyan">
              {studentList.length} Students
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel: Total Marks, Passing Marks & Real-time Benchmark Stats */}
      <div
        className={`p-6 rounded-3xl border space-y-6 ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b border-current/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              Grading Benchmark & Controls
            </h2>
          </div>

          {/* Quick preset fills */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Quick Benchmarks:</span>
            <button
              type="button"
              onClick={() => handleBatchFill(40)}
              className="px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold hover:bg-white/10 text-slate-300"
            >
              Fill 40% (Pass)
            </button>
            <button
              type="button"
              onClick={() => handleBatchFill(75)}
              className="px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold hover:bg-white/10 text-slate-300"
            >
              Fill 75% (Distinction)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Marks Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">
              Total Examination Marks
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1000"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Math.max(1, Number(e.target.value)))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-black transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 ${
                  isAmoled
                    ? 'bg-neutral-900 border-white/15 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">
                PTS
              </span>
            </div>
          </div>

          {/* Passing Marks Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">
              Passing Benchmark Marks
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={totalMarks}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Math.max(0, Number(e.target.value)))}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-black transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                  isAmoled
                    ? 'bg-neutral-900 border-white/15 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">
                ({Math.round((passingMarks / totalMarks) * 100)}%)
              </span>
            </div>
          </div>

          {/* Passing Count Stat */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isAmoled
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">
                Meeting Benchmark
              </span>
              <span className="text-base font-black">
                {stats.passed} Passed ({stats.passRate}%)
              </span>
            </div>
          </div>

          {/* Failing Count Stat */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isAmoled
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">
                Below Benchmark
              </span>
              <span className="text-base font-black">
                {stats.failed} Scholars
              </span>
            </div>
          </div>
        </div>

        {passingMarks > totalMarks && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Warning:</strong> Passing marks cannot be higher than Total Marks. Please adjust your benchmark.
            </span>
          </div>
        )}
      </div>

      {/* Status Feedback Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grading Table with Real-time Conditional Validation */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-current/10 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-cyan" />
            <h3 className="font-extrabold text-sm tracking-tight">
              Class Roster & Marks Evaluation Table
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            Real-time validation: <span className="text-emerald-400 font-bold">Green = Passing</span>,{' '}
            <span className="text-rose-400 font-bold">Red = Below Benchmark</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-cyan" />
            <p className="text-xs">Loading scholar roster and existing evaluation records...</p>
          </div>
        ) : studentList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-sm font-bold">No students registered in this class.</p>
            <p className="text-xs">
              Ensure the class has scholars enrolled via the Class Management Excel engine.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitMarks} className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-current/10 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-4">Scholar Details</th>
                    <th className="py-3 px-3">Academic Points</th>
                    <th className="py-3 px-4 w-48">Marks Obtained</th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-3 text-right">% Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5 text-xs">
                  {studentList.map((stu, index) => {
                    const rawMark = scores[stu._id];
                    const numMark = rawMark === '' || rawMark === undefined ? null : Number(rawMark);
                    const hasEntered = numMark !== null;
                    const isPassing = hasEntered && numMark >= Number(passingMarks);
                    const isFailing = hasEntered && numMark < Number(passingMarks);

                    // Real-time Conditional Styling based on requirement:
                    // If marks < passingMarks -> Text/Row outline turns light red.
                    // If marks >= passingMarks -> Text/Row outline turns light green.
                    let rowClass = 'transition-all duration-200 ';
                    let inputBorderClass = '';

                    if (isPassing) {
                      rowClass += isAmoled
                        ? 'bg-emerald-950/20 text-emerald-200 border-l-4 border-l-emerald-500'
                        : 'bg-emerald-50/70 text-emerald-900 border-l-4 border-l-emerald-500';
                      inputBorderClass = 'border-emerald-500 text-emerald-400 focus:ring-emerald-500';
                    } else if (isFailing) {
                      rowClass += isAmoled
                        ? 'bg-rose-950/25 text-rose-200 border-l-4 border-l-rose-500'
                        : 'bg-rose-50/70 text-rose-900 border-l-4 border-l-rose-500';
                      inputBorderClass = 'border-rose-500 text-rose-400 focus:ring-rose-500';
                    } else {
                      rowClass += isAmoled ? 'hover:bg-white/5' : 'hover:bg-slate-50';
                      inputBorderClass = isAmoled
                        ? 'border-white/15 text-white focus:ring-brand-cyan'
                        : 'border-slate-300 text-slate-900 focus:ring-brand-indigo';
                    }

                    const percentage =
                      numMark !== null && totalMarks > 0
                        ? Math.round((numMark / totalMarks) * 100)
                        : 0;

                    return (
                      <tr key={stu._id} className={rowClass}>
                        {/* Index */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {index + 1}
                        </td>

                        {/* Scholar Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isPassing
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : isFailing
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-brand-cyan/10 text-brand-cyan'
                              }`}
                            >
                              {stu.name ? stu.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="font-bold">{stu.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Roll / File: {stu.fileNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{stu.points ?? 0}</span>
                          </span>
                        </td>

                        {/* Marks Input (Real-time typed) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={totalMarks}
                              value={rawMark ?? ''}
                              onChange={(e) => handleScoreChange(stu._id, e.target.value)}
                              placeholder="0"
                              className={`w-24 px-3 py-1.5 rounded-xl border font-mono font-black text-sm text-center transition-all focus:outline-none focus:ring-2 ${
                                isAmoled ? 'bg-neutral-900' : 'bg-white'
                              } ${inputBorderClass}`}
                            />
                            <span className="text-slate-400 text-xs font-bold font-mono">
                              / {totalMarks}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {isPassing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pass Benchmark</span>
                            </span>
                          ) : isFailing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Below Benchmark</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              Pending Input
                            </span>
                          )}
                        </td>

                        {/* Score % */}
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {hasEntered ? (
                            <span
                              className={
                                isPassing
                                  ? 'text-emerald-400'
                                  : isFailing
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              {percentage}%
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-current/10">
              <div className="text-xs text-slate-400">
                Evaluation summary: <strong>{stats.passed} passed</strong>,{' '}
                <strong>{stats.failed} failed</strong> out of {studentList.length} total.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isAmoled
                      ? 'border-white/15 hover:bg-white/10 text-slate-300'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || studentList.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-cyan to-blue-600 text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Recording Marks & Audit...'
                      : 'Submit & View Leaderboard 🥇'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Celebratory Leaderboard Podium Modal */}
      {showLeaderboard && (
        <TestLeaderboardModal
          testResult={savedTestResult}
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          noticeTitle={notice?.message || 'Mid-Semester Test (MST)'}
        />
      )}
    </div>
  );
};

export default GradeTestView;
