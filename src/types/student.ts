export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type SkillStatus = 'Good' | 'Moderate' | 'Weak' | 'Not Assessed';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type ProjectStatus = 'Planning' | 'In Progress' | 'Completed';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type RoadmapStatus = 'Active' | 'Paused' | 'Completed';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type ActionTaskCategory =
  | 'Daily Tasks'
  | 'Weekly Goals'
  | 'Practice Exercises'
  | 'Learning Activities'
  | 'Project Activities'
  | 'Interview Preparation';

export type ActivityType =
  | 'Hackathon'
  | 'Workshop'
  | 'Coding Competition'
  | 'Internship'
  | 'Technical Event'
  | 'Other';

export interface ReadinessWeights {
  technicalSkills: number; // default 45
  projectExperience: number; // default 20
  academicPerformance: number; // default 10
  interviewPerformance: number; // default 15
  learningConsistency: number; // default 10
}

export interface SkillThresholds {
  goodMin: number; // default 75
  moderateMin: number; // default 50
  careerReadyMilestone: number; // default 75
}

export interface CareerSkillRequirement {
  name: string;
  requiredScore: number; // 0-100
  importance: PriorityLevel;
  weight: number; // 1-3
  category: string;
}

export interface CareerPath {
  id: string;
  title: string;
  tagline: string;
  description: string;
  averageExperienceTrack: string;
  requiredSkills: CareerSkillRequirement[];
  suggestedProjects: string[];
  learningRecommendations: string[];
  interviewTopics: string[];
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  email: string;
  collegeName: string;
  course: string;
  currentSemester: number;
  graduationYear: number;
  bio: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  interviewExperienceLevel: string;
  primaryCareerId: string;
  secondaryCareerIds: string[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSkill {
  id: string;
  userId: string;
  name: string;
  category: string;
  selfReportedLevel: ProficiencyLevel;
  selfReportedScore: number; // 25, 50, 75, 90
  assessmentScore: number | null; // optional assessment-based evidence
  previousAssessmentScore?: number | null;
  evidenceUrl?: string;
  notes?: string;
  updatedAt: string;
}

export interface AcademicRecord {
  id: string;
  userId: string;
  semester: number;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  assessmentType: 'Semester Exam' | 'Mid-Term' | 'Lab Practical' | 'Assignment' | 'Quiz';
  assessmentDate: string;
  credits?: number;
}

export interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate: string;
  completionDate?: string;
  status: ProjectStatus;
  thumbnailUrl?: string;
}

export interface CertificationItem {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
  relatedSkills: string[];
}

export interface ActivityItem {
  id: string;
  userId: string;
  title: string;
  type: ActivityType;
  organization: string;
  date: string;
  description: string;
  relatedSkills: string[];
}

export interface SkillGapItem {
  skillName: string;
  category: string;
  currentScore: number | null; // null if missing evidence
  selfReportedScore: number | null;
  assessmentScore: number | null;
  requiredScore: number;
  gap: number | null; // Required - Current; null if insufficient evidence
  gapPercentage: number | null;
  importance: PriorityLevel;
  priority: PriorityLevel;
  status: 'Meets Target' | 'Improvement Needed' | 'Insufficient Evidence';
  skillStatus: SkillStatus;
  suggestedApproach: string;
}

export interface ReadinessComponentScore {
  key: keyof ReadinessWeights;
  label: string;
  baseWeight: number;
  effectiveWeight: number;
  score: number | null;
  hasData: boolean;
  detail: string;
}

export interface ReadinessResult {
  overallScore: number; // 0-100 indicative metric
  dataCoveragePercent: number; // 0-100
  technicalSkillMatchScore: number | null;
  components: ReadinessComponentScore[];
  strongestSkills: SkillGapItem[];
  weakestSkills: SkillGapItem[];
  gapsIdentifiedCount: number;
  insufficientEvidenceCount: number;
  skillGaps: SkillGapItem[];
  disclaimer: string;
}

export interface AcademicAnalytics {
  cgpa: number | null; // 10-point scale
  averagePercentage: number | null;
  totalRecords: number;
  semesterTrend: { semester: string; averagePercent: number; sgpa: number; subjectsCount: number }[];
  subjectBreakdown: { subject: string; percentage: number; marksObtained: number; maxMarks: number; semester: number }[];
  distribution: { band: string; count: number }[];
  strengths: { subject: string; percentage: number }[];
  improvementAreas: { subject: string; percentage: number }[];
}

export interface RecommendationItem {
  id: string;
  userId: string;
  title: string;
  explanation: string;
  relatedSkill: string;
  reason: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  expectedOutcome: string;
  suggestedNextAction: string;
  source: 'gemini-ai' | 'deterministic-fallback';
  addedToActionPlan: boolean;
  createdAt: string;
}

export interface RoadmapTask {
  id: string;
  weekLabel: string;
  dayRange: string;
  topic: string;
  skill: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedDuration: string;
  expectedOutcome: string;
  completed: boolean;
  completedAt?: string;
}

export interface LearningRoadmap {
  id: string;
  userId: string;
  careerId: string;
  careerTitle: string;
  durationDays: 30 | 60 | 90;
  status: RoadmapStatus;
  source: 'gemini-ai' | 'deterministic-fallback';
  tasks: RoadmapTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionPlanTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: ActionTaskCategory;
  relatedSkill: string;
  dueDate: string;
  priority: PriorityLevel;
  estimatedDuration: string;
  status: TaskStatus;
  notes: string;
  completedAt?: string;
  createdAt: string;
}

export interface InterviewQuestionEval {
  question: string;
  topic: string;
  userAnswer: string;
  score: number;
  rubric: {
    technicalCorrectness: number;
    conceptualUnderstanding: number;
    clarity: number;
    completeness: number;
    problemSolving: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  exampleAnswer: string;
  conceptExplanation: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  topic: string;
  difficulty: DifficultyLevel;
  overallScore: number;
  questionsCount: number;
  strongTopics: string[];
  weakTopics: string[];
  suggestedNextActivities: string[];
  evaluations: InterviewQuestionEval[];
  source: 'gemini-ai' | 'deterministic-fallback';
  completedAt: string;
}

export interface ProgressSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  readinessScore: number;
  skillMatchScore: number;
  tasksCompleted: number;
  interviewAvg: number | null;
  note: string;
}

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  criteria: string;
  iconName: string;
}

