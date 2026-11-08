/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { GroupPicker } from './components/GroupPicker';
import { DualTimer } from './components/DualTimer';
import { FormsHub } from './components/FormsHub';
import { SetupPanel } from './components/SetupPanel';
import { ProjectorView } from './components/ProjectorView';
import { QrModal } from './components/QrModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { BackupPanel } from './components/BackupPanel';
import { loadSessionState, saveSessionState, parseRosterInput } from './utils/storage';
import { createBackup, type SessionBackup } from './utils/backup';
import { playChime, playWarningChime, playTick, playFanfare } from './utils/audio';
import { SessionState, GroupItem, TimingMode, computePresentationMinutes, computeQaMinutes } from './types';
import confetti from 'canvas-confetti';

const CLOCK_KEY = 'presentation_facilitator_clocks_v1';

function loadClocks(groupId: string | null) {
  try {
    const value = JSON.parse(localStorage.getItem(CLOCK_KEY) || 'null');
    if (value?.groupId !== groupId) return null;
    if (!Number.isFinite(value.presSeconds) || !Number.isFinite(value.qaSeconds)) return null;
    return {
      groupId: value.groupId as string | null,
      presSeconds: value.presSeconds as number,
      qaSeconds: value.qaSeconds as number,
      presDeadline: Number.isFinite(value.presDeadline) ? value.presDeadline as number : null,
      qaDeadline: Number.isFinite(value.qaDeadline) ? value.qaDeadline as number : null,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<SessionState>(() => loadSessionState());
  const [setupVersion, setSetupVersion] = useState(0);
  const [savedClocks] = useState(() => loadClocks(session.currentGroup?.id ?? null));

  // Centralized Group Draw Animation State
  const [isDrawingGroup, setIsDrawingGroup] = useState<boolean>(false);
  const [drawingCandidate, setDrawingCandidate] = useState<string>('');

  // Independent Presentation Timer State
  const [presSecondsRemaining, setPresSecondsRemaining] = useState<number>(() => {
    const mins = computePresentationMinutes(
      session.currentGroup,
      session.presTimingMode,
      session.presMinutesPerMember,
      session.presentationMinutes
    );
    return savedClocks?.presDeadline
      ? Math.ceil((savedClocks.presDeadline - Date.now()) / 1000)
      : savedClocks?.presSeconds ?? Math.round(mins * 60);
  });
  const [presIsRunning, setPresIsRunning] = useState<boolean>(Boolean(savedClocks?.presDeadline));

  // Independent Q&A Timer State
  const [qaSecondsRemaining, setQaSecondsRemaining] = useState<number>(() => {
    const mins = computeQaMinutes(
      session.currentGroup,
      session.qaTimingMode,
      session.qaMinutes,
      session.qaMinutesPerMember
    );
    return savedClocks?.qaDeadline
      ? Math.ceil((savedClocks.qaDeadline - Date.now()) / 1000)
      : savedClocks?.qaSeconds ?? Math.round(mins * 60);
  });
  const [qaIsRunning, setQaIsRunning] = useState<boolean>(Boolean(savedClocks?.qaDeadline));

  // Q&A Respondent State
  const [currentRespondent, setCurrentRespondent] = useState<string | null>(session.currentRespondent ?? null);
  const [answeredMembers, setAnsweredMembers] = useState<string[]>(session.answeredMembers ?? []);

  // Modals & Views
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  const timerIntervalRef = useRef<number | null>(null);
  const presDeadlineRef = useRef<number | null>(savedClocks?.presDeadline ?? null);
  const qaDeadlineRef = useRef<number | null>(savedClocks?.qaDeadline ?? null);
  const groupDrawTimeoutRef = useRef<number | null>(null);
  const groupDrawGenerationRef = useRef(0);
  const hasWarnedPresRef = useRef<boolean>(false);
  const hasWarnedQaRef = useRef<boolean>(false);

  const exportBackup = () => createBackup(
    { ...session, currentRespondent, answeredMembers },
    presDeadlineRef.current !== null ? Math.ceil((presDeadlineRef.current - Date.now()) / 1000) : presSecondsRemaining,
    qaDeadlineRef.current !== null ? Math.ceil((qaDeadlineRef.current - Date.now()) / 1000) : qaSecondsRemaining
  );

  const restoreBackup = (backup: SessionBackup) => {
    cancelGroupDraw();
    presDeadlineRef.current = null;
    qaDeadlineRef.current = null;
    hasWarnedPresRef.current = false;
    hasWarnedQaRef.current = false;
    setPresIsRunning(false);
    setQaIsRunning(false);
    setPresSecondsRemaining(backup.clocks.presSeconds);
    setQaSecondsRemaining(backup.clocks.qaSeconds);
    setCurrentRespondent(backup.session.currentRespondent);
    setAnsweredMembers(backup.session.answeredMembers);
    setSession(backup.session);
    setSetupVersion((value) => value + 1);
  };

  // Persist session state to localStorage
  useEffect(() => {
    saveSessionState({
      ...session,
      currentRespondent,
      answeredMembers,
    });
  }, [session, currentRespondent, answeredMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(CLOCK_KEY, JSON.stringify({
        groupId: session.currentGroup?.id ?? null,
        presSeconds: presSecondsRemaining,
        qaSeconds: qaSecondsRemaining,
        presDeadline: presIsRunning ? presDeadlineRef.current : null,
        qaDeadline: qaIsRunning ? qaDeadlineRef.current : null,
      }));
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }, [session.currentGroup?.id, presSecondsRemaining, qaSecondsRemaining, presIsRunning, qaIsRunning]);

  // Master Timer Tick (handles both independent clocks)
  useEffect(() => {
    const anyRunning = presIsRunning || qaIsRunning;

    if (anyRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        // Presentation Clock
        if (presIsRunning) {
          setPresSecondsRemaining((prev) => {
            const next = Math.ceil(((presDeadlineRef.current ?? Date.now()) - Date.now()) / 1000);

            if (prev > 60 && next <= 60 && next > 0 && !hasWarnedPresRef.current) {
              hasWarnedPresRef.current = true;
              if (session.soundEnabled) playWarningChime(session.volume);
            }

            if (prev > 0 && next <= 0) {
              if (session.soundEnabled) playChime(session.volume);
              try {
                confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
              } catch {
                // ignore
              }
            }

            return next;
          });
        }

        // Q&A Clock
        if (qaIsRunning) {
          setQaSecondsRemaining((prev) => {
            const next = Math.ceil(((qaDeadlineRef.current ?? Date.now()) - Date.now()) / 1000);

            if (prev > 60 && next <= 60 && next > 0 && !hasWarnedQaRef.current) {
              hasWarnedQaRef.current = true;
              if (session.soundEnabled) playWarningChime(session.volume);
            }

            if (prev > 0 && next <= 0) {
              if (session.soundEnabled) playChime(session.volume);
              try {
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
              } catch {
                // ignore
              }
            }

            return next;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [presIsRunning, qaIsRunning, session.soundEnabled, session.volume]);

  // Toggle Presentation Timer
  const handleTogglePresTimer = useCallback(() => {
    if (presIsRunning) {
      if (presDeadlineRef.current !== null) setPresSecondsRemaining(Math.ceil((presDeadlineRef.current - Date.now()) / 1000));
      presDeadlineRef.current = null;
      setPresIsRunning(false);
    } else {
      presDeadlineRef.current = Date.now() + presSecondsRemaining * 1000;
      setPresIsRunning(true);
    }
  }, [presIsRunning, presSecondsRemaining]);

  // Reset Presentation Timer
  // Reset Presentation Timer (Strictly checks customMinutes to prevent SyntheticEvent becoming NaN)
  const handleResetPresTimer = useCallback(
    (customMinutes?: unknown) => {
      setPresIsRunning(false);
      presDeadlineRef.current = null;
      hasWarnedPresRef.current = false;
      const mins =
        typeof customMinutes === 'number' && Number.isFinite(customMinutes)
          ? customMinutes
          : computePresentationMinutes(
              session.currentGroup,
              session.presTimingMode,
              session.presMinutesPerMember,
              session.presentationMinutes
            );
      const safeMins = typeof mins === 'number' && Number.isFinite(mins) && mins >= 0 ? mins : 14;
      setPresSecondsRemaining(Math.round(safeMins * 60));
    },
    [session.currentGroup, session.presTimingMode, session.presMinutesPerMember, session.presentationMinutes]
  );

  // Toggle Q&A Timer
  const handleToggleQaTimer = useCallback(() => {
    if (qaIsRunning) {
      if (qaDeadlineRef.current !== null) setQaSecondsRemaining(Math.ceil((qaDeadlineRef.current - Date.now()) / 1000));
      qaDeadlineRef.current = null;
      setQaIsRunning(false);
    } else {
      qaDeadlineRef.current = Date.now() + qaSecondsRemaining * 1000;
      setQaIsRunning(true);
      if (presIsRunning) {
        if (presDeadlineRef.current !== null) setPresSecondsRemaining(Math.ceil((presDeadlineRef.current - Date.now()) / 1000));
        presDeadlineRef.current = null;
        setPresIsRunning(false);
      }
    }
  }, [qaIsRunning, qaSecondsRemaining, presIsRunning]);

  // Reset Q&A Timer (Strictly checks customMinutes to prevent SyntheticEvent becoming NaN)
  const handleResetQaTimer = useCallback(
    (customMinutes?: unknown) => {
      setQaIsRunning(false);
      qaDeadlineRef.current = null;
      hasWarnedQaRef.current = false;
      const mins =
        typeof customMinutes === 'number' && Number.isFinite(customMinutes)
          ? customMinutes
          : computeQaMinutes(
              session.currentGroup,
              session.qaTimingMode,
              session.qaMinutes,
              session.qaMinutesPerMember
            );
      const safeMins = typeof mins === 'number' && Number.isFinite(mins) && mins >= 0 ? mins : 5;
      setQaSecondsRemaining(Math.round(safeMins * 60));
    },
    [session.currentGroup, session.qaTimingMode, session.qaMinutes, session.qaMinutesPerMember]
  );

  // Q&A Member Select & Reset
  const handleSelectRespondent = useCallback((name: string) => {
    setCurrentRespondent(name);
    setAnsweredMembers((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  const handleResetRespondents = useCallback(() => {
    setCurrentRespondent(null);
    setAnsweredMembers([]);
  }, []);

  // Draw Next Group (resets both timers & Q&A respondents for the new group)
  const handleDrawNext = useCallback(
    (picked: GroupItem) => {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedPicked: GroupItem = { ...picked, presentedAt: nowTime };

      setSession((prev) => ({
        ...prev,
        pendingGroups: prev.pendingGroups.filter((g) => g.id !== picked.id),
        presentedGroups: [updatedPicked, ...prev.presentedGroups],
        currentGroup: updatedPicked,
        currentRespondent: null,
        answeredMembers: [],
      }));

      setCurrentRespondent(null);
      setAnsweredMembers([]);

      // Reset presentation clock for this group's member count
      setPresIsRunning(false);
      presDeadlineRef.current = null;
      hasWarnedPresRef.current = false;
      const newPresMins = computePresentationMinutes(
        updatedPicked,
        session.presTimingMode,
        session.presMinutesPerMember,
        session.presentationMinutes
      );
      setPresSecondsRemaining(Math.round(newPresMins * 60));

      // Reset Q&A clock
      setQaIsRunning(false);
      qaDeadlineRef.current = null;
      hasWarnedQaRef.current = false;
      const newQaMins = computeQaMinutes(
        updatedPicked,
        session.qaTimingMode,
        session.qaMinutes,
        session.qaMinutesPerMember
      );
      setQaSecondsRemaining(Math.round(newQaMins * 60));
    },
    [
      session.presTimingMode,
      session.presMinutesPerMember,
      session.presentationMinutes,
      session.qaTimingMode,
      session.qaMinutes,
      session.qaMinutesPerMember,
    ]
  );

  const cancelGroupDraw = useCallback(() => {
    groupDrawGenerationRef.current += 1;
    if (groupDrawTimeoutRef.current !== null) {
      window.clearTimeout(groupDrawTimeoutRef.current);
      groupDrawTimeoutRef.current = null;
    }
    setIsDrawingGroup(false);
    setDrawingCandidate('');
  }, []);

  useEffect(() => () => {
    groupDrawGenerationRef.current += 1;
    if (groupDrawTimeoutRef.current !== null) window.clearTimeout(groupDrawTimeoutRef.current);
  }, []);

  // Centralized Animated Group Draw (Roulette with deceleration, ticks, fanfare, and confetti)
  const handleTriggerGroupDraw = useCallback(() => {
    if (isDrawingGroup) return;
    if (session.pendingGroups.length === 0) {
      alert(session.presentedGroups.length === 0
        ? 'Add a roster in Classroom Setup before drawing a group.'
        : 'All groups have presented in this session! Click "Reset All" to start a new class round.');
      return;
    }

    setIsDrawingGroup(true);
    const drawGeneration = ++groupDrawGenerationRef.current;
    let speed = 40;
    let iterations = 0;
    const maxIterations = Math.min(26, Math.max(14, session.pendingGroups.length * 2));

    const step = () => {
      if (drawGeneration !== groupDrawGenerationRef.current) return;
      const randomIndex = Math.floor(Math.random() * session.pendingGroups.length);
      const tempCandidate = session.pendingGroups[randomIndex];
      setDrawingCandidate(tempCandidate.name);
      if (session.soundEnabled) {
        playTick(0.5);
      }
      iterations++;

      if (iterations < maxIterations) {
        speed += 12; // Realistic deceleration
        groupDrawTimeoutRef.current = window.setTimeout(step, speed);
      } else {
        groupDrawTimeoutRef.current = null;
        // Final pick
        const picked = session.pendingGroups[randomIndex];
        setIsDrawingGroup(false);
        setDrawingCandidate('');
        handleDrawNext(picked);

        if (session.soundEnabled) {
          playFanfare(0.8);
        }

        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.55 },
            colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'],
          });
        } catch {
          // ignore
        }
      }
    };

    step();
  }, [isDrawingGroup, session.pendingGroups, session.soundEnabled, handleDrawNext]);

  // Thorough Reset All Groups & Session State
  const handleResetAll = useCallback(() => {
    // 1. Cancel any active group draw animation
    cancelGroupDraw();

    // 2. Re-parse pristine group roster in original order if raw input is available
    let allGroups: GroupItem[] = [];
    if (session.rawGroupInput && session.rawGroupInput.trim()) {
      allGroups = parseRosterInput(session.rawGroupInput);
    }

    if (!allGroups.length) {
      const seen = new Set<string>();
      const combined = [
        ...session.pendingGroups,
        ...session.presentedGroups,
        ...(session.currentGroup ? [session.currentGroup] : []),
      ];
      for (const g of combined) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          allGroups.push({ ...g, presentedAt: undefined });
        }
      }
    } else {
      allGroups = allGroups.map((g) => ({ ...g, presentedAt: undefined }));
    }

    // 3. Clear session groups & stage state
    setSession((prev) => ({
      ...prev,
      pendingGroups: allGroups,
      presentedGroups: [],
      currentGroup: null,
      currentRespondent: null,
      answeredMembers: [],
    }));

    // 4. Clear Q&A respondent selections
    setCurrentRespondent(null);
    setAnsweredMembers([]);

    // 5. Reset Presentation Clock to fresh default (no group on stage)
    setPresIsRunning(false);
    presDeadlineRef.current = null;
    hasWarnedPresRef.current = false;
    const cleanPresMins = computePresentationMinutes(
      null,
      session.presTimingMode,
      session.presMinutesPerMember,
      session.presentationMinutes
    );
    setPresSecondsRemaining(Math.round(cleanPresMins * 60));

    // 6. Reset Q&A Clock to fresh default
    setQaIsRunning(false);
    qaDeadlineRef.current = null;
    hasWarnedQaRef.current = false;
    const cleanQaMins = computeQaMinutes(
      null,
      session.qaTimingMode,
      session.qaMinutes,
      session.qaMinutesPerMember
    );
    setQaSecondsRemaining(Math.round(cleanQaMins * 60));
  }, [
    cancelGroupDraw,
    session.rawGroupInput,
    session.pendingGroups,
    session.presentedGroups,
    session.currentGroup,
    session.presTimingMode,
    session.presMinutesPerMember,
    session.presentationMinutes,
    session.qaTimingMode,
    session.qaMinutes,
    session.qaMinutesPerMember,
  ]);

  // Return a single group to pending pool
  const handleReturnToPending = useCallback((group: GroupItem) => {
    const wasCurrentGroup = session.currentGroup?.id === group.id;
    setSession((prev) => ({
      ...prev,
      presentedGroups: prev.presentedGroups.filter((g) => g.id !== group.id),
      pendingGroups: [...prev.pendingGroups, { ...group, presentedAt: undefined }],
      currentGroup: prev.currentGroup?.id === group.id ? null : prev.currentGroup,
    }));
    if (!wasCurrentGroup) return;

    setCurrentRespondent(null);
    setAnsweredMembers([]);
    setPresIsRunning(false);
    presDeadlineRef.current = null;
    hasWarnedPresRef.current = false;
    setPresSecondsRemaining(Math.round(computePresentationMinutes(
      null, session.presTimingMode, session.presMinutesPerMember, session.presentationMinutes
    ) * 60));
    setQaIsRunning(false);
    qaDeadlineRef.current = null;
    hasWarnedQaRef.current = false;
    setQaSecondsRemaining(Math.round(computeQaMinutes(
      null, session.qaTimingMode, session.qaMinutes, session.qaMinutesPerMember
    ) * 60));
  }, [session.currentGroup, session.presTimingMode, session.presMinutesPerMember,
      session.presentationMinutes, session.qaTimingMode, session.qaMinutes, session.qaMinutesPerMember]);

  // Initialize from Setup Panel
  const handleInitializeSetup = useCallback(
    (params: {
      courseTitle: string;
      rawGroupInput: string;
      pendingGroups: GroupItem[];
      presTimingMode: TimingMode;
      presMinutesPerMember: number;
      presentationMinutes: number;
      qaTimingMode: TimingMode;
      qaMinutes: number;
      qaMinutesPerMember: number;
      qaFormUrl?: string;
      peerEvalFormUrl: string;
    }) => {
      const rosterChanged = params.rawGroupInput.trim() !== session.rawGroupInput.trim();
      if (rosterChanged && (session.currentGroup || session.presentedGroups.length > 0) &&
          !window.confirm('Changing the roster will clear presentation progress and reset both timers. Continue?')) {
        return false;
      }
      if (rosterChanged) cancelGroupDraw();
      const updatedSession: SessionState = {
        ...session,
        courseTitle: params.courseTitle,
        rawGroupInput: params.rawGroupInput,
        pendingGroups: rosterChanged ? params.pendingGroups : session.pendingGroups,
        presentedGroups: rosterChanged ? [] : session.presentedGroups,
        currentGroup: rosterChanged ? null : session.currentGroup,
        currentRespondent: rosterChanged ? null : currentRespondent,
        answeredMembers: rosterChanged ? [] : answeredMembers,
        presTimingMode: params.presTimingMode,
        presMinutesPerMember: params.presMinutesPerMember,
        presentationMinutes: params.presentationMinutes,
        qaTimingMode: params.qaTimingMode,
        qaMinutes: params.qaMinutes,
        qaMinutesPerMember: params.qaMinutesPerMember,
        qaFormUrl: params.qaFormUrl,
        peerEvalFormUrl: params.peerEvalFormUrl,
      };

      setSession(updatedSession);
      if (!rosterChanged) return true;
      setCurrentRespondent(null);
      setAnsweredMembers([]);

      // Reset presentation timer
      setPresIsRunning(false);
      presDeadlineRef.current = null;
      const presM = computePresentationMinutes(
        null,
        params.presTimingMode,
        params.presMinutesPerMember,
        params.presentationMinutes
      );
      setPresSecondsRemaining(Math.round(presM * 60));

      // Reset Q&A timer
      setQaIsRunning(false);
      qaDeadlineRef.current = null;
      const qaM = computeQaMinutes(null, params.qaTimingMode, params.qaMinutes, params.qaMinutesPerMember);
      setQaSecondsRemaining(Math.round(qaM * 60));
      return true;
    },
    [session, currentRespondent, answeredMembers, cancelGroupDraw]
  );

  // Set Presentation Rate
  const handleSetPresPerMember = useCallback(
    (rate: number) => {
      setSession((prev) => ({
        ...prev,
        presTimingMode: 'per_member',
        presMinutesPerMember: rate,
      }));
      setPresIsRunning(false);
      presDeadlineRef.current = null;
      const newMins = computePresentationMinutes(session.currentGroup, 'per_member', rate, session.presentationMinutes);
      setPresSecondsRemaining(Math.round(newMins * 60));
    },
    [session.currentGroup, session.presentationMinutes]
  );

  // Set Q&A Duration
  const handleSetQaDuration = useCallback(
    (qaMin: number, isProportional: boolean = false) => {
      setSession((prev) => ({
        ...prev,
        qaTimingMode: isProportional ? 'per_member' : 'fixed',
        qaMinutes: qaMin,
      }));
      setQaIsRunning(false);
      qaDeadlineRef.current = null;
      const newMins = isProportional
        ? computeQaMinutes(session.currentGroup, 'per_member', qaMin, 0.5)
        : qaMin;
      setQaSecondsRemaining(Math.round(newMins * 60));
    },
    [session.currentGroup]
  );

  // Random draw member to answer via shortcut or external call
  const triggerRespondentDraw = useCallback(() => {
    const members = session.currentGroup?.members;
    if (!members || !members.length) return;
    const uncalled = members.filter((m) => !answeredMembers.includes(m));
    const pool = uncalled.length > 0 ? uncalled : members;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    if (session.soundEnabled) playTick(0.5);
    handleSelectRespondent(picked);
    if (session.soundEnabled) playFanfare(0.6);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  }, [session.currentGroup, answeredMembers, session.soundEnabled, handleSelectRespondent]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (qrModalData.isOpen) setQrModalData((prev) => ({ ...prev, isOpen: false }));
        else if (isProjectorOpen) setIsProjectorOpen(false);
        return;
      }
      if (
        e.repeat || e.altKey || e.ctrlKey || e.metaKey ||
        isShortcutsOpen || qrModalData.isOpen ||
        target?.closest('input, textarea, select, button, a, [contenteditable], [role="button"]')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePresTimer();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleToggleQaTimer();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        triggerRespondentDraw();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleTriggerGroupDraw();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsProjectorOpen((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (e.shiftKey) {
          handleResetQaTimer();
        } else {
          handleResetPresTimer();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSession((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePresTimer,
    handleToggleQaTimer,
    triggerRespondentDraw,
    handleTriggerGroupDraw,
    handleResetPresTimer,
    handleResetQaTimer,
    isShortcutsOpen,
    qrModalData.isOpen,
    isProjectorOpen,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        courseTitle={session.courseTitle}
        soundEnabled={session.soundEnabled}
        onToggleSound={() => setSession((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
        onOpenProjector={() => setIsProjectorOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {session.pendingGroups.length === 0 && session.presentedGroups.length === 0 && (
          <a href="#setup-section" className="block rounded-2xl border border-indigo-500/40 bg-indigo-950/40 px-5 py-4 text-sm font-semibold text-indigo-100 hover:bg-indigo-950/70 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            Add your groups in Classroom Setup to begin <span aria-hidden="true">↓</span>
          </a>
        )}
        {/* Top Section: Group Picker (Left) & Separated Timers + Q&A Respondent Draw (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <GroupPicker
              pendingGroups={session.pendingGroups}
              presentedGroups={session.presentedGroups}
              currentGroup={session.currentGroup}
              soundEnabled={session.soundEnabled}
              isDrawingGroup={isDrawingGroup}
              drawingCandidate={drawingCandidate}
              onDrawNext={handleTriggerGroupDraw}
              onResetAll={handleResetAll}
              onReturnToPending={handleReturnToPending}
            />
          </div>

          <div className="lg:col-span-7">
            <DualTimer
              currentGroup={session.currentGroup}
              presSecondsRemaining={presSecondsRemaining}
              presIsRunning={presIsRunning}
              presTimingMode={session.presTimingMode}
              presMinutesPerMember={session.presMinutesPerMember}
              presentationMinutes={session.presentationMinutes}
              onTogglePresTimer={handleTogglePresTimer}
              onResetPresTimer={handleResetPresTimer}
              onAdjustPresSeconds={(delta) => {
                if (presDeadlineRef.current !== null) presDeadlineRef.current += delta * 1000;
                setPresSecondsRemaining((prev) => prev + delta);
              }}
              onSetPresPerMember={handleSetPresPerMember}

              qaSecondsRemaining={qaSecondsRemaining}
              qaIsRunning={qaIsRunning}
              qaTimingMode={session.qaTimingMode}
              qaMinutes={session.qaMinutes}
              qaMinutesPerMember={session.qaMinutesPerMember}
              onToggleQaTimer={handleToggleQaTimer}
              onResetQaTimer={handleResetQaTimer}
              onAdjustQaSeconds={(delta) => {
                if (qaDeadlineRef.current !== null) qaDeadlineRef.current += delta * 1000;
                setQaSecondsRemaining((prev) => prev + delta);
              }}
              onSetQaDuration={handleSetQaDuration}

              currentRespondent={currentRespondent}
              answeredMembers={answeredMembers}
              soundEnabled={session.soundEnabled}
              onSelectRespondent={handleSelectRespondent}
              onResetRespondents={handleResetRespondents}
            />
          </div>
        </div>

        {/* Bottom Section: Forms Hub & Setup Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <FormsHub
              peerEvalUrl={session.peerEvalFormUrl}
              onOpenQr={(title, url) => setQrModalData({ isOpen: true, title, url })}
            />
          </div>

          <div className="lg:col-span-7">
            <SetupPanel
              key={setupVersion}
              courseTitle={session.courseTitle}
              rawGroupInput={session.rawGroupInput}
              presTimingMode={session.presTimingMode}
              presMinutesPerMember={session.presMinutesPerMember}
              presentationMinutes={session.presentationMinutes}
              qaTimingMode={session.qaTimingMode}
              qaMinutes={session.qaMinutes}
              qaMinutesPerMember={session.qaMinutesPerMember}
              peerEvalFormUrl={session.peerEvalFormUrl}
              onUpdateCourseTitle={(title) => setSession((prev) => ({ ...prev, courseTitle: title }))}
              onInitialize={handleInitializeSetup}
            />
          </div>
        </div>
        <BackupPanel onExport={exportBackup} onRestore={restoreBackup} />
      </main>

      {/* Projector View Overlay (Separated Clocks + Q&A Respondent Showcase) */}
      <ProjectorView
        isOpen={isProjectorOpen}
        onClose={() => setIsProjectorOpen(false)}
        courseTitle={session.courseTitle}
        currentGroup={session.currentGroup}
        pendingGroups={session.pendingGroups}
        presentedGroups={session.presentedGroups}

        isDrawingGroup={isDrawingGroup}
        drawingCandidate={drawingCandidate}
        onDrawNextGroup={handleTriggerGroupDraw}
        onResetAll={handleResetAll}

        presSecondsRemaining={presSecondsRemaining}
        presIsRunning={presIsRunning}
        presTimingMode={session.presTimingMode}
        presMinutesPerMember={session.presMinutesPerMember}
        presentationMinutes={session.presentationMinutes}
        onTogglePresTimer={handleTogglePresTimer}
        onResetPresTimer={handleResetPresTimer}

        qaSecondsRemaining={qaSecondsRemaining}
        qaIsRunning={qaIsRunning}
        qaTimingMode={session.qaTimingMode}
        qaMinutes={session.qaMinutes}
        onToggleQaTimer={handleToggleQaTimer}
        onResetQaTimer={handleResetQaTimer}

        currentRespondent={currentRespondent}
        answeredMembers={answeredMembers}
        soundEnabled={session.soundEnabled}
        onSelectRespondent={handleSelectRespondent}

        onOpenQr={() => {
          const formUrl = session.peerEvalFormUrl;
          if (formUrl) {
            setQrModalData({
              isOpen: true,
              title: 'Student Peer Evaluation Form',
              url: formUrl,
            });
          } else {
            alert('Please configure a Peer Evaluation Form URL first in the setup panel.');
          }
        }}
      />

      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        url={qrModalData.url}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
