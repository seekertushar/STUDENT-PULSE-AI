import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Loader2,
  Map,
  Pause,
  Play,
  RefreshCw,
  Square,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import type { LearningRoadmap } from '../../types/student';

export function RoadmapPage() {
  const { data, primaryCareer, saveRoadmap, toggleRoadmapTask, setRoadmapStatus, pushToast } =
    useStudentData();

  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 90>(
    data.roadmap?.durationDays ?? 30
  );
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  const roadmap = data.roadmap;
  const totalTasks = roadmap?.tasks.length ?? 0;
  const completedTasks = roadmap?.tasks.filter((t) => t.completed).length ?? 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const visibleTasks = (roadmap?.tasks ?? []).filter((t) => {
    if (filter === 'Pending') return !t.completed;
    if (filter === 'Completed') return t.completed;
    return true;
  });

  async function handleGenerateRoadmap(duration: 30 | 60 | 90 = selectedDuration) {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.profile.userId,
          careerId: primaryCareer.id,
          customCareers: data.customCareers,
          skills: data.skills,
          durationDays: duration,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.roadmap) {
        throw new Error(json.error || 'Could not generate roadmap.');
      }
      await saveRoadmap(json.roadmap as LearningRoadmap);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Roadmap generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Personalized Learning Roadmap
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Step-by-step milestone sequence built around your{' '}
            <strong className="text-[#142B53] dark:text-white">{primaryCareer.title}</strong> skill
            gaps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C33] p-1">
            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedDuration(days)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedDuration === days
                    ? 'bg-[#3267D5] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white'
                }`}
              >
                {days}-Day
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerateRoadmap(selectedDuration)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {roadmap ? `Regenerate ${selectedDuration}-Day Plan` : `Generate ${selectedDuration}-Day Plan`}
          </button>
        </div>
      </div>

      {!roadmap ? (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <Map className="w-8 h-8 text-[#3267D5] mx-auto" />
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            No active roadmap yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Choose a 30-day, 60-day, or 90-day horizon and generate a structured roadmap tailored to
            your highest-priority skill gaps.
          </p>
        </div>
      ) : (
        <>
          {/* Roadmap Summary & Controls */}
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-[#142B53] dark:text-white">
                  {roadmap.durationDays}-Day {roadmap.careerTitle} Roadmap
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status:{' '}
                  <strong
                    className={
                      roadmap.status === 'Completed'
                        ? 'text-[#22A06B]'
                        : roadmap.status === 'Paused'
                          ? 'text-[#F2A93B]'
                          : 'text-[#3267D5] dark:text-[#26C6DA]'
                    }
                  >
                    {roadmap.status}
                  </strong>{' '}
                  · Source:{' '}
                  {roadmap.source === 'gemini-ai'
                    ? 'Gemini AI Roadmap'
                    : 'Rule-Based Fallback (Not AI-Generated)'}{' '}
                  · {completedTasks} of {totalTasks} milestones completed
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {roadmap.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() =>
                      setRoadmapStatus(roadmap.status === 'Paused' ? 'Active' : 'Paused')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#142B53] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {roadmap.status === 'Paused' ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Resume Roadmap
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        Pause Roadmap
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Overall Completion</span>
                <span className="font-mono tabular-nums font-semibold text-[#142B53] dark:text-white">
                  {completionPct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#22A06B] transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5">
            {(['All', 'Pending', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === tab
                    ? 'bg-[#142B53] dark:bg-[#3267D5] text-white'
                    : 'bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#3267D5]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Milestone List */}
          <div className="space-y-3">
            {visibleTasks.length === 0 ? (
              <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500">
                No milestones in this filter view.
              </div>
            ) : (
              visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-[#111C33] border rounded-xl p-5 transition-colors ${
                    task.completed
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      aria-label={`Mark ${task.topic} as ${task.completed ? 'pending' : 'completed'}`}
                      onClick={() => toggleRoadmapTask(task.id)}
                      className="mt-0.5 text-[#3267D5] dark:text-[#26C6DA] hover:opacity-80 shrink-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-[#22A06B]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          <strong className="text-[#142B53] dark:text-white">
                            {task.weekLabel}
                          </strong>{' '}
                          · {task.dayRange} · {task.skill} · {task.difficulty}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {task.estimatedDuration}
                        </span>
                      </div>

                      <h3
                        className={`font-display text-base font-semibold ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-[#142B53] dark:text-white'
                        }`}
                      >
                        {task.topic}
                      </h3>

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {task.description}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong className="text-[#142B53] dark:text-slate-200">
                          Expected Outcome:{' '}
                        </strong>
                        {task.expectedOutcome}
                        {task.completedAt && (
                          <span className="ml-2 text-[#22A06B] font-medium">
                            · Completed {task.completedAt}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
