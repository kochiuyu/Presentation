import { SessionState, GroupItem } from '../types';

const STORAGE_KEY = 'presentation_facilitator_session_v1';
const LEGACY_STORAGE_KEY = 'dote5110_presenter_session_v5';
const LEGACY_ROSTER_HASH = 3562784588;

function rosterHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

/**
 * Robust CSV/TSV parser supporting quotes and commas/tabs
 */
function parseCsvRow(row: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses Google Sheets CSV / TSV or newline-separated group names
 */
function splitCsvRecords(input: string): string[] {
  const records: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (inQuotes && input[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
    }
    if ((char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13) && !inQuotes) {
      if (char.charCodeAt(0) === 13 && input.charCodeAt(i + 1) === 10) i++;
      if (current.trim()) records.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) records.push(current.trim());
  return records;
}

export function parseRosterInput(input: string): GroupItem[] {
  if (!input || !input.trim()) return [];

  const rawLines = splitCsvRecords(input);
  if (rawLines.length === 0) return [];

  const firstLine = rawLines[0].toLowerCase();
  const isTab = rawLines[0].includes('\t');
  const delimiter = isTab ? '\t' : ',';

  const isSheetTable =
    firstLine.includes('group') && (firstLine.includes('leader') || firstLine.includes('member'));

  if (isSheetTable) {
    const headerCols = parseCsvRow(rawLines[0], delimiter).map((h) => h.toLowerCase());
    const groupNameIdx = headerCols.findIndex((h) => h.includes('group'));
    const leaderIdx = headerCols.findIndex((h) => h.includes('leader'));
    const memberIndices = headerCols.flatMap((h, idx) => h.includes('member') ? [idx] : []);
    const participantIndices = [...(leaderIdx >= 0 ? [leaderIdx] : []), ...memberIndices];

    const groups: GroupItem[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      const cols = parseCsvRow(line, delimiter);
      const name = cols[groupNameIdx >= 0 ? groupNameIdx : 0];
      if (!name) continue;

      const leader = leaderIdx >= 0 ? cols[leaderIdx] : undefined;
      const rawMembers: string[] = [];

      participantIndices.forEach((idx) => {
        const col = cols[idx];
        if (col && col.length > 0) rawMembers.push(col);
      });

      // Deduplicate member names while preserving order
      const uniqueMembers: string[] = [];
      const seen = new Set<string>();
      for (const m of rawMembers) {
        const norm = m.trim().toLowerCase();
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          uniqueMembers.push(m.trim());
        }
      }

      groups.push({
        id: `group-${i}-${Date.now()}`,
        name: name.trim(),
        leader: leader ? leader.trim() : undefined,
        members: uniqueMembers,
      });
    }

    return groups;
  }

  // Fallback: standard line-by-line
  const cleanNames: string[] = [];
  const seen = new Set<string>();

  for (const line of rawLines) {
    const parts = line.includes('\t') ? line.split('\t') : [line];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        cleanNames.push(trimmed);
      }
    }
  }

  return cleanNames.map((name, idx) => ({
    id: `g-${idx + 1}-${Date.now()}`,
    name,
  }));
}

export const INITIAL_STATE: SessionState = {
  courseTitle: 'Presentation Session',
  rawGroupInput: '',
  pendingGroups: [],
  presentedGroups: [],
  currentGroup: null,
  currentRespondent: null,
  answeredMembers: [],

  // Presentation: Proportional to group size (default: 2 minutes per member)
  presTimingMode: 'per_member',
  presMinutesPerMember: 2,
  presentationMinutes: 14, // fallback if no members

  // Q&A: Fixed duration (default: 5 minutes)
  qaTimingMode: 'fixed',
  qaMinutes: 5,
  qaMinutesPerMember: 0.5,

  peerEvalFormUrl: '',
  soundEnabled: true,
  volume: 0.8,
  oneMinuteWarning: true,
};

export function loadSessionState(): SessionState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const raw = saved ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (!saved) {
      if (parsed.courseTitle === 'DOTE5110 Statistical Analysis') parsed.courseTitle = INITIAL_STATE.courseTitle;
      if (parsed.peerEvalFormUrl === 'https://forms.gle/bKtEYEEkvUy3F4mt6' || parsed.peerEvalFormUrl?.includes('peer-eval-demo')) {
        parsed.peerEvalFormUrl = '';
      }
      if (rosterHash(parsed.rawGroupInput || '') === LEGACY_ROSTER_HASH) {
        parsed.rawGroupInput = '';
        parsed.pendingGroups = [];
        parsed.presentedGroups = [];
        parsed.currentGroup = null;
        parsed.currentRespondent = null;
        parsed.answeredMembers = [];
      }
    }

    return {
      ...INITIAL_STATE,
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
    return INITIAL_STATE;
  }
}

export function saveSessionState(state: SessionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}
