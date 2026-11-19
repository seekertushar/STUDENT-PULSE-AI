import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { DEFAULT_CAREER_PATHS } from './src/data/careers';
import {
  analyzeAcademics,
  analyzeSkillGaps,
  buildDeterministicRecommendations,
  buildDeterministicRoadmap,
  calculateCareerReadiness,
} from './src/utils/analyticsEngine';
import type {
  AcademicRecord,
  ActionPlanTask,
  ActivityItem,
  CareerPath,
  CertificationItem,
  DifficultyLevel,
  InterviewSession,
  LearningRoadmap,
  LearningStreak,
  ProjectItem,
  ReadinessWeights,
  SkillThresholds,
  StudentSkill,
} from './src/types/student';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const PYTHON_ANALYTICS_URL = (process.env.PYTHON_ANALYTICS_URL || '').trim().replace(/\/+$/, '');

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Simple in-memory rate limiter for expensive AI endpoints
const aiRateBuckets = new Map<string, { count: number; resetAt: number }>();
function aiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.ip || 'local';
  const now = Date.now();
  const bucket = aiRateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    aiRateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (bucket.count >= 30) {
    return res.status(429).json({
      error: 'Too many AI requests in a minute. Please pause briefly and try again.',
    });
  }
  bucket.count += 1;
  return next();
}

function findCareer(careerId: string, customCareers?: CareerPath[]): CareerPath {
  const catalog = customCareers && customCareers.length > 0 ? customCareers : DEFAULT_CAREER_PATHS;
  return catalog.find((c) => c.id === careerId) ?? DEFAULT_CAREER_PATHS[0];
}

