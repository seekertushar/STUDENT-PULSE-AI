import React, { useEffect, useState } from 'react';
import {
  Moon,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useStudentData } from '../../context/StudentDataContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { ReadinessWeights, SkillThresholds } from '../../types/student';

interface HealthStatus {
  status: string;
  aiConfigured: boolean;
  pythonAnalytics: {
    configured: boolean;
    connected: boolean;
    activeEngine: string;
  };
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data, isDemoMode, updateSettings, resetSettings, resetDemoWorkspace, pushToast } =
    useStudentData();

  const [weights, setWeights] = useState<ReadinessWeights>(data.weights);
  const [thresholds, setThresholds] = useState<SkillThresholds>(data.thresholds);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);

  useEffect(() => {
    setWeights(data.weights);
    setThresholds(data.thresholds);
  }, [data.weights, data.thresholds]);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((r) => r.json())
      .then((json: HealthStatus) => {
        if (active) setHealth(json);
      })
      .catch(() => {
        // Ignore network errors
      });
    return () => {
      active = false;
    };
  }, []);

  const weightSum =
    weights.technicalSkills +
    weights.projectExperience +
    weights.academicPerformance +
    weights.interviewPerformance +
    weights.learningConsistency;

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (weightSum !== 100) {
      pushToast('error', `Readiness weights must sum to 100% (currently ${weightSum}%).`);
      return;
    }
    if (thresholds.goodMin <= thresholds.moderateMin) {
      pushToast('error', '"Good" skill threshold must be higher than "Moderate" threshold.');
      return;
    }
    await updateSettings(weights, thresholds);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
          Workspace Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize appearance, Career Readiness Score weights, skill status thresholds, and inspect
          analytics engine connectivity
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Interface Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between StudentPulse AI Light Mode and Dark Mode
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-[#F6F8FC] dark:bg-[#0B1324] self-start">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-white text-[#142B53] shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Light Mode
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-[#3267D5] text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark Mode
          </button>
        </div>
      </div>

      {/* Configurable Weights & Thresholds */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Career Readiness Weights & Skill Thresholds
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All 5 readiness dimensions must total exactly 100%. Changes recalculate analytics live.
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold tabular-nums ${
              weightSum === 100 ? 'text-[#22A06B]' : 'text-[#E35D6A]'
            }`}
          >
            Total: {weightSum}% / 100%
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            [
              ['technicalSkills', 'Technical Skill Match (%)'],
              ['projectExperience', 'Project Experience (%)'],
              ['academicPerformance', 'Academic Performance (%)'],
              ['interviewPerformance', 'Interview Performance (%)'],
              ['learningConsistency', 'Learning Consistency (%)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {label}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))
                }
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              &ldquo;Good&rdquo; Skill Minimum (%)
            </label>
            <input
              type="number"
              min={50}
              max={95}
              value={thresholds.goodMin}
              onChange={(e) =>
                setThresholds((prev) => ({ ...prev, goodMin: Number(e.target.value) || 75 }))
              }
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              &ldquo;Moderate&rdquo; Skill Minimum (%)
            </label>
            <input
              type="number"
              min={20}
              max={80}
              value={thresholds.moderateMin}
              onChange={(e) =>
                setThresholds((prev) => ({ ...prev, moderateMin: Number(e.target.value) || 50 }))
              }
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Career Ready Badge Milestone (%)
            </label>
            <input
              type="number"
              min={50}
              max={95}
              value={thresholds.careerReadyMilestone}
              onChange={(e) =>
                setThresholds((prev) => ({
                  ...prev,
                  careerReadyMilestone: Number(e.target.value) || 75,
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => resetSettings()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={weightSum !== 100}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Analytics Configuration
          </button>
        </div>
      </form>

      {/* Analytics Engine & Optional Python Microservice Status */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-[#3267D5]" />
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Analytics & AI Runtime Status
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1">
            <p className="font-semibold text-[#142B53] dark:text-white">Active Analytics Engine</p>
            <p className="font-mono text-[#3267D5] dark:text-[#26C6DA]">
              {health?.pythonAnalytics.activeEngine ?? 'node-deterministic-engine'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              {health?.pythonAnalytics.connected
                ? 'Connected to external Python FastAPI + Pandas + NumPy microservice.'
                : 'Optional Python FastAPI microservice (PYTHON_ANALYTICS_URL) is not configured; using the identical deterministic Node analytics engine.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1">
            <p className="font-semibold text-[#142B53] dark:text-white">
              Server-Side Gemini AI Proxy
            </p>
            <p className="font-mono text-[#22A06B]">
              {health?.aiConfigured ? 'Connected (Server-Side API)' : 'Deterministic Fallback Mode'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              All AI calls execute securely on the Express server with transparent deterministic
              fallbacks whenever Gemini is unavailable.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Demo Isolation */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#22A06B]" />
          <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
            Data Isolation & Privacy
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isDemoMode
            ? 'You are currently exploring the isolated fictional Demo Account (Rahul Sharma). Changes persist only in your browser session storage and are never written to any real Firebase user account.'
            : 'Your profile, skills, academic marks, projects, and interview logs are isolated to your authenticated Firebase user ID and protected by owner-scoped Firestore Security Rules.'}
        </p>

        {isDemoMode && (
          <div>
            <button
              type="button"
              onClick={() => setShowResetDemoConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#E35D6A] bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Workspace to Initial Sample State
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showResetDemoConfirm}
        title="Reset Fictional Demo Workspace"
        message="Restore Rahul Sharma's sample profile, skills, projects, and action tasks back to their initial demonstration values?"
        confirmLabel="Reset Demo Data"
        onCancel={() => setShowResetDemoConfirm(false)}
        onConfirm={() => {
          resetDemoWorkspace();
          setShowResetDemoConfirm(false);
        }}
      />
    </div>
  );
}
