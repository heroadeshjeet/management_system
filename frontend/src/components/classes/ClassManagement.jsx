import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  UserCheck,
  Users,
  FileSpreadsheet,
  Download,
  Search,
  Building2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { downloadTemplate } from '../../utils/excelUtils';
import { ExcelImportModal } from './ExcelImportModal';

export const ClassManagement = ({ defaultInchargeId = null, filterByIncharge = false }) => {
  const { user, token, activeBlock } = useAuth();
  const { isAmoled } = useTheme();

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Class Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [classForm, setClassForm] = useState({
    className: '',
    inchargeTeacherId: defaultInchargeId || '',
    subjects: [
      { subjectName: 'Core Computing Principles', assignedTeacherId: '' },
      { subjectName: 'System Architecture & OS', assignedTeacherId: '' },
    ],
  });

  // Excel Import Modal State
  const [importTargetClass, setImportTargetClass] = useState(null);

  // Active Selected Class for Roster View
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  // Fetch all classes
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classes', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'User',
          'x-actor-role': user?.role || 'admin',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let list = data.classes || [];
        if (filterByIncharge && user?.fileNumber) {
          list = list.filter(
            (c) =>
              c.inchargeTeacher?.fileNumber === user.fileNumber ||
              c.inchargeTeacher?._id === user._id
          );
        }
        setClasses(list);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user, filterByIncharge]);

  // Fetch teachers for incharge/subject allocation
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/teachers', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeachers(data.teachers || []);
        if (!classForm.inchargeTeacherId && data.teachers.length > 0) {
          setClassForm((prev) => ({
            ...prev,
            inchargeTeacherId: defaultInchargeId || data.teachers[0]._id,
            subjects: prev.subjects.map((s) => ({
              ...s,
              assignedTeacherId: s.assignedTeacherId || data.teachers[0]._id,
            })),
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  }, [token, classForm.inchargeTeacherId, defaultInchargeId]);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [fetchClasses, fetchTeachers]);

  // Fetch roster when selecting class
  const handleViewRoster = async (cls) => {
    if (selectedClassForRoster?._id === cls._id) {
      setSelectedClassForRoster(null);
      setRosterData(null);
      return;
    }

    sfx.playClick();
    setSelectedClassForRoster(cls);
    setLoadingRoster(true);

    try {
      const res = await fetch(`/api/classes/${cls._id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRosterData(data.class);
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Add subject row in form
  const handleAddSubjectField = () => {
    sfx.playClick();
    setClassForm((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          subjectName: '',
          assignedTeacherId: teachers[0]?._id || '',
        },
      ],
    }));
  };

  // Remove subject row in form
  const handleRemoveSubjectField = (index) => {
    sfx.playClick();
    setClassForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  // Handle Class Creation Form Submit
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.className.trim() || !classForm.inchargeTeacherId) {
      sfx.playError();
      setFormError('Class Name and In-charge Teacher are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Administrator',
          'x-actor-role': user?.role || 'admin',
        },
        body: JSON.stringify({
          className: classForm.className.trim(),
          block: activeBlock,
          inchargeTeacherId: classForm.inchargeTeacherId,
          subjects: classForm.subjects.filter((s) => s.subjectName.trim()),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        haptics.success();
        setShowCreateModal(false);
        setClassForm({
          className: '',
          inchargeTeacherId: teachers[0]?._id || '',
          subjects: [
            { subjectName: 'Core Computing Principles', assignedTeacherId: teachers[0]?._id || '' },
          ],
        });
        fetchClasses();
      } else {
        sfx.playError();
        haptics.error();
        setFormError(data.message || 'Failed to create class.');
      }
    } catch (err) {
      sfx.playError();
      haptics.error();
      setFormError('Network error while saving class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered classes
  const filteredClasses = classes.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.className && c.className.toLowerCase().includes(q)) ||
      (c.inchargeTeacher?.name && c.inchargeTeacher.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Fast Actions */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
          isAmoled
            ? 'glass-panel-amoled border-white/10 text-white'
            : 'glass-panel-light border-slate-200 text-slate-900'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-xl font-black tracking-tight">
              Class Management & Student Enrollment
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Abdul Kalam Block · Batch definitions, teacher assignments, and bulk Excel onboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download Official Template Button */}
          <button
            onClick={() => {
              sfx.playClick();
              downloadTemplate();
            }}
            title="Download official Excel template with standard columns"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-current/15 hover:bg-current/5 transition-all text-brand-cyan"
          >
            <Download className="w-4 h-4" />
            <span>Download template.xlsx</span>
          </button>

          {/* Create New Class Modal Trigger */}
          <button
            onClick={() => {
              sfx.playClick();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-cyan to-blue-600 text-black hover:opacity-90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes by name, batch, or in-charge professor..."
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
              fetchClasses();
            }}
            title="Refresh classes list"
            className={`p-2.5 rounded-xl border transition-colors ${
              isAmoled
                ? 'border-white/10 hover:bg-white/10 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClasses.length === 0 ? (
          <div
            className={`col-span-full p-12 text-center rounded-3xl border ${
              isAmoled
                ? 'bg-neutral-950/60 border-white/10 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-cyan" />
            <h3 className="text-base font-bold">No Classes Configured Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Create a new class for Abdul Kalam Block, assign an In-charge Professor and subjects,
              then use the Excel Importer to onboard students.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Class</span>
            </button>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const isSelected = selectedClassForRoster?._id === cls._id;

            return (
              <div
                key={cls._id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  isSelected
                    ? 'border-brand-cyan shadow-neon-cyan/20 bg-cyan-950/10'
                    : isAmoled
                    ? 'glass-panel-amoled border-white/10 text-white hover:border-white/20'
                    : 'glass-panel-light border-slate-200 text-slate-900 hover:border-indigo-200'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
                      <Building2 className="w-3 h-3" />
                      <span>{cls.block || activeBlock}</span>
                    </span>
                    <h3 className="text-lg font-black tracking-tight">{cls.className}</h3>
                  </div>

                  {/* Student count pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>{cls.studentCount || 0} Scholars</span>
                  </div>
                </div>

                {/* Incharge Professor */}
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    isAmoled ? 'bg-neutral-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      In-Charge Faculty
                    </span>
                    <span className="text-xs font-bold">
                      {cls.inchargeTeacher?.name || 'Unassigned Professor'}
                    </span>
                    {cls.inchargeTeacher?.fileNumber && (
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        (ID: {cls.inchargeTeacher.fileNumber})
                      </span>
                    )}
                  </div>
                </div>

                {/* Subjects Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Curriculum Subjects ({cls.subjects?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.subjects && cls.subjects.length > 0 ? (
                      cls.subjects.map((subj, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10"
                        >
                          <BookOpen className="w-3 h-3 text-brand-indigo" />
                          <span>{subj.subjectName}</span>
                          {subj.assignedTeacherId?.name && (
                            <span className="text-[9px] text-slate-400">
                              · {subj.assignedTeacherId.name.split(' ')[0]}
                            </span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        No subjects mapped to this batch.
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-current/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewRoster(cls)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-cyan hover:underline"
                  >
                    <span>{isSelected ? 'Hide Roster' : 'View Student Roster'}</span>
                    {isSelected ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Excel Import Modal Trigger */}
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setImportTargetClass(cls);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Import Excel</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded Class Student Roster Section */}
      {selectedClassForRoster && (
        <div
          className={`p-6 rounded-3xl border space-y-4 animate-fade-in ${
            isAmoled
              ? 'glass-panel-amoled border-white/10 text-white'
              : 'glass-panel-light border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-current/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  Enrolled Scholars · {selectedClassForRoster.className}
                </h3>
                <p className="text-xs text-slate-400">
                  {rosterData?.students?.length || 0} active students linked in MongoDB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Filter roster..."
                className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                  isAmoled ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-200'
                }`}
              />

              <button
                onClick={() => {
                  sfx.playClick();
                  setImportTargetClass(selectedClassForRoster);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>+ Import More</span>
              </button>
            </div>
          </div>

          {loadingRoster ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-cyan" />
              <span className="text-xs">Loading class scholars...</span>
            </div>
          ) : !rosterData?.students || rosterData.students.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold">No students currently enrolled in this batch.</p>
              <button
                onClick={() => setImportTargetClass(selectedClassForRoster)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:opacity-90"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Student Sheet</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-current/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                      isAmoled ? 'bg-white/[0.02]' : 'bg-slate-50'
                    }`}
                  >
                    <th className="px-5 py-3">File Number</th>
                    <th className="px-5 py-3">Scholar Name</th>
                    <th className="px-5 py-3">Points</th>
                    <th className="px-5 py-3">Campus Block</th>
                    <th className="px-5 py-3">Enrolled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {rosterData.students
                    .filter((s) => {
                      const q = rosterSearch.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.fileNumber.toLowerCase().includes(q)
                      );
                    })
                    .map((student) => (
                      <tr key={student._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-brand-cyan">
                          {student.fileNumber}
                        </td>
                        <td className="px-5 py-3 font-bold">{student.name}</td>
                        <td className="px-5 py-3 font-bold text-emerald-400">
                          {student.points || 500} pts
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {student.block || activeBlock}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {student.createdAt
                            ? new Date(student.createdAt).toLocaleDateString()
                            : 'Enrolled'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW CLASS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto ${
              isAmoled
                ? 'bg-neutral-950 border-white/15 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Create Academic Class</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define class batch, in-charge professor, and subject matrix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              {/* Class Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Class / Batch Title *
                </label>
                <input
                  type="text"
                  required
                  value={classForm.className}
                  onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                  placeholder="e.g. BCA Semester 5 (Sec A) or B.Tech CSE 4th Sem"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                    isAmoled
                      ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                  }`}
                />
              </div>

              {/* Incharge Teacher Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  In-Charge Professor *
                </label>
                <select
                  value={classForm.inchargeTeacherId}
                  onChange={(e) =>
                    setClassForm({ ...classForm, inchargeTeacherId: e.target.value })
                  }
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                    isAmoled
                      ? 'bg-neutral-900 border-white/10 text-white focus:border-brand-cyan'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-indigo'
                  }`}
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (ID: {t.fileNumber}) - {t.department || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Subjects List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Subjects & Faculty Allocation
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubjectField}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {classForm.subjects.map((subj, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                        isAmoled
                          ? 'bg-neutral-900/60 border-white/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="text"
                        placeholder="Subject Name (e.g. Cloud Computing)"
                        value={subj.subjectName}
                        onChange={(e) => {
                          const updated = [...classForm.subjects];
                          updated[idx].subjectName = e.target.value;
                          setClassForm({ ...classForm, subjects: updated });
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                          isAmoled
                            ? 'bg-black border-white/10 text-white'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />

                      <select
                        value={subj.assignedTeacherId}
                        onChange={(e) => {
                          const updated = [...classForm.subjects];
                          updated[idx].assignedTeacherId = e.target.value;
                          setClassForm({ ...classForm, subjects: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                          isAmoled
                            ? 'bg-black border-white/10 text-white'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {classForm.subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectField(idx)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-cyan text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Class Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL BULK IMPORT MODAL */}
      <ExcelImportModal
        targetClass={importTargetClass}
        isOpen={!!importTargetClass}
        onClose={() => setImportTargetClass(null)}
        onSuccess={(result) => {
          fetchClasses();
          if (selectedClassForRoster?._id === importTargetClass?._id) {
            handleViewRoster(importTargetClass);
          }
        }}
      />
    </div>
  );
};

export default ClassManagement;