function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. Health & Engine Status (honestly reports whether Python FastAPI microservice is configured)
  app.get('/api/health', async (_req, res) => {
    let pythonConnected = false;
    if (PYTHON_ANALYTICS_URL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1800);
        const pyRes = await fetch(`${PYTHON_ANALYTICS_URL}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        pythonConnected = pyRes.ok;
      } catch {
        pythonConnected = false;
      }
    }
    res.json({
      status: 'ok',
      aiConfigured: Boolean(getGenAIClient()),
      pythonAnalytics: {
        configured: Boolean(PYTHON_ANALYTICS_URL),
        connected: pythonConnected,
        activeEngine: pythonConnected ? 'python-fastapi-pandas-numpy' : 'node-deterministic-engine',
      },
    });
  });

  // 2. Analytics Evaluation Endpoint (Python adapter when configured, else identical Node engine)
  app.post('/api/analytics/evaluate', async (req, res) => {
    try {
      const body = req.body as {
        careerId: string;
        skills: StudentSkill[];
        academics: AcademicRecord[];
        projects: ProjectItem[];
        certifications: CertificationItem[];
        activities: ActivityItem[];
        interviews: InterviewSession[];
        actionTasks: ActionPlanTask[];
        roadmap: LearningRoadmap | null;
        streak: LearningStreak;
        weights?: ReadinessWeights;
        thresholds?: SkillThresholds;
        customCareers?: CareerPath[];
      };

      const career = findCareer(body.careerId || 'java-developer', body.customCareers);
      const readiness = calculateCareerReadiness({
        skills: body.skills ?? [],
        academics: body.academics ?? [],
        projects: body.projects ?? [],
        certifications: body.certifications ?? [],
        activities: body.activities ?? [],
        interviews: body.interviews ?? [],
        actionTasks: body.actionTasks ?? [],
        roadmap: body.roadmap ?? null,
        streak: body.streak ?? { currentStreak: 0, longestStreak: 0, activeDates: [], totalCompletedTasks: 0 },
        career,
        weights: body.weights,
        thresholds: body.thresholds,
      });
      const academics = analyzeAcademics(body.academics ?? []);

      let engineUsed = 'node-deterministic-engine';
      if (PYTHON_ANALYTICS_URL) {
        try {
          const pyRes = await fetch(`${PYTHON_ANALYTICS_URL}/analyze/skill-gap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              skills: (body.skills ?? []).map((s) => ({
                name: s.name,
                selfReportedScore: s.selfReportedScore,
                assessmentScore: s.assessmentScore,
              })),
              requirements: career.requiredSkills,
            }),
          });
          if (pyRes.ok) {
            engineUsed = 'python-fastapi-pandas-numpy';
          }
        } catch {
          engineUsed = 'node-deterministic-engine';
        }
      }

      res.json({
        engineUsed,
        readiness,
        academics,
      });
    } catch (error) {
      console.error('Analytics evaluation error:', error);
      res.status(400).json({ error: 'Invalid analytics payload.' });
    }
  });

  // 3. Personalized AI Recommendations (gemini-4-hydrogen with optional High Thinking + structured JSON + fallback)
  app.post('/api/ai/recommendations', aiRateLimit, async (req, res) => {
    const body = req.body as {
      userId: string;
      studentName: string;
      course: string;
      semester: number;
      careerId: string;
      customCareers?: CareerPath[];
      skills: StudentSkill[];
      academics: AcademicRecord[];
      projects: ProjectItem[];
      certifications: CertificationItem[];
      activities: ActivityItem[];
      interviews: InterviewSession[];
      actionTasks: ActionPlanTask[];
      roadmap: LearningRoadmap | null;
      streak: LearningStreak;
      deepThinking?: boolean;
    };

    const career = findCareer(body.careerId || 'java-developer', body.customCareers);
    const readiness = calculateCareerReadiness({
      skills: body.skills ?? [],
      academics: body.academics ?? [],
      projects: body.projects ?? [],
      certifications: body.certifications ?? [],
      activities: body.activities ?? [],
      interviews: body.interviews ?? [],
      actionTasks: body.actionTasks ?? [],
      roadmap: body.roadmap ?? null,
      streak: body.streak ?? { currentStreak: 0, longestStreak: 0, activeDates: [], totalCompletedTasks: 0 },
      career,
    });
    const academicStats = analyzeAcademics(body.academics ?? []);

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        source: 'deterministic-fallback',
        notice: 'Gemini API is not currently configured; showing deterministic rule-based recommendations derived from your actual gaps.',
        recommendations: buildDeterministicRecommendations(body.userId || 'student', career, readiness),
      });
    }

    try {
      const prompt = `You are a senior career readiness advisor for StudentPulse AI.
Generate 5 to 6 highly actionable, personalized recommendations strictly grounded in the student's ACTUAL data below.
NEVER fabricate marks, projects, certifications, or skill scores that are not in the data.

Student: ${body.studentName || 'Student'} (${body.course || 'CS'}, Semester ${body.semester || 1})
Target Career: ${career.title}
Indicative Readiness Score: ${readiness.overallScore}% (Data coverage: ${readiness.dataCoveragePercent}%)
Skill Gaps: ${JSON.stringify(
        readiness.skillGaps.map((g) => ({
          skill: g.skillName,
          current: g.currentScore,
          required: g.requiredScore,
          gap: g.gap,
          status: g.status,
          priority: g.priority,
        }))
      )}
Academic Average: ${academicStats.averagePercentage !== null ? `${academicStats.averagePercentage}% (CGPA ${academicStats.cgpa})` : 'No records yet'}
Projects (${(body.projects ?? []).length}): ${(body.projects ?? []).map((p) => `${p.name} [${p.status}]`).join(', ') || 'None'}
Certifications (${(body.certifications ?? []).length}): ${(body.certifications ?? []).map((c) => c.name).join(', ') || 'None'}
Recent Mock Interviews: ${(body.interviews ?? []).map((i) => `${i.topic}: ${i.overallScore}/100`).join(', ') || 'None'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: body.deepThinking ? ThinkingLevel.HIGH : ThinkingLevel.MEDIUM,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                explanation: { type: Type.STRING },
                relatedSkill: { type: Type.STRING },
                reason: { type: Type.STRING },
                priority: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                expectedOutcome: { type: Type.STRING },
                suggestedNextAction: { type: Type.STRING },
              },
              required: [
                'title',
                'explanation',
                'relatedSkill',
                'reason',
                'priority',
                'difficulty',
                'estimatedTime',
                'expectedOutcome',
                'suggestedNextAction',
              ],
            },
          },
        },
      });

      const parsed = safeJsonParse<Array<Record<string, string>>>(response.text, []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Empty recommendation payload from Gemini');
      }

      const now = new Date().toISOString();
      const recommendations = parsed.slice(0, 7).map((item, idx) => {
        const prio = item.priority === 'High' || item.priority === 'Low' ? item.priority : 'Medium';
        const diff =
          item.difficulty === 'Beginner' || item.difficulty === 'Advanced'
            ? item.difficulty
            : 'Intermediate';
        return {
          id: `rec-ai-${Date.now()}-${idx}`,
          userId: body.userId || 'student',
          title: String(item.title || 'Skill Improvement Focus').slice(0, 190),
          explanation: String(item.explanation || '').slice(0, 1400),
          relatedSkill: String(item.relatedSkill || career.title).slice(0, 95),
          reason: String(item.reason || '').slice(0, 580),
          priority: prio,
          difficulty: diff,
          estimatedTime: String(item.estimatedTime || '4–6 hours / week').slice(0, 75),
          expectedOutcome: String(item.expectedOutcome || '').slice(0, 580),
          suggestedNextAction: String(item.suggestedNextAction || '').slice(0, 480),
          source: 'gemini-ai' as const,
          addedToActionPlan: false,
          createdAt: now,
        };
      });

      return res.json({ source: 'gemini-ai', recommendations });
    } catch (error) {
      console.error('Gemini recommendations failed, using deterministic fallback:', error);
      return res.json({
        source: 'deterministic-fallback',
        notice: 'Gemini AI was temporarily unavailable; generated deterministic rule-based recommendations from your verified profile data.',
        recommendations: buildDeterministicRecommendations(body.userId || 'student', career, readiness),
      });
    }
  });

  // 4. Low-Latency Quick Skill Coaching Tip (gemini-3.1-flash-lite)
  app.post('/api/ai/quick-tip', aiRateLimit, async (req, res) => {
    const { skillName, currentScore, requiredScore, careerTitle } = req.body as {
      skillName: string;
      currentScore: number | null;
      requiredScore: number;
      careerTitle: string;
    };
    if (!skillName || typeof skillName !== 'string') {
      return res.status(400).json({ error: 'skillName is required.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        source: 'deterministic-fallback',
        tip: `To raise ${skillName} toward ${requiredScore}% for ${careerTitle}, complete 3 targeted practice labs this week, document your solution patterns, and log a fresh assessment score.`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Give a crisp, practical 3-sentence coaching tip for a college student targeting ${careerTitle}. Skill: ${skillName}. Current score: ${currentScore ?? 'Not yet assessed'}/100. Target score: ${requiredScore}/100. Focus on concrete exercises and interview preparation.`,
      });
      return res.json({
        source: 'gemini-ai',
        model: 'gemini-3.1-flash-lite',
        tip: (response.text || '').trim(),
      });
    } catch (error) {
      console.error('Quick tip error:', error);
      return res.json({
        source: 'deterministic-fallback',
        tip: `Focus on core ${skillName} patterns relevant to ${careerTitle} by building a small timed exercise and reviewing edge cases until you reach ${requiredScore}%.`,
      });
    }
  });

  // 5. Google Search Grounded Live Career Market Insights (gemini-4-hydrogen + googleSearch)
  app.post('/api/ai/market-insights', aiRateLimit, async (req, res) => {
    const { careerTitle, topGaps } = req.body as { careerTitle: string; topGaps: string[] };
    const role = (careerTitle || 'Software Engineer').slice(0, 100);
    const gaps = Array.isArray(topGaps) ? topGaps.slice(0, 5) : [];

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        careerTitle: role,
        summary: `Entry-level ${role} hiring continues to emphasize strong core computer science fundamentals, practical project repositories with automated tests, SQL/data modeling fluency, and structured problem-solving communication.`,
        trendingSkills: gaps.length > 0 ? gaps : ['System Fundamentals', 'SQL', 'Testing', 'Cloud Deployment'],
        sources: [],
        source: 'deterministic-fallback',
        generatedAt: new Date().toISOString(),
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Provide a concise, grounded 2026 entry-level job market briefing for college graduates targeting "${role}" roles. Highlight current hiring expectations, top 4 technical skills employers test in campus/junior interviews (especially relating to: ${gaps.join(', ') || 'core fundamentals'}), and one practical portfolio tip. Keep it under 180 words and factual.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c) => {
          const web = (c as { web?: { uri?: string; title?: string } }).web;
          if (!web?.uri) return null;
          return { title: web.title || web.uri, uri: web.uri };
        })
        .filter((item): item is { title: string; uri: string } => item !== null)
        .slice(0, 5);

      return res.json({
        careerTitle: role,
        summary: (response.text || '').trim(),
        trendingSkills: gaps.length > 0 ? gaps : ['Core Language', 'SQL', 'DSA', 'Testing'],
        sources,
        source: 'gemini-search',
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Market insights search error:', error);
      return res.json({
        careerTitle: role,
        summary: `Live search was temporarily unavailable. For ${role} campus placements, prioritize measurable depth in ${gaps.join(', ') || 'core technical skills'}, clean GitHub repositories, and mock technical interviews.`,
        trendingSkills: gaps.length > 0 ? gaps : ['Core Skills', 'SQL', 'DSA'],
        sources: [],
        source: 'deterministic-fallback',
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // 6. Personalized 30/60/90-Day AI Learning Roadmap
  app.post('/api/ai/roadmap', aiRateLimit, async (req, res) => {
    const body = req.body as {
      userId: string;
      careerId: string;
      customCareers?: CareerPath[];
      skills: StudentSkill[];
      durationDays: 30 | 60 | 90;
    };
    const duration: 30 | 60 | 90 = body.durationDays === 60 || body.durationDays === 90 ? body.durationDays : 30;
    const career = findCareer(body.careerId || 'java-developer', body.customCareers);
    const { gaps } = analyzeSkillGaps(body.skills ?? [], career);
    const readiness = calculateCareerReadiness({
      skills: body.skills ?? [],
      academics: [],
      projects: [],
      certifications: [],
      activities: [],
      interviews: [],
      actionTasks: [],
      roadmap: null,
      streak: { currentStreak: 0, longestStreak: 0, activeDates: [], totalCompletedTasks: 0 },
      career,
    });

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        source: 'deterministic-fallback',
        roadmap: buildDeterministicRoadmap(body.userId || 'student', career, readiness, duration),
      });
    }

    try {
      const taskCount = duration === 30 ? 8 : duration === 60 ? 10 : 12;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Design a structured ${duration}-day learning roadmap with exactly ${taskCount} sequential milestones for a college student targeting "${career.title}".
Prioritize their actual skill gaps first: ${JSON.stringify(
          gaps.map((g) => ({ skill: g.skillName, current: g.currentScore, required: g.requiredScore, priority: g.priority }))
        )}.
Each milestone must specify weekLabel (e.g., "Week 1"), dayRange (e.g., "Days 1–4"), topic, skill, description, difficulty ("Beginner" | "Intermediate" | "Advanced"), estimatedDuration (e.g., "5 hours"), and expectedOutcome.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekLabel: { type: Type.STRING },
                dayRange: { type: Type.STRING },
                topic: { type: Type.STRING },
                skill: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                estimatedDuration: { type: Type.STRING },
                expectedOutcome: { type: Type.STRING },
              },
              required: [
                'weekLabel',
                'dayRange',
                'topic',
                'skill',
                'description',
                'difficulty',
                'estimatedDuration',
                'expectedOutcome',
              ],
            },
          },
        },
      });

      const parsed = safeJsonParse<Array<Record<string, string>>>(response.text, []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Empty roadmap response');
      }

      const now = new Date().toISOString();
      const roadmap: LearningRoadmap = {
        id: `roadmap-ai-${duration}-${Date.now()}`,
        userId: body.userId || 'student',
        careerId: career.id,
        careerTitle: career.title,
        durationDays: duration,
        status: 'Active',
        source: 'gemini-ai',
        createdAt: now,
        updatedAt: now,
        tasks: parsed.slice(0, 16).map((item, idx) => ({
          id: `rm-ai-${Date.now()}-${idx}`,
          weekLabel: String(item.weekLabel || `Week ${idx + 1}`).slice(0, 30),
          dayRange: String(item.dayRange || `Days ${idx * 3 + 1}–${idx * 3 + 3}`).slice(0, 30),
          topic: String(item.topic || 'Milestone').slice(0, 140),
          skill: String(item.skill || career.title).slice(0, 80),
          description: String(item.description || '').slice(0, 500),
          difficulty:
            item.difficulty === 'Beginner' || item.difficulty === 'Advanced'
              ? item.difficulty
              : 'Intermediate',
          estimatedDuration: String(item.estimatedDuration || '5 hours').slice(0, 40),
          expectedOutcome: String(item.expectedOutcome || '').slice(0, 300),
          completed: false,
        })),
      };

      return res.json({ source: 'gemini-ai', roadmap });
    } catch (error) {
      console.error('Gemini roadmap error, returning deterministic fallback:', error);
      return res.json({
        source: 'deterministic-fallback',
        roadmap: buildDeterministicRoadmap(body.userId || 'student', career, readiness, duration),
      });
    }
  });

  // 7. AI Mock Interview Question Generation
  app.post('/api/ai/interview/questions', aiRateLimit, async (req, res) => {
    const { role, topic, difficulty, count } = req.body as {
      role: string;
      topic: string;
      difficulty: DifficultyLevel;
      count: number;
    };
    const safeRole = (role || 'Java Developer').slice(0, 80);
    const safeTopic = (topic || 'Core Concepts').slice(0, 80);
    const safeDiff: DifficultyLevel =
      difficulty === 'Beginner' || difficulty === 'Advanced' ? difficulty : 'Intermediate';
    const safeCount = Math.max(1, Math.min(5, Number(count) || 3));

    const fallbackQuestions = buildFallbackInterviewQuestions(safeRole, safeTopic, safeDiff, safeCount);
    const ai = getGenAIClient();
    if (!ai) {
      return res.json({ source: 'deterministic-fallback', questions: fallbackQuestions });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate exactly ${safeCount} realistic text-based technical interview questions for a college student preparing for a "${safeRole}" role.
Topic focus: "${safeTopic}". Difficulty: "${safeDiff}".
Questions should be clear, answerable in 3–8 sentences of written explanation or pseudocode, and test conceptual depth plus real problem-solving.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                topic: { type: Type.STRING },
              },
              required: ['question', 'topic'],
            },
          },
        },
      });
      const parsed = safeJsonParse<Array<{ question: string; topic: string }>>(response.text, []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return res.json({ source: 'deterministic-fallback', questions: fallbackQuestions });
      }
      return res.json({
        source: 'gemini-ai',
        questions: parsed.slice(0, safeCount).map((q) => ({
          question: String(q.question || '').slice(0, 800),
          topic: String(q.topic || safeTopic).slice(0, 80),
        })),
      });
    } catch (error) {
      console.error('Interview questions error:', error);
      return res.json({ source: 'deterministic-fallback', questions: fallbackQuestions });
    }
  });

  // 8. AI Mock Interview Answer Evaluation
  app.post('/api/ai/interview/evaluate', aiRateLimit, async (req, res) => {
    const { role, topic, difficulty, question, userAnswer } = req.body as {
      role: string;
      topic: string;
      difficulty: DifficultyLevel;
      question: string;
      userAnswer: string;
    };

    if (!question || !userAnswer || userAnswer.trim().length < 5) {
      return res.status(400).json({ error: 'Please enter a substantive answer before submitting.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        source: 'deterministic-fallback',
        evaluation: buildFallbackEvaluation(question, topic || role, userAnswer),
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Evaluate this student's practice mock interview response strictly and constructively.
Role: ${role} | Topic: ${topic} | Difficulty: ${difficulty}
Question: ${question}
Student Answer: ${userAnswer}

Score each dimension from 0 to 100: technicalCorrectness, conceptualUnderstanding, clarity, completeness, problemSolving.
Compute overall score (0–100). Provide concise arrays for strengths, weaknesses, improvements, plus exampleAnswer and conceptExplanation.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              technicalCorrectness: { type: Type.NUMBER },
              conceptualUnderstanding: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              completeness: { type: Type.NUMBER },
              problemSolving: { type: Type.NUMBER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              exampleAnswer: { type: Type.STRING },
              conceptExplanation: { type: Type.STRING },
            },
            required: [
              'score',
              'technicalCorrectness',
              'conceptualUnderstanding',
              'clarity',
              'completeness',
              'problemSolving',
              'strengths',
              'weaknesses',
              'improvements',
              'exampleAnswer',
              'conceptExplanation',
            ],
          },
        },
      });

      const parsed = safeJsonParse<Record<string, unknown>>(response.text, {});
      if (typeof parsed.score !== 'number') {
        throw new Error('Malformed interview evaluation JSON');
      }

      const clampNum = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
      return res.json({
        source: 'gemini-ai',
        evaluation: {
          question,
          topic: topic || role,
          userAnswer,
          score: clampNum(parsed.score),
          rubric: {
            technicalCorrectness: clampNum(parsed.technicalCorrectness),
            conceptualUnderstanding: clampNum(parsed.conceptualUnderstanding),
            clarity: clampNum(parsed.clarity),
            completeness: clampNum(parsed.completeness),
            problemSolving: clampNum(parsed.problemSolving),
          },
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 4) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String).slice(0, 4) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String).slice(0, 4) : [],
          exampleAnswer: String(parsed.exampleAnswer || '').slice(0, 2500),
          conceptExplanation: String(parsed.conceptExplanation || '').slice(0, 2500),
        },
      });
    } catch (error) {
      console.error('Interview evaluation error:', error);
      return res.json({
        source: 'deterministic-fallback',
        evaluation: buildFallbackEvaluation(question, topic || role, userAnswer),
      });
    }
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudentPulse AI server listening on http://localhost:${PORT}`);
  });
}

