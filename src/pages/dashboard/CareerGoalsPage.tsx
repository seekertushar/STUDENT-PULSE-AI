import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Compass, GitCompare, Star } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';

export function CareerGoalsPage() {
  const {
    data,
    primaryCareer,
    setPrimaryCareer,
    toggleSecondaryCareer,
    updateCareerSkillRequirement,
  } = useStudentData();

  const [inspectCareerId, setInspectCareerId] = useState(primaryCareer.id);
  const inspected =
    data.customCareers.find((c) => c.id === inspectCareerId) ?? primaryCareer;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Career Goals & Benchmarks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select your primary target career, track secondary interests, and customize expected
            skill benchmarks.
          </p>
        </div>
        <Link
          to="/dashboard/compare"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 hover:border-[#3267D5] rounded-lg whitespace-nowrap"
        >
          <GitCompare className="w-4 h-4" />
          Compare Two Careers
        </Link>
      </div>

      {/* Career Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.customCareers.map((career) => {
          const isPrimary = data.profile.primaryCareerId === career.id;
          const isSecondary = data.profile.secondaryCareerIds.includes(career.id);
          const isSelectedForView = inspected.id === career.id;

          return (
            <div
              key={career.id}
              className={`bg-white dark:bg-[#111C33] border rounded-xl p-5 flex flex-col justify-between space-y-4 transition-colors ${
                isSelectedForView
                  ? 'border-[#3267D5] ring-1 ring-[#3267D5]/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectCareerId(career.id)}
                    className="text-left font-display font-semibold text-[#142B53] dark:text-white hover:text-[#3267D5]"
                  >
                    {career.title}
                  </button>
                  {isPrimary && <CheckCircle2 className="w-4 h-4 text-[#22A06B] shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPrimary
                    ? 'Primary Target Career'
                    : isSecondary
                      ? 'Saved Interest'
                      : `${career.requiredSkills.length} required skills`}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                  {career.tagline}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryCareer(career.id);
                    setInspectCareerId(career.id);
                  }}
                  disabled={isPrimary}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isPrimary
                      ? 'bg-[#EAF1FF] dark:bg-[#1C2F59] text-[#3267D5] dark:text-[#26C6DA]'
                      : 'bg-[#3267D5] hover:bg-[#2755B8] text-white'
                  }`}
                >
                  {isPrimary ? 'Active Goal' : 'Set Primary'}
                </button>
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => toggleSecondaryCareer(career.id)}
                    aria-label={
                      isSecondary
                        ? `Remove ${career.title} from interests`
                        : `Save ${career.title} as secondary interest`
                    }
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isSecondary
                        ? 'border-[#F2A93B] text-[#F2A93B] bg-amber-50 dark:bg-amber-950/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Career Requirement Inspector & Editor */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#3267D5] dark:text-[#26C6DA] font-medium">
              <Compass className="w-4 h-4" />
              <span>{inspected.averageExperienceTrack}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#142B53] dark:text-white">
              {inspected.title} — Editable Skill Requirement Dataset
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {inspected.description}
            </p>
          </div>
          <Link
            to="/dashboard/skill-gap"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#142B53] hover:bg-[#0D1E3B] rounded-lg whitespace-nowrap shrink-0"
          >
            Analyze My Gaps for {inspected.title}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Required Technical Skill</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium">Importance</th>
                <th className="py-2.5 pl-4 font-medium text-right">Target Proficiency (Editable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inspected.requiredSkills.map((req) => (
                <tr key={req.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-medium text-[#142B53] dark:text-white">
                    {req.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{req.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-medium ${
                        req.importance === 'High'
                          ? 'text-[#E35D6A]'
                          : req.importance === 'Medium'
                            ? 'text-[#F2A93B]'
                            : 'text-slate-500'
                      }`}
                    >
                      {req.importance}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <input
                        type="range"
                        min={40}
                        max={100}
                        step={5}
                        aria-label={`Target proficiency for ${req.name}`}
                        value={req.requiredScore}
                        onChange={(e) =>
                          updateCareerSkillRequirement(
                            inspected.id,
                            req.name,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 accent-[#3267D5]"
                      />
                      <span className="font-mono tabular-nums text-xs font-semibold w-10 text-right">
                        {req.requiredScore}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
              Suggested Portfolio Projects
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              {inspected.suggestedProjects.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
              Core Learning Focus
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              {inspected.learningRecommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
