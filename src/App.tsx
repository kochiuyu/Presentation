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
import { loadSessionState, saveSessionState, parseRosterInput } from './utils/storage';
import { playChime, playWarningChime, playTick, playFanfare } from './utils/audio';
import { SessionState, GroupItem, TimingMode, computePresentationMinutes, computeQaMinutes } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [session, setSession] = useState<SessionState>(() => loadSessionState());

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
    return Math.round(mins * 60);
  });
  const [presIsRunning, setPresIsRunning] = useState<boolean>(false);

  // Independent Q&A Timer State
  const [qaSecondsRemaining, setQaSecondsRemaining] = useState<number>(() => {
    const mins = computeQaMinutes(
      session.currentGroup,
      session.qaTimingMode,
      session.qaMinutes,
      session.qaMinutesPerMember
    );
    return Math.round(mins * 60);
  });
  const [qaIsRunning, setQaIsRunning] = useState<boolean>(false);

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
  const hasWarnedPresRef = useRef<boolean>(false);
  const hasWarnedQaRef = useRef<boolean>(false);

  // Persist session state to localStorage
  useEffect(() => {
    saveSessionState({
      ...session,
      currentRespondent,
      answeredMembers,
    });
  }, [session, currentRespondent, answeredMembers]);

  // Master Timer Tick (handles both independent clocks)
  useEffect(() => {
    const anyRunning = presIsRunning || qaIsRunning;

    if (anyRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        // Presentation Clock
        if (presIsRunning) {
          setPresSecondsRemaining((prev) => {
            const next = prev - 1;

            if (next === 60 && !hasWarnedPresRef.current) {
              hasWarnedPresRef.current = true;
              if (session.soundEnabled) playWarningChime(session.volume);
            }

            if (next === 0) {
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
            const next = prev - 1;

            if (next === 60 && !hasWarnedQaRef.current) {
              hasWarnedQaRef.current = true;
              if (session.soundEnabled) playWarningChime(session.volume);
            }

            if (next === 0) {
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
    setPresIsRunning((prev) => !prev);
  }, []);

  // Reset Presentation Timer
  // Reset Presentation Timer (Strictly checks customMinutes to prevent SyntheticEvent becoming NaN)
  const handleResetPresTimer = useCallback(
    (customMinutes?: unknown) => {
      setPresIsRunning(false);
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
    setQaIsRunning((prev) => {
      const next = !prev;
      if (next && presIsRunning) {
        setPresIsRunning(false);
      }
      return next;
    });
  }, [presIsRunning]);

  // Reset Q&A Timer (Strictly checks customMinutes to prevent SyntheticEvent becoming NaN)
  const handleResetQaTimer = useCallback(
    (customMinutes?: unknown) => {
      setQaIsRunning(false);
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

  // Centralized Animated Group Draw (Roulette with deceleration, ticks, fanfare, and confetti)
  const handleTriggerGroupDraw = useCallback(() => {
    if (isDrawingGroup) return;
    if (session.pendingGroups.length === 0) {
      alert('All groups have presented in this session! Click "Reset All" to start a new class round.');
      return;
    }

    setIsDrawingGroup(true);
    let speed = 40;
    let iterations = 0;
    const maxIterations = Math.min(26, Math.max(14, session.pendingGroups.length * 2));

    const step = () => {
      const randomIndex = Math.floor(Math.random() * session.pendingGroups.length);
      const tempCandidate = session.pendingGroups[randomIndex];
      setDrawingCandidate(tempCandidate.name);
      if (session.soundEnabled) {
        playTick(0.5);
      }
      iterations++;

      if (iterations < maxIterations) {
        speed += 12; // Realistic deceleration
        setTimeout(step, speed);
      } else {
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
    setIsDrawingGroup(false);
    setDrawingCandidate('');

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
    hasWarnedQaRef.current = false;
    const cleanQaMins = computeQaMinutes(
      null,
      session.qaTimingMode,
      session.qaMinutes,
      session.qaMinutesPerMember
    );
    setQaSecondsRemaining(Math.round(cleanQaMins * 60));
  }, [
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
    setSession((prev) => ({
      ...prev,
      presentedGroups: prev.presentedGroups.filter((g) => g.id !== group.id),
      pendingGroups: [...prev.pendingGroups, { ...group, presentedAt: undefined }],
      currentGroup: prev.currentGroup?.id === group.id ? null : prev.currentGroup,
    }));
  }, []);

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
      const updatedSession: SessionState = {
        ...session,
        courseTitle: params.courseTitle,
        rawGroupInput: params.rawGroupInput,
        pendingGroups: params.pendingGroups,
        presentedGroups: [],
        currentGroup: null,
        currentRespondent: null,
        answeredMembers: [],
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
      setCurrentRespondent(null);
      setAnsweredMembers([]);

      // Reset presentation timer
      setPresIsRunning(false);
      const presM = computePresentationMinutes(
        null,
        params.presTimingMode,
        params.presMinutesPerMember,
        params.presentationMinutes
      );
      setPresSecondsRemaining(Math.round(presM * 60));

      // Reset Q&A timer
      setQaIsRunning(false);
      const qaM = computeQaMinutes(null, params.qaTimingMode, params.qaMinutes, params.qaMinutesPerMember);
      setQaSecondsRemaining(Math.round(qaM * 60));
    },
    [session]
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
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
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
      } else if (e.key === 'Escape') {
        setIsProjectorOpen(false);
        setIsShortcutsOpen(false);
        setQrModalData((prev) => ({ ...prev, isOpen: false }));
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
              onAdjustPresSeconds={(delta) => setPresSecondsRemaining((prev) => prev + delta)}
              onSetPresPerMember={handleSetPresPerMember}

              qaSecondsRemaining={qaSecondsRemaining}
              qaIsRunning={qaIsRunning}
              qaTimingMode={session.qaTimingMode}
              qaMinutes={session.qaMinutes}
              qaMinutesPerMember={session.qaMinutesPerMember}
              onToggleQaTimer={handleToggleQaTimer}
              onResetQaTimer={handleResetQaTimer}
              onAdjustQaSeconds={(delta) => setQaSecondsRemaining((prev) => prev + delta)}
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
