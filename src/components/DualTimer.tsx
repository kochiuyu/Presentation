import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, AlertTriangle, Users, MessageSquareQuote, Presentation, Dice5, CheckCircle2 } from 'lucide-react';
import { GroupItem, TimingMode } from '../types';
import { playTick, playFanfare } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DualTimerProps {
  currentGroup: GroupItem | null;
  // Presentation Timer State
  presSecondsRemaining: number;
  presIsRunning: boolean;
  presTimingMode: TimingMode;
  presMinutesPerMember: number;
  presentationMinutes: number;
  onTogglePresTimer: () => void;
  onResetPresTimer: () => void;
  onAdjustPresSeconds: (delta: number) => void;
  onSetPresPerMember: (minutesPerMember: number) => void;

  // Q&A Timer State
  qaSecondsRemaining: number;
  qaIsRunning: boolean;
  qaTimingMode: TimingMode;
  qaMinutes: number;
  qaMinutesPerMember: number;
  onToggleQaTimer: () => void;
  onResetQaTimer: () => void;
  onAdjustQaSeconds: (delta: number) => void;
  onSetQaDuration: (qaMin: number, isProportional?: boolean) => void;

  // Q&A Random Respondent Draw
  currentRespondent: string | null;
  answeredMembers: string[];
  soundEnabled: boolean;
  onSelectRespondent: (name: string) => void;
  onResetRespondents: () => void;
}

