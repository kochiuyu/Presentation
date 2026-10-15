import { SessionState, GroupItem } from '../types';

const STORAGE_KEY = 'dote5110_presenter_session_v5';

export const USER_PROVIDED_GOOGLE_SHEET_CSV = `Group Name,Leader,Member 1,Member 2,Member 3,Member 4,Member 5,Member 6,Member 7,Member 8
ITM Pass,CHAN Chun Ming (Danny),CHAN Chun Ming (Danny),CHOW Sik Hong (Eric),WAN Wing Wai (Michelle),LAM Ka Ho (Danny),Wong Yin Yee (Jess),Lam Kai Yi (Kelly),Zhang Yi Chi(Adam),Wang Shengping (Spencer)
Group 1,Tan Tsz Ching (Iris),Ng Kei Ming Kevin,Liu Tsun Yee (Matt),"Kan Pok Shing, Harry",CHAN CHUN YIN (Tom),Cheung Ting Fung (Tito),Chan Ka Chun (EricB),Tan Tsz Ching (Iris),
GIGO,CHAN Hoi Ho (Thomas),Lai Chun Man (Edward),Ho Lok Yiu (Kenix),FUNG Phillis,CHAN Hoi Ho (Thomas),Yeung Chin Wai (Charlotte),"WAN Ka Wing, Daniel",,
Group 3,Szeto Wing Yan (Queenie),WONG Oi Lam (Tac),Ng Kit Yee (Kit),Chieh Kwong Wing (William),Wong Ho Hay Edgar,Ng Hau Yin (Mandy),Ching Lok Yan (Ada),Szeto Wing Yan (Queenie),
jager bomb,Cheng Man Hin,Lam Tsz Lok Dennis,Yeung Hoi Ying Daisy,Chan Jian Xi Elvis,Ma Tsz Yan,Lo Chun Hang Leo,Chan Gi Wei Violet,Gao Ying Ying,
Ctrl + Six,Tsoi Wing Sze (Celia) ,Yung Ching Lam (Kimberly),Li Yuk Yu (Sherena),Tsoi Wing Sze (Celia) ,Lam Ching Wing (Andrea),Wong Wai (Angela),Lai Kit Sum (Kennis),,
Last but not Beast,Wong Yu Kin Ivan,Law Yu Tung (Sabine),Ho Kai Ching (Matt),LEUNG Yi Kit (Ricky),CHEUNG KWOK LUEN (Anson),LEE KA HONG (Ka-hong),Wong Yu Kin Ivan,WONG Hon Lung (Barron),
DataPandas,HAO Chunhui (Nick) ,CHEUNG Kai leuk (Ken),ZHANG Jiamin Cathie,LEE Chun Kit (Ivan),WONG IOK SENG (Samuel),HAO Chunhui (Nick) ,Wong Sung Him (Tony),Lam Nga Mei (May),LI Kai Ming (Kasu)`;

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
export function parseRosterInput(input: string): GroupItem[] {
  if (!input || !input.trim()) return [];

  const rawLines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
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

    const groups: GroupItem[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      const cols = parseCsvRow(line, delimiter);
      const name = cols[groupNameIdx >= 0 ? groupNameIdx : 0];
      if (!name) continue;

      const leader = leaderIdx >= 0 ? cols[leaderIdx] : undefined;
      const rawMembers: string[] = [];

      cols.forEach((col, idx) => {
        if (idx !== groupNameIdx && col && col.length > 0) {
          rawMembers.push(col);
        }
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

    if (groups.length > 0) return groups;
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

export const INITIAL_GROUPS: GroupItem[] = parseRosterInput(USER_PROVIDED_GOOGLE_SHEET_CSV);

export const INITIAL_STATE: SessionState = {
  courseTitle: 'DOTE5110 Statistical Analysis',
  rawGroupInput: USER_PROVIDED_GOOGLE_SHEET_CSV,
  pendingGroups: INITIAL_GROUPS,
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

  peerEvalFormUrl: 'https://forms.gle/bKtEYEEkvUy3F4mt6',
  soundEnabled: true,
  volume: 0.8,
  oneMinuteWarning: true,
};

export function loadSessionState(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    const peerUrl =
      !parsed.peerEvalFormUrl || parsed.peerEvalFormUrl.includes('peer-eval-demo')
        ? 'https://forms.gle/bKtEYEEkvUy3F4mt6'
        : parsed.peerEvalFormUrl;

    return {
      ...INITIAL_STATE,
      ...parsed,
      peerEvalFormUrl: peerUrl,
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