function buildFallbackInterviewQuestions(
  role: string,
  topic: string,
  difficulty: DifficultyLevel,
  count: number
) {
  const bank: Record<string, string[]> = {
    'Core Java': [
      'Explain the difference between == and .equals() in Java, and why overriding hashCode() is mandatory whenever you override equals().',
      'How does the Java Memory Model separate Heap and Stack memory, and what triggers a StackOverflowError versus an OutOfMemoryError?',
      'Compare Checked and Unchecked exceptions in Java with practical examples of when to use each.',
      'What are the key differences between an Abstract Class and an Interface in modern Java (Java 8+)?',
      'Explain how String immutability works in Java and why StringBuilder is preferred inside loops.',
    ],
    OOP: [
      'Explain the four pillars of Object-Oriented Programming with a concrete software design example.',
      'Compare compile-time polymorphism (method overloading) with runtime polymorphism (method overriding).',
      'What is the Dependency Inversion Principle (SOLID) and how does it improve unit testability?',
      'When should you prefer composition over inheritance in an enterprise backend application?',
      'How do access modifiers enforce encapsulation across packages in Java or Python?',
    ],
    SQL: [
      'Compare INNER JOIN, LEFT JOIN, and FULL OUTER JOIN, and explain how WHERE vs ON filters affect LEFT JOIN results.',
      'What is database normalization (1NF, 2NF, 3NF), and when might a backend engineer intentionally denormalize a table?',
      'Explain how a B-Tree index accelerates SELECT queries and what trade-offs it introduces on INSERT and UPDATE operations.',
      'Explain the difference between WHERE and HAVING clauses with a GROUP BY query example.',
      'Describe the ACID properties of relational database transactions and why isolation levels matter.',
    ],
    DSA: [
      'How would you detect a cycle in a singly linked list in O(n) time and O(1) extra space? Walk through edge cases.',
      'Compare HashMap lookup complexity in average vs worst case, and explain how collisions are resolved.',
      'Explain when you would choose Breadth-First Search (BFS) over Depth-First Search (DFS) on a graph.',
      'How does Binary Search achieve O(log n) time, and what invariant must hold before applying it?',
      'Explain the sliding window technique and give an example problem where it reduces O(n^2) to O(n).',
    ],
    Python: [
      'Compare Python lists, tuples, sets, and dictionaries in terms of mutability and lookup complexity.',
      'Explain Python generators and the yield keyword, and why they help when processing large datasets.',
      'How do *args and **kwargs work in Python functions, and when are decorators useful?',
      'Explain shallow copy versus deep copy in Python with a nested list example.',
      'How does Pandas vectorization outperform standard Python loops on tabular datasets?',
    ],
    Statistics: [
      'Explain the difference between mean, median, and mode, and when median is more reliable than mean.',
      'What is a p-value in hypothesis testing, and what is a common misconception about interpreting it?',
      'Explain the difference between correlation and causation with a business analytics scenario.',
      'Compare Type I (false positive) and Type II (false negative) errors in an A/B testing experiment.',
      'What does standard deviation measure, and how do you detect outliers using the IQR method?',
    ],
  };

  const selected =
    bank[topic] ??
    [
      `Explain a core architectural principle of ${topic} that every ${difficulty} ${role} candidate should master.`,
      `Describe a realistic bug or performance bottleneck in ${topic} and walk through how you would diagnose and fix it.`,
      `Compare two common approaches or tools used in ${topic} for ${role} systems, highlighting trade-offs.`,
      `Walk through how you applied (or would apply) ${topic} inside a production-style campus project.`,
      `What edge cases and testing strategies are most important when implementing ${topic} features for ${role}?`,
    ];

  return selected.slice(0, count).map((q) => ({ question: q, topic }));
}

