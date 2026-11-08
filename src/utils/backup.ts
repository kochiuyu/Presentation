import type { GroupItem, SessionState } from '../types';

export interface SessionBackup {
  format: 'presentation-facilitator-backup';
  version: 1;
  exportedAt: string;
  session: SessionState;
  clocks: { presSeconds: number; qaSeconds: number };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 1000 && value.every((item) => typeof item === 'string');

function isGroup(value: unknown): value is GroupItem {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.name === 'string' && value.name.length > 0 &&
    (value.leader === undefined || typeof value.leader === 'string') &&
    (value.members === undefined || isStringArray(value.members)) &&
    (value.presentedAt === undefined || typeof value.presentedAt === 'string');
}

function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function validNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function createBackup(session: SessionState, presSeconds: number, qaSeconds: number): string {
  const backup: SessionBackup = {
    format: 'presentation-facilitator-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    session,
    clocks: { presSeconds, qaSeconds },
  };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): SessionBackup {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!isRecord(value) || value.format !== 'presentation-facilitator-backup' || value.version !== 1 ||
      typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) {
    throw new Error('This is not a supported presentation backup.');
  }

  const session = value.session;
  const clocks = value.clocks;
  if (!isRecord(session) || !isRecord(clocks) ||
      typeof session.courseTitle !== 'string' || session.courseTitle.length > 500 ||
      typeof session.rawGroupInput !== 'string' || session.rawGroupInput.length > 500_000 ||
      !Array.isArray(session.pendingGroups) || session.pendingGroups.length > 1000 || !session.pendingGroups.every(isGroup) ||
      !Array.isArray(session.presentedGroups) || session.presentedGroups.length > 1000 || !session.presentedGroups.every(isGroup) ||
      (session.currentGroup !== null && !isGroup(session.currentGroup)) ||
      (session.currentRespondent !== null && typeof session.currentRespondent !== 'string') ||
      !isStringArray(session.answeredMembers) ||
      !['fixed', 'per_member'].includes(String(session.presTimingMode)) ||
      !['fixed', 'per_member'].includes(String(session.qaTimingMode)) ||
      !validNumber(session.presMinutesPerMember, 0.5, 10) ||
      !validNumber(session.presentationMinutes, 1, 60) ||
      !validNumber(session.qaMinutes, 1, 30) ||
      !validNumber(session.qaMinutesPerMember, 0.5, 5) ||
      typeof session.peerEvalFormUrl !== 'string' || !isHttpUrl(session.peerEvalFormUrl) ||
      typeof session.soundEnabled !== 'boolean' ||
      !validNumber(session.volume, 0, 1) ||
      typeof session.oneMinuteWarning !== 'boolean' ||
      !Number.isSafeInteger(clocks.presSeconds) || !Number.isSafeInteger(clocks.qaSeconds)) {
    throw new Error('The backup has missing or invalid session data.');
  }

  const groups = [...session.pendingGroups, ...session.presentedGroups] as GroupItem[];
  const ids = new Set(groups.map((group) => group.id));
  if (ids.size !== groups.length ||
      (session.currentGroup && !ids.has((session.currentGroup as GroupItem).id))) {
    throw new Error('The backup has inconsistent group progress.');
  }

  return value as unknown as SessionBackup;
}
