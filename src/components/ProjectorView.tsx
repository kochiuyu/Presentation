import React, { useState } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  Dice5,
  QrCode,
  RotateCcw,
  AlertTriangle,
  Presentation,
  MessageSquareQuote,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GroupItem, TimingMode } from '../types';
import { playTick, playFanfare } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ProjectorViewProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  currentGroup: GroupItem | null;
  pendingGroups: GroupItem[];
  presentedGroups: GroupItem[];

  // Group Draw Animation & Triggers
  isDrawingGroup: boolean;
  drawingCandidate: string;
  onDrawNextGroup: () => void;
  onResetAll: () => void;

  // Presentation Timer
  presSecondsRemaining: number;
  presIsRunning: boolean;
  presTimingMode: TimingMode;
  presMinutesPerMember: number;
  presentationMinutes: number;
  onTogglePresTimer: () => void;
  onResetPresTimer: () => void;

  // Q&A Timer
  qaSecondsRemaining: number;
  qaIsRunning: boolean;
  qaTimingMode: TimingMode;
  qaMinutes: number;
  onToggleQaTimer: () => void;
  onResetQaTimer: () => void;

  // Q&A Member Draw
  currentRespondent: string | null;
  answeredMembers: string[];
  soundEnabled: boolean;
  onSelectRespondent: (name: string) => void;

  onOpenQr: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  isOpen,
  onClose,
  courseTitle,
  currentGroup,
  pendingGroups,
  presentedGroups,
  isDrawingGroup,
  drawingCandidate,
  onDrawNextGroup,
  onResetAll,
  presSecondsRemaining,
  presIsRunning,
  presTimingMode,
  presMinutesPerMember,
  presentationMinutes,
  onTogglePresTimer,
  onResetPresTimer,
  qaSecondsRemaining,
  qaIsRunning,
  qaTimingMode,
  qaMinutes,
  onToggleQaTimer,
  onResetQaTimer,
  currentRespondent,
  answeredMembers,
  soundEnabled,
  onSelectRespondent,
  onOpenQr,
}) => {
  const [isShufflingRespondent, setIsShufflingRespondent] = useState(false);
  const [candidateRespondentName, setCandidateRespondentName] = useState<string>('');
  const [showPoolDrawer, setShowPoolDrawer] = useState<boolean>(true);

  if (!isOpen) return null;

  const isPresOvertime = presSecondsRemaining < 0;
  const isPresWarning = presSecondsRemaining <= 60 && presSecondsRemaining > 0;

  const isQaOvertime = qaSecondsRemaining < 0;
  const isQaWarning = qaSecondsRemaining <= 60 && qaSecondsRemaining > 0;

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

  const membersList = currentGroup?.members && currentGroup.members.length > 0
    ? currentGroup.members
    : [];

  const memberCount = membersList.length > 0 ? membersList.length : 7;

  const activePresTotalMin = presTimingMode === 'per_member'
    ? Math.round(memberCount * presMinutesPerMember * 10) / 10
    : presentationMinutes;

  const totalGroupsCount = pendingGroups.length + presentedGroups.length;

  const handleDrawRespondent = () => {
    if (isShufflingRespondent || !membersList.length) return;
    const uncalled = membersList.filter((m) => !answeredMembers.includes(m));
    const pool = uncalled.length > 0 ? uncalled : membersList;

    setIsShufflingRespondent(true);
    let speed = 40;
    let iterations = 0;
    const maxIterations = 20;

    const step = () => {
      const randIdx = Math.floor(Math.random() * pool.length);
      const temp = pool[randIdx];
      setCandidateRespondentName(temp);
      if (soundEnabled) playTick(0.4);
      iterations++;

      if (iterations < maxIterations) {
        speed += 14;
        setTimeout(step, speed);
      } else {
        const picked = pool[randIdx];
        setIsShufflingRespondent(false);
        setCandidateRespondentName('');
        onSelectRespondent(picked);
        if (soundEnabled) playFanfare(0.7);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }
    };
    step();
  };

  const handleConfirmReset = () => {
    if (window.confirm('Reset all groups and timers? This returns all groups to the remaining pool for a new session.')) {
      onResetAll();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 p-4 sm:p-6 md:p-8 text-white select-none overflow-y-auto">
      {/* Top Projector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-black tracking-widest text-indigo-400 uppercase">
            PROJECTOR VIEW
          </span>
          <h2 className="text-lg md:text-2xl font-black text-slate-100 tracking-tight">
            {courseTitle || 'DOTE5110 Statistical Analysis'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Remaining Pool */}
          <button
            onClick={() => setShowPoolDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
              showPoolDrawer
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle display of remaining groups pool"
          >
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span>Pool ({pendingGroups.length} Left)</span>
            {showPoolDrawer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {/* Peer Eval QR */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
          >
            <QrCode className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Peer Eval QR</span>
          </button>

          {/* Reset All Button */}
          <button
            onClick={handleConfirmReset}
            className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition"
            title="Reset All Groups"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reset All</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Exit [Esc]</span>
          </button>
        </div>
      </div>

      {/* Center Stage Container */}
      <div className="flex flex-1 flex-col items-center justify-center text-center my-3 max-w-6xl mx-auto w-full">

        {/* 1. SUSPENSEFUL GROUP DRAWING ANIMATION / ACTIVE PRESENTER HERO */}
        {isDrawingGroup ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 border-amber-400/90 bg-gradient-to-b from-amber-950/60 via-slate-900 to-amber-950/60 shadow-2xl shadow-amber-500/20 animate-pulse max-w-4xl w-full my-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/50 px-4 py-1.5 text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 mb-3">
              <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
              <span>RANDOMLY DRAWING NEXT GROUP...</span>
            </div>
            <div className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-amber-200 tracking-tight drop-shadow-[0_0_35px_rgba(251,191,36,0.5)]">
              {drawingCandidate || 'Shuffling Roster...'}
            </div>
            <p className="mt-3 text-xs sm:text-sm text-amber-400/90 font-semibold">
              Selecting fairly without replacement from {pendingGroups.length} remaining groups in pool
            </p>
          </div>
        ) : currentGroup ? (
          <div className="flex flex-col items-center max-w-5xl w-full my-2">
            <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-300 mb-1">
              NOW ON STAGE
            </span>
            <h3 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              {currentGroup.name}
            </h3>

            {/* Leader & Members Badges */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 max-w-4xl">
              {currentGroup.leader && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/50 px-3 py-1 text-xs text-indigo-200 font-bold shadow-xs">
                  <span>👑 Leader:</span>
                  <span className="text-white">{currentGroup.leader}</span>
                </div>
              )}
              {currentGroup.members && currentGroup.members.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  ({currentGroup.members.length} members)
                </span>
              )}
            </div>

            {/* Member Chips on Projector */}
            {currentGroup.members && currentGroup.members.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 max-w-3xl">
                {currentGroup.members.map((m, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                      currentRespondent === m
                        ? 'bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-400/40'
                        : answeredMembers.includes(m)
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {answeredMembers.includes(m) && '✓ '}
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-800 bg-slate-900/50 max-w-2xl w-full my-2">
            <Users className="h-10 w-10 text-slate-600 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-slate-300">
              Ready to Start Session
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-md">
              {pendingGroups.length > 0
                ? `${pendingGroups.length} groups in remaining pool. Click "Next Group (N)" to draw.`
                : 'All groups have presented! Click "Reset All" to begin a new round.'}
            </p>
            {pendingGroups.length > 0 && (
              <button
                onClick={onDrawNextGroup}
                className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <Dice5 className="h-4 w-4" />
                <span>Draw First Group (N)</span>
              </button>
            )}
          </div>
        )}

        {/* 2. PROMINENT Q&A RESPONDENT BANNER */}
        <div className="w-full max-w-3xl my-2">
          {isShufflingRespondent ? (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-950/60 p-3 text-center shadow-lg animate-pulse">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                🎲 RANDOMLY DRAWING Q&A RESPONDENT...
              </span>
              <div className="font-mono text-2xl md:text-3xl font-black text-amber-200 truncate mt-0.5">
                {candidateRespondentName}
              </div>
            </div>
          ) : currentRespondent ? (
            <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 p-3 text-center shadow-xl shadow-emerald-500/10">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                🎯 SELECTED TO ANSWER THE QUESTION:
              </span>
              <div className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug mt-0.5">
                {currentRespondent}
              </div>
            </div>
          ) : currentGroup ? (
            <div className="flex items-center justify-center">
              <button
                onClick={handleDrawRespondent}
                disabled={!membersList.length}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
              >
                <Dice5 className="h-4 w-4" />
                <span>🎲 Random Draw Member to Answer (A)</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* 3. SEPARATED SIDE-BY-SIDE DUAL TIMERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-5xl my-2">
          
          {/* CLOCK 1: Presentation Time */}
          <div className={`relative flex flex-col items-center justify-center rounded-3xl border-2 p-5 sm:p-7 transition-all ${
            presIsRunning
              ? 'border-indigo-400 bg-gradient-to-b from-indigo-950/50 to-slate-950 ring-4 ring-indigo-500/30'
              : 'border-slate-800 bg-slate-900/60'
          }`}>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-indigo-300 mb-1">
              <Presentation className="h-4 w-4" />
              <span>PRESENTATION ({activePresTotalMin}m)</span>
            </div>

            <div
              className={`font-mono text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none my-1 transition-colors ${
                isPresOvertime
                  ? 'text-rose-500 animate-pulse drop-shadow-[0_0_35px_rgba(244,63,94,0.4)]'
                  : isPresWarning
                  ? 'text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.25)]'
                  : presIsRunning
                  ? 'text-indigo-300 drop-shadow-[0_0_35px_rgba(99,102,241,0.25)]'
                  : 'text-white'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(presSecondsRemaining)}
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onTogglePresTimer}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                  presIsRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {presIsRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                <span>{presIsRunning ? 'Pause Pres (Space)' : 'Start Pres (Space)'}</span>
              </button>
              <button
                onClick={() => onResetPresTimer()}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                title="Reset Presentation Clock"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {isPresOvertime && (
              <div className="mt-2 flex items-center gap-1 text-xs font-black text-rose-400 uppercase animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                <span>Presentation Overtime</span>
              </div>
            )}
          </div>

          {/* CLOCK 2: Q&A Time */}
          <div className={`relative flex flex-col items-center justify-center rounded-3xl border-2 p-5 sm:p-7 transition-all ${
            qaIsRunning
              ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/50 to-slate-950 ring-4 ring-emerald-500/30'
              : 'border-slate-800 bg-slate-900/60'
          }`}>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-300 mb-1">
              <MessageSquareQuote className="h-4 w-4" />
              <span>Q&A DISCUSSION ({qaMinutes}m {qaTimingMode === 'fixed' ? 'FIXED' : 'PROP'})</span>
            </div>

            <div
              className={`font-mono text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none my-1 transition-colors ${
                isQaOvertime
                  ? 'text-rose-500 animate-pulse drop-shadow-[0_0_35px_rgba(244,63,94,0.4)]'
                  : isQaWarning
                  ? 'text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.25)]'
                  : qaIsRunning
                  ? 'text-emerald-300 drop-shadow-[0_0_35px_rgba(52,211,153,0.25)]'
                  : 'text-white'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(qaSecondsRemaining)}
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onToggleQaTimer}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                  qaIsRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {qaIsRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                <span>{qaIsRunning ? 'Pause Q&A (Q)' : 'Start Q&A (Q)'}</span>
              </button>
              <button
                onClick={() => onResetQaTimer()}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                title="Reset Q&A Clock"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handleDrawRespondent}
                disabled={!membersList.length}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                title="Randomly draw a member to answer (A)"
              >
                <Dice5 className="h-3.5 w-3.5" />
                <span>Draw Answerer (A)</span>
              </button>
            </div>

            {isQaOvertime && (
              <div className="mt-2 flex items-center gap-1 text-xs font-black text-rose-400 uppercase animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                <span>Q&A Overtime</span>
              </div>
            )}
          </div>

        </div>

        {/* 4. POOL OF REMAINING GROUPS IN PROJECTOR VIEW */}
        {showPoolDrawer && (
          <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 mt-2 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-slate-200">
                  Pool of Remaining Groups ({pendingGroups.length} of {totalGroupsCount || 8} to Present)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-semibold">{presentedGroups.length} presented</span>
                <span>·</span>
                <span className="text-amber-300 font-semibold">{pendingGroups.length} waiting in pool</span>
              </div>
            </div>

            {pendingGroups.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 max-h-28 overflow-y-auto py-1">
                {pendingGroups.map((group, idx) => {
                  const isCurrentCandidate = isDrawingGroup && drawingCandidate === group.name;
                  return (
                    <div
                      key={group.id}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
                        isCurrentCandidate
                          ? 'border-2 border-amber-400 bg-amber-500/30 text-amber-100 font-bold scale-105 shadow-md shadow-amber-500/30'
                          : 'border border-slate-800 bg-slate-950/80 text-slate-300'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-500">{idx + 1}.</span>
                      <span className="font-semibold">{group.name}</span>
                      {group.leader && (
                        <span className="text-[10px] text-indigo-400">
                          👑 {group.leader.split('(')[0].trim()}
                        </span>
                      )}
                      {group.members && group.members.length > 0 && (
                        <span className="rounded bg-slate-900 px-1.5 py-0.2 text-[10px] font-mono text-slate-400 border border-slate-800">
                          {group.members.length}p
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>All {totalGroupsCount} groups in the pool have presented! Press &quot;Reset All&quot; to start again.</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Bar Controls for Instructor */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="hidden sm:flex items-center gap-3">
          <span><kbd className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-slate-300">Space</kbd> Pres</span>
          <span><kbd className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-slate-300">Q</kbd> Q&A</span>
          <span><kbd className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-slate-300">A</kbd> Answerer</span>
          <span><kbd className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-slate-300">N</kbd> Draw Group</span>
          <span><kbd className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-slate-300">R</kbd> Reset</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDrawRespondent}
            disabled={!membersList.length}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Dice5 className="h-3.5 w-3.5" />
            <span>Draw Answerer (A)</span>
          </button>
          
          <button
            onClick={onDrawNextGroup}
            disabled={isDrawingGroup || pendingGroups.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Dice5 className={`h-3.5 w-3.5 ${isDrawingGroup ? 'animate-spin' : ''}`} />
            <span>{isDrawingGroup ? 'Drawing Group...' : 'Draw Next Group (N)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
