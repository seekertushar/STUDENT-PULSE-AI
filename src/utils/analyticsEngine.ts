import { ACHIEVEMENT_CATALOG, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from '../data/careers';
import type {
  AcademicAnalytics,
  AcademicRecord,
  ActionPlanTask,
  ActivityItem,
  CareerComparisonResult,
  CareerPath,
  CertificationItem,
  InterviewSession,
  LearningRoadmap,
  LearningStreak,
  PriorityLevel,
  ProficiencyLevel,
  ProjectItem,
  ReadinessComponentScore,
  ReadinessResult,
  ReadinessWeights,
  RecommendationItem,
  SkillGapItem,
  SkillStatus,
  SkillThresholds,
  StudentAchievementStatus,
  StudentProfile,
  StudentSkill,
} from '../types/student';

export const SELF_REPORTED_LEVEL_SCORES: Record<ProficiencyLevel, number> = {
  Beginner: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 90,
};

export const READINESS_DISCLAIMER =
  'Indicative platform metric calculated from your tracked skills, projects, academics, mock interviews, and consistency — not a scientifically validated probability of placement or employment.';

export function normalizeSkillName(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const aliases: Record<string, string> = {
    java: 'core java',
    'core java': 'core java',
    oop: 'object oriented programming',
    oops: 'object oriented programming',
    'object oriented programming': 'object oriented programming',
    dsa: 'data structures algorithms',
    'data structures and algorithms': 'data structures algorithms',
    'data structures algorithms': 'data structures algorithms',
    'git and github': 'git github',
    'git github': 'git github',
    git: 'git github',
    js: 'javascript typescript',
    javascript: 'javascript typescript',
    typescript: 'javascript typescript',
    react: 'react js',
    'react js': 'react js',
    reactjs: 'react js',
    node: 'node js express',
    'node js': 'node js express',
    express: 'node js express',
    'spring': 'spring boot',
    'spring boot': 'spring boot',
    mysql: 'sql',
    postgresql: 'sql',
    sql: 'sql',
    'powerbi': 'power bi',
    'power bi': 'power bi',
    ml: 'machine learning',
    'machine learning': 'machine learning',
  };
  return aliases[cleaned] ?? cleaned;
}

export function getEffectiveSkillScore(skill: StudentSkill | undefined): number | null {
  if (!skill) return null;
  if (typeof skill.assessmentScore === 'number' && !Number.isNaN(skill.assessmentScore)) {
    return clamp(Math.round(skill.assessmentScore), 0, 100);
  }
  if (typeof skill.selfReportedScore === 'number' && !Number.isNaN(skill.selfReportedScore)) {
    return clamp(Math.round(skill.selfReportedScore), 0, 100);
  }
  return null;
}

export function classifySkillStatus(
  score: number | null,
  thresholds: SkillThresholds = DEFAULT_THRESHOLDS
): SkillStatus {
  if (score === null || Number.isNaN(score)) return 'Not Assessed';
  if (score >= thresholds.goodMin) return 'Good';
  if (score >= thresholds.moderateMin) return 'Moderate';
  return 'Weak';
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computePriority(gap: number | null, importance: PriorityLevel): PriorityLevel {
  if (gap === null) {
    return importance === 'High' ? 'High' : 'Medium';
  }
  if (gap <= 0) return 'Low';
  const importanceBoost = importance === 'High' ? 15 : importance === 'Medium' ? 5 : 0;
  const severity = gap + importanceBoost;
  if (severity >= 35) return 'High';
  if (severity >= 18) return 'Medium';
  return 'Low';
}

function buildSuggestedApproach(skillName: string, gap: number | null, status: SkillGapItem['status']): string {
  if (status === 'Insufficient Evidence') {
    return `Add a self-assessment or record a quiz/project score for ${skillName} to establish a baseline.`;
  }
  if (status === 'Meets Target') {
    return `Maintain proficiency in ${skillName} through code reviews, mock interviews, and applied project work.`;
  }
  if ((gap ?? 0) >= 35) {
    return `Dedicate focused weekly study blocks to ${skillName} fundamentals, hands-on drills, and a mini-project.`;
  }
  if ((gap ?? 0) >= 15) {
    return `Bridge the remaining gap in ${skillName} with targeted exercises, documentation review, and timed practice.`;
  }
  return `Polish edge cases in ${skillName} with interview-style scenarios to exceed the target benchmark.`;
}

export function analyzeSkillGaps(
  studentSkills: StudentSkill[],
  career: CareerPath,
  thresholds: SkillThresholds = DEFAULT_THRESHOLDS
): {
  gaps: SkillGapItem[];
  technicalSkillMatchScore: number | null;
  assessedRequiredCount: number;
} {
  const skillMap = new Map<string, StudentSkill>();
  for (const s of studentSkills) {
    skillMap.set(normalizeSkillName(s.name), s);
  }

  let weightedAchieved = 0;
  let weightedRequired = 0;
  let assessedRequiredCount = 0;

  const gaps: SkillGapItem[] = career.requiredSkills.map((req) => {
    const matched = skillMap.get(normalizeSkillName(req.name));
    const currentScore = getEffectiveSkillScore(matched);

    if (currentScore === null) {
      return {
        skillName: req.name,
        category: req.category,
        currentScore: null,
        selfReportedScore: null,
        assessmentScore: null,
        requiredScore: req.requiredScore,
        gap: null,
        gapPercentage: null,
        importance: req.importance,
        priority: computePriority(null, req.importance),
        status: 'Insufficient Evidence',
        skillStatus: 'Not Assessed',
        suggestedApproach: buildSuggestedApproach(req.name, null, 'Insufficient Evidence'),
      };
    }

    assessedRequiredCount += 1;
    // Cap an individual skill's contribution at 100% of its required score while retaining actual score for display
    const cappedContribution = Math.min(currentScore, req.requiredScore);
    weightedAchieved += (cappedContribution / req.requiredScore) * 100 * req.weight;
    weightedRequired += req.weight;

    const rawGap = req.requiredScore - currentScore;
    const status: SkillGapItem['status'] = rawGap > 0 ? 'Improvement Needed' : 'Meets Target';
    const gapPercentage = rawGap > 0 ? Math.round((rawGap / req.requiredScore) * 100) : 0;

    return {
      skillName: req.name,
      category: req.category,
      currentScore,
      selfReportedScore: matched?.selfReportedScore ?? null,
      assessmentScore: matched?.assessmentScore ?? null,
      requiredScore: req.requiredScore,
      gap: rawGap,
      gapPercentage,
      importance: req.importance,
      priority: computePriority(rawGap, req.importance),
      status,
      skillStatus: classifySkillStatus(currentScore, thresholds),
      suggestedApproach: buildSuggestedApproach(req.name, rawGap, status),
    };
  });

  const technicalSkillMatchScore =
    weightedRequired > 0 ? Math.round(weightedAchieved / weightedRequired) : null;

  return {
    gaps,
    technicalSkillMatchScore,
    assessedRequiredCount,
  };
}

export function analyzeAcademics(records: AcademicRecord[]): AcademicAnalytics {
  // Filter strictly valid records (never assume missing marks are zero)
  const validRecords = records.filter(
    (r) =>
      typeof r.marksObtained === 'number' &&
      typeof r.maxMarks === 'number' &&
      r.maxMarks > 0 &&
      r.marksObtained >= 0
  );

  if (validRecords.length === 0) {
    return {
      cgpa: null,
      averagePercentage: null,
      totalRecords: 0,
      semesterTrend: [],
      subjectBreakdown: [],
      distribution: [
        { band: '90–100%', count: 0 },
        { band: '75–89%', count: 0 },
        { band: '60–74%', count: 0 },
        { band: '< 60%', count: 0 },
      ],
      strengths: [],
      improvementAreas: [],
    };
  }

  const subjectBreakdown = validRecords.map((r) => ({
    subject: r.subject,
    percentage: Math.round((r.marksObtained / r.maxMarks) * 1000) / 10,
    marksObtained: r.marksObtained,
    maxMarks: r.maxMarks,
    semester: r.semester,
  }));

  const avgPercent =
    Math.round(
      (subjectBreakdown.reduce((sum, item) => sum + item.percentage, 0) / subjectBreakdown.length) *
        10
    ) / 10;

  // Standard 10-point Indian university CGPA indicative mapping
  const cgpa = Math.round(Math.min(10, avgPercent / 9.5) * 100) / 100;

  const semMap = new Map<number, number[]>();
  for (const item of subjectBreakdown) {
    const existing = semMap.get(item.semester) ?? [];
    existing.push(item.percentage);
    semMap.set(item.semester, existing);
  }

  const semesterTrend = Array.from(semMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([sem, percents]) => {
      const semAvg = Math.round((percents.reduce((s, v) => s + v, 0) / percents.length) * 10) / 10;
      const sgpa = Math.round(Math.min(10, semAvg / 9.5) * 100) / 100;
      return {
        semester: `Sem ${sem}`,
        averagePercent: semAvg,
        sgpa,
        subjectsCount: percents.length,
      };
    });

  const distribution = [
    { band: '90–100%', count: subjectBreakdown.filter((s) => s.percentage >= 90).length },
    {
      band: '75–89%',
      count: subjectBreakdown.filter((s) => s.percentage >= 75 && s.percentage < 90).length,
    },
    {
      band: '60–74%',
      count: subjectBreakdown.filter((s) => s.percentage >= 60 && s.percentage < 75).length,
    },
    { band: '< 60%', count: subjectBreakdown.filter((s) => s.percentage < 60).length },
  ];

  const sorted = [...subjectBreakdown].sort((a, b) => b.percentage - a.percentage);
  const strengths = sorted.filter((s) => s.percentage >= 75).slice(0, 3);
  const improvementAreas = [...subjectBreakdown]
    .sort((a, b) => a.percentage - b.percentage)
    .filter((s) => s.percentage < 75)
    .slice(0, 3);

  return {
    cgpa,
    averagePercentage: avgPercent,
    totalRecords: validRecords.length,
    semesterTrend,
    subjectBreakdown,
    distribution,
    strengths,
    improvementAreas,
  };
}

export function calculateProjectScore(
  projects: ProjectItem[],
  certifications: CertificationItem[],
  activities: ActivityItem[],
  career: CareerPath
): { score: number | null; detail: string } {
  if (projects.length === 0 && certifications.length === 0 && activities.length === 0) {
    return { score: null, detail: 'No projects, certifications, or activities logged yet' };
  }

  const careerSkillKeys = new Set(career.requiredSkills.map((s) => normalizeSkillName(s.name)));
  let points = 0;
  let completedCount = 0;

  for (const p of projects) {
    const base = p.status === 'Completed' ? 28 : p.status === 'In Progress' ? 14 : 6;
    if (p.status === 'Completed') completedCount += 1;
    const matchedTech = p.technologies.some((t) => careerSkillKeys.has(normalizeSkillName(t)));
    const evidenceBonus = p.githubUrl || p.liveUrl ? 4 : 0;
    points += base + (matchedTech ? 6 : 0) + evidenceBonus;
  }

  points += Math.min(20, certifications.length * 8);
  points += Math.min(15, activities.length * 5);

  const normalized = clamp(Math.round(points), 0, 100);
  return {
    score: normalized,
    detail: `${completedCount} completed project(s), ${certifications.length} cert(s), ${activities.length} activity record(s)`,
  };
}

export function calculateInterviewScore(
  interviews: InterviewSession[]
): { score: number | null; detail: string } {
  if (interviews.length === 0) {
    return { score: null, detail: 'No mock interview sessions completed yet' };
  }
  const avg = Math.round(
    interviews.reduce((sum, item) => sum + item.overallScore, 0) / interviews.length
  );
  return {
    score: clamp(avg, 0, 100),
    detail: `Average across ${interviews.length} practice session(s)`,
  };
}

export function calculateLearningConsistencyScore(
  actionTasks: ActionPlanTask[],
  roadmap: LearningRoadmap | null,
  streak: LearningStreak
): { score: number | null; detail: string } {
  const totalTasks = actionTasks.length + (roadmap?.tasks.length ?? 0);
  if (totalTasks === 0 && streak.activeDates.length === 0) {
    return { score: null, detail: 'No learning tasks or activity streak recorded yet' };
  }

  const completedActionTasks = actionTasks.filter((t) => t.status === 'Completed').length;
  const completedRoadmapTasks = roadmap ? roadmap.tasks.filter((t) => t.completed).length : 0;
  const completionRate =
    totalTasks > 0 ? ((completedActionTasks + completedRoadmapTasks) / totalTasks) * 100 : 0;
  const streakBonus = Math.min(35, streak.currentStreak * 5);
  const score = clamp(Math.round(completionRate * 0.65 + streakBonus), 0, 100);

  return {
    score,
    detail: `${completedActionTasks + completedRoadmapTasks}/${totalTasks} tasks done · ${streak.currentStreak}-day streak`,
  };
}

export function calculateCareerReadiness(params: {
  skills: StudentSkill[];
  academics: AcademicRecord[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  activities: ActivityItem[];
  interviews: InterviewSession[];
  actionTasks: ActionPlanTask[];
  roadmap: LearningRoadmap | null;
  streak: LearningStreak;
  career: CareerPath;
  weights?: ReadinessWeights;
  thresholds?: SkillThresholds;
}): ReadinessResult {
  const weights = params.weights ?? DEFAULT_WEIGHTS;
  const thresholds = params.thresholds ?? DEFAULT_THRESHOLDS;

  const { gaps, technicalSkillMatchScore, assessedRequiredCount } = analyzeSkillGaps(
    params.skills,
    params.career,
    thresholds
  );
  const academicStats = analyzeAcademics(params.academics);
  const projectEval = calculateProjectScore(
    params.projects,
    params.certifications,
    params.activities,
    params.career
  );
  const interviewEval = calculateInterviewScore(params.interviews);
  const consistencyEval = calculateLearningConsistencyScore(
    params.actionTasks,
    params.roadmap,
    params.streak
  );

  const rawComponents: Omit<ReadinessComponentScore, 'effectiveWeight'>[] = [
    {
      key: 'technicalSkills',
      label: 'Technical Skill Match',
      baseWeight: weights.technicalSkills,
      score: technicalSkillMatchScore,
      hasData: technicalSkillMatchScore !== null,
      detail:
        technicalSkillMatchScore !== null
          ? `${assessedRequiredCount}/${params.career.requiredSkills.length} target skills assessed`
          : 'No required skills assessed yet',
    },
    {
      key: 'projectExperience',
      label: 'Project Experience',
      baseWeight: weights.projectExperience,
      score: projectEval.score,
      hasData: projectEval.score !== null,
      detail: projectEval.detail,
    },
    {
      key: 'academicPerformance',
      label: 'Academic Performance',
      baseWeight: weights.academicPerformance,
      score: academicStats.averagePercentage !== null ? Math.round(academicStats.averagePercentage) : null,
      hasData: academicStats.averagePercentage !== null,
      detail:
        academicStats.cgpa !== null
          ? `CGPA ${academicStats.cgpa.toFixed(2)} (${academicStats.averagePercentage}% avg)`
          : 'No academic marks logged yet',
    },
    {
      key: 'interviewPerformance',
      label: 'Interview Performance',
      baseWeight: weights.interviewPerformance,
      score: interviewEval.score,
      hasData: interviewEval.score !== null,
      detail: interviewEval.detail,
    },
    {
      key: 'learningConsistency',
      label: 'Learning Consistency',
      baseWeight: weights.learningConsistency,
      score: consistencyEval.score,
      hasData: consistencyEval.score !== null,
      detail: consistencyEval.detail,
    },
  ];

  const totalConfiguredWeight = rawComponents.reduce((sum, c) => sum + c.baseWeight, 0) || 100;
  const availableWeightSum = rawComponents
    .filter((c) => c.hasData)
    .reduce((sum, c) => sum + c.baseWeight, 0);

  // Never silently assign zero for missing components: renormalize available weights and report dataCoveragePercent
  const dataCoveragePercent = Math.round((availableWeightSum / totalConfiguredWeight) * 100);

  const components: ReadinessComponentScore[] = rawComponents.map((c) => ({
    ...c,
    effectiveWeight:
      c.hasData && availableWeightSum > 0
        ? Math.round((c.baseWeight / availableWeightSum) * 1000) / 10
        : 0,
  }));

  const overallScore =
    availableWeightSum > 0
      ? Math.round(
          components.reduce(
            (sum, c) => sum + (c.hasData && c.score !== null ? (c.score * c.baseWeight) / availableWeightSum : 0),
            0
          )
        )
      : 0;

  const assessedGaps = gaps.filter((g) => g.currentScore !== null);
  const strongestSkills = [...assessedGaps]
    .sort((a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0))
    .slice(0, 4);

  const weakestSkills = [...assessedGaps]
    .filter((g) => (g.gap ?? 0) > 0)
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
    .slice(0, 4);

  const gapsIdentifiedCount = gaps.filter(
    (g) => g.status === 'Improvement Needed' || g.status === 'Insufficient Evidence'
  ).length;

  const insufficientEvidenceCount = gaps.filter(
    (g) => g.status === 'Insufficient Evidence'
  ).length;

  return {
    overallScore,
    dataCoveragePercent,
    technicalSkillMatchScore,
    components,
    strongestSkills,
    weakestSkills,
    gapsIdentifiedCount,
    insufficientEvidenceCount,
    skillGaps: gaps,
    disclaimer: READINESS_DISCLAIMER,
  };
}

export function compareCareerPaths(params: {
  careerA: CareerPath;
  careerB: CareerPath;
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
}): CareerComparisonResult {
  const readinessA = calculateCareerReadiness({ ...params, career: params.careerA });
  const readinessB = calculateCareerReadiness({ ...params, career: params.careerB });

  const reqMapB = new Map(
    params.careerB.requiredSkills.map((s) => [normalizeSkillName(s.name), s])
  );
  const studentMap = new Map(
    params.skills.map((s) => [normalizeSkillName(s.name), s])
  );

  const sharedSkills: CareerComparisonResult['sharedSkills'] = [];
  for (const reqA of params.careerA.requiredSkills) {
    const key = normalizeSkillName(reqA.name);
    const reqB = reqMapB.get(key);
    if (reqB) {
      sharedSkills.push({
        name: reqA.name,
        studentScore: getEffectiveSkillScore(studentMap.get(key)),
        requiredA: reqA.requiredScore,
        requiredB: reqB.requiredScore,
      });
    }
  }

  const missingA = readinessA.skillGaps
    .filter((g) => g.status === 'Insufficient Evidence')
    .map((g) => g.skillName);
  const missingB = readinessB.skillGaps
    .filter((g) => g.status === 'Insufficient Evidence')
    .map((g) => g.skillName);

  const sharedKeys = new Set(sharedSkills.map((s) => normalizeSkillName(s.name)));
  const specificGapsA = readinessA.skillGaps.filter(
    (g) => !sharedKeys.has(normalizeSkillName(g.skillName)) && g.status !== 'Meets Target'
  );
  const specificGapsB = readinessB.skillGaps.filter(
    (g) => !sharedKeys.has(normalizeSkillName(g.skillName)) && g.status !== 'Meets Target'
  );

  const higherRole =
    readinessA.overallScore >= readinessB.overallScore ? params.careerA.title : params.careerB.title;
  const diff = Math.abs(readinessA.overallScore - readinessB.overallScore);

  const summaryExplanation =
    `Based on your current tracked evidence, your indicative readiness is ${readinessA.overallScore}% for ${params.careerA.title} and ${readinessB.overallScore}% for ${params.careerB.title}. ` +
    (diff > 0
      ? `You currently align ${diff} points closer to ${higherRole}. `
      : `Both roles show an equal indicative baseline today. `) +
    `${sharedSkills.length > 0 ? `Shared skills such as ${sharedSkills.map((s) => s.name).join(', ')} transfer directly across both tracks. ` : ''}` +
    `Neither comparison metric guarantees employment outcomes; use the gap breakdown to choose the technical domain you want to master.`;

  return {
    careerA: {
      career: params.careerA,
      readiness: readinessA,
      missingSkills: missingA,
      careerSpecificGaps: specificGapsA,
    },
    careerB: {
      career: params.careerB,
      readiness: readinessB,
      missingSkills: missingB,
      careerSpecificGaps: specificGapsB,
    },
    sharedSkills,
    summaryExplanation,
  };
}

export function computeLearningStreak(activeDates: string[], referenceDateIso?: string): {
  currentStreak: number;
  longestStreak: number;
} {
  const uniqueSorted = Array.from(new Set(activeDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort();
  if (uniqueSorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const toDayNum = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
  const dayNums = uniqueSorted.map(toDayNum);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i] === dayNums[i - 1] + 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const todayIso = referenceDateIso ?? new Date().toISOString().slice(0, 10);
  const todayNum = toDayNum(todayIso);
  const lastDay = dayNums[dayNums.length - 1];

  // Current streak is alive if the last active date is today or yesterday
  let currentStreak = 0;
  if (todayNum - lastDay <= 1) {
    currentStreak = 1;
    for (let i = dayNums.length - 1; i > 0; i--) {
      if (dayNums[i] - dayNums[i - 1] === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: longest };
}

export function evaluateAchievements(params: {
  profile: StudentProfile;
  skills: StudentSkill[];
  projects: ProjectItem[];
  interviews: InterviewSession[];
  roadmap: LearningRoadmap | null;
  streak: LearningStreak;
  readiness: ReadinessResult;
  thresholds?: SkillThresholds;
  earnedDates: Record<string, string>;
}): StudentAchievementStatus[] {
  const thresholds = params.thresholds ?? DEFAULT_THRESHOLDS;
  const completedProjects = params.projects.filter((p) => p.status === 'Completed').length;
  const hasSkillImprovement = params.skills.some(
    (s) =>
      typeof s.assessmentScore === 'number' &&
      typeof s.previousAssessmentScore === 'number' &&
      s.assessmentScore > s.previousAssessmentScore
  );
  const roadmapFinished =
    params.roadmap !== null &&
    params.roadmap.tasks.length > 0 &&
    params.roadmap.tasks.every((t) => t.completed);

  const uniqueActiveDays = new Set(params.streak.activeDates).size;

  const evaluators: Record<string, { earned: boolean; progressText: string }> = {
    FIRST_STEP: {
      earned: Boolean(
        params.profile.onboardingCompleted &&
          params.profile.fullName.trim() &&
          params.profile.collegeName.trim()
      ),
      progressText: params.profile.onboardingCompleted ? 'Profile complete' : 'Complete onboarding',
    },
    SKILL_EXPLORER: {
      earned: params.skills.length >= 5,
      progressText: `${Math.min(params.skills.length, 5)}/5 skills tracked`,
    },
    PROJECT_BUILDER: {
      earned: completedProjects >= 1,
      progressText: `${completedProjects}/1 completed project`,
    },
    CONSISTENT_LEARNER: {
      earned: uniqueActiveDays >= 7,
      progressText: `${Math.min(uniqueActiveDays, 7)}/7 active days`,
    },
    INTERVIEW_STARTER: {
      earned: params.interviews.length >= 1,
      progressText: `${Math.min(params.interviews.length, 1)}/1 mock interview`,
    },
    SKILL_IMPROVER: {
      earned: hasSkillImprovement,
      progressText: hasSkillImprovement
        ? 'Assessment score improved'
        : 'Record a higher skill assessment score',
    },
    ROADMAP_FINISHER: {
      earned: roadmapFinished,
      progressText: params.roadmap
        ? `${params.roadmap.tasks.filter((t) => t.completed).length}/${params.roadmap.tasks.length} roadmap tasks`
        : 'Start a learning roadmap',
    },
    CAREER_READY: {
      earned:
        params.readiness.dataCoveragePercent >= 60 &&
        params.readiness.overallScore >= thresholds.careerReadyMilestone,
      progressText: `${params.readiness.overallScore}% / ${thresholds.careerReadyMilestone}% milestone`,
    },
  };

  return ACHIEVEMENT_CATALOG.map((def) => {
    const check = evaluators[def.code] ?? { earned: false, progressText: 'In progress' };
    return {
      ...def,
      earned: check.earned,
      earnedDate: check.earned ? params.earnedDates[def.code] ?? new Date().toISOString().slice(0, 10) : null,
      progressText: check.progressText,
    };
  });
}

export function buildDeterministicRecommendations(
  userId: string,
  career: CareerPath,
  readiness: ReadinessResult
): RecommendationItem[] {
  const now = new Date().toISOString();
  const topGaps = readiness.skillGaps
    .filter((g) => g.status !== 'Meets Target')
    .sort((a, b) => (b.gap ?? 50) - (a.gap ?? 50))
    .slice(0, 5);

  const items: RecommendationItem[] = topGaps.map((gap, index) => ({
    id: `rec-rule-${index + 1}-${Date.now()}`,
    userId,
    title:
      gap.status === 'Insufficient Evidence'
        ? `Establish Baseline Proficiency in ${gap.skillName}`
        : `Close ${gap.gap}-Point Skill Gap in ${gap.skillName}`,
    explanation: gap.suggestedApproach,
    relatedSkill: gap.skillName,
    reason:
      gap.status === 'Insufficient Evidence'
        ? `${gap.skillName} is required at ${gap.requiredScore}% for ${career.title}, and no score is recorded yet.`
        : `Current score (${gap.currentScore}%) is ${gap.gap} points below the ${gap.requiredScore}% benchmark for ${career.title}.`,
    priority: gap.priority,
    difficulty: gap.priority === 'High' ? 'Intermediate' : 'Beginner',
    estimatedTime: gap.priority === 'High' ? '8–10 hours / week' : '4–6 hours / week',
    expectedOutcome: `Raise assessed ${gap.skillName} proficiency toward ${gap.requiredScore}% for ${career.title} readiness.`,
    suggestedNextAction: `Complete 3 structured practice sets and log an updated assessment score for ${gap.skillName}.`,
    source: 'deterministic-fallback',
    addedToActionPlan: false,
    createdAt: now,
  }));

  items.push({
    id: `rec-rule-interview-${Date.now()}`,
    userId,
    title: `Attempt Weekly ${career.title} Mock Interviews`,
    explanation: `Regular written technical interviews strengthen explanation clarity and expose conceptual blind spots across ${career.interviewTopics.slice(0, 3).join(', ')}.`,
    relatedSkill: 'Technical Interview Skills',
    reason: 'Interview performance contributes 15% to your indicative Career Readiness Score.',
    priority: 'Medium',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours / week',
    expectedOutcome: 'Consistently score above 75/100 on core technical interview rubrics.',
    suggestedNextAction: `Launch a 3-question ${career.title} mock interview in Interview Preparation.`,
    source: 'deterministic-fallback',
    addedToActionPlan: false,
    createdAt: now,
  });

  return items;
}

export function buildDeterministicRoadmap(
  userId: string,
  career: CareerPath,
  readiness: ReadinessResult,
  durationDays: 30 | 60 | 90
): LearningRoadmap {
  const now = new Date().toISOString();
  const focusSkills = readiness.skillGaps
    .filter((g) => g.status !== 'Meets Target')
    .sort((a, b) => (b.gap ?? 45) - (a.gap ?? 45));

  const skill1 = focusSkills[0]?.skillName ?? career.requiredSkills[0]?.name ?? 'Core Foundations';
  const skill2 = focusSkills[1]?.skillName ?? career.requiredSkills[1]?.name ?? 'Database & SQL';
  const skill3 = focusSkills[2]?.skillName ?? career.requiredSkills[2]?.name ?? 'Frameworks';
  const weeksTotal = durationDays === 30 ? 4 : durationDays === 60 ? 8 : 12;

  const tasks = Array.from({ length: weeksTotal }, (_, idx) => {
    const weekNum = idx + 1;
    const phaseMod = idx % 4;
    if (phaseMod === 0) {
      return {
        id: `rm-task-${weekNum}-a`,
        weekLabel: `Week ${weekNum}`,
        dayRange: `Days ${(weekNum - 1) * 7 + 1}–${Math.min(weekNum * 7, durationDays)}`,
        topic: `${skill1}: Core Concepts & Structured Drills`,
        skill: skill1,
        description: `Review core patterns, solve 15 progressive problems, and document complexity trade-offs in ${skill1}.`,
        difficulty: 'Intermediate' as const,
        estimatedDuration: '8 hours',
        expectedOutcome: `Demonstrate reliable problem-solving accuracy in ${skill1}.`,
        completed: false,
      };
    }
    if (phaseMod === 1) {
      return {
        id: `rm-task-${weekNum}-b`,
        weekLabel: `Week ${weekNum}`,
        dayRange: `Days ${(weekNum - 1) * 7 + 1}–${Math.min(weekNum * 7, durationDays)}`,
        topic: `${skill2}: Applied Query & Architecture Practice`,
        skill: skill2,
        description: `Complete hands-on exercises, schema modeling, and timed evaluation challenges for ${skill2}.`,
        difficulty: 'Intermediate' as const,
        estimatedDuration: '7 hours',
        expectedOutcome: `Improve assessed proficiency in ${skill2} by at least 15 points.`,
        completed: false,
      };
    }
    if (phaseMod === 2) {
      return {
        id: `rm-task-${weekNum}-c`,
        weekLabel: `Week ${weekNum}`,
        dayRange: `Days ${(weekNum - 1) * 7 + 1}–${Math.min(weekNum * 7, durationDays)}`,
        topic: `${skill3}: Portfolio Mini-Project Implementation`,
        skill: skill3,
        description: `Build and push a working feature module integrating ${skill1}, ${skill2}, and ${skill3} with clean README documentation.`,
        difficulty: 'Advanced' as const,
        estimatedDuration: '10 hours',
        expectedOutcome: `Ship a demonstrable repository milestone aligned with ${career.title}.`,
        completed: false,
      };
    }
    return {
      id: `rm-task-${weekNum}-d`,
      weekLabel: `Week ${weekNum}`,
      dayRange: `Days ${(weekNum - 1) * 7 + 1}–${Math.min(weekNum * 7, durationDays)}`,
      topic: `${career.title} Revision & Mock Interview Checkpoint`,
      skill: 'Technical Interview Skills',
      description: `Revise weak topics from Weeks ${Math.max(1, weekNum - 3)}–${weekNum - 1} and complete a full text-based mock interview.`,
      difficulty: 'Advanced' as const,
      estimatedDuration: '6 hours',
      expectedOutcome: `Validate concept clarity and log an updated skill assessment score.`,
      completed: false,
    };
  });

  return {
    id: `roadmap-${durationDays}-${Date.now()}`,
    userId,
    careerId: career.id,
    careerTitle: career.title,
    durationDays,
    status: 'Active',
    source: 'deterministic-fallback',
    tasks,
    createdAt: now,
    updatedAt: now,
  };
}
