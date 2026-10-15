export type Phase = 'presentation' | 'qa';
export type TimingMode = 'per_member' | 'fixed';

export interface GroupItem {
  id: string;
  name: string;
  leader?: string;
  members?: string[];
  answeredMembers?: string[];
  currentRespondent?: string | null;
  order?: number;
  presentedAt?: string;
  timeSpentSeconds?: number;
}

export interface SessionState {
  courseTitle: string;
  rawGroupInput: string;
  pendingGroups: GroupItem[];
  presentedGroups: GroupItem[];
  currentGroup: GroupItem | null;
  
  // Q&A respondent tracking
  currentRespondent: string | null;
  answeredMembers: string[];

  // Presentation timing
  presTimingMode: TimingMode;
  presMinutesPerMember: number;
  presentationMinutes: number;

  // Q&A timing
  qaTimingMode: TimingMode;
  qaMinutes: number;
  qaMinutesPerMember: number;

  qaFormUrl?: string;
  peerEvalFormUrl: string;
  soundEnabled: boolean;
  volume: number;
  oneMinuteWarning: boolean;
}

export interface Preset {
  label: string;
  presMode: TimingMode;
  presRate: number;
  presFixed: number;
  qaMode: TimingMode;
  qaFixed: number;
  qaRate: number;
}

export function computePresentationMinutes(
  group: GroupItem | null,
  mode: TimingMode,
  perMemberRate: number,
  fixedMinutes: number,
  defaultMembers: number = 7
): number {
  if (mode === 'per_member') {
    const count = group && group.members && group.members.length > 0 ? group.members.length : defaultMembers;
    return Math.round(count * perMemberRate * 10) / 10;
  }
  return fixedMinutes;
}

export function computeQaMinutes(
  group: GroupItem | null,
  mode: TimingMode,
  fixedMinutes: number,
  perMemberRate: number = 0.5,
  defaultMembers: number = 7
): number {
  if (mode === 'per_member') {
    const count = group && group.members && group.members.length > 0 ? group.members.length : defaultMembers;
    return Math.round(count * perMemberRate * 10) / 10;
  }
  return fixedMinutes;
}
