import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CAREER_PATHS, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from '../data/careers';
import {
  analyzeAcademics,
  analyzeSkillGaps,
  calculateCareerReadiness,
  classifySkillStatus,
  compareCareerPaths,
  computeLearningStreak,
  evaluateAchievements,
  SELF_REPORTED_LEVEL_SCORES,
} from './analyticsEngine';
import type {
  AcademicRecord,
  ActionPlanTask,
  InterviewSession,
  LearningRoadmap,
  ProjectItem,
  StudentProfile,
  StudentSkill,
} from '../types/student';

const javaCareer = DEFAULT_CAREER_PATHS.find((c) => c.id === 'java-developer')!;
const dataAnalystCareer = DEFAULT_CAREER_PATHS.find((c) => c.id === 'data-analyst')!;

const sampleSkills: StudentSkill[] = [
  {
    id: 'sk-1',
    userId: 'demo-user',
    name: 'Core Java',
    category: 'Language',
    selfReportedLevel: 'Advanced',
    selfReportedScore: 75,
    assessmentScore: 85,
    previousAssessmentScore: 78,
    updatedAt: '2026-11-10',
  },
  {
    id: 'sk-2',
    userId: 'demo-user',
    name: 'SQL',
    category: 'Database',
    selfReportedLevel: 'Intermediate',
    selfReportedScore: 50,
    assessmentScore: 60,
    updatedAt: '2026-11-10',
  },
  {
    id: 'sk-3',
    userId: 'demo-user',
    name: 'DSA',
    category: 'CS Fundamentals',
    selfReportedLevel: 'Beginner',
    selfReportedScore: 25,
    assessmentScore: 35,
    updatedAt: '2026-11-10',
  },
  {
    id: 'sk-4',
    userId: 'demo-user',
    name: 'OOP',
    category: 'Architecture',
    selfReportedLevel: 'Advanced',
    selfReportedScore: 75,
    assessmentScore: 80,
    updatedAt: '2026-11-10',
  },
  {
    id: 'sk-5',
    userId: 'demo-user',
    name: 'Spring Boot',
    category: 'Framework',
    selfReportedLevel: 'Intermediate',
    selfReportedScore: 50,
    assessmentScore: 55,
    updatedAt: '2026-11-10',
  },
];

test('maps self-reported levels to documented indicative values', () => {
  assert.equal(SELF_REPORTED_LEVEL_SCORES.Beginner, 25);
  assert.equal(SELF_REPORTED_LEVEL_SCORES.Intermediate, 50);
  assert.equal(SELF_REPORTED_LEVEL_SCORES.Advanced, 75);
  assert.equal(SELF_REPORTED_LEVEL_SCORES.Expert, 90);
});

test('classifies skill statuses using configurable thresholds and missing evidence', () => {
  assert.equal(classifySkillStatus(85, DEFAULT_THRESHOLDS), 'Good');
  assert.equal(classifySkillStatus(60, DEFAULT_THRESHOLDS), 'Moderate');
  assert.equal(classifySkillStatus(35, DEFAULT_THRESHOLDS), 'Weak');
  assert.equal(classifySkillStatus(null, DEFAULT_THRESHOLDS), 'Not Assessed');
});

test('computes exact skill gaps and marks unassessed required skills as Insufficient Evidence', () => {
  const { gaps, technicalSkillMatchScore } = analyzeSkillGaps(sampleSkills, javaCareer);
  const dsa = gaps.find((g) => g.skillName === 'Data Structures & Algorithms')!;
  const java = gaps.find((g) => g.skillName === 'Core Java')!;
  const jdbc = gaps.find((g) => g.skillName === 'JDBC')!;

  assert.equal(dsa.currentScore, 35);
  assert.equal(dsa.requiredScore, 85);
  assert.equal(dsa.gap, 50);
  assert.equal(dsa.priority, 'High');
  assert.equal(dsa.status, 'Improvement Needed');

  assert.equal(java.currentScore, 85);
  assert.equal(java.gap, 5);

  assert.equal(jdbc.currentScore, null);
  assert.equal(jdbc.gap, null);
  assert.equal(jdbc.status, 'Insufficient Evidence');
  assert.equal(jdbc.skillStatus, 'Not Assessed');

  assert.ok(technicalSkillMatchScore !== null && technicalSkillMatchScore > 60 && technicalSkillMatchScore < 85);
});

test('caps skill contribution at 100% of required score while keeping actual score for display', () => {
  const overAchievedSkills: StudentSkill[] = [
    {
      id: 's1',
      userId: 'u1',
      name: 'Core Java',
      category: 'Language',
      selfReportedLevel: 'Expert',
      selfReportedScore: 90,
      assessmentScore: 100,
      updatedAt: '2026-11-15',
    },
  ];
  const { gaps, technicalSkillMatchScore } = analyzeSkillGaps(overAchievedSkills, javaCareer);
  const java = gaps.find((g) => g.skillName === 'Core Java')!;
  assert.equal(java.currentScore, 100);
  assert.equal(java.status, 'Meets Target');
  assert.equal(technicalSkillMatchScore, 100);
});

