import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Users,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';
import { downloadTemplate, parseExcelFile } from '../../utils/excelUtils';
import { sfx } from '../../utils/soundEffects';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const ExcelImportModal = ({ targetClass, isOpen, onClose, onSuccess }) => {
  const { user, token } = useAuth();
  const { isAmoled } = useTheme();

  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  // Persistent "Do not show this dialog instructions again" preference
  const [hideInstructions, setHideInstructions] = useState(() => {
    return localStorage.getItem('aryabhatta_hide_import_guidelines') === 'true';
  });

  const handleToggleInstructions = (e) => {
    const checked = e.target.checked;
    setHideInstructions(checked);
    localStorage.setItem('aryabhatta_hide_import_guidelines', checked ? 'true' : 'false');
  };

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParseResult(null);
      setErrorMessage(null);
      setSuccessResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !targetClass) return null;

  // Handle File Input or Drop
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    sfx.playClick();
    setFile(selectedFile);
    setIsParsing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const result = await parseExcelFile(selectedFile);
      setParseResult(result);
      if (result.validStudents.length > 0) {
        sfx.playSuccess();
      } else {
        sfx.playError();
      }
    } catch (err) {
      sfx.playError();
      setErrorMessage(err.message || 'Failed to parse Excel file.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Trigger Bulk Import API
  const handleImportSubmit = async () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-actor-name': user?.name || 'Faculty In-Charge',
          'x-actor-role': user?.role || 'teacher',
        },
        body: JSON.stringify({
          classId: targetClass._id,
          students: parseResult.validStudents,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sfx.playSuccess();
        setSuccessResult(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        sfx.playError();
        setErrorMessage(data.message || 'Bulk student import failed.');
      }
    } catch (err) {
      sfx.playError();
      setErrorMessage('Network error communicating with the bulk import server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto ${
          isAmoled
            ? 'bg-neutral-950 border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-current/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Bulk Student Excel Importer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target Batch: <strong className="text-brand-cyan">{targetClass.className}</strong> ·{' '}
                {targetClass.block || 'Abdul Kalam Block'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Download Action Bar */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isAmoled ? 'bg-neutral-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-brand-cyan flex-shrink-0" />
            <span>Need the official template with correct columns?</span>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              downloadTemplate();
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-brand-cyan transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download template.xlsx</span>
          </button>
        </div>

        {/* Informational Guidance (hidden if user checked "Do not show again") */}
        {!hideInstructions && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isAmoled ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Standard Template Column Requirements:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
              <div className="p-2 rounded-lg bg-black/20 border border-current/20">
                1. File numbers
              </div>
              <div className="p-2 rounded-lg bg-black/20 border border-current/20">
                2. Name
              </div>
              <div className="p-2 rounded-lg bg-black/20 border border-current/20">
                3. Password (Opt)
              </div>
              <div className="p-2 rounded-lg bg-black/20 border border-current/20">
                4. Points (Opt)
              </div>
            </div>
            <p className="text-[11px] opacity-80">
              * Default password will be set to '123' and points to 500 if left blank.
            </p>
          </div>
        )}

        {/* Success Screen if completed */}
        {successResult ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-lg font-black text-emerald-400">Import Complete!</h4>
              <p className="text-xs text-slate-300 mt-1">
                {successResult.message}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              <Users className="w-4 h-4" />
              <span>Total Class Scholars: {successResult.totalClassStudents}</span>
            </div>

            {successResult.skippedExisting?.length > 0 && (
              <p className="text-[11px] text-amber-400">
                Note: {successResult.skippedExisting.length} existing records were skipped.
              </p>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              >
                Done & View Roster
              </button>
            </div>
          </div>
        ) : (
          /* File Drag & Drop / Upload Area */
          <div className="space-y-4">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed cursor-pointer transition-all ${
                isAmoled
                  ? 'border-white/20 bg-neutral-900/40 hover:border-brand-cyan/60 hover:bg-neutral-900/70'
                  : 'border-slate-300 bg-slate-50 hover:border-brand-indigo/60 hover:bg-slate-100'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {isParsing ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin" />
                  <span className="text-xs font-bold">Parsing Excel with SheetJS...</span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
                  <span className="text-sm font-bold">{file.name}</span>
                  <span className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB · Click or drop another to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <UploadCloud className="w-10 h-10 text-brand-cyan mb-1" />
                  <span className="text-sm font-bold">
                    Drop your filled <code className="text-brand-cyan">template.xlsx</code> here
                  </span>
                  <span className="text-xs text-slate-400">
                    or click to browse your computer (.xlsx, .xls)
                  </span>
                </div>
              )}
            </label>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Parsed Data Preview Table */}
            {parseResult && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Parsed {parseResult.validStudents.length} Valid Student Records</span>
                  </div>

                  {parseResult.duplicateFileNumbers.length > 0 && (
                    <span className="text-amber-400 text-[11px] font-semibold">
                      ⚠️ {parseResult.duplicateFileNumbers.length} duplicate file numbers skipped
                    </span>
                  )}
                </div>

                {/* Table preview (first 5 rows) */}
                <div
                  className={`rounded-2xl border overflow-hidden max-h-48 overflow-y-auto ${
                    isAmoled ? 'border-white/10 bg-neutral-900/60' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/20 text-slate-400 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="px-4 py-2">File No.</th>
                        <th className="px-4 py-2">Student Name</th>
                        <th className="px-4 py-2">Initial Password</th>
                        <th className="px-4 py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-current/5">
                      {parseResult.validStudents.slice(0, 6).map((student, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-4 py-2 font-bold text-brand-cyan">
                            {student.fileNumber}
                          </td>
                          <td className="px-4 py-2 text-slate-200">{student.name}</td>
                          <td className="px-4 py-2 text-slate-400">{student.password}</td>
                          <td className="px-4 py-2 text-emerald-400">{student.points} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parseResult.validStudents.length > 6 && (
                  <div className="text-[11px] text-slate-500 text-center">
                    + {parseResult.validStudents.length - 6} more scholars ready to deploy into{' '}
                    {targetClass.className}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions & Checkbox */}
        <div className="pt-2 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={hideInstructions}
              onChange={handleToggleInstructions}
              className="rounded bg-neutral-800 border-neutral-700 text-brand-cyan focus:ring-0"
            />
            <span>Do not show column guide in this dialog again</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5"
            >
              Cancel
            </button>

            {!successResult && (
              <button
                onClick={handleImportSubmit}
                disabled={!parseResult || parseResult.validStudents.length === 0 || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? 'Importing...'
                    : `Deploy ${parseResult?.validStudents?.length || 0} Students`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
