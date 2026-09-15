import React from 'react';
import { BookOpen, GraduationCap, Award, Calendar, CheckCircle2, Building2, MapPin, Sparkles, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const StudentDashboard = () => {
  const { user, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const courses = [
    { code: 'CS-401', name: 'Database Management Systems', faculty: 'Dr. V. K. Gupta', room: 'Kalam AK-104', attendance: '92%' },
    { code: 'CS-402', name: 'Design & Analysis of Algorithms', faculty: 'Prof. Rajesh Sharma', room: 'Kalam AK-204', attendance: '88%' },
    { code: 'CS-403', name: 'Computer Networks & Protocols', faculty: 'Prof. S. Mehra', room: 'Kalam AK-301', attendance: '85%' },
    { code: 'CS-404', name: 'Artificial Intelligence Lab', faculty: 'Dr. Suresh Chandra', room: 'Kalam AI Lab 402', attendance: '95%' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Student Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl transition-all border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Scholar Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {user?.name || 'Aman Kumar Verma'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>Campus Wing: <strong>{activeBlock}</strong> (Smart Classroom AK-104)</span>
            </p>
          </div>

          {/* File Number Badge */}
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
              isAmoled ? 'bg-neutral-900/90 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 text-brand-cyan" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Student File Number</span>
              <span className="text-base font-black text-brand-cyan tracking-wider">
                {user?.identifier || '241342'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div
          className={`p-5 rounded-2xl border ${
            isAmoled ? 'bg-neutral-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Overall Attendance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">89.6%</span>
            <span className="text-xs text-emerald-500 font-semibold">Eligible for Exams</span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '89.6%' }}></div>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isAmoled ? 'bg-neutral-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Academic Standing</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-indigo">8.82</span>
            <span className="text-xs text-slate-400 font-semibold">CGPA</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Dean's Honor List Eligible</p>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isAmoled ? 'bg-neutral-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Registered Courses</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-cyan">6 Subjects</span>
            <span className="text-xs text-brand-cyan font-semibold">Semester 4</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">All practicals in Kalam Block</p>
        </div>
      </div>

      {/* Courses in Kalam Block */}
      <div
        className={`p-6 rounded-3xl border ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-cyan" />
            <span>Enrolled Subjects in Abdul Kalam Block</span>
          </h3>
          <span className="text-xs text-slate-400">Current Semester</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.code}
              className={`p-4 rounded-2xl border transition-all ${
                isAmoled ? 'bg-neutral-900/60 border-white/10 hover:border-brand-cyan/40' : 'bg-slate-50 border-slate-200 hover:border-brand-indigo/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-cyan px-2 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
                  {course.code}
                </span>
                <span className="text-xs font-bold text-emerald-400">{course.attendance} Attended</span>
              </div>
              <h4 className="text-base font-bold mb-1">{course.name}</h4>
              <p className="text-xs text-slate-400 mb-2">Faculty: {course.faculty}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{course.room}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
