import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { ActionTaskCategory, PriorityLevel, TaskStatus } from '../../types/student';

const CATEGORIES: ActionTaskCategory[] = [
  'Daily Tasks',
  'Weekly Goals',
  'Practice Exercises',
  'Learning Activities',
  'Project Activities',
  'Interview Preparation',
];

export function ActionPlanPage() {
  const { data, addActionTask, updateActionTask, deleteActionTask, pushToast } = useStudentData();

  const [categoryFilter, setCategoryFilter] = useState<'All' | ActionTaskCategory>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActionTaskCategory>('Practice Exercises');
  const [relatedSkill, setRelatedSkill] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [estimatedDuration, setEstimatedDuration] = useState('2 hours');
  const [notes, setNotes] = useState('');

  const totalCount = data.actionTasks.length;
  const completedCount = data.actionTasks.filter((t) => t.status === 'Completed').length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyCompleted = data.actionTasks.filter(
    (t) => t.status === 'Completed' && t.completedAt && t.completedAt >= sevenDaysAgo
  ).length;
  const weeklyRate =
    totalCount > 0 ? Math.min(100, Math.round(((weeklyCompleted || completedCount) / Math.max(1, totalCount)) * 100)) : 0;

  const upcomingDeadlines = data.actionTasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const visibleTasks = data.actionTasks.filter((t) =>
    categoryFilter === 'All' ? true : t.category === categoryFilter
  );

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      pushToast('error', 'Please enter a task title.');
      return;
    }
    await addActionTask({
      title: title.trim(),
      description: description.trim() || 'Focused skill-building action item.',
      category,
      relatedSkill: relatedSkill.trim() || 'General Readiness',
      dueDate,
      priority,
      estimatedDuration: estimatedDuration.trim() || '2 hours',
      status: 'Not Started',
      notes: notes.trim(),
    });
    setTitle('');
    setDescription('');
    setRelatedSkill('');
    setNotes('');
    setShowAddForm(false);
  }

  function nextStatus(status: TaskStatus): TaskStatus {
    if (status === 'Not Started') return 'In Progress';
    if (status === 'In Progress') return 'Completed';
    return 'Not Started';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            My Action Plan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track daily study habits, weekly goals, coding practice, and project milestones — every
            completion updates your learning streak
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Close Form' : 'Add Action Task'}
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Progress</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-1">
            {completionRate}%
          </p>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div className="h-full bg-[#3267D5] rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Weekly Momentum</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#22A06B] mt-1">
            {weeklyRate}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{data.streak.currentStreak}-day active streak</p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Tasks</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#F2A93B] mt-1">
            {pendingCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Active in queue</p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Tasks</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1">
            {completedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Out of {totalCount} total</p>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Create New Action Task
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Solve 5 binary tree traversal problems in Java"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:border-[#3267D5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActionTaskCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Related Skill
              </label>
              <input
                type="text"
                value={relatedSkill}
                onChange={(e) => setRelatedSkill(e.target.value)}
                placeholder="e.g., Data Structures & Algorithms"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Est. Time
                </label>
                <input
                  type="text"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="2 hours"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Concrete deliverable or study resource"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key takeaways or links"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Upcoming Deadlines Strip */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-[#EAF1FF]/70 dark:bg-[#162647]/60 border border-[#3267D5]/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#142B53] dark:text-white shrink-0">
            <Calendar className="w-4 h-4 text-[#3267D5] dark:text-[#26C6DA]" />
            Upcoming Deadlines:
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700 dark:text-slate-200">
            {upcomingDeadlines.map((t) => (
              <span key={t.id}>
                <strong className="font-mono text-[#3267D5] dark:text-[#26C6DA]">{t.dueDate}</strong>{' '}
                — {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(['All', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              categoryFilter === cat
                ? 'bg-[#142B53] dark:bg-[#3267D5] text-white'
                : 'bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#3267D5]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {visibleTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500">
            No action tasks in this category yet. Click &ldquo;Add Action Task&rdquo; to create one.
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-[#111C33] border rounded-xl p-5 space-y-3 transition-colors ${
                task.status === 'Completed'
                  ? 'border-emerald-200 dark:border-emerald-900/50'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={`Cycle status for ${task.title}`}
                    onClick={() => updateActionTask(task.id, { status: nextStatus(task.status) })}
                    className="mt-0.5 shrink-0"
                  >
                    {task.status === 'Completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                    ) : (
                      <Circle
                        className={`w-5 h-5 ${
                          task.status === 'In Progress' ? 'text-[#3267D5]' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{task.category}</span>
                      <span>·</span>
                      <span className="font-medium text-[#142B53] dark:text-slate-200">
                        {task.relatedSkill}
                      </span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          task.priority === 'High'
                            ? 'text-[#E35D6A]'
                            : task.priority === 'Medium'
                              ? 'text-[#F2A93B]'
                              : 'text-slate-500'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>
                    <h3
                      className={`font-display text-base font-semibold ${
                        task.status === 'Completed'
                          ? 'line-through text-slate-400'
                          : 'text-[#142B53] dark:text-white'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:pl-4">
                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    onChange={(e) =>
                      updateActionTask(task.id, { status: e.target.value as TaskStatus })
                    }
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-[#0B1324] text-[#142B53] dark:text-white"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    type="button"
                    aria-label="Edit notes"
                    onClick={() => {
                      setEditingNotesId(task.id);
                      setNotesDraft(task.notes || '');
                    }}
                    className="p-1.5 text-slate-400 hover:text-[#3267D5] rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="Delete task"
                    onClick={() => setDeleteTargetId(task.id)}
                    className="p-1.5 text-slate-400 hover:text-[#E35D6A] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pl-8">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    Due {task.dueDate}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {task.estimatedDuration}
                  </span>
                </div>
                {task.completedAt && (
                  <span className="text-[#22A06B] font-medium">Completed {task.completedAt}</span>
                )}
              </div>

              {editingNotesId === task.id ? (
                <div className="pl-8 flex items-center gap-2">
                  <input
                    type="text"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add study notes or reflection..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await updateActionTask(task.id, { notes: notesDraft.trim() });
                      setEditingNotesId(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3267D5] rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNotesId(null)}
                    className="px-2.5 py-1.5 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                task.notes && (
                  <p className="pl-8 text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">Notes: </strong>
                    {task.notes}
                  </p>
                )
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Action Task"
        message="Remove this task from your Action Plan? This cannot be undone."
        confirmLabel="Delete Task"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteActionTask(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
      />
    </div>
  );
}
