import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  Building2,
  Award,
  ClipboardCheck,
  ArrowUpRight,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { ClassManagement } from '../classes/ClassManagement';

export const TeacherDashboard = () => {
  const { user, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  // Tab state: 'schedule' | 'classes'
  const [activeTab, setActiveTab] = useState('classes');

  const schedule = [
    {
      time: '09:30 AM - 10:45 AM',
      subject: 'Advanced Operating Systems',
      room: 'AK-302 (Kalam Block 3rd Floor)',
      batch: 'CSE-4th Sem (Sec A)',
      attendance: '48/52 Present',
    },
    {
      time: '11:15 AM - 01:00 PM',
      subject: 'Distributed Cloud Architecture Lab',
      room: 'Kalam AI Lab 402',
      batch: 'CSE-6th Sem (Sec B)',
      attendance: 'Scheduled',
    },
    {
      time: '02:30 PM - 03:45 PM',
      subject: 'Design & Analysis of Algorithms',
      room: 'AK-204 (Kalam Block 2nd Floor)',
      batch: 'CSE-4th Sem (Sec C)',
      attendance: 'Scheduled',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Faculty Profile Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl transition-all border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Faculty Academic & In-Charge Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {user?.name || 'Prof. Rajesh Sharma'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>
                Faculty Cabin: <strong>Kalam Block - 2nd Floor (Cabin 12)</strong> ·{' '}
                {activeBlock}
              </span>
            </p>
          </div>

          <div
            className={`px-4 py-3 rounded-2xl border text-xs font-semibold ${
              isAmoled
                ? 'bg-neutral-900/90 border-white/10 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Faculty Identifier
            </span>
            <span className="text-sm font-extrabold text-brand-cyan">
              ID: {user?.identifier || user?.fileNumber || 'T101'}
            </span>
          </div>
        </div>
      </div>

      {/* Portal Navigation Switcher */}
      <div className="flex items-center gap-3 border-b border-current/10 pb-4">
        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('classes');
          }}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-brand-cyan border border-cyan-500/40 shadow-neon-cyan/20'
              : isAmoled
              ? 'text-slate-400 hover:text-white border border-transparent'
              : 'text-slate-600 hover:text-slate-900 border border-transparent'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>My Classes & Student Excel Importer</span>
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('schedule');
          }}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40'
              : isAmoled
              ? 'text-slate-400 hover:text-white border border-transparent'
              : 'text-slate-600 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Teaching Schedule & Lectures</span>
        </button>
      </div>

      {/* TAB 1: CLASS IN-CHARGE & STUDENT EXCEL IMPORTER */}
      {activeTab === 'classes' && (
        <ClassManagement
          defaultInchargeId={user?._id}
          filterByIncharge={false}
        />
      )}

      {/* TAB 2: SCHEDULE VIEW */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div
              className={`p-5 rounded-2xl border ${
                isAmoled
                  ? 'bg-neutral-950 border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                <span>Today's Classes</span>
                <Clock className="w-4 h-4 text-brand-cyan" />
              </div>
              <div className="text-3xl font-black">3 Lectures</div>
              <div className="text-xs text-slate-500 mt-1">All situated in Abdul Kalam Block</div>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isAmoled
                  ? 'bg-neutral-950 border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                <span>Total Enrolled Students</span>
                <Users className="w-4 h-4 text-brand-indigo" />
              </div>
              <div className="text-3xl font-black">164 Scholars</div>
              <div className="text-xs text-slate-500 mt-1">Across Sections A, B & C</div>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isAmoled
                  ? 'bg-neutral-950 border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                <span>Attendance Average</span>
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">92.4%</div>
              <div className="text-xs text-slate-500 mt-1">Kalam Block Lecture Halls</div>
            </div>
          </div>

          {/* Lecture Schedule for Today */}
          <div
            className={`p-6 rounded-3xl border ${
              isAmoled
                ? 'glass-panel-amoled border-white/10 text-white'
                : 'glass-panel-light border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-cyan" />
                <span>Today's Kalam Block Teaching Roster</span>
              </h3>
              <span className="text-xs text-slate-400">Day View</span>
            </div>

            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isAmoled
                      ? 'bg-neutral-900/60 border-white/10 hover:border-brand-cyan/40'
                      : 'bg-slate-50 border-slate-200 hover:border-brand-indigo/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                        {item.time}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{item.batch}</span>
                    </div>
                    <h4 className="text-base font-bold">{item.subject}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>{item.room}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">{item.attendance}</span>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors flex items-center gap-1"
                    >
                      <span>Mark Attendance</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
