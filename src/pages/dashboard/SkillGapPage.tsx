import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Info,
  Lightbulb,
  Loader2,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudentData } from '../../context/StudentDataContext';
import type { SkillGapItem } from '../../types/student';

interface QuickTipState {
  skillName: string;
  tip: string;
  source: string;
}

export function SkillGapPage() {
  const { primaryCareer, readiness, pushToast } = useStudentData();
  const [statusFilter, setStatusFilter] = useState<'All' | SkillGapItem['status']>('All');
  const [loadingTipSkill, setLoadingTipSkill] = useState<string | null>(null);
  const [quickTip, setQuickTip] = useState<QuickTipState | null>(null);

  const filteredGaps = readiness.skillGaps.filter((g) =>
    statusFilter === 'All' ? true : g.status === statusFilter
  );

  const barChartData = readiness.skillGaps.map((g) => ({
    name: g.skillName.length > 15 ? `${g.skillName.slice(0, 13)}…` : g.skillName,
    fullName: g.skillName,
    Current: g.currentScore ?? 0,
    Required: g.requiredScore,
  }));

  const radarChartData = readiness.skillGaps.slice(0, 8).map((g) => ({
    skill: g.skillName.length > 12 ? `${g.skillName.slice(0, 10)}…` : g.skillName,
    Student: g.currentScore ?? 0,
    Benchmark: g.requiredScore,
  }));

  const meetsTargetCount = readiness.skillGaps.filter((g) => g.status === 'Meets Target').length;

  async function fetchQuickTip(gap: SkillGapItem) {
    setLoadingTipSkill(gap.skillName);
    try {
      const res = await fetch('/api/ai/quick-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: gap.skillName,
          currentScore: gap.currentScore,
          requiredScore: gap.requiredScore,
          careerTitle: primaryCareer.title,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not fetch coaching tip.');
      setQuickTip({
        skillName: gap.skillName,
        tip: json.tip,
        source: json.source === 'gemini-ai' ? 'Gemini AI Quick Coach' : 'Rule-Based Coaching Tip',
      });
    } catch {
      pushToast('error', 'Unable to load quick coaching tip right now.');
    } finally {
      setLoadingTipSkill(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Skill-Gap Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Benchmarking your verified & self-reported skills against{' '}
            <strong className="text-[#142B53] dark:text-white">{primaryCareer.title}</strong>{' '}
            expectations
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/skills"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 hover:border-[#3267D5] rounded-lg transition-colors whitespace-nowrap"
          >
            <Sliders className="w-4 h-4" />
            Update Skills
          </Link>
          <Link
            to="/dashboard/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap"
          >
            <Lightbulb className="w-4 h-4" />
            Get AI Plan
          </Link>
        </div>
      </div>

      {/* Top Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Indicative Career Readiness
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-1">
            {readiness.overallScore}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {readiness.dataCoveragePercent}% signal coverage
          </p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Technical Skill Match
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1">
            {readiness.technicalSkillMatchScore !== null
              ? `${readiness.technicalSkillMatchScore}%`
              : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Capped at 100% per skill</p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Gaps Requiring Action
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#E35D6A] mt-1">
            {readiness.gapsIdentifiedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {meetsTargetCount} skills meet target
          </p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Insufficient Evidence
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#F2A93B] mt-1">
            {readiness.insufficientEvidenceCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Unassessed required skills</p>
        </div>
      </div>

      {/* Charts Row: Bar Chart + Radar Chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Current Proficiency vs Required Target
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assessed scores take precedence over self-reported proficiency; unassessed skills plot at 0 visually while marked Insufficient Evidence below
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 8, right: 12, left: -16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Current" fill="#3267D5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Competency Radar Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual balance across core {primaryCareer.title} competencies
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} outerRadius="68%">
                <PolarGrid stroke="#cbd5e1" opacity={0.5} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Required Benchmark"
                  dataKey="Benchmark"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.18}
                />
                <Radar
                  name="Student Profile"
                  dataKey="Student"
                  stroke="#3267D5"
                  fill="#3267D5"
                  fillOpacity={0.35}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Coaching Tip Drawer (if requested) */}
      {quickTip && (
        <div className="bg-[#EAF1FF] dark:bg-[#162647] border border-[#3267D5]/30 rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA]">
              <Sparkles className="w-4 h-4" />
              <span>
                {quickTip.source} · {quickTip.skillName}
              </span>
            </div>
            <p className="text-sm text-[#142B53] dark:text-slate-100 leading-relaxed">
              {quickTip.tip}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickTip(null)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-300 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Detailed Skill Gap Matrix Table */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Detailed Skill-Gap Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Missing skills are explicitly labeled Insufficient Evidence rather than scored as zero
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Improvement Needed', 'Insufficient Evidence', 'Meets Target'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === tab
                      ? 'bg-[#3267D5] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-[#0B1324] text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Current</th>
                <th className="py-3 px-4">Required</th>
                <th className="py-3 px-4">Gap</th>
                <th className="py-3 px-4">Importance / Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Suggested Learning Approach</th>
                <th className="py-3 px-4 text-right">Coach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredGaps.map((gap) => (
                <tr
                  key={gap.skillName}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#142B53] dark:text-white">{gap.skillName}</p>
                    <p className="text-xs text-slate-500">{gap.category}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {gap.currentScore !== null ? (
                      <div>
                        <span className="font-semibold text-[#142B53] dark:text-white">
                          {gap.currentScore}%
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {gap.assessmentScore !== null ? 'Assessed' : 'Self-reported'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-sans font-medium text-[#F2A93B]">
                        Not assessed
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {gap.requiredScore}%
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {gap.gap === null ? (
                      <span className="text-xs font-sans text-slate-400">—</span>
                    ) : gap.gap > 0 ? (
                      <span className="font-semibold text-[#E35D6A]">
                        -{gap.gap} pts ({gap.gapPercentage}%)
                      </span>
                    ) : (
                      <span className="font-semibold text-[#22A06B]">0 pts</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{gap.importance}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span
                      className={`font-semibold ${
                        gap.priority === 'High'
                          ? 'text-[#E35D6A]'
                          : gap.priority === 'Medium'
                            ? 'text-[#F2A93B]'
                            : 'text-[#22A06B]'
                      }`}
                    >
                      {gap.priority} Priority
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                    {gap.status === 'Meets Target' && (
                      <span className="inline-flex items-center gap-1 text-[#22A06B]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Meets Target
                      </span>
                    )}
                    {gap.status === 'Improvement Needed' && (
                      <span className="inline-flex items-center gap-1 text-[#E35D6A]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Improvement Needed
                      </span>
                    )}
                    {gap.status === 'Insufficient Evidence' && (
                      <span className="inline-flex items-center gap-1 text-[#F2A93B]">
                        <Info className="w-3.5 h-3.5" />
                        Insufficient Evidence
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                    {gap.suggestedApproach}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={loadingTipSkill === gap.skillName}
                      onClick={() => fetchQuickTip(gap)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] bg-[#EAF1FF] dark:bg-[#162647] hover:bg-[#dce8ff] dark:hover:bg-[#1f3461] rounded-lg transition-colors disabled:opacity-60"
                    >
                      {loadingTipSkill === gap.skillName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Quick Tip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weighted Readiness Formula Breakdown */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#3267D5]" />
            <div>
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Transparent Weighted Readiness Formula
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Missing categories renormalize cleanly across available signals instead of unfairly zeroing your score
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/settings"
            className="text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
          >
            Customize Weights →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Readiness Dimension</th>
                <th className="py-2.5 px-4">Base Weight</th>
                <th className="py-2.5 px-4">Effective Weight</th>
                <th className="py-2.5 px-4">Dimension Score</th>
                <th className="py-2.5 pl-4">Evidence Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {readiness.components.map((comp) => (
                <tr key={comp.key}>
                  <td className="py-3 pr-4 font-medium text-[#142B53] dark:text-white">
                    {comp.label}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                    {comp.baseWeight}%
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums font-medium text-[#3267D5] dark:text-[#26C6DA]">
                    {comp.hasData ? `${comp.effectiveWeight}%` : 'Excluded (no data)'}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#142B53] dark:text-white">
                    {comp.hasData ? `${comp.score}%` : '—'}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-600 dark:text-slate-300">
                    {comp.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {readiness.disclaimer}
          </p>
          <Link
            to="/dashboard/compare"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap shrink-0"
          >
            <Compass className="w-4 h-4" />
            Compare Career Paths
          </Link>
        </div>
      </div>
    </div>
  );
}
