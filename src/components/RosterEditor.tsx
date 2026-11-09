import { useRef, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { parseRosterInput } from '../utils/storage';
import type { GroupItem } from '../types';

interface RosterEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const quoteCell = (value: string) => /[",\r\n]/.test(value)
  ? `"${value.replace(/"/g, '""')}"`
  : value;

function serializeGroups(groups: GroupItem[]): string {
  if (!groups.length) return '';
  const members = groups.map((group) => (group.members ?? []).filter(
    (member) => member.toLocaleLowerCase() !== group.leader?.toLocaleLowerCase()
  ));
  const count = Math.max(1, ...members.map((list) => list.length));
  const header = ['Group', 'Leader', ...Array.from({ length: count }, (_, index) => `Member ${index + 1}`)];
  return [header, ...groups.map((group, index) => [group.name, group.leader ?? '', ...members[index]])]
    .map((row) => row.map(quoteCell).join(','))
    .join('\n');
}

function splitMembers(value: string): string[] {
  const seen = new Set<string>();
  return value.split(/[,\n\r\t]+/).map((name) => name.trim()).filter((name) => {
    const key = name.toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function RosterEditor({ value, onChange }: RosterEditorProps) {
  const [mode, setMode] = useState<'guided' | 'paste'>('guided');
  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [members, setMembers] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const groups = parseRosterInput(value);

  const clearForm = () => {
    setName('');
    setLeader('');
    setMembers('');
    setEditingIndex(null);
    setError('');
  };

  const saveGroup = () => {
    const groupName = name.replace(/\s+/g, ' ').trim();
    if (!groupName) {
      setError('Enter a group name.');
      nameRef.current?.focus();
      return;
    }
    if (groups.some((group, index) => index !== editingIndex && group.name.toLocaleLowerCase() === groupName.toLocaleLowerCase())) {
      setError('A group with this name is already in the roster.');
      nameRef.current?.focus();
      return;
    }
    const leaderName = leader.trim();
    const people = splitMembers(members);
    if (leaderName && !people.some((person) => person.toLocaleLowerCase() === leaderName.toLocaleLowerCase())) {
      people.unshift(leaderName);
    }
    const group: GroupItem = { id: `draft-${Date.now()}`, name: groupName, leader: leaderName || undefined, members: people };
    const next = [...groups];
    if (editingIndex === null) next.push(group);
    else next[editingIndex] = { ...next[editingIndex], ...group };
    onChange(serializeGroups(next));
    clearForm();
    nameRef.current?.focus();
  };

  const editGroup = (group: GroupItem, index: number) => {
    setMode('guided');
    setEditingIndex(index);
    setName(group.name);
    setLeader(group.leader ?? '');
    setMembers((group.members ?? []).filter((member) => member.toLocaleLowerCase() !== group.leader?.toLocaleLowerCase()).join('\n'));
    setError('');
    nameRef.current?.focus();
  };

  return (
    <section aria-labelledby="roster-heading" className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="roster-heading" className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Users className="h-4 w-4 text-indigo-400" /> Student groups & roster
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Add groups one at a time or paste a list from a spreadsheet.</p>
        </div>
        <span role="status" className="rounded-full border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
          {groups.length} {groups.length === 1 ? 'group' : 'groups'} ready
        </span>
      </div>

      <div role="tablist" aria-label="Roster entry method" className="flex rounded-lg border border-slate-800 bg-slate-950/70 p-1 text-xs">
        <button type="button" role="tab" aria-selected={mode === 'guided'} onClick={() => setMode('guided')}
          className={`flex-1 rounded-md px-3 py-2 font-semibold ${mode === 'guided' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}>
          Add groups
        </button>
        <button type="button" role="tab" aria-selected={mode === 'paste'} onClick={() => { clearForm(); setMode('paste'); }}
          className={`flex-1 rounded-md px-3 py-2 font-semibold ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}>
          Paste spreadsheet
        </button>
      </div>

      {mode === 'guided' ? (
        <div role="tabpanel" className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-300">
              Group name <span className="text-rose-400">*</span>
              <input ref={nameRef} value={name} onChange={(event) => { setName(event.target.value); setError(''); }}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveGroup(); } }}
                placeholder="e.g. Group A" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Leader <span className="font-normal text-slate-500">(optional)</span>
              <input value={leader} onChange={(event) => setLeader(event.target.value)} placeholder="e.g. Alex"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-300">
            Student names <span className="font-normal text-slate-500">(optional)</span>
            <textarea value={members} onChange={(event) => setMembers(event.target.value)} rows={2}
              placeholder={'One name per line, or separate names with commas'}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">The leader counts as a student. Groups without names use the default timer length.</p>
            <div className="flex items-center gap-2">
              {editingIndex !== null && <button type="button" onClick={clearForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300">Cancel</button>}
              <button type="button" onClick={saveGroup} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">
                <Plus className="h-3.5 w-3.5" /> {editingIndex === null ? 'Add group' : 'Save group'}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="text-xs font-semibold text-rose-300">{error}</p>}
        </div>
      ) : (
        <div role="tabpanel" className="space-y-2">
          <label htmlFor="group-roster" className="block text-xs font-semibold text-slate-300">Paste groups from Google Sheets, CSV, or a plain list</label>
          <textarea id="group-roster" rows={6} value={value} onChange={(event) => onChange(event.target.value)}
            placeholder={'Group\tLeader\tMember 1\nGroup A\tAlex\tSam\n\nOr enter one group name per line'}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 font-mono placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none leading-relaxed" />
          <p className="text-[11px] text-slate-400">Include column headings when copying a table. You can then switch to Add groups to review or edit each group.</p>
        </div>
      )}

      <div className="space-y-2" aria-label="Roster preview">
        {groups.length ? groups.map((group, index) => (
          <div key={`${index}-${group.name}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-100">{group.name}</p>
              <p className="text-[11px] text-slate-400">{group.members?.length ? `${group.members.length} ${group.members.length === 1 ? 'student' : 'students'}` : 'No students listed'}{group.leader ? ` · Leader: ${group.leader}` : ''}</p>
            </div>
            {mode === 'guided' && <div className="flex items-center gap-1">
              <button type="button" onClick={() => editGroup(group, index)} aria-label={`Edit ${group.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => { onChange(serializeGroups(groups.filter((_, item) => item !== index))); clearForm(); }} aria-label={`Remove ${group.name}`} className="rounded-lg p-2 text-rose-400 hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>}
          </div>
        )) : <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-400">No groups yet. Add your first group above.</p>}
      </div>
      <p className="text-[11px] text-slate-400">Review the roster, then choose <strong>Apply Changes & Save</strong> below.</p>
    </section>
  );
}