export const DualTimer: React.FC<DualTimerProps> = ({
  currentGroup,
  presSecondsRemaining,
  presIsRunning,
  presTimingMode,
  presMinutesPerMember,
  presentationMinutes,
  onTogglePresTimer,
  onResetPresTimer,
  onAdjustPresSeconds,
  onSetPresPerMember,

  qaSecondsRemaining,
  qaIsRunning,
  qaTimingMode,
  qaMinutes,
  qaMinutesPerMember,
  onToggleQaTimer,
  onResetQaTimer,
  onAdjustQaSeconds,
  onSetQaDuration,

  currentRespondent,
  answeredMembers,
  soundEnabled,
  onSelectRespondent,
  onResetRespondents,
}) => {
  const [isShufflingRespondent, setIsShufflingRespondent] = useState(false);
  const [candidateName, setCandidateName] = useState<string>('');

  const membersList = currentGroup?.members && currentGroup.members.length > 0
    ? currentGroup.members
    : [];

  const memberCount = membersList.length > 0 ? membersList.length : 7;

  const activePresTotalMin = presTimingMode === 'per_member'
    ? Math.round(memberCount * presMinutesPerMember * 10) / 10
    : presentationMinutes;

  const activeQaTotalMin = qaTimingMode === 'per_member'
    ? Math.round(memberCount * qaMinutesPerMember * 10) / 10
    : qaMinutes;

  const formatTime = (secs: number) => {
    if (typeof secs !== 'number' || !Number.isFinite(secs) || isNaN(secs)) {
      return '00:00';
    }
    const isNeg = secs < 0;
    const abs = Math.abs(secs);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${isNeg ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isPresOvertime = presSecondsRemaining < 0;
  const isPresWarning = presSecondsRemaining <= 60 && presSecondsRemaining > 0;

  const isQaOvertime = qaSecondsRemaining < 0;
  const isQaWarning = qaSecondsRemaining <= 60 && qaSecondsRemaining > 0;

  // Random draw member to answer for Q&A
  const handleDrawRespondent = () => {
    if (isShufflingRespondent) return;
    if (!membersList.length) {
      alert('Please load or select a group with members first.');
      return;
    }

    // Prefer members who haven't answered yet in this group
    const uncalled = membersList.filter((m) => !answeredMembers.includes(m));
    const pool = uncalled.length > 0 ? uncalled : membersList;

    setIsShufflingRespondent(true);
    let speed = 40;
    let iterations = 0;
    const maxIterations = 20;

    const step = () => {
      const randIdx = Math.floor(Math.random() * pool.length);
      const temp = pool[randIdx];
      setCandidateName(temp);
      if (soundEnabled) playTick(0.4);
      iterations++;

      if (iterations < maxIterations) {
        speed += 14;
        setTimeout(step, speed);
      } else {
        const picked = pool[randIdx];
        setIsShufflingRespondent(false);
        setCandidateName('');
        onSelectRespondent(picked);

        if (soundEnabled) playFanfare(0.6);
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.5 },
            colors: ['#10b981', '#6366f1', '#f59e0b'],
          });
        } catch {
          // ignore
        }
      }
    };
    step();
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Independent Clocks</span>
          <h2 className="text-xl font-bold text-white">Presentation & Q&A Facilitator</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
            presIsRunning
              ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            {presIsRunning ? '🎤 Presentation Running' : 'Presentation Ready'}
          </span>
          <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
            qaIsRunning
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            {qaIsRunning ? '💬 Q&A Running' : 'Q&A Ready'}
          </span>
        </div>
      </div>

      {/* Two Dedicated Separated Timer Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* TIMER 1: Presentation Clock */}
        <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 shadow-md ${
          presIsRunning
            ? 'border-indigo-500/80 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 ring-2 ring-indigo-500/30'
            : 'border-slate-800 bg-slate-950/90'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Presentation className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Presentation Time</h3>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-300">
                    <Users className="h-3 w-3" />
                    <span>
                      {presTimingMode === 'per_member'
                        ? `${memberCount} members × ${presMinutesPerMember}m = ${activePresTotalMin}m`
                        : `Fixed ${activePresTotalMin}m`}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                PROPORTIONAL
              </span>
            </div>

            {/* Presentation Digits Display */}
            <div className="my-3 text-center">
              <div
                className={`font-mono text-5xl lg:text-6xl font-black tracking-tight transition-colors ${
                  isPresOvertime
                    ? 'text-rose-500 animate-pulse'
                    : isPresWarning
                    ? 'text-amber-400'
                    : presIsRunning
                    ? 'text-indigo-200'
                    : 'text-white'
                }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(presSecondsRemaining)}
              </div>

              {isPresOvertime && (
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-black text-rose-400 uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Presentation Overtime</span>
                </div>
              )}
              {isPresWarning && (
                <div className="mt-1 text-xs font-bold text-amber-400">
                  ⚠️ Final 60 Seconds
                </div>
              )}
            </div>
          </div>

          {/* Presentation Controls */}
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onTogglePresTimer}
                className={`col-span-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 font-bold text-xs text-white shadow-md transition active:scale-[0.99] ${
                  presIsRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {presIsRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                <span>{presIsRunning ? 'Pause Pres (Space)' : 'Start Pres (Space)'}</span>
              </button>

              <button
                onClick={() => onResetPresTimer()}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                title="Reset presentation timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-[11px]">Nudge Pres:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onAdjustPresSeconds(60)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-mono"
                >
                  +1m
                </button>
                <button
                  onClick={() => onAdjustPresSeconds(-60)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-mono"
                >
                  -1m
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TIMER 2: Q&A Clock + Random Respondent Draw */}
        <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 shadow-md ${
          qaIsRunning
            ? 'border-emerald-500/80 bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 ring-2 ring-emerald-500/30'
            : 'border-slate-800 bg-slate-950/90'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MessageSquareQuote className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Q&A Discussion Time</h3>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    {qaTimingMode === 'fixed'
                      ? `Fixed ${activeQaTotalMin}m (Class questions)`
                      : `${memberCount} members × ${qaMinutesPerMember}m = ${activeQaTotalMin}m`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {qaTimingMode === 'fixed' ? 'FIXED 5M' : 'PROPORTIONAL'}
              </span>
            </div>

            {/* Q&A Digits Display */}
            <div className="my-2 text-center">
              <div
                className={`font-mono text-5xl lg:text-6xl font-black tracking-tight transition-colors ${
                  isQaOvertime
                    ? 'text-rose-500 animate-pulse'
                    : isQaWarning
                    ? 'text-amber-400'
                    : qaIsRunning
                    ? 'text-emerald-300'
                    : 'text-white'
                }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(qaSecondsRemaining)}
              </div>

              {isQaOvertime && (
                <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-black text-rose-400 uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Q&A Overtime</span>
                </div>
              )}
              {isQaWarning && (
                <div className="mt-0.5 text-xs font-bold text-amber-400">
                  ⚠️ Final 60 Seconds of Q&A
                </div>
              )}
            </div>

            {/* Random Draw Member to Answer Section */}
            <div className="my-2 rounded-xl bg-slate-900/90 border border-emerald-900/40 p-2.5 text-center">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span>🎯 Q&A Respondent</span>
                  {answeredMembers.length > 0 && (
                    <span className="text-slate-400 font-normal">({answeredMembers.length} answered)</span>
                  )}
                </span>
                {answeredMembers.length > 0 && (
                  <button
                    onClick={onResetRespondents}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Reset picks
                  </button>
                )}
              </div>

              {isShufflingRespondent ? (
                <div className="py-1 animate-pulse">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Shuffling members...</span>
                  <div className="font-mono text-base font-black text-amber-300 truncate">
                    {candidateName}
                  </div>
                </div>
              ) : currentRespondent ? (
                <div className="py-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Selected to Answer:</span>
                  <div className="text-sm font-black text-white bg-emerald-950/60 border border-emerald-600/50 rounded-lg py-1 px-2.5 truncate">
                    🎯 {currentRespondent}
                  </div>
                </div>
              ) : (
                <div className="py-1 text-xs text-slate-400">
                  Click below or press <kbd className="font-mono text-[10px] px-1 py-0.5 bg-slate-800 rounded border border-slate-700">A</kbd> to randomly select an answerer
                </div>
              )}

              <button
                onClick={handleDrawRespondent}
                disabled={isShufflingRespondent || !membersList.length}
                className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Dice5 className={`h-3.5 w-3.5 ${isShufflingRespondent ? 'animate-spin' : ''}`} />
                <span>{currentRespondent ? 'Draw Another Member (A)' : 'Draw Member to Answer (A)'}</span>
              </button>

              {/* Quick clickable member chips */}
              {membersList.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1 max-h-16 overflow-y-auto pt-1">
                  {membersList.map((m, idx) => {
                    const isAnswered = answeredMembers.includes(m);
                    const isCurrent = currentRespondent === m;
                    return (
                      <button
                        key={idx}
                        onClick={() => onSelectRespondent(m)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                          isCurrent
                            ? 'bg-emerald-600 border-emerald-400 text-white font-bold ring-1 ring-emerald-400'
                            : isAnswered
                            ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400/80'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={isAnswered ? 'Already answered (click to pick again)' : 'Click to assign'}
                      >
                        {isAnswered && <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5 text-emerald-400" />}
                        {m.split('(')[0].trim()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Q&A Controls */}
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onToggleQaTimer}
                className={`col-span-2 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 font-bold text-xs text-white shadow-md transition active:scale-[0.99] ${
                  qaIsRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {qaIsRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                <span>{qaIsRunning ? 'Pause Q&A (Q)' : 'Start Q&A (Q)'}</span>
              </button>

              <button
                onClick={() => onResetQaTimer()}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                title="Reset Q&A timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-[11px]">Nudge Q&A:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onAdjustQaSeconds(60)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-mono"
                >
                  +1m
                </button>
                <button
                  onClick={() => onAdjustQaSeconds(-60)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] font-mono"
                >
                  -1m
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Rate Selectors for DOTE5110 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Presentation Rate:</span>
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => onSetPresPerMember(2)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                presMinutesPerMember === 2 && presTimingMode === 'per_member'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2m / member (DOTE5110)
            </button>
            <button
              onClick={() => onSetPresPerMember(1)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                presMinutesPerMember === 1 && presTimingMode === 'per_member'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1m / member
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Q&A Duration:</span>
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => onSetQaDuration(5, false)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                qaMinutes === 5 && qaTimingMode === 'fixed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5m Fixed
            </button>
            <button
              onClick={() => onSetQaDuration(3, false)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                qaMinutes === 3 && qaTimingMode === 'fixed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3m Fixed
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
