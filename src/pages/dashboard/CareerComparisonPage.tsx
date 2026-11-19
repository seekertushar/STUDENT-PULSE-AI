import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  GitCompare,
  Info,
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
import { compareCareerPaths } from '../../utils/analyticsEngine';

export function CareerComparisonPage() {
  const { data, primaryCareer, setPrimaryCareer } = useStudentData();

  const defaultSecondId =
    data.customCareers.find((c) => c.id !== primaryCareer.id && c.id === 'data-analyst')?.id ??
    data.customCareers.find((c) => c.id !== primaryCareer.id)?.id ??
    primaryCareer.id;

  const [careerAId, setCareerAId] = useState(primaryCareer.id);
  const [careerBId, setCareerBId] = useState(defaultSecondId);

  const careerA = useMemo(
    () => data.customCareers.find((c) => c.id === careerAId) ?? primaryCareer,
    [data.customCareers, careerAId, primaryCareer]
  );
  const careerB = useMemo(
    () => data.customCareers.find((c) => c.id === careerBId) ?? data.customCareers[1] ?? primaryCareer,
    [data.customCareers, careerBId, primaryCareer]
  );

  const comparison = useMemo(
    () =>
      compareCareerPaths({
        careerA,
        careerB,
        skills: data.skills,
        academics: data.academics,
        projects: data.projects,
        certifications: data.certifications,
        activities: data.activities,
        interviews: data.interviews,
        actionTasks: data.actionTasks,
        roadmap: data.roadmap,
        streak: data.streak,
        weights: data.weights,
        thresholds: data.thresholds,
      }),
    [careerA, careerB, data]
  );

  // Build unified comparison chart dataset across combined skills (up to 8)
  const combinedChartData = useMemo(() => {
    const map = new Map<
      string,
      { skill: string; Student: number; CareerA: number; CareerB: number }
    >();

    for (const g of comparison.careerA.readiness.skillGaps) {
      map.set(g.skillName.toLowerCase(), {
        skill: g.skillName.length > 13 ? `${g.skillName.slice(0, 11)}…` : g.skillName,
        Student: g.currentScore ?? 0,
        CareerA: g.requiredScore,
        CareerB: 0,
      });
    }
    for (const g of comparison.careerB.readiness.skillGaps) {
      const key = g.skillName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.CareerB = g.requiredScore;
      } else {
        map.set(key, {
          skill: g.skillName.length > 13 ? `${g.skillName.slice(0, 11)}…` : g.skillName,
          Student: g.currentScore ?? 0,
          CareerA: 0,
          CareerB: g.requiredScore,
        });
      }
    }
    return Array.from(map.values()).slice(0, 8);
  }, [comparison]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Career Path Comparison
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compare your transferable skills, readiness baseline, and required learning effort
            across two target roles
          </p>
        </div>
      </div>

      {/* Career Selectors */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] mb-1.5">
            Career Path A
          </label>
          <select
            value={careerA.id}
            onChange={(e) => setCareerAId(e.target.value)}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
          >
            {data.customCareers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#22A06B] mb-1.5">
            Career Path B
          </label>
          <select
            value={careerB.id}
            onChange={(e) => setCareerBId(e.target.value)}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
          >
            {data.customCareers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Readiness Summary Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { side: comparison.careerA, accent: 'text-[#3267D5] dark:text-[#26C6DA]', label: 'Career A' },
          { side: comparison.careerB, accent: 'text-[#22A06B]', label: 'Career B' },
        ].map(({ side, accent, label }) => {
          const isPrimary = side.career.id === primaryCareer.id;
          return (
            <div
              key={`${label}-${side.career.id}`}
              className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label} {isPrimary ? '· Current Primary Goal' : ''}
                  </p>
                  <h2 className="font-display text-lg font-bold text-[#142B53] dark:text-white mt-0.5">
                    {side.career.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {side.career.tagline}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-3xl font-mono font-bold tabular-nums ${accent}`}>
                    {side.readiness.overallScore}%
                  </p>
                  <p className="text-[11px] text-slate-500">Indicative</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-slate-500">Skill Match</p>
                  <p className="font-mono font-semibold text-[#142B53] dark:text-white mt-0.5">
                    {side.readiness.technicalSkillMatchScore !== null
                      ? `${side.readiness.technicalSkillMatchScore}%`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Gaps Found</p>
                  <p className="font-mono font-semibold text-[#E35D6A] mt-0.5">
                    {side.readiness.gapsIdentifiedCount}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Unassessed</p>
                  <p className="font-mono font-semibold text-[#F2A93B] mt-0.5">
                    {side.missingSkills.length}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Data coverage: {side.readiness.dataCoveragePercent}%
                </span>
                {isPrimary ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22A06B]">
                    <CheckCircle2 className="w-4 h-4" />
                    Primary Career
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimaryCareer(side.career.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Set as Primary Career
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Neutral Summary Explanation */}
      <div className="bg-[#EAF1FF] dark:bg-[#162647] border border-[#3267D5]/30 rounded-xl p-5 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3267D5] dark:text-[#26C6DA] shrink-0 mt-0.5" />
        <p className="text-sm text-[#142B53] dark:text-slate-100 leading-relaxed">
          {comparison.summaryExplanation}
        </p>
      </div>

      {/* Charts: Grouped Bar + Radar Overlay */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#3267D5]" />
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Skill Benchmark Comparison
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={combinedChartData} margin={{ top: 8, right: 12, left: -16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis
                  dataKey="skill"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Student" name="Your Score" fill="#142B53" radius={[3, 3, 0, 0]} />
                <Bar dataKey="CareerA" name={careerA.title} fill="#3267D5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="CareerB" name={careerB.title} fill="#26C6DA" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#3267D5]" />
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Overlap Radar
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={combinedChartData} outerRadius="68%">
                <PolarGrid stroke="#cbd5e1" opacity={0.5} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Your Score"
                  dataKey="Student"
                  stroke="#142B53"
                  fill="#142B53"
                  fillOpacity={0.28}
                />
                <Radar
                  name={careerA.title}
                  dataKey="CareerA"
                  stroke="#3267D5"
                  fill="#3267D5"
                  fillOpacity={0.18}
                />
                <Radar
                  name={careerB.title}
                  dataKey="CareerB"
                  stroke="#26C6DA"
                  fill="#26C6DA"
                  fillOpacity={0.18}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shared Transferable Skills */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
          Shared Transferable Technical Skills ({comparison.sharedSkills.length})
        </h2>
        {comparison.sharedSkills.length === 0 ? (
          <p className="text-sm text-slate-500">
            These two career paths have distinct required skill lists with minimal direct overlap.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <th className="py-2 pr-4">Shared Skill</th>
                  <th className="py-2 px-4">Your Current Score</th>
                  <th className="py-2 px-4">{careerA.title} Target</th>
                  <th className="py-2 pl-4">{careerB.title} Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.sharedSkills.map((s) => (
                  <tr key={s.name}>
                    <td className="py-3 pr-4 font-semibold text-[#142B53] dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {s.studentScore !== null ? `${s.studentScore}%` : 'Not assessed'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#3267D5] dark:text-[#26C6DA]">
                      {s.requiredA}%
                    </td>
                    <td className="py-3 pl-4 font-mono tabular-nums text-[#22A06B]">
                      {s.requiredB}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Career-Specific Skill Gaps & Learning Paths */}
      <div className="grid md:grid-cols-2 gap-6">
        {[comparison.careerA, comparison.careerB].map((side) => (
          <div
            key={side.career.id}
            className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              {side.career.title} — Specific Gaps & Focus Areas
            </h3>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Career-Specific Gaps ({side.careerSpecificGaps.length})
              </p>
              {side.careerSpecificGaps.length === 0 ? (
                <p className="text-xs text-[#22A06B]">
                  All career-specific skills meet target benchmarks.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {side.careerSpecificGaps.map((g) => (
                    <div key={g.skillName} className="py-2 flex items-center justify-between gap-2">
                      <span className="font-medium text-[#142B53] dark:text-slate-200">
                        {g.skillName}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {g.currentScore !== null
                          ? `${g.currentScore}% / ${g.requiredScore}% (-${g.gap})`
                          : `Unassessed (Target ${g.requiredScore}%)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Suggested Learning Focus
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {side.career.learningRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
