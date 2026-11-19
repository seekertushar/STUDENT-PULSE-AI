import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  FolderCheck,
  Layers,
  Lock,
  MapPin,
  MessageSquare,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCheck,
  Layers,
  FolderCheck,
  Flame,
  MessageSquareCheck: MessageSquare,
  TrendingUp,
  MapPinCheck: MapPin,
  Award,
};

export function AchievementsPage() {
  const { data, achievements } = useStudentData();
  const [filter, setFilter] = useState<'All' | 'Earned' | 'Locked'>('All');

  const earnedCount = achievements.filter((a) => a.earned).length;
  const visibleBadges = achievements.filter((a) => {
    if (filter === 'Earned') return a.earned;
    if (filter === 'Locked') return !a.earned;
    return true;
  });

  // Build 14-day activity calendar ending today
  const activityCalendar = useMemo(() => {
    const activeSet = new Set(data.streak.activeDates);
    const today = new Date();
    return Array.from({ length: 14 }, (_, idx) => {
      const d = new Date(today.getTime() - (13 - idx) * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      return {
        iso,
        weekday,
        dayNum,
        active: activeSet.has(iso),
      };
    });
  }, [data.streak.activeDates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
          Achievements & Learning Streak
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Every badge is strictly validated against real profile, portfolio, roadmap, assessment,
          and interview events
        </p>
      </div>

      {/* Streak KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Streak</p>
            <Flame className="w-4 h-4 text-[#F2A93B]" />
          </div>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1.5">
            {data.streak.currentStreak} days
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Consecutive active days</p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Longest Streak</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-1.5">
            {data.streak.longestStreak} days
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Personal record</p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed Learning Actions
          </p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#22A06B] mt-1.5">
            {data.streak.totalCompletedTasks}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Set(data.streak.activeDates).size} unique active days
          </p>
        </div>

        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Earned Badges</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1.5">
            {earnedCount} / {achievements.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Verified milestones</p>
        </div>
      </div>

      {/* 14-Day Activity Calendar */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              14-Day Learning Activity Calendar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete action tasks, roadmap milestones, projects, or mock interviews to light up
              each day
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#22A06B]" /> Active Day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />{' '}
              No Activity
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {activityCalendar.map((day) => (
            <div
              key={day.iso}
              title={`${day.iso}: ${day.active ? 'Qualifying learning activity recorded' : 'No recorded activity'}`}
              className={`rounded-lg p-2.5 text-center border transition-colors ${
                day.active
                  ? 'bg-[#22A06B] text-white border-[#22A06B]'
                  : 'bg-[#F6F8FC] dark:bg-[#0B1324] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="text-[10px] font-medium opacity-85">{day.weekday}</p>
              <p className="font-mono text-sm font-bold tabular-nums mt-0.5">{day.dayNum}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {(['All', 'Earned', 'Locked'] as const).map((tab) => (
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

      {/* Badges Gallery */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleBadges.map((badge) => {
          const Icon = ICON_MAP[badge.iconName] ?? Award;
          return (
            <div
              key={badge.code}
              className={`bg-white dark:bg-[#111C33] border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                badge.earned
                  ? 'border-emerald-200 dark:border-emerald-900/60'
                  : 'border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`p-2.5 rounded-lg ${
                      badge.earned
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#22A06B]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  {badge.earned ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22A06B]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Earned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-sm font-bold text-[#142B53] dark:text-white">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                <p className="text-slate-500 dark:text-slate-400">{badge.criteria}</p>
                <p
                  className={`font-medium ${
                    badge.earned ? 'text-[#22A06B]' : 'text-[#3267D5] dark:text-[#26C6DA]'
                  }`}
                >
                  {badge.earned && badge.earnedDate
                    ? `Unlocked on ${badge.earnedDate}`
                    : `Progress: ${badge.progressText}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