test('renormalizes readiness weights when components have missing data instead of assuming zero', () => {
  const readiness = calculateCareerReadiness({
    skills: sampleSkills,
    academics: [],
    projects: [],
    certifications: [],
    activities: [],
    interviews: [],
    actionTasks: [],
    roadmap: null,
    streak: { currentStreak: 0, longestStreak: 0, activeDates: [], totalCompletedTasks: 0 },
    career: javaCareer,
    weights: DEFAULT_WEIGHTS,
  });

  // Only technicalSkills (45%) has data -> coverage = 45%, effective weight = 100%
  assert.equal(readiness.dataCoveragePercent, 45);
  assert.equal(readiness.overallScore, readiness.technicalSkillMatchScore);
  const techComp = readiness.components.find((c) => c.key === 'technicalSkills')!;
  assert.equal(techComp.effectiveWeight, 100);
});

test('computes academic CGPA and never treats missing records as zero', () => {
  const empty = analyzeAcademics([]);
  assert.equal(empty.cgpa, null);
  assert.equal(empty.averagePercentage, null);

  const records: AcademicRecord[] = [
    {
      id: 'a1',
      userId: 'u1',
      semester: 1,
      subject: 'Java Programming',
      marksObtained: 88,
      maxMarks: 100,
      assessmentType: 'Semester Exam',
      assessmentDate: '2025-12-10',
    },
    {
      id: 'a2',
      userId: 'u1',
      semester: 2,
      subject: 'Database Systems',
      marksObtained: 72,
      maxMarks: 100,
      assessmentType: 'Semester Exam',
      assessmentDate: '2026-05-15',
    },
  ];
  const stats = analyzeAcademics(records);
  assert.equal(stats.averagePercentage, 80);
  assert.equal(stats.cgpa, 8.42);
  assert.equal(stats.semesterTrend.length, 2);
});

test('compares two career paths and identifies shared skills and distinct gaps', () => {
  const result = compareCareerPaths({
    careerA: javaCareer,
    careerB: dataAnalystCareer,
    skills: sampleSkills,
    academics: [],
    projects: [],
    certifications: [],
    activities: [],
    interviews: [],
    actionTasks: [],
    roadmap: null,
    streak: { currentStreak: 0, longestStreak: 0, activeDates: [], totalCompletedTasks: 0 },
  });

  assert.ok(result.sharedSkills.some((s) => s.name === 'SQL'));
  assert.ok(result.careerA.readiness.overallScore > 0);
  assert.ok(result.careerB.missingSkills.includes('Python'));
});

test('tracks consecutive daily streaks and evaluates event-driven achievements', () => {
  const streakResult = computeLearningStreak(
    ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'],
    '2026-11-19'
  );
  assert.equal(streakResult.currentStreak, 7);
  assert.equal(streakResult.longestStreak, 7);

  const profile: StudentProfile = {
    userId: 'u1',
    fullName: 'Rahul Sharma',
    email: 'rahul@example.edu',
    collegeName: 'Demo Tech University',
    course: 'MCA',
    currentSemester: 3,
    graduationYear: 2027,
    bio: 'Student',
    onboardingCompleted: true,
    interviewExperienceLevel: 'Beginner',
    primaryCareerId: 'java-developer',
    secondaryCareerIds: ['data-analyst'],
    createdAt: '2026-10-01',
    updatedAt: '2026-11-19',
  };
  const projects: ProjectItem[] = [
    {
      id: 'p1',
      userId: 'u1',
      name: 'Student Management System',
      description: 'Java + SQL portal',
      category: 'Backend',
      technologies: ['Core Java', 'SQL'],
      startDate: '2026-08-01',
      status: 'Completed',
    },
  ];
  const interviews: InterviewSession[] = [
    {
      id: 'i1',
      userId: 'u1',
      role: 'Java Developer',
      topic: 'Core Java',
      difficulty: 'Intermediate',
      overallScore: 65,
      questionsCount: 3,
      strongTopics: ['OOP'],
      weakTopics: ['DSA'],
      suggestedNextActivities: ['Practice DSA'],
      evaluations: [],
      source: 'deterministic-fallback',
      completedAt: '2026-11-15',
    },
  ];
  const tasks: ActionPlanTask[] = [];
  const roadmap: LearningRoadmap | null = null;
  const streak = {
    currentStreak: 7,
    longestStreak: 7,
    activeDates: ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'],
    totalCompletedTasks: 7,
  };
  const readiness = calculateCareerReadiness({
    skills: sampleSkills,
    academics: [],
    projects,
    certifications: [],
    activities: [],
    interviews,
    actionTasks: tasks,
    roadmap,
    streak,
    career: javaCareer,
  });

  const badges = evaluateAchievements({
    profile,
    skills: sampleSkills,
    projects,
    interviews,
    roadmap,
    streak,
    readiness,
    earnedDates: {},
  });

  assert.equal(badges.find((b) => b.code === 'FIRST_STEP')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'SKILL_EXPLORER')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'PROJECT_BUILDER')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'CONSISTENT_LEARNER')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'INTERVIEW_STARTER')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'SKILL_IMPROVER')?.earned, true);
  assert.equal(badges.find((b) => b.code === 'ROADMAP_FINISHER')?.earned, false);
});
