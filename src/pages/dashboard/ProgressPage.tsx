import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudentData } from '../../context/StudentDataContext';

type RangeKey = '7d' | '30d' | '90d' | 'all';

export function ProgressPage() {
  const { data, readiness, academicsAnalytics } = useStudentData();
  const [range, setRange] = useState<RangeKey>('all');

  const filteredHistory = useMemo(() => {
    const sorted = [...data.progressHistory].sort((a, b) => a.date.localeCompare(b.date));
    if (range === 'all' || sorted.length === 0) return sorted;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const matches = sorted.filter((item) => item.date >= cutoff);
    return matches.length > 0 ? matches : sorted.slice(-1);
  }, [data.progressHistory, range]);

  const initialSnap = filteredHistory[0] ?? null;
  const latestSnap = filteredHistory[filteredHistory.length - 1] ?? null;

  const readinessDelta =
    initialSnap && latestSnap ? readiness.overallScore - initialSnap.readinessScore : 0;
  const skillDelta =
    initialSnap && latestSnap && readiness.technicalSkillMatchScore !== null
      ? readiness.technicalSkillMatchScore - initialSnap.skillMatchScore
      : 0;
  const latestInterviewAvg =
    data.interviews.length > 0
      ? Math.round(
          data.interviews.reduce((s, i) => s + i.overallScore, 0) / data.interviews.length
        )
      : null;

  const readinessTrendData =
    filteredHistory.length > 0
      ? filteredHistory.map((h) => ({
          date: h.date.slice(5),
          Readiness: h.readinessScore,
          SkillMatch: h.skillMatchScore,
        }))
      : [
          {
            date: new Date().toISOString().slice(5, 10),
            Readiness: readiness.overallScore,
            SkillMatch: readiness.technicalSkillMatchScore ?? 0,
          },
        ];

  const interviewTrendData = [...data.interviews]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((item, idx) => ({
      session: `#${idx + 1} ${item.topic.slice(0, 10)}`,
      Score: item.overallScore,
    }));

  return (
    <div className="space-y-6">
      {/* Header + Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Progress History & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track longitudinal career readiness growth, academic trajectories, interview trends, and
            milestone history
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C33] p-1 self-start">
          {(
            [
              ['7d', 'Last 7 Days'],
              ['30d', 'Last 30 Days'],
              ['90d', 'Last 90 Days'],
              ['all', 'All Time'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                range === key
                  ? 'bg-[#3267D5] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Initial vs Latest Profile Comparison Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Readiness Progression
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-1">
            {readiness.overallScore}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {initialSnap
              ? `${readinessDelta >= 0 ? '+' : ''}${readinessDelta} pts since ${initialSnap.date}`
              : 'Baseline checkpoint'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Technical Skill Match
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1">
            {readiness.technicalSkillMatchScore !== null
              ? `${readiness.technicalSkillMatchScore}%`
              : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {initialSnap ? `${skillDelta >= 0 ? '+' : ''}${skillDelta} pts vs baseline` : 'Current'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Tasks Completed
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#22A06B] mt-1">
            {data.streak.totalCompletedTasks}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.streak.currentStreak}-day active streak
          </p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Average Interview Score
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#F2A93B] mt-1">
            {latestInterviewAvg !== null ? `${latestInterviewAvg}/100` : 'Not Taken'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.interviews.length} session(s) logged
          </p>
        </div>
      </div>

      {/* Main Readiness History Chart */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Career Readiness & Skill Match Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Snapshots recorded automatically as you complete learning tasks, projects, and mock
            interviews
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readinessTrendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Readiness"
                name="Readiness Score"
                stroke="#3267D5"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="SkillMatch"
                name="Skill Match"
                stroke="#26C6DA"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Academic Trend + Interview Score Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Academic Semester Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {academicsAnalytics.cgpa !== null
                ? `Current CGPA: ${academicsAnalytics.cgpa.toFixed(2)} (${academicsAnalytics.averagePercentage}% overall average)`
                : 'Add semester records to view academic progression'}
            </p>
          </div>
          {academicsAnalytics.semesterTrend.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">No academic records yet.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={academicsAnalytics.semesterTrend}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="averagePercent" name="Average %" fill="#3267D5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Mock Interview Score Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice rubric performance across saved text-based sessions
            </p>
          </div>
          {interviewTrendData.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">
              Complete a mock interview to track interview score trends.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={interviewTrendData}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="session" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="Score" fill="#22A06B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Chronological Learning Activity History */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Chronological Checkpoint Log
          </h2>
        </div>
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No historical checkpoints logged in this timeframe yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-[#0B1324] text-xs text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Skill Match</th>
                  <th className="py-3 px-4">Tasks Done</th>
                  <th className="py-3 px-4">Milestone Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...filteredHistory].reverse().map((snap) => (
                  <tr key={snap.id}>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {snap.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#3267D5] dark:text-[#26C6DA]">
                      {snap.readinessScore}%
                    </td>
                    <td className="py-3 px-4 font-mono text-[#142B53] dark:text-white">
                      {snap.skillMatchScore}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {snap.tasksCompleted}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {snap.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
