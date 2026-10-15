import React from 'react';
import { Dice5, CheckCircle2, RotateCcw, Users, Undo2, Sparkles } from 'lucide-react';
import { GroupItem } from '../types';

interface GroupPickerProps {
  pendingGroups: GroupItem[];
  presentedGroups: GroupItem[];
  currentGroup: GroupItem | null;
  soundEnabled: boolean;
  isDrawingGroup: boolean;
  drawingCandidate: string;
  onDrawNext: () => void;
  onResetAll: () => void;
  onReturnToPending: (group: GroupItem) => void;
}

export const GroupPicker: React.FC<GroupPickerProps> = ({
  pendingGroups,
  presentedGroups,
  currentGroup,
  soundEnabled: _soundEnabled,
  isDrawingGroup,
  drawingCandidate,
  onDrawNext,
  onResetAll,
  onReturnToPending,
}) => {
  const totalCount = pendingGroups.length + presentedGroups.length;
  const presentedCount = presentedGroups.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((presentedCount / totalCount) * 100);

  const handleConfirmReset = () => {
    if (window.confirm('Reset all groups? This will move all presented groups back to the pending pool for the next session.')) {
      onResetAll();
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 shadow-xl">
      {/* Top Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Random Group Picker</span>
          <h2 className="text-xl font-bold text-white">Active Presenter</h2>
        </div>

        {/* Status Metrics */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>{pendingGroups.length} Pending</span>
          </div>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{presentedCount} Presented</span>
          </div>
        </div>
      </div>

      {/* Main Presenter Hero Showcase */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-6 md:p-8 flex flex-col items-center justify-center min-h-[190px] text-center shadow-inner">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {isDrawingGroup ? (
          <div className="flex flex-col items-center animate-pulse">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" />
              <span>SHUFFLING GROUPS...</span>
            </span>
            <div className="font-mono text-3xl md:text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              {drawingCandidate || 'Shuffling...'}
            </div>
          </div>
        ) : currentGroup ? (
          <div className="flex flex-col items-center max-w-2xl w-full">
            <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-300 mb-2">
              NOW ON STAGE
            </span>
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug">
              {currentGroup.name}
            </h3>

            {currentGroup.leader && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/50 px-3 py-1 text-xs text-indigo-200 font-semibold shadow-xs">
                <span>👑 Group Leader:</span>
                <span className="text-white">{currentGroup.leader}</span>
              </div>
            )}

            {currentGroup.members && currentGroup.members.length > 0 && (
              <div className="mt-3 w-full bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                  Team Members ({currentGroup.members.length})
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 text-xs text-slate-300">
                  {currentGroup.members.map((member, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                        currentGroup.leader && member.toLowerCase().includes(currentGroup.leader.toLowerCase().split(' ')[0])
                          ? 'bg-indigo-900/40 border-indigo-500/40 text-indigo-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentGroup.presentedAt && (
              <p className="mt-2 text-xs text-slate-400">
                Called at {currentGroup.presentedAt}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-slate-600 mb-2" />
            <h3 className="text-xl md:text-2xl font-bold text-slate-300">
              No Group Selected Yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              Click &quot;Draw Next Group&quot; or press <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-300 border border-slate-700">N</kbd> to randomly select without repeating.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onDrawNext}
          disabled={isDrawingGroup || pendingGroups.length === 0}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Dice5 className={`h-5 w-5 ${isDrawingGroup ? 'animate-spin' : ''}`} />
          <span>{isDrawingGroup ? 'Selecting Group...' : 'Draw Next Group (N)'}</span>
        </button>

        <button
          onClick={handleConfirmReset}
          className="flex items-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 hover:text-white transition"
          title="Reset session so all groups return to pending pool"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Progress & Queue Breakdown */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        {/* Progress Bar */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
          <span>Session Progress</span>
          <span className="font-bold text-slate-200">{progressPercent}% Completed ({presentedCount}/{totalCount})</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dual Lists */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Pending Groups */}
          <div>
            <div className="mb-2 flex items-center justify-between font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Remaining Pool
              </span>
              <span className="text-slate-400 font-mono">{pendingGroups.length}</span>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {pendingGroups.length > 0 ? (
                pendingGroups.map((group, idx) => {
                  const isCandidate = isDrawingGroup && drawingCandidate === group.name;
                  return (
                    <li
                      key={group.id}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border transition-all ${
                        isCandidate
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold scale-[1.01]'
                          : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">
                        <span className="text-slate-500 mr-1.5 font-mono text-[10px]">{idx + 1}.</span>
                        <span className="font-medium">{group.name}</span>
                        {group.leader && (
                          <span className="text-[10px] text-indigo-400 ml-1.5 font-normal">
                            · {group.leader.split('(')[0].trim()}
                          </span>
                        )}
                      </span>
                      {group.members && group.members.length > 0 && (
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {group.members.length}p
                        </span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="py-2 text-center text-slate-600 italic">All groups have presented!</li>
              )}
            </ul>
          </div>

          {/* Presented Groups */}
          <div>
            <div className="mb-2 flex items-center justify-between font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Presented Groups
              </span>
              <span className="text-emerald-400 font-mono">{presentedCount}</span>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {presentedGroups.length > 0 ? (
                presentedGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center justify-between rounded-lg bg-emerald-950/20 px-2.5 py-1.5 border border-emerald-900/30 text-emerald-300/90"
                  >
                    <span className="truncate pr-2 font-medium">
                      ✓ {group.name}
                      {group.leader && (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                          ({group.leader.split('(')[0].trim()})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => onReturnToPending(group)}
                      className="text-[10px] text-slate-400 hover:text-amber-300 hover:underline flex items-center gap-0.5 shrink-0"
                      title="Return group to pending pool"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Undo</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="py-2 text-center text-slate-600 italic">No groups presented yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
