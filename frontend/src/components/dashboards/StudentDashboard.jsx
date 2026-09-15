import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Sparkles,
  FileText,
  Trophy,
  Bell,
  Clock,
  AlertTriangle,
  RefreshCw,
  Quote,
  TrendingUp,
  User,
  Zap,
  Target,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { API_BASE_URL } from '../../config/api';

export const StudentDashboard = () => {
  const { user, token, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student identifier to query
  const studentIdentifier = user?._id || user?.fileNumber || 'self';

  // Fetch student hub dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!studentIdentifier) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${studentIdentifier}/dashboard`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDashboardData(data.dashboard);
      } else {
        setError(data.message || 'Unable to load student hub data.');
      }
    } catch (err) {
      console.error('Failed to fetch student dashboard:', err);
      setError('Connection error while fetching student records.');
    } finally {
      setLoading(false);
    }
  }, [studentIdentifier, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Dynamic Time of Day Greeting
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = dashboardData?.student?.name || user?.name || 'Scholar';
    if (hour >= 5 && hour < 12) {
      return { text: `Good morning, ${name} ☀️`, timeOfDay: 'morning' };
    } else if (hour >= 12 && hour < 17) {
      return { text: `Good afternoon, ${name} 🌤️`, timeOfDay: 'afternoon' };
    } else if (hour >= 17 && hour < 22) {
      return { text: `Good evening, ${name} 🌙`, timeOfDay: 'evening' };
    } else {
      return { text: `Good night, ${name} 🌌`, timeOfDay: 'night' };
    }
  }, [dashboardData?.student?.name, user?.name]);

  // Dynamic Motivational Quote based on latest test score
  const motivationalQuote = useMemo(() => {
    const latestPct = dashboardData?.stats?.latestTestPercentage;
    if (latestPct === null || latestPct === undefined) {
      return {
        quote:
          'Welcome to your academic journey at Aryabhatta Group of Institutes. Every lecture is a stepping stone to engineering mastery.',
        author: 'Aryabhatta Academic Council',
        tag: 'Academic Journey',
        color: 'text-brand-cyan',
      };
    }

    if (latestPct >= 80) {
      return {
        quote:
          'Outstanding performance! Excellence is not a singular act, but an enduring habit. Continue setting the benchmark for your peers.',
        author: 'Dr. A. P. J. Abdul Kalam',
        tag: 'Exemplary Honor',
        color: 'text-amber-400',
      };
    } else if (latestPct >= 65) {
      return {
        quote:
          'Solid achievement! Consistency, disciplined practice, and curiosity will propel you to the very top rank.',
        author: 'Faculty Mentorship Council',
        tag: 'Merit & Growth',
        color: 'text-emerald-400',
      };
    } else if (latestPct >= 40) {
      return {
        quote:
          'Passing benchmark achieved! Identify target areas for refinement and aim for distinction on your next evaluation.',
        author: 'Abdul Kalam Block Advisory',
        tag: 'Progress in Motion',
        color: 'text-blue-400',
      };
    } else {
      return {
        quote:
          'Keep pushing, every setback is a setup for a comeback! Resilience and grit transform obstacles into engineering triumphs.',
        author: 'Dean of Student Affairs',
        tag: 'Unyielding Resolve',
        color: 'text-rose-400',
      };
    }
  }, [dashboardData?.stats?.latestTestPercentage]);

  // Standout metrics
  const points = dashboardData?.student?.points ?? user?.points ?? 500;
  const currentRank = dashboardData?.rank?.currentRank ?? 1;
  const totalClassmates = dashboardData?.rank?.totalClassmates ?? 1;
  const recentTests = dashboardData?.recentTests || [];
  const notifications = dashboardData?.notifications || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Dynamic Header & Greeting Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl transition-all border relative overflow-hidden ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        {/* Subtle background ambient light */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Scholar Portal · Phase 6</span>
            </div>

            {/* Dynamic Greeting based on local time of day */}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
              <span>{dynamicGreeting.text}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-brand-cyan font-semibold">
                <Building2 className="w-4 h-4" />
                <span>{activeBlock}</span>
              </span>
              <span>·</span>
              <span>
                Department:{' '}
                <strong className="text-slate-200">
                  {dashboardData?.classInfo?.className || user?.department || 'Computer Science & Engineering'}
                </strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* File Number Badge */}
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
                isAmoled
                  ? 'bg-neutral-900/90 border-white/10 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5 text-brand-cyan" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Student File Number
                </span>
                <span className="text-base font-black text-brand-cyan tracking-wider font-mono">
                  {dashboardData?.student?.fileNumber || user?.fileNumber || user?.identifier || 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sfx.playClick();
                fetchDashboard();
              }}
              disabled={loading}
              className={`p-3 rounded-2xl border text-slate-400 hover:text-white transition-all ${
                isAmoled ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
              }`}
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Glassmorphic Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Behavioral & Academic Points */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isAmoled
              ? 'bg-neutral-950/80 border-white/10 text-white hover:border-amber-400/40 shadow-xl'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Academic Points
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
              {points}
            </span>
            <span className="text-xs text-slate-400 font-bold">PTS</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                points >= 500
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {points >= 500 ? 'Good Standing Tier' : 'Needs Advisory Attention'}
            </span>
          </div>
        </div>

        {/* Card 2: Dynamic Overall Class Rank */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isAmoled
              ? 'bg-neutral-950/80 border-white/10 text-white hover:border-brand-cyan/40 shadow-xl'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Class Standing
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
              <Trophy className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-brand-cyan font-mono">
              #{currentRank}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              of {totalClassmates} Scholars
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-brand-cyan" />
            <span>
              {currentRank === 1
                ? '🥇 Highest Ranked in Class'
                : `Top ${dashboardData?.rank?.percentile || 10}% Cohort`}
            </span>
          </div>
        </div>

        {/* Card 3: Latest Test Result */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isAmoled
              ? 'bg-neutral-950/80 border-white/10 text-white hover:border-purple-400/40 shadow-xl'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest Evaluation
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            {recentTests.length > 0 ? (
              <>
                <span className="text-3xl sm:text-4xl font-black text-purple-400 font-mono">
                  {recentTests[0].percentage}%
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({recentTests[0].marksObtained}/{recentTests[0].totalMarks})
                </span>
              </>
            ) : (
              <span className="text-2xl font-extrabold text-slate-500">Pending</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {recentTests.length > 0 ? (
              recentTests[0].isPassing ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Passed Benchmark</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>Below Benchmark</span>
                </span>
              )
            ) : (
              <span className="text-slate-500 text-xs">No examination scores yet</span>
            )}
          </div>
        </div>

        {/* Card 4: Official Broadcasts Count */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isAmoled
              ? 'bg-neutral-950/80 border-white/10 text-white hover:border-blue-400/40 shadow-xl'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Notices
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bell className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-blue-400 font-mono">
              {notifications.length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Dispatched</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Direct Broadcast Stream</span>
          </div>
        </div>
      </div>

      {/* Dynamic Motivational Quote Banner */}
      <div
        className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-brand-cyan shrink-0">
              <Quote className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Institutional Mentorship
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${motivationalQuote.color}`}>
                  {motivationalQuote.tag}
                </span>
              </div>

              <p className="text-xs sm:text-sm italic font-medium text-slate-200 leading-relaxed">
                "{motivationalQuote.quote}"
              </p>

              <span className="text-[11px] text-slate-400 font-semibold block pt-1">
                — {motivationalQuote.author}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Test Analytics & Notifications Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Recent Test Analytics Section */}
        <div
          className={`lg:col-span-7 p-6 sm:p-7 rounded-3xl border space-y-6 ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider">
                Recent Test & MST Analytics
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {recentTests.length} Evaluations Recorded
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-cyan" />
              <p className="text-xs">Loading academic evaluation records...</p>
            </div>
          ) : recentTests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Zap className="w-8 h-8 mx-auto text-slate-500" />
              <h4 className="font-bold text-sm">No Test Records Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Evaluations conducted by faculty in the Kalam Block will automatically reflect here
                with detailed scores and rank progression.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTests.map((test) => (
                <div
                  key={test._id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isAmoled
                      ? 'bg-neutral-900/60 border-white/10 hover:border-brand-cyan/30'
                      : 'bg-slate-50 border-slate-200 hover:border-brand-indigo/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          MST Evaluation
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {test.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Evaluated by: <strong>{test.teacherName}</strong> · Class: {test.className}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-brand-cyan">
                          {test.marksObtained}/{test.totalMarks}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Passing: {test.passingMarks} pts
                        </span>
                      </div>

                      {test.isPassing ? (
                        <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Performance Score</span>
                      <span
                        className={`font-mono font-bold ${
                          test.isPassing ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {test.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          test.percentage >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : test.isPassing
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            : 'bg-gradient-to-r from-rose-500 to-orange-500'
                        }`}
                        style={{ width: `${test.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Notifications Feed with Behavioral Warning Styling */}
        <div
          className={`lg:col-span-5 p-6 sm:p-7 rounded-3xl border space-y-6 ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider">
                Notifications Feed
              </h2>
            </div>
            <span className="text-xs text-slate-400">Official Dispatches</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-cyan" />
              <p className="text-xs">Loading notices stream...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <h4 className="font-bold text-sm">All Clear!</h4>
              <p className="text-xs text-slate-500">
                You have no active alerts or disciplinary warnings at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {notifications.map((notice) => {
                // If flagged as behavioral warning (e.g. "late today"), give subtle warning accent
                const isWarning = notice.isBehavioralWarning;

                return (
                  <div
                    key={notice._id}
                    className={`p-4 rounded-2xl border space-y-2 transition-all ${
                      isWarning
                        ? isAmoled
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 shadow-neon-amber/10'
                          : 'bg-amber-50/80 border-amber-300 text-amber-900'
                        : notice.isTest
                        ? isAmoled
                          ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                          : 'bg-purple-50/70 border-purple-200 text-purple-900'
                        : isAmoled
                        ? 'bg-neutral-900/60 border-white/10 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Behavioral Notice</span>
                          </span>
                        ) : notice.isTest ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>Exam Notice</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
                            Announcement
                          </span>
                        )}

                        <span className="font-bold text-[11px] text-slate-400">
                          {notice.senderName}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500">
                        {notice.createdAt
                          ? new Date(notice.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed font-sans pl-0.5">
                      {notice.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
