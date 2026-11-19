import React, { useMemo, useState } from 'react';
import { Edit2, ExternalLink, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useStudentData } from '../../context/StudentDataContext';
import {
  classifySkillStatus,
  getEffectiveSkillScore,
  normalizeSkillName,
  SELF_REPORTED_LEVEL_SCORES,
} from '../../utils/analyticsEngine';
import type { ProficiencyLevel, StudentSkill } from '../../types/student';

export function SkillsPage() {
  const { data, primaryCareer, addSkill, updateSkill, deleteSkill } = useStudentData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Good' | 'Moderate' | 'Weak' | 'Not Assessed'>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<StudentSkill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentSkill | null>(null);

  // Quick AI coaching tip state (gemini-3.1-flash-lite)
  const [tipSkill, setTipSkill] = useState<string | null>(null);
  const [tipText, setTipText] = useState('');
  const [tipSource, setTipSource] = useState('');
  const [tipLoading, setTipLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Language');
  const [level, setLevel] = useState<ProficiencyLevel>('Intermediate');
  const [assessmentScore, setAssessmentScore] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const reqLookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of primaryCareer.requiredSkills) {
      map.set(normalizeSkillName(r.name), r.requiredScore);
    }
    return map;
  }, [primaryCareer]);

  const openAddForm = () => {
    setEditingSkill(null);
    setName('');
    setCategory('Language');
    setLevel('Intermediate');
    setAssessmentScore('');
    setEvidenceUrl('');
    setNotes('');
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (skill: StudentSkill) => {
    setEditingSkill(skill);
    setName(skill.name);
    setCategory(skill.category || 'Technical');
    setLevel(skill.selfReportedLevel);
    setAssessmentScore(skill.assessmentScore !== null ? String(skill.assessmentScore) : '');
    setEvidenceUrl(skill.evidenceUrl || '');
    setNotes(skill.notes || '');
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Skill name is required.');
      return;
    }

    let parsedAssessment: number | null = null;
    if (assessmentScore.trim() !== '') {
      const num = Number(assessmentScore);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        setFormError('Assessment score must be a number between 0 and 100.');
        return;
      }
      parsedAssessment = Math.round(num);
    }

    const payload = {
      name: name.trim(),
      category: category.trim() || 'Technical',
      selfReportedLevel: level,
      selfReportedScore: SELF_REPORTED_LEVEL_SCORES[level],
      assessmentScore: parsedAssessment,
      evidenceUrl: evidenceUrl.trim(),
      notes: notes.trim(),
    };

    if (editingSkill) {
      await updateSkill(editingSkill.id, payload);
    } else {
      await addSkill(payload);
    }
    setFormOpen(false);
  };

  const requestQuickTip = async (skill: StudentSkill, required: number) => {
    setTipSkill(skill.name);
    setTipLoading(true);
    setTipText('');
    setTipSource('');
    try {
      const res = await fetch('/api/ai/quick-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skill.name,
          currentScore: getEffectiveSkillScore(skill),
          requiredScore: required,
          careerTitle: primaryCareer.title,
        }),
      });
      const json = await res.json();
      setTipText(json.tip || 'Keep practicing applied exercises.');
      setTipSource(
        json.source === 'gemini-ai'
          ? 'Low-latency AI Coaching (gemini-3.1-flash-lite)'
          : 'Rule-based Coaching Tip (AI offline)'
      );
    } catch {
      setTipText('Unable to reach coaching service right now.');
    } finally {
      setTipLoading(false);
    }
  };

  const filteredSkills = useMemo(() => {
    return data.skills.filter((sk) => {
      const eff = getEffectiveSkillScore(sk);
      const status = classifySkillStatus(eff, data.thresholds);
      const matchesStatus = statusFilter === 'All' || status === statusFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        sk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sk.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [data.skills, data.thresholds, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            My Technical Skills
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track self-reported proficiency separately from verified assessment scores against{' '}
            <strong className="text-[#142B53] dark:text-white">{primaryCareer.title}</strong> targets.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills or categories..."
            aria-label="Search skills"
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C33]"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          {(['All', 'Good', 'Moderate', 'Weak', 'Not Assessed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#142B53] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Skill Drawer Card */}
      {formOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#111C33] border border-[#3267D5]/50 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Add New Technical Skill'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close skill form"
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-[#E35D6A] font-medium">
              {formError}
            </p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="skill-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Skill Name
              </label>
              <input
                id="skill-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Core Java, SQL, DSA"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label
                htmlFor="skill-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Category
              </label>
              <select
                id="skill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              >
                <option value="Language">Language</option>
                <option value="CS Fundamentals">CS Fundamentals</option>
                <option value="Framework">Framework</option>
                <option value="Database">Database</option>
                <option value="Architecture">Architecture</option>
                <option value="Data Library">Data Library</option>
                <option value="Tooling">Tooling</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="skill-level"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Self-Reported Proficiency
              </label>
              <select
                id="skill-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              >
                <option value="Beginner">Beginner (25)</option>
                <option value="Intermediate">Intermediate (50)</option>
                <option value="Advanced">Advanced (75)</option>
                <option value="Expert">Expert (90)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="skill-assessment"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Assessment Score (0–100, optional)
              </label>
              <input
                id="skill-assessment"
                type="number"
                min={0}
                max={100}
                value={assessmentScore}
                onChange={(e) => setAssessmentScore(e.target.value)}
                placeholder="Leave blank if unassessed"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="skill-evidence"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Supporting Evidence Link (GitHub / Certificate / Assessment)
              </label>
              <input
                id="skill-evidence"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="skill-notes"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Learning Notes
              </label>
              <input
                id="skill-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key subtopics mastered or currently practicing"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg"
            >
              {editingSkill ? 'Update Skill' : 'Save Skill'}
            </button>
          </div>
        </form>
      )}

      {/* Low-Latency AI Quick Coaching Banner */}
      {tipSkill && (
        <div className="bg-white dark:bg-[#111C33] border border-[#26C6DA]/50 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Quick Coaching for {tipSkill} {tipSource ? `· ${tipSource}` : ''}
            </p>
            <button
              type="button"
              onClick={() => setTipSkill(null)}
              aria-label="Close coaching tip"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {tipLoading ? 'Generating quick coaching tip...' : tipText}
          </p>
        </div>
      )}

      {/* Skills Data Table */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredSkills.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-[#142B53] dark:text-white">
              No skills match this view.
            </p>
            <p className="text-xs text-slate-500">
              Add your programming languages, databases, frameworks, and CS fundamentals to compute
              accurate skill-gap metrics.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#3267D5] rounded-lg"
            >
              Add First Skill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-[#0B1324] text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Skill</th>
                  <th className="py-3 px-4 font-medium">Self-Reported</th>
                  <th className="py-3 px-4 font-medium text-right">Assessment Score</th>
                  <th className="py-3 px-4 font-medium text-right">Required ({primaryCareer.title})</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Last Updated</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSkills.map((sk) => {
                  const eff = getEffectiveSkillScore(sk);
                  const status = classifySkillStatus(eff, data.thresholds);
                  const req = reqLookup.get(normalizeSkillName(sk.name));

                  return (
                    <tr key={sk.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#142B53] dark:text-white flex items-center gap-2">
                          <span>{sk.name}</span>
                          {sk.evidenceUrl && (
                            <a
                              href={sk.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Evidence link for ${sk.name}`}
                              className="text-slate-400 hover:text-[#3267D5]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sk.category}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {sk.selfReportedLevel}{' '}
                        <span className="font-mono text-xs text-slate-400">
                          ({sk.selfReportedScore})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                        {sk.assessmentScore !== null ? `${sk.assessmentScore}/100` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {req !== undefined ? `${req}/100` : 'Elective'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            status === 'Good'
                              ? 'text-[#22A06B]'
                              : status === 'Moderate'
                                ? 'text-[#F2A93B]'
                                : status === 'Weak'
                                  ? 'text-[#E35D6A]'
                                  : 'text-slate-400'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {sk.updatedAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => requestQuickTip(sk, req ?? 80)}
                            aria-label={`Get quick coaching tip for ${sk.name}`}
                            title="Quick AI coaching tip"
                            className="p-1.5 text-slate-500 hover:text-[#3267D5] rounded-md"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(sk)}
                            aria-label={`Edit ${sk.name}`}
                            className="p-1.5 text-slate-500 hover:text-[#142B53] dark:hover:text-white rounded-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(sk)}
                            aria-label={`Delete ${sk.name}`}
                            className="p-1.5 text-slate-500 hover:text-[#E35D6A] rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Remove "${deleteTarget?.name}"?`}
        message="This skill will be removed from your inventory and your Skill-Gap Analysis will recalculate immediately."
        confirmLabel="Remove Skill"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSkill(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
