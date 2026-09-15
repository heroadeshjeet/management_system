import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Shield, Compass, Volume2, ArrowRight } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

export const SplashScreen = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const DURATION_MS = 2800;

  const triggerAudioAndFade = () => {
    if (!audioPlayed) {
      sfx.playIntroTone();
      setAudioPlayed(true);
    }
  };

  const finishSplash = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    sfx.playClick();
    setTimeout(() => {
      onFinish();
    }, 450); // allow CSS fade-out animation to complete
  };

  useEffect(() => {
    // Attempt audio playback on mount (browsers may require interaction; fallback handled on tap)
    const playTimer = setTimeout(() => {
      triggerAudioAndFade();
    }, 150);

    // Progress bar tick
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);
    }, 30);

    // Auto fadeout after 2.8 seconds
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onFinish();
      }, 450);
    }, DURATION_MS);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(timerRef.current);
      clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div
      onClick={() => {
        triggerAudioAndFade();
        finishSplash();
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer transition-all duration-500 ${
        isFadingOut
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-100 scale-100'
      } bg-black text-white`}
      style={{
        background: 'radial-gradient(ellipse at center, #0c1022 0%, #000000 70%, #000000 100%)',
      }}
    >
      {/* Background ambient neon glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-indigo/15 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Row / Status */}
      <div className="w-full flex items-center justify-between max-w-5xl z-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
          <span>Core System Booting</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            finishSplash();
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-colors"
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Branding & Typography */}
      <div className="flex flex-col items-center text-center max-w-3xl z-10 px-4 my-auto">
        {/* Animated Emblem */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-neutral-950 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-brand-cyan" />
            <Sparkles className="w-5 h-5 text-brand-indigo absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        {/* Primary Institute Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 mb-6 drop-shadow-sm">
          Welcome To Aryabhatta Group of Institutes Management System
        </h1>

        {/* Sub-badge at the bottom of hero: Abdul Kalam Block */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-brand-indigo/10 border border-brand-indigo/30 text-brand-cyan font-semibold text-sm sm:text-base tracking-wide backdrop-blur-md shadow-neon-cyan/20">
          <Compass className="w-4 h-4 text-brand-cyan animate-spin" style={{ animationDuration: '12s' }} />
          <span>Abdul Kalam Block</span>
        </div>

        <p className="text-xs text-slate-500 mt-4 max-w-md">
          Phase 1 Architecture · High-Performance Cloud Orchestration
        </p>
      </div>

      {/* Footer Area with Creator Credit & 2.8s Progress Meter */}
      <div className="w-full max-w-xl flex flex-col items-center gap-4 z-10">
        {/* Sleek 2.8-second progress line */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet transition-all ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="w-full flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Tap anywhere to interact</span>
          </span>

          {/* Footer text in muted, clean typography: By Adeshjeet_Official */}
          <div className="text-right">
            <span className="text-slate-500 font-normal">Created </span>
            <span className="text-slate-300 font-semibold tracking-wider hover:text-brand-cyan transition-colors">
              By Adeshjeet_Official
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