export interface StudentAchievementStatus extends AchievementDefinition {
  earned: boolean;
  earnedDate: string | null;
  progressText: string;
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  activeDates: string[]; // YYYY-MM-DD
  totalCompletedTasks: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'recommendation' | 'milestone' | 'achievement' | 'roadmap' | 'interview';
  read: boolean;
  targetRoute: string;
  createdAt: string;
}

export interface CareerComparisonResult {
  careerA: {
    career: CareerPath;
    readiness: ReadinessResult;
    missingSkills: string[];
    careerSpecificGaps: SkillGapItem[];
  };
  careerB: {
    career: CareerPath;
    readiness: ReadinessResult;
    missingSkills: string[];
    careerSpecificGaps: SkillGapItem[];
  };
  sharedSkills: {
    name: string;
    studentScore: number | null;
    requiredA: number;
    requiredB: number;
  }[];
  summaryExplanation: string;
}

export interface MarketInsightResult {
  careerTitle: string;
  summary: string;
  trendingSkills: string[];
  sources: { title: string; uri: string }[];
  source: 'gemini-search' | 'deterministic-fallback';
  generatedAt: string;
}

export interface StudentWorkspaceData {
  profile: StudentProfile;
  skills: StudentSkill[];
  academics: AcademicRecord[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  activities: ActivityItem[];
  recommendations: RecommendationItem[];
  roadmap: LearningRoadmap | null;
  actionTasks: ActionPlanTask[];
  interviews: InterviewSession[];
  progressHistory: ProgressSnapshot[];
  streak: LearningStreak;
  notifications: NotificationItem[];
  customCareers: CareerPath[];
  weights: ReadinessWeights;
  thresholds: SkillThresholds;
  earnedAchievementDates: Record<string, string>;
}
