import React, { useState, useEffect } from 'react';
import { Shield, Building2, Users, Cpu, Activity, Database, CheckCircle2, Server, KeyRound, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const AdminDashboard = () => {
  const { user, activeBlock } = useAuth();
  const { isAmoled } = useTheme();
  const [dbInfo, setDbInfo] = useState({ status: 'connected', host: 'adeshjeetscluster.acwuyxt.mongodb.net' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.database) {
          setDbInfo(data.database);
        }
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: 'Active Labs', value: '8 High-Tech Labs', sub: 'Kalam Block 3rd & 4th Floor', icon: Cpu, color: 'text-brand-cyan' },
    { label: 'Enrolled Students', value: '840 Students', sub: 'Across 4 Engineering Depts', icon: Users, color: 'text-brand-indigo' },
    { label: 'Faculty Roster', value: '42 Professors', sub: 'In Kalam Block Cabins', icon: Shield, color: 'text-brand-violet' },
    { label: 'Infrastructure Health', value: '99.9% Uptime', sub: 'Smart Campus IoT Network', icon: Activity, color: 'text-brand-emerald' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
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
              <span>Central Administrative Headquarters</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>Assigned Facility: <strong>{activeBlock}</strong> (Suite 401)</span>
            </p>
          </div>

          {/* Database Atlas Live Badge */}
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
                <span>MongoDB Atlas Active</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                Cluster: adeshjeetscluster
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                isAmoled
                  ? 'bg-neutral-950/80 border-white/10 text-white hover:border-brand-cyan/40'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-brand-indigo/40 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Facilities & Kalam Block Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Abdul Kalam Block Laboratories */}
        <div
          className={`lg:col-span-2 p-6 rounded-3xl border ${
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
              { name: 'Kalam Advanced AI & Deep Learning Center', floor: '4th Floor, Room 402', capacity: '60 Workstations', status: 'Online', load: '82%' },
              { name: 'Robotics & Embedded Automation Lab', floor: '3rd Floor, Room 305', capacity: '45 Workstations', status: 'Online', load: '65%' },
              { name: 'Dr. APJ Abdul Kalam Central Seminar Hall', floor: 'Ground Floor, Auditorium 1', capacity: '350 Seats', status: 'Reserved', load: '100%' },
              { name: 'Cloud Computing & Cyber Defense Center', floor: '2nd Floor, Room 210', capacity: '50 Workstations', status: 'Online', load: '40%' },
            ].map((facility, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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

        {/* Right Column: Quick Admin Actions */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-indigo" />
            <span>Phase 1 Quick Operations</span>
          </h3>

          <div className="space-y-2.5">
            {[
              { title: 'Block Attendance Sync', desc: 'Sync Kalam Block RFID turnstiles' },
              { title: 'Faculty Duty Allocation', desc: 'Manage lecture hall assignments' },
              { title: 'Security Audit Log', desc: 'Inspect single-door authentication events' },
              { title: 'Cluster Backup', desc: 'MongoDB Atlas snapshot triggers' },
            ].map((action, i) => (
              <button
                key={i}
                type="button"
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isAmoled
                    ? 'bg-neutral-900/80 border-white/10 hover:border-brand-cyan/50 hover:bg-neutral-800'
                    : 'bg-white border-slate-200 hover:border-brand-indigo/50 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-brand-cyan">{action.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
