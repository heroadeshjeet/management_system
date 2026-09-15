import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  X,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Building2,
  Share2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { sfx } from '../../utils/soundEffects';

export const TestLeaderboardModal = ({
  testResult,
  isOpen,
  onClose,
  noticeTitle = 'Mid-Semester Test (MST)',
}) => {
  const { isAmoled } = useTheme();

  // Trigger confetti burst celebration on render
  useEffect(() => {
    if (isOpen && testResult?.scores && testResult.scores.length > 0) {
      sfx.playSuccess();

      // Multi-stage confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#eab308', '#ec4899', '#10b981'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#eab308', '#ffffff'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#06b6d4', '#ffffff'],
          });
        }, 250);
      } catch (err) {
        console.warn('Confetti burst trigger skipped:', err);
      }
    }
  }, [isOpen, testResult]);

  if (!isOpen || !testResult) return null;

  const totalMarks = testResult.totalMarks || 100;
  const passingMarks = testResult.passingMarks || 40;

  // Sorted scores (ensure sorted descending)
  const scores = [...(testResult.scores || [])].sort(
    (a, b) => b.marksObtained - a.marksObtained
  );

  const top1 = scores[0];
  const top2 = scores[1];
  const top3 = scores[2];

  // Pass / Fail statistics
  const passedCount = scores.filter((s) => s.marksObtained >= passingMarks).length;
  const passPercentage = scores.length > 0 ? Math.round((passedCount / scores.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-4xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto ${
          isAmoled
            ? 'bg-neutral-950 border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-current/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3" />
                <span>Official Evaluation Leaderboard</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                {noticeTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Total Marks: <strong>{totalMarks}</strong> · Passing Benchmark:{' '}
                <strong>{passingMarks}</strong> ({passPercentage}% Pass Rate)
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

        {/* Podium of Honor: Top 3 Medal Ceremony */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2: Silver Medal */}
          {top2 && (
            <div
              className={`order-2 sm:order-1 p-5 rounded-3xl border flex flex-col items-center text-center relative overflow-hidden transition-all ${
                isAmoled
                  ? 'bg-slate-900/60 border-slate-300/30 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <div className="text-3xl mb-1 select-none">🥈</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Silver Medalist
              </span>
              <h4 className="font-extrabold text-sm mt-1">{top2.studentId?.name || 'Scholar'}</h4>
              <span className="text-[11px] font-mono text-slate-400">
                {top2.studentId?.fileNumber}
              </span>

              <div className="mt-3 px-3 py-1 rounded-xl bg-slate-400/15 border border-slate-400/30 font-black text-sm text-slate-300">
                {top2.marksObtained}/{totalMarks} pts
              </div>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                {Math.round((top2.marksObtained / totalMarks) * 100)}% Score
              </span>
            </div>
          )}

          {/* Rank 1: Golden Medal (Elevated) */}
          {top1 && (
            <div
              className={`order-1 sm:order-2 p-6 rounded-3xl border-2 flex flex-col items-center text-center relative overflow-hidden transform sm:-translate-y-2 shadow-2xl transition-all ${
                isAmoled
                  ? 'bg-amber-950/25 border-amber-400/60 text-white shadow-neon-amber/20'
                  : 'bg-amber-50/80 border-amber-400 text-slate-900 shadow-amber-200'
              }`}
            >
              <div className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </div>

              <div className="text-4xl mb-1 select-none">🥇</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Gold Medalist · Rank #1
              </span>
              <h4 className="font-black text-base sm:text-lg mt-1 text-amber-300">
                {top1.studentId?.name || 'Top Scholar'}
              </h4>
              <span className="text-xs font-mono text-slate-400 font-bold">
                {top1.studentId?.fileNumber}
              </span>

              <div className="mt-3 px-4 py-1.5 rounded-xl bg-amber-400 text-black font-black text-base shadow-md">
                {top1.marksObtained}/{totalMarks} pts
              </div>
              <span className="text-[11px] text-amber-400 mt-1 font-bold">
                {Math.round((top1.marksObtained / totalMarks) * 100)}% Exceptional Score
              </span>
            </div>
          )}

          {/* Rank 3: Bronze Medal */}
          {top3 && (
            <div
              className={`order-3 p-5 rounded-3xl border flex flex-col items-center text-center relative overflow-hidden transition-all ${
                isAmoled
                  ? 'bg-amber-950/20 border-amber-700/30 text-white'
                  : 'bg-orange-50/60 border-amber-700/30 text-slate-900'
              }`}
            >
              <div className="text-3xl mb-1 select-none">🥉</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                Bronze Medalist
              </span>
              <h4 className="font-extrabold text-sm mt-1">{top3.studentId?.name || 'Scholar'}</h4>
              <span className="text-[11px] font-mono text-slate-400">
                {top3.studentId?.fileNumber}
              </span>

              <div className="mt-3 px-3 py-1 rounded-xl bg-amber-700/15 border border-amber-700/30 font-black text-sm text-amber-500">
                {top3.marksObtained}/{totalMarks} pts
              </div>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                {Math.round((top3.marksObtained / totalMarks) * 100)}% Score
              </span>
            </div>
          )}
        </div>

        {/* Complete Leaderboard Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1 font-bold text-slate-400">
            <span>All Class Evaluations ({scores.length} Scholars)</span>
            <span>Sorted by Merit</span>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden max-h-72 overflow-y-auto ${
              isAmoled ? 'border-white/10 bg-neutral-900/60' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-black/20 text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Scholar Name</th>
                  <th className="px-5 py-3">File Number</th>
                  <th className="px-5 py-3">Marks</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/5">
                {scores.map((item, idx) => {
                  const rank = idx + 1;
                  const isPassed = item.marksObtained >= passingMarks;
                  const percent = Math.round((item.marksObtained / totalMarks) * 100);

                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

                  return (
                    <tr
                      key={item._id || idx}
                      className={`transition-colors ${
                        rank <= 3
                          ? isAmoled
                            ? 'bg-amber-500/[0.04]'
                            : 'bg-amber-50/50'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-5 py-3 font-bold">
                        {medal ? (
                          <span className="text-base mr-1">{medal}</span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{rank}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-200">
                        {item.studentId?.name || 'Scholar'}
                      </td>
                      <td className="px-5 py-3 font-mono text-brand-cyan">
                        {item.studentId?.fileNumber || '-'}
                      </td>
                      <td className="px-5 py-3 font-black text-sm">
                        {item.marksObtained}
                        <span className="text-[10px] text-slate-400 font-normal">
                          /{totalMarks}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-300">
                        {percent}%
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{isPassed ? 'Passed' : 'Needs Retest'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-current/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Official Evaluation Sheet · Abdul Kalam Block
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-black hover:opacity-90 transition-all shadow-md"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestLeaderboardModal;
