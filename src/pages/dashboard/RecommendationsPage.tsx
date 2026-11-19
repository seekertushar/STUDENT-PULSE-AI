import React, { useState } from 'react';
import {
  Brain,
  Check,
  ExternalLink,
  Globe,
  Info,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import type { MarketInsightResult, PriorityLevel, RecommendationItem } from '../../types/student';

export function RecommendationsPage() {
  const {
    data,
    primaryCareer,
    readiness,
    saveRecommendations,
    addRecommendationToActionPlan,
    pushToast,
  } = useStudentData();

  const [deepThinking, setDeepThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'All' | PriorityLevel>('All');

  const [marketLoading, setMarketLoading] = useState(false);
  const [marketInsight, setMarketInsight] = useState<MarketInsightResult | null>(null);

  const filteredRecommendations = data.recommendations.filter((r) =>
    priorityFilter === 'All' ? true : r.priority === priorityFilter
  );

  const aiCount = data.recommendations.filter((r) => r.source === 'gemini-ai').length;
  const fallbackCount = data.recommendations.filter(
    (r) => r.source === 'deterministic-fallback'
  ).length;

  async function handleGenerateRecommendations() {
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.profile.userId,
          studentName: data.profile.fullName,
          course: data.profile.course,
          semester: data.profile.currentSemester,
          careerId: primaryCareer.id,
          customCareers: data.customCareers,
          skills: data.skills,
          academics: data.academics,
          projects: data.projects,
          certifications: data.certifications,
          activities: data.activities,
          interviews: data.interviews,
          actionTasks: data.actionTasks,
          roadmap: data.roadmap,
          streak: data.streak,
          deepThinking,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate recommendations');
      const items: RecommendationItem[] = Array.isArray(json.recommendations)
        ? json.recommendations
        : [];
      await saveRecommendations(items);
      if (json.notice) {
        setNotice(json.notice);
      }
      pushToast(
        'success',
        json.source === 'gemini-ai'
          ? `Generated ${items.length} Gemini AI recommendations.`
          : `Generated ${items.length} rule-based recommendations from your profile.`
      );
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Recommendation request failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleFetchMarketInsights() {
    setMarketLoading(true);
    try {
      const topGaps = readiness.weakestSkills.map((g) => g.skillName).slice(0, 4);
      const res = await fetch('/api/ai/market-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerTitle: primaryCareer.title,
          topGaps,
        }),
      });
      const json = (await res.json()) as MarketInsightResult;
      if (!res.ok) throw new Error('Could not load live market insights');
      setMarketInsight(json);
    } catch {
      pushToast('error', 'Failed to fetch market insights.');
    } finally {
      setMarketLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            AI Career Recommendations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Actionable guidance grounded strictly in your{' '}
            <strong className="text-[#142B53] dark:text-white">{primaryCareer.title}</strong> skill
            gaps, projects, and academic record
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deepThinking}
              onChange={(e) => setDeepThinking(e.target.checked)}
              className="rounded border-slate-300 text-[#3267D5] focus:ring-[#3267D5]"
            />
            <Brain className="w-4 h-4 text-[#3267D5] dark:text-[#26C6DA]" />
            High Thinking Mode
          </label>

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateRecommendations}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? 'Analyzing Profile…' : 'Generate Personalized AI Recommendations'}
          </button>
        </div>
      </div>

      {/* Honest Source Banner */}
      {(notice || data.recommendations.length > 0) && (
        <div
          className={`rounded-xl p-4 border flex items-start gap-3 text-sm ${
            aiCount > 0 && fallbackCount === 0
              ? 'bg-[#EAF1FF] dark:bg-[#162647] border-[#3267D5]/30 text-[#142B53] dark:text-slate-100'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-100'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-xs">
              {aiCount > 0 && fallbackCount === 0
                ? 'Source: Server-Side Gemini AI (Grounded in Your Verified Profile Data)'
                : 'Source: Deterministic Rule-Based Fallback (Not AI-Generated)'}
            </p>
            <p className="text-xs opacity-90">
              {notice ||
                (aiCount > 0 && fallbackCount === 0
                  ? 'Recommendations were generated by Gemini based strictly on your tracked skills, gaps, projects, academics, and interview history.'
                  : 'Currently displaying deterministic rule-based recommendations computed directly from your actual skill gaps. Click "Generate Personalized AI Recommendations" to request live Gemini analysis.')}
            </p>
          </div>
        </div>
      )}

      {/* Priority Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(['All', 'High', 'Medium', 'Low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                priorityFilter === p
                  ? 'bg-[#142B53] dark:bg-[#3267D5] text-white'
                  : 'bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#3267D5]'
              }`}
            >
              {p === 'All' ? `All (${data.recommendations.length})` : `${p} Priority`}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Readiness: <span className="font-mono font-semibold">{readiness.overallScore}%</span> ·{' '}
          {readiness.gapsIdentifiedCount} gaps targeted
        </p>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <Lightbulb className="w-8 h-8 text-[#3267D5] mx-auto" />
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            No recommendations match this view yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Generate personalized recommendations to receive concrete study topics, project upgrades,
            and interview drills tailored to your {primaryCareer.title} gaps.
          </p>
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateRecommendations}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg"
          >
            <Sparkles className="w-4 h-4" />
            Generate Recommendations
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-[#142B53] dark:text-slate-200">
                    {rec.relatedSkill} · {rec.difficulty} · {rec.estimatedTime}
                  </span>
                  <span
                    className={`font-semibold whitespace-nowrap ${
                      rec.priority === 'High'
                        ? 'text-[#E35D6A]'
                        : rec.priority === 'Medium'
                          ? 'text-[#F2A93B]'
                          : 'text-[#22A06B]'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold text-[#142B53] dark:text-white leading-snug">
                  {rec.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rec.explanation}
                </p>

                <div className="bg-[#F6F8FC] dark:bg-[#0B1324] rounded-lg p-3.5 space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-[#142B53] dark:text-white">Why this matters: </strong>
                    {rec.reason}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-[#142B53] dark:text-white">Expected outcome: </strong>
                    {rec.expectedOutcome}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-[#142B53] dark:text-white">Next action: </strong>
                    {rec.suggestedNextAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {rec.source === 'gemini-ai' ? 'Gemini AI' : 'Rule-Based Fallback'}
                </span>
                <button
                  type="button"
                  disabled={rec.addedToActionPlan}
                  onClick={() => addRecommendationToActionPlan(rec.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    rec.addedToActionPlan
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#22A06B] cursor-default'
                      : 'bg-[#EAF1FF] dark:bg-[#162647] text-[#3267D5] dark:text-[#26C6DA] hover:bg-[#dce8ff] dark:hover:bg-[#1e335c]'
                  }`}
                >
                  {rec.addedToActionPlan ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Added to Action Plan
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add to Action Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Market Insights with Google Search Grounding */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-lg bg-[#EAF1FF] dark:bg-[#162647] text-[#3267D5] dark:text-[#26C6DA] shrink-0">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Live Hiring Market Briefing (Search Grounded)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fetch current entry-level expectations for {primaryCareer.title} roles backed by
                live web citations
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={marketLoading}
            onClick={handleFetchMarketInsights}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#142B53] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {marketLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {marketInsight ? 'Refresh Briefing' : 'Load Live Market Briefing'}
          </button>
        </div>

        {marketInsight && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Source:{' '}
              <strong className="text-[#142B53] dark:text-white">
                {marketInsight.source === 'gemini-search'
                  ? 'Gemini + Google Search Grounding'
                  : 'Deterministic Briefing Fallback'}
              </strong>{' '}
              · Focus Skills: {marketInsight.trendingSkills.join(' · ')}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {marketInsight.summary}
            </p>
            {marketInsight.sources.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Cited Web Sources
                </p>
                <div className="flex flex-wrap gap-3">
                  {marketInsight.sources.map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
