import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  MessageSquareCode,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import type {
  DifficultyLevel,
  InterviewQuestionEval,
  InterviewSession,
} from '../../types/student';

interface GeneratedQuestion {
  question: string;
  topic: string;
}

export function InterviewPage() {
  const { data, primaryCareer, saveInterviewSession, pushToast } = useStudentData();

  const [selectedCareerId, setSelectedCareerId] = useState(primaryCareer.id);
  const selectedCareer = useMemo(
    () => data.customCareers.find((c) => c.id === selectedCareerId) ?? primaryCareer,
    [data.customCareers, selectedCareerId, primaryCareer]
  );

  const [selectedTopic, setSelectedTopic] = useState(
    selectedCareer.interviewTopics[0] ?? 'Core Concepts'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [questionCount, setQuestionCount] = useState(3);

  // Active session state
  const [stage, setStage] = useState<'setup' | 'active' | 'summary'>('setup');
  const [starting, setStarting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [currentEval, setCurrentEval] = useState<InterviewQuestionEval | null>(null);
  const [evaluations, setEvaluations] = useState<InterviewQuestionEval[]>([]);
  const [sessionSource, setSessionSource] = useState<'gemini-ai' | 'deterministic-fallback'>(
    'gemini-ai'
  );
  const [savedSummary, setSavedSummary] = useState<InterviewSession | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  function handleCareerChange(newCareerId: string) {
    setSelectedCareerId(newCareerId);
    const found = data.customCareers.find((c) => c.id === newCareerId);
    if (found && found.interviewTopics.length > 0) {
      setSelectedTopic(found.interviewTopics[0]);
    }
  }

  async function handleStartInterview() {
    setStarting(true);
    try {
      const res = await fetch('/api/ai/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedCareer.title,
          topic: selectedTopic,
          difficulty,
          count: questionCount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !Array.isArray(json.questions) || json.questions.length === 0) {
        throw new Error(json.error || 'Could not load interview questions.');
      }
      setQuestions(json.questions);
      setSessionSource(json.source === 'gemini-ai' ? 'gemini-ai' : 'deterministic-fallback');
      setCurrentIdx(0);
      setAnswerText('');
      setCurrentEval(null);
      setEvaluations([]);
      setSavedSummary(null);
      setStage('active');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to start interview.');
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (answerText.trim().length < 5) {
      pushToast('error', 'Please write a complete technical answer before submitting.');
      return;
    }
    const q = questions[currentIdx];
    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedCareer.title,
          topic: q.topic || selectedTopic,
          difficulty,
          question: q.question,
          userAnswer: answerText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.evaluation) {
        throw new Error(json.error || 'Evaluation failed.');
      }
      if (json.source === 'deterministic-fallback') {
        setSessionSource('deterministic-fallback');
      }
      const ev = json.evaluation as InterviewQuestionEval;
      setCurrentEval(ev);
      setEvaluations((prev) => [...prev, ev]);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Could not evaluate response.');
    } finally {
      setEvaluating(false);
    }
  }

  async function handleNextOrFinish() {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((idx) => idx + 1);
      setAnswerText('');
      setCurrentEval(null);
      return;
    }

    const overallScore =
      evaluations.length > 0
        ? Math.round(evaluations.reduce((s, item) => s + item.score, 0) / evaluations.length)
        : 0;
    const strongTopics = Array.from(
      new Set(evaluations.filter((e) => e.score >= 70).map((e) => e.topic))
    );
    const weakTopics = Array.from(
      new Set(evaluations.filter((e) => e.score < 70).map((e) => e.topic))
    );
    const suggestedNextActivities =
      weakTopics.length > 0
        ? weakTopics.map(
            (wt) => `Review core fundamentals and write 3 structured practice answers on ${wt}.`
          )
        : [`Attempt an Advanced-level ${selectedCareer.title} interview on another core topic.`];

    const session: InterviewSession = {
      id: `int_${Date.now()}`,
      userId: data.profile.userId,
      role: selectedCareer.title,
      topic: selectedTopic,
      difficulty,
      overallScore,
      questionsCount: evaluations.length,
      strongTopics,
      weakTopics,
      suggestedNextActivities,
      evaluations,
      source: sessionSource,
      completedAt: new Date().toISOString().slice(0, 10),
    };
    await saveInterviewSession(session);
    setSavedSummary(session);
    setStage('summary');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            AI Mock Interview Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Text-based technical interview practice with 5-dimension rubric scoring, model answers,
            and concept explanations
          </p>
        </div>
        {stage !== 'setup' && (
          <button
            type="button"
            onClick={() => {
              setStage('setup');
              setCurrentEval(null);
              setAnswerText('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#3267D5] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Practice Setup
          </button>
        )}
      </div>

      {/* Explicit Practice Disclaimer */}
      <div className="bg-[#EAF1FF] dark:bg-[#162647] border border-[#3267D5]/30 rounded-xl p-4 flex items-start gap-3 text-xs text-[#142B53] dark:text-slate-100">
        <Info className="w-4 h-4 text-[#3267D5] dark:text-[#26C6DA] shrink-0 mt-0.5" />
        <p>
          <strong>Practice feedback — not a formal interview assessment.</strong> Written responses
          are scored across Technical Correctness, Conceptual Understanding, Clarity, Completeness,
          and Problem Solving to help sharpen your explanations before real interviews.
        </p>
      </div>

      {/* SETUP VIEW */}
      {stage === 'setup' && (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <MessageSquareCode className="w-5 h-5 text-[#3267D5]" />
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Configure Text-Based Practice Session
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Target Career Role
              </label>
              <select
                value={selectedCareerId}
                onChange={(e) => handleCareerChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              >
                {data.customCareers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Interview Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              >
                {selectedCareer.interviewTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Question' : 'Questions'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Questions are presented one at a time with instant written feedback after each answer.
            </p>
            <button
              type="button"
              disabled={starting}
              onClick={handleStartInterview}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {starting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {starting ? 'Preparing Questions…' : 'Start Practice Interview'}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE QUESTION VIEW */}
      {stage === 'active' && questions[currentIdx] && (
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong className="text-[#142B53] dark:text-white">
                Question {currentIdx + 1} of {questions.length}
              </strong>{' '}
              · {selectedCareer.title} · {questions[currentIdx].topic} · {difficulty}
            </span>
            <span>
              {sessionSource === 'gemini-ai'
                ? 'Gemini AI Evaluator'
                : 'Rule-Based Rubric Fallback'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200/70 dark:border-slate-800">
            <p className="font-display text-base font-semibold text-[#142B53] dark:text-white leading-relaxed">
              {questions[currentIdx].question}
            </p>
          </div>

          {!currentEval ? (
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Your Written Answer
                </label>
                <textarea
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write a clear explanation covering core concepts, trade-offs, complexity, or a short code/SQL example..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:border-[#3267D5]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60"
                >
                  {evaluating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {evaluating ? 'Evaluating Answer…' : 'Submit Answer for Feedback'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Score & 5-Dimension Rubric */}
              <div className="grid sm:grid-cols-6 gap-3">
                <div className="sm:col-span-1 p-3.5 rounded-lg bg-[#EAF1FF] dark:bg-[#162647] flex flex-col items-center justify-center">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Score
                  </span>
                  <span className="text-2xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA]">
                    {currentEval.score}
                  </span>
                  <span className="text-[11px] text-slate-500">/ 100</span>
                </div>

                {[
                  ['Technical', currentEval.rubric.technicalCorrectness],
                  ['Conceptual', currentEval.rubric.conceptualUnderstanding],
                  ['Clarity', currentEval.rubric.clarity],
                  ['Completeness', currentEval.rubric.completeness],
                  ['Problem Solving', currentEval.rubric.problemSolving],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] flex flex-col justify-between"
                  >
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="text-lg font-mono font-bold tabular-nums text-[#142B53] dark:text-white">
                      {val}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <p className="font-semibold text-[#22A06B]">Strengths</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-200">
                    {currentEval.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                  <p className="font-semibold text-[#E35D6A]">Gaps & Weaknesses</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-200">
                    {currentEval.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <p className="font-semibold text-[#3267D5] dark:text-[#26C6DA]">
                    Improvement Suggestions
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-200">
                    {currentEval.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1.5">
                  <p className="font-semibold text-[#142B53] dark:text-white">
                    Reference Example Answer
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentEval.exampleAnswer}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1.5">
                  <p className="font-semibold text-[#142B53] dark:text-white">
                    Concept Explanation
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentEval.conceptExplanation}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNextOrFinish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg"
                >
                  {currentIdx + 1 < questions.length ? (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Finish & Save Session Summary
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SESSION SUMMARY VIEW */}
      {stage === 'summary' && savedSummary && (
        <div className="bg-white dark:bg-[#111C33] border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#22A06B]">Session Saved to Your History</p>
              <h2 className="font-display text-lg font-bold text-[#142B53] dark:text-white">
                {savedSummary.role} — {savedSummary.topic} ({savedSummary.difficulty})
              </h2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA]">
                {savedSummary.overallScore}/100
              </span>
              <p className="text-xs text-slate-500">Overall Practice Score</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1">
              <p className="font-semibold text-[#142B53] dark:text-white">Strong Topics</p>
              <p className="text-slate-600 dark:text-slate-300">
                {savedSummary.strongTopics.length > 0
                  ? savedSummary.strongTopics.join(', ')
                  : 'Keep practicing to cross the 70/100 mark consistently.'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-1">
              <p className="font-semibold text-[#142B53] dark:text-white">
                Suggested Next Activities
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                {savedSummary.suggestedNextActivities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PAST INTERVIEW HISTORY */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Saved Interview History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.interviews.length} completed practice session(s)
            </p>
          </div>
        </div>

        {data.interviews.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No mock interviews completed yet. Configure a session above to earn your first practice
            score.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.interviews.map((session) => {
              const expanded = expandedHistoryId === session.id;
              return (
                <div key={session.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-[#142B53] dark:text-white">
                        {session.role} · {session.topic}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {session.difficulty} · {session.questionsCount} question(s) ·{' '}
                        {session.completedAt} ·{' '}
                        {session.source === 'gemini-ai' ? 'Gemini AI' : 'Rule-Based Rubric'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono tabular-nums font-bold text-base text-[#3267D5] dark:text-[#26C6DA]">
                        {session.overallScore}/100
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryId(expanded ? null : session.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#3267D5]"
                      >
                        {expanded ? (
                          <>
                            Hide Review <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Review Q&A <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {session.evaluations.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-[#142B53] dark:text-white">
                              Q{idx + 1}: {ev.question}
                            </p>
                            <span className="font-mono font-bold text-[#3267D5] shrink-0">
                              {ev.score}/100
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            <strong>Your Answer: </strong>
                            {ev.userAnswer}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            <strong>Model Answer: </strong>
                            {ev.exampleAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
