import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
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
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useStudentData } from '../../context/StudentDataContext';
import type { AcademicRecord } from '../../types/student';

export function AcademicsPage() {
  const { data, academicsAnalytics, addAcademicRecord, deleteAcademicRecord } = useStudentData();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AcademicRecord | null>(null);

  const [semester, setSemester] = useState(String(data.profile.currentSemester || 1));
  const [subject, setSubject] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [assessmentType, setAssessmentType] =
    useState<AcademicRecord['assessmentType']>('Semester Exam');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sem = Number(semester);
    const marks = Number(marksObtained);
    const max = Number(maxMarks);
    if (!subject.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (Number.isNaN(max) || max <= 0) {
      setError('Maximum marks must be greater than zero.');
      return;
    }
    if (Number.isNaN(marks) || marks < 0 || marks > max) {
      setError(`Marks obtained must be between 0 and ${max}.`);
      return;
    }
    await addAcademicRecord({
      semester: sem,
      subject: subject.trim(),
      marksObtained: marks,
      maxMarks: max,
      assessmentType,
      assessmentDate,
      credits: 4,
    });
    setSubject('');
    setMarksObtained('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Academic Performance Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track semester assessments, CGPA, and subject strengths. Missing marks are never
            assumed to be zero.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Academic Record
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated CGPA (10-pt)</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-1">
            {academicsAnalytics.cgpa !== null ? academicsAnalytics.cgpa.toFixed(2) : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Average Percentage</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white mt-1">
            {academicsAnalytics.averagePercentage !== null
              ? `${academicsAnalytics.averagePercentage}%`
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Records Logged</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-[#22A06B] mt-1">
            {academicsAnalytics.totalRecords}
          </p>
        </div>
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Readiness Contribution</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200 mt-1">
            {data.weights.academicPerformance}% wt
          </p>
        </div>
      </div>

      {/* Add Record Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111C33] border border-[#3267D5]/50 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Log Subject Assessment
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close academic form"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#E35D6A] font-medium">
              {error}
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ac-sem" className="block text-xs font-medium mb-1">
                Semester
              </label>
              <input
                id="ac-sem"
                type="number"
                min={1}
                max={12}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label htmlFor="ac-sub" className="block text-xs font-medium mb-1">
                Subject Name
              </label>
              <input
                id="ac-sub"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Operating Systems"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label htmlFor="ac-type" className="block text-xs font-medium mb-1">
                Assessment Type
              </label>
              <select
                id="ac-type"
                value={assessmentType}
                onChange={(e) =>
                  setAssessmentType(e.target.value as AcademicRecord['assessmentType'])
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              >
                <option value="Semester Exam">Semester Exam</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Lab Practical">Lab Practical</option>
                <option value="Assignment">Assignment</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label htmlFor="ac-marks" className="block text-xs font-medium mb-1">
                Marks Obtained
              </label>
              <input
                id="ac-marks"
                type="number"
                required
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label htmlFor="ac-max" className="block text-xs font-medium mb-1">
                Maximum Marks
              </label>
              <input
                id="ac-max"
                type="number"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label htmlFor="ac-date" className="block text-xs font-medium mb-1">
                Assessment Date
              </label>
              <input
                id="ac-date"
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3267D5] rounded-lg"
            >
              Save Record
            </button>
          </div>
        </form>
      )}

      {/* Charts Grid */}
      {academicsAnalytics.totalRecords > 0 && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Semester-Wise Performance Trend
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={academicsAnalytics.semesterTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="averagePercent"
                    name="Average %"
                    stroke="#3267D5"
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Marks Distribution by Grade Band
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={academicsAnalytics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="band" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" name="Subjects" fill="#26C6DA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Improvement Areas */}
      {academicsAnalytics.totalRecords > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
            <h2 className="font-display text-sm font-semibold text-[#22A06B]">
              Academic Strengths (≥ 75%)
            </h2>
            {academicsAnalytics.strengths.length === 0 ? (
              <p className="text-xs text-slate-500">No subjects above 75% recorded yet.</p>
            ) : (
              academicsAnalytics.strengths.map((s) => (
                <div key={s.subject} className="flex items-center justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#22A06B]">
                    {s.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
            <h2 className="font-display text-sm font-semibold text-[#E35D6A]">
              Areas Requiring Improvement (&lt; 75%)
            </h2>
            {academicsAnalytics.improvementAreas.length === 0 ? (
              <p className="text-xs text-slate-500">All recorded subjects are at or above 75%.</p>
            ) : (
              academicsAnalytics.improvementAreas.map((s) => (
                <div key={s.subject} className="flex items-center justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#E35D6A]">
                    {s.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {data.academics.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-[#142B53] dark:text-white">
              No academic records added yet.
            </p>
            <p className="text-xs text-slate-500">
              Log semester exams, mid-terms, or practical marks to calculate your CGPA and trend
              charts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-[#0B1324] text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Semester</th>
                  <th className="py-3 px-4 font-medium">Subject</th>
                  <th className="py-3 px-4 font-medium">Assessment Type</th>
                  <th className="py-3 px-4 font-medium text-right">Marks</th>
                  <th className="py-3 px-4 font-medium text-right">Percentage</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.academics.map((rec) => {
                  const pct = Math.round((rec.marksObtained / rec.maxMarks) * 1000) / 10;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-xs">Sem {rec.semester}</td>
                      <td className="py-3 px-4 font-medium text-[#142B53] dark:text-white">
                        {rec.subject}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {rec.assessmentType}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {rec.marksObtained}/{rec.maxMarks}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        <span
                          className={
                            pct >= 75
                              ? 'text-[#22A06B]'
                              : pct >= 60
                                ? 'text-[#F2A93B]'
                                : 'text-[#E35D6A]'
                          }
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {rec.assessmentDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rec)}
                          aria-label={`Delete ${rec.subject}`}
                          className="p-1.5 text-slate-400 hover:text-[#E35D6A]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete academic record for ${deleteTarget?.subject}?`}
        message="Your CGPA and semester averages will recalculate immediately."
        confirmLabel="Delete Record"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteAcademicRecord(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
