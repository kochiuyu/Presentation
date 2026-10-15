import React, { useState } from 'react';
import { Settings, Sparkles, Check, ListChecks, Calculator } from 'lucide-react';
import { parseRosterInput, USER_PROVIDED_GOOGLE_SHEET_CSV } from '../utils/storage';
import { GroupItem, TimingMode } from '../types';

interface SetupPanelProps {
  courseTitle: string;
  rawGroupInput: string;
  presTimingMode: TimingMode;
  presMinutesPerMember: number;
  presentationMinutes: number;
  qaTimingMode: TimingMode;
  qaMinutes: number;
  qaMinutesPerMember: number;
  qaFormUrl?: string;
  peerEvalFormUrl: string;
  onUpdateCourseTitle?: (title: string) => void;
  onInitialize: (params: {
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
  }) => void;
}

export const SetupPanel: React.FC<SetupPanelProps> = ({
  courseTitle: initialCourse,
  rawGroupInput: initialRaw,
  presTimingMode: initialPresMode,
  presMinutesPerMember: initialPresRate,
  presentationMinutes: initialPresMin,
  qaTimingMode: initialQaMode,
  qaMinutes: initialQaMin,
  qaMinutesPerMember: initialQaRate,
  qaFormUrl: initialQaUrl,
  peerEvalFormUrl: initialPeerUrl,
  onUpdateCourseTitle,
  onInitialize,
}) => {
  const [courseTitle, setCourseTitle] = useState(initialCourse);
  const [rawText, setRawText] = useState(initialRaw);

  // Sync courseTitle if initialCourse changes externally
  React.useEffect(() => {
    setCourseTitle(initialCourse);
  }, [initialCourse]);

  // Presentation timing state
  const [presTimingMode, setPresTimingMode] = useState<TimingMode>(initialPresMode);
  const [presRate, setPresRate] = useState<number>(initialPresRate);
  const [presFixed, setPresFixed] = useState<number>(initialPresMin);

  // QA timing state
  const [qaTimingMode, setQaTimingMode] = useState<TimingMode>(initialQaMode);
  const [qaFixed, setQaFixed] = useState<number>(initialQaMin);
  const [qaRate, setQaRate] = useState<number>(initialQaRate);

  const [qaUrl, setQaUrl] = useState(initialQaUrl);
  const [peerUrl, setPeerUrl] = useState(initialPeerUrl);
  const [justSaved, setJustSaved] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);

  const parsedItems = parseRosterInput(rawText);

  const handleInit = () => {
    if (parsedItems.length === 0) {
      alert('Please enter at least one group name or paste your Google Sheet CSV/roster.');
      return;
    }

    onInitialize({
      courseTitle: courseTitle.trim() || 'DOTE5110 Statistical Analysis',
      rawGroupInput: rawText,
      pendingGroups: parsedItems,
      presTimingMode,
      presMinutesPerMember: Number(presRate) || 2,
      presentationMinutes: Number(presFixed) || 14,
      qaTimingMode,
      qaMinutes: Number(qaFixed) || 5,
      qaMinutesPerMember: Number(qaRate) || 0.5,
      peerEvalFormUrl: peerUrl.trim() || 'https://forms.gle/bKtEYEEkvUy3F4mt6',
    });

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleQuickSaveTitle = () => {
    if (onUpdateCourseTitle) {
      onUpdateCourseTitle(courseTitle.trim() || 'DOTE5110 Statistical Analysis');
      setTitleSaved(true);
      setTimeout(() => setTitleSaved(false), 2000);
    }
  };

  const handleLoadSample = () => {
    setCourseTitle('DOTE5110 Statistical Analysis');
    setRawText(USER_PROVIDED_GOOGLE_SHEET_CSV);
    setPresTimingMode('per_member');
    setPresRate(2);
    setPresFixed(14);
    setQaTimingMode('fixed');
    setQaFixed(5);
    setQaRate(0.5);
    setPeerUrl('https://forms.gle/bKtEYEEkvUy3F4mt6');
    if (onUpdateCourseTitle) {
      onUpdateCourseTitle('DOTE5110 Statistical Analysis');
    }
  };

  return (
    <section id="setup-section" className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 shadow-xl scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Classroom Setup & Timings</span>
            <h2 className="text-lg font-bold text-white">Course & Roster Configuration</h2>
          </div>
        </div>

        <button
          onClick={handleLoadSample}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          title="Reset to DOTE5110 defaults"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Reset DOTE5110 Roster</span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Course title (Allow changes at the bottom) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Course Title / Presentation Session Name
            </label>
            <span className="text-[11px] text-indigo-300 font-medium">
              Editable for any course
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => {
                setCourseTitle(e.target.value);
                if (onUpdateCourseTitle) {
                  onUpdateCourseTitle(e.target.value);
                }
              }}
              placeholder="e.g. DOTE5110 Statistical Analysis"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
            {onUpdateCourseTitle && (
              <button
                type="button"
                onClick={handleQuickSaveTitle}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  titleSaved
                    ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                    : 'border-indigo-700/60 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300'
                }`}
              >
                {titleSaved ? '✓ Saved' : 'Save Title'}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Timing Configuration Box */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 border-b border-slate-800/80 pb-2">
            <Calculator className="h-4 w-4" />
            <span>Time Limit Rules (Proportional vs Fixed)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Presentation Rule */}
            <div className="space-y-2">
              <span className="block font-semibold text-slate-200">
                1. Presentation Duration Rule:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPresTimingMode('per_member')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                    presTimingMode === 'per_member'
                      ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Proportional (per member)
                </button>
                <button
                  type="button"
                  onClick={() => setPresTimingMode('fixed')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                    presTimingMode === 'fixed'
                      ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ⏱ Fixed Duration
                </button>
              </div>

              {presTimingMode === 'per_member' ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400">Minutes per member:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 1.5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPresRate(val)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          presRate === val
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val} min
                      </button>
                    ))}
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={presRate}
                      onChange={(e) => setPresRate(Number(e.target.value))}
                      className="w-16 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400">Fixed Total Minutes:</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={presFixed}
                    onChange={(e) => setPresFixed(Number(e.target.value))}
                    className="w-20 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Q&A Rule */}
            <div className="space-y-2">
              <span className="block font-semibold text-slate-200">
                2. Q&A Phase Duration Rule:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQaTimingMode('fixed')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                    qaTimingMode === 'fixed'
                      ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ⏱ Fixed Duration (Default 5m)
                </button>
                <button
                  type="button"
                  onClick={() => setQaTimingMode('per_member')}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                    qaTimingMode === 'per_member'
                      ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Proportional (per member)
                </button>
              </div>

              {qaTimingMode === 'fixed' ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400">Fixed Q&A Minutes:</span>
                  <div className="flex gap-1.5">
                    {[5, 3, 2].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQaFixed(val)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          qaFixed === val
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val} min
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={qaFixed}
                      onChange={(e) => setQaFixed(Number(e.target.value))}
                      className="w-16 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400">Minutes per member:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    value={qaRate}
                    onChange={(e) => setQaRate(Number(e.target.value))}
                    className="w-20 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Group roster textarea */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Student Groups & Roster <span className="text-slate-500 font-normal">(Paste Google Sheets CSV, TSV, or plain names)</span>
            </label>
            <span className="text-[11px] font-mono text-indigo-400">
              {parsedItems.length} valid {parsedItems.length === 1 ? 'group' : 'groups'} detected
            </span>
          </div>
          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Group Name,Leader,Member 1,Member 2...&#10;or one group per line"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Peer Evaluation Google Form URL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Peer Evaluation Google Form URL
            </label>
            <span className="text-[11px] text-indigo-400 font-medium">
              Audience & Peer Grading Form
            </span>
          </div>
          <input
            type="url"
            value={peerUrl}
            onChange={(e) => setPeerUrl(e.target.value)}
            placeholder="https://forms.gle/bKtEYEEkvUy3F4mt6"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
          />
          <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Configured URL:</span>
            <span className="text-slate-400 font-mono truncate">{peerUrl || 'https://forms.gle/bKtEYEEkvUy3F4mt6'}</span>
          </p>
        </div>

        {/* Save button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Changes persist automatically in localStorage for DOTE5110 Statistical Analysis.
          </p>

          <button
            onClick={handleInit}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            {justSaved ? <Check className="h-4 w-4 text-emerald-300" /> : <ListChecks className="h-4 w-4" />}
            <span>{justSaved ? 'Changes Applied & Saved!' : 'Apply Changes & Initialize'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
