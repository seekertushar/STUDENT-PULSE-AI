import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Check, CheckCheck } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';

export function NotificationsPage() {
  const { data, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead } =
    useStudentData();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = data.notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Notifications Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadNotificationsCount} unread notification(s) across recommendations, roadmaps,
            skills, and mock interviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C33] p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-[#3267D5] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({data.notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                filter === 'unread'
                  ? 'bg-[#3267D5] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 hover:border-[#3267D5] rounded-lg whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-2">
          <Bell className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
            You&apos;re all caught up
          </p>
          <p className="text-xs text-slate-500">
            New updates appear here whenever you improve an assessment, generate recommendations, or
            finish a roadmap milestone.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white dark:bg-[#111C33] border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                notif.read
                  ? 'border-slate-200 dark:border-slate-800 opacity-80'
                  : 'border-[#3267D5]/40 bg-[#EAF1FF]/30 dark:bg-[#162647]/30'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize font-semibold text-[#3267D5] dark:text-[#26C6DA]">
                    {notif.type}
                  </span>
                  <span>·</span>
                  <span className="font-mono">{notif.createdAt.slice(0, 10)}</span>
                  {!notif.read && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-[#142B53] dark:text-white">Unread</span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
                  {notif.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(notif.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Read
                  </button>
                )}
                <Link
                  to={notif.targetRoute || '/dashboard'}
                  onClick={() => {
                    if (!notif.read) markNotificationRead(notif.id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg"
                >
                  Open
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
