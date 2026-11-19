import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Compass,
  FolderGit2,
  Lightbulb,
  Map,
  MessageSquareCode,
  Sliders,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudentData } from '../../context/StudentDataContext';

export function OverviewPage() {
  const { data, primaryCareer, readiness, achievements } = useStudentData();

  const completedProjects = data.projects.filter((p) => p.status === 'Completed').length;
  const totalRoadmapTasks = data.roadmap?.tasks.length ?? 0;
  const completedRoadmapTasks = data.roadmap?.tasks.filter((t) => t.completed).length ?? 0;
  const totalActionTasks = data.actionTasks.length;
  const completedActionTasks = data.actionTasks.filter((t) => t.status === 'Completed').length;
  const totalLearningItems = totalRoadmapTasks + totalActionTasks;
  const learningProgressPct =
    totalLearningItems > 0
      ? Math.round(((completedRoadmapTasks + completedActionTasks) / totalLearningItems) * 100)
      : 0;

  const avgInterviewScore =
    data.interviews.length > 0
      ? Math.round(
          data.interviews.reduce((sum, item) => sum + item.overallScore, 0) / data.interviews.length
        )
      : null;

  const skillChartData = readiness.skillGaps.slice(0, 7).map((g) => ({
    name: g.skillName.length > 14 ? `${g.skillName.slice(0, 12)}…` : g.skillName,
    Current: g.currentScore ?? 0,
    Required: g.requiredScore,
  }));

  const progressChartData =
    data.progressHistory.length > 0
      ? data.progressHistory.map((p) => ({
          date: p.date.slice(5),
          Readiness: p.readinessScore,
          Skills: p.skillMatchScore,
        }))
      : [
          {
            date: new Date().toISOString().slice(5, 10),
            Readiness: readiness.overallScore,
            Skills: readiness.technicalSkillMatchScore ?? 0,
          },
        ];

  const earnedBadges = achievements.filter((a) => a.earned);
  const upcomingTasks = data.actionTasks.filter((t) => t.status !== 'Completed').slice(0, 4);

  const summaryCards = [
    {
      label: 'Career Readiness Score',
      value: `${readiness.overallScore}%`,
      sub: `Data coverage: ${readiness.dataCoveragePercent}%`,
      icon: Target,
      to: '/dashboard/skill-gap',
      accent: 'text-[#3267D5] dark:text-[#26C6DA]',
    },
    {
      label: 'Skills Tracked',
      value: String(data.skills.length),
      sub: `${data.skills.filter((s) => s.assessmentScore !== null).length} assessed with scores`,
      icon: Sliders,
      to: '/dashboard/skills',
      accent: 'text-[#142B53] dark:text-white',
    },
    {
      label: 'Skill Gaps Identified',
      value: String(readiness.gapsIdentifiedCount),
      sub: `${readiness.insufficientEvidenceCount} awaiting evidence`,
      icon: TrendingUp,
      to: '/dashboard/skill-gap',
      accent: readiness.gapsIdentifiedCount > 0 ? 'text-[#E35D6A]' : 'text-[#22A06B]',
    },
    {
      label: 'Projects Completed',
      value: String(completedProjects),
      sub: `${data.projects.length} total in portfolio`,
      icon: FolderGit2,
      to: '/dashboard/portfolio',
      accent: 'text-[#22A06B]',
    },
    {
      label: 'Learning Progress',
      value: `${learningProgressPct}%`,
      sub: `${completedRoadmapTasks + completedActionTasks}/${totalLearningItems} tasks completed`,
      icon: ClipboardList,
      to: '/dashboard/action-plan',
      accent: 'text-[#3267D5] dark:text-[#26C6DA]',
    },
    {
      label: 'Interview Performance',
      value: avgInterviewScore !== null ? `${avgInterviewScore}/100` : 'Not Taken',
      sub:
        data.interviews.length > 0
          ? `${data.interviews.length} practice session(s)`
          : 'Start your first mock session',
      icon: MessageSquareCode,
      to: '/dashboard/interview',
      accent: 'text-[#F2A93B]',
    },
  ];

  const isBrandNewStudent =
    data.skills.length === 0 && data.projects.length === 0 && data.academics.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Intro Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Career Readiness Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Target Role: <strong className="text-[#142B53] dark:text-white">{primaryCareer.title}</strong> ·{' '}
            {data.profile.course} Semester {data.profile.currentSemester} ·{' '}
            {data.streak.currentStreak}-day learning streak
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/dashboard/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap"
          >
            <Lightbulb className="w-4 h-4" />
            AI Recommendations
          </Link>
          <Link
            to="/dashboard/interview"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 hover:border-[#3267D5] rounded-lg transition-colors whitespace-nowrap"
          >
            Practice Interview
          </Link>
        </div>
      </div>

      {/* Empty State Onboarding Callout for New Accounts */}
      {isBrandNewStudent && (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Build your baseline profile to unlock live skill-gap analytics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Add your first technical skills, semester marks, or a project — or run the 6-step
              onboarding wizard to populate everything in two minutes.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg whitespace-nowrap shrink-0"
          >
            Start Onboarding Wizard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 6 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="group bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 hover:border-[#3267D5]/60 rounded-xl p-5 flex items-start justify-between gap-4 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className={`text-2xl font-mono font-bold tabular-nums ${card.accent}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.sub}</p>
              </div>
              <span className="p-2.5 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] text-slate-600 dark:text-slate-300 group-hover:text-[#3267D5] dark:group-hover:text-[#26C6DA] transition-colors shrink-0">
                <Icon className="w-5 h-5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Main Analytics Row: Circular Readiness + Strongest/Weakest + Weekly Progress */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Readiness Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Indicative Career Readiness
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weighted score across 5 evaluated dimensions
              </p>
            </div>
            <Link
              to="/dashboard/skill-gap"
              className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
            >
              Full Analysis →
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#3267D5"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * readiness.overallScore) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white">
                  {readiness.overallScore}%
                </span>
                <span className="text-[11px] text-slate-500">Indicative</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              {readiness.components.map((comp) => (
                <div key={comp.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{comp.label}</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {comp.hasData ? `${comp.score}%` : 'No data'} ({comp.baseWeight}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3267D5]"
                      style={{ width: `${comp.score ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            {readiness.disclaimer}
          </p>
        </div>

        {/* Weekly Progress Line Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Readiness & Skill Match Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historical progression across recorded checkpoints
              </p>
            </div>
            <Link
              to="/dashboard/progress"
              className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
            >
              Progress History →
            </Link>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressChartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Readiness"
                  stroke="#3267D5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3267D5' }}
                />
                <Line
                  type="monotone"
                  dataKey="Skills"
                  stroke="#26C6DA"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#26C6DA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skill Proficiency Chart + Strongest / Weakest Skills */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Skill Proficiency vs {primaryCareer.title} Benchmark
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current assessed or self-reported score against required target
              </p>
            </div>
            <Link
              to="/dashboard/skills"
              className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
            >
              Manage Skills →
            </Link>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="Current" fill="#3267D5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
              Strongest Skills
            </h2>
            {readiness.strongestSkills.length === 0 ? (
              <p className="text-xs text-slate-500">Add assessed skills to view your top strengths.</p>
            ) : (
              <div className="space-y-2">
                {readiness.strongestSkills.slice(0, 3).map((s) => (
                  <div key={s.skillName} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{s.skillName}</span>
                    <span className="font-mono tabular-nums font-semibold text-[#22A06B]">
                      {s.currentScore}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
              Priority Skill Gaps
            </h2>
            {readiness.weakestSkills.length === 0 ? (
              <p className="text-xs text-slate-500">
                No negative skill gaps detected across assessed skills.
              </p>
            ) : (
              <div className="space-y-2">
                {readiness.weakestSkills.slice(0, 3).map((s) => (
                  <div key={s.skillName} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{s.skillName}</span>
                    <span className="font-mono tabular-nums font-semibold text-[#E35D6A]">
                      -{s.gap} pts ({s.currentScore}/{s.requiredScore})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Current Roadmap, Upcoming Tasks, Latest AI Recommendations, Achievements */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Current Roadmap & Upcoming Tasks */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-[#3267D5]" />
                <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                  Current Learning Roadmap
                </h2>
              </div>
              <Link
                to="/dashboard/roadmap"
                className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
              >
                Open Roadmap →
              </Link>
            </div>
            {data.roadmap ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {data.roadmap.durationDays}-Day {data.roadmap.careerTitle} Plan ·{' '}
                    {data.roadmap.status}
                  </span>
                  <span className="font-mono tabular-nums">
                    {completedRoadmapTasks}/{totalRoadmapTasks} completed
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#22A06B] rounded-full"
                    style={{
                      width: `${
                        totalRoadmapTasks > 0
                          ? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="space-y-2 pt-1">
                  {data.roadmap.tasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#142B53] dark:text-white truncate">
                          {t.weekLabel}: {t.topic}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.skill} · {t.estimatedDuration}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          t.completed ? 'text-[#22A06B]' : 'text-slate-400'
                        }`}
                      >
                        {t.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm text-slate-500">No active roadmap yet.</p>
                <Link
                  to="/dashboard/roadmap"
                  className="inline-block text-xs font-semibold text-[#3267D5] hover:underline"
                >
                  Generate 30/60/90-Day Roadmap
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                Upcoming Learning Tasks
              </h2>
              <Link
                to="/dashboard/action-plan"
                className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
              >
                Action Plan →
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-slate-500">All action-plan tasks completed.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#142B53] dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.category} · {task.relatedSkill} · Due {task.dueDate}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        task.priority === 'High'
                          ? 'text-[#E35D6A]'
                          : task.priority === 'Medium'
                            ? 'text-[#F2A93B]'
                            : 'text-slate-500'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Recommendations & Recent Achievements / Activity */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#3267D5]" />
                <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                  Latest AI Recommendations
                </h2>
              </div>
              <Link
                to="/dashboard/recommendations"
                className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
              >
                View All →
              </Link>
            </div>
            {data.recommendations.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm text-slate-500">No recommendations generated yet.</p>
                <Link
                  to="/dashboard/recommendations"
                  className="inline-block text-xs font-semibold text-[#3267D5] hover:underline"
                >
                  Generate Personalized Recommendations
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {rec.relatedSkill} · {rec.priority} Priority
                      </span>
                      <span>{rec.estimatedTime}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#142B53] dark:text-white">
                      {rec.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {rec.suggestedNextAction || rec.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#22A06B]" />
                <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                  Achievements & Recent Activity
                </h2>
              </div>
              <Link
                to="/dashboard/achievements"
                className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
              >
                {earnedBadges.length}/{achievements.length} Earned →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {earnedBadges.slice(0, 4).map((b) => (
                <div
                  key={b.code}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#22A06B] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#142B53] dark:text-white truncate">
                      {b.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Earned {b.earnedDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {data.progressHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Recent Timeline
                </p>
                {data.progressHistory.slice(-2).reverse().map((item) => (
                  <p key={item.id} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-mono text-slate-400 mr-2">{item.date}</span>
                    {item.note}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Target Strip */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-[#3267D5] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#142B53] dark:text-white">
              Primary Career Target: {primaryCareer.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{primaryCareer.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dashboard/compare"
            className="text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline"
          >
            Compare With Another Career
          </Link>
          <Link
            to="/dashboard/career-goals"
            className="px-3.5 py-1.5 text-xs font-medium text-[#142B53] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
          >
            Edit Career Goals
          </Link>
        </div>
      </div>
    </div>
  );
}