function buildFallbackEvaluation(question: string, topic: string, userAnswer: string) {
  const words = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  const hasComplexityOrExample = /o\(|example|for instance|trade-off|because|edge case|null|index|complexity/i.test(
    userAnswer
  );
  const lengthScore = Math.min(45, Math.round((words / 45) * 45));
  const structureBonus = hasComplexityOrExample ? 22 : 8;
  const clarityBonus = words >= 20 ? 15 : 6;
  const score = Math.max(30, Math.min(88, lengthScore + structureBonus + clarityBonus));

  return {
    question,
    topic,
    userAnswer,
    score,
    rubric: {
      technicalCorrectness: Math.min(92, score + 3),
      conceptualUnderstanding: score,
      clarity: Math.min(92, score + 4),
      completeness: Math.max(25, score - 6),
      problemSolving: Math.max(25, score - 2),
    },
    strengths: [
      words >= 25
        ? 'Provided a clear multi-sentence explanation rather than a single-phrase answer.'
        : 'Addressed the core prompt directly.',
      ...(hasComplexityOrExample ? ['Included supporting reasoning, trade-offs, or concrete examples.'] : []),
    ],
    weaknesses: [
      'Evaluated using the offline deterministic rubric because live Gemini AI feedback was unavailable.',
      ...(words < 30 ? ['Answer is brief — expand with edge cases, complexity, or concrete usage.'] : []),
    ],
    improvements: [
      'Structure technical answers as: (1) crisp definition, (2) internal mechanism, (3) complexity or trade-off, and (4) project example.',
      `Review official ${topic} reference documentation for edge-case precision.`,
    ],
    exampleAnswer: `A strong ${topic} response clearly defines the core mechanism behind the prompt, contrasts alternatives or failure modes, states time/space or operational trade-offs, and cites a concrete scenario from a software project.`,
    conceptExplanation: `Interviewers evaluate ${topic} answers for accuracy, structural clarity, and awareness of real-world constraints such as null inputs, concurrency, or scaling limits.`,
  };
}

createApp();
