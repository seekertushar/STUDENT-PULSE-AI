import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { DEFAULT_CAREER_PATHS, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from '../data/careers';
import { createDemoWorkspace } from '../data/demoData';
import {
  analyzeAcademics,
  calculateCareerReadiness,
  computeLearningStreak,
  evaluateAchievements,
} from '../utils/analyticsEngine';
import { toIsoDateString } from '../utils/formatters';
import type {
  AcademicAnalytics,
  AcademicRecord,
  ActionPlanTask,
  ActivityItem,
  CareerPath,
  CertificationItem,
  InterviewSession,
  LearningRoadmap,
  NotificationItem,
  ProjectItem,
  ReadinessResult,
  ReadinessWeights,
  RecommendationItem,
  SkillThresholds,
  StudentAchievementStatus,
  StudentProfile,
  StudentSkill,
  StudentWorkspaceData,
} from '../types/student';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StudentDataContextValue {
  data: StudentWorkspaceData;
  loading: boolean;
  isDemoMode: boolean;
  primaryCareer: CareerPath;
  readiness: ReadinessResult;
  academicsAnalytics: AcademicAnalytics;
  achievements: StudentAchievementStatus[];
  unreadNotificationsCount: number;
  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: (id: string) => void;

  // Profile & Career
  updateProfile: (patch: Partial<StudentProfile>) => Promise<void>;
  setPrimaryCareer: (careerId: string) => Promise<void>;
  toggleSecondaryCareer: (careerId: string) => Promise<void>;
  updateCareerSkillRequirement: (careerId: string, skillName: string, requiredScore: number) => void;

  // Skills
  addSkill: (skill: Omit<StudentSkill, 'id' | 'userId' | 'updatedAt'>) => Promise<void>;
  updateSkill: (id: string, patch: Partial<StudentSkill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  // Academics
  addAcademicRecord: (rec: Omit<AcademicRecord, 'id' | 'userId'>) => Promise<void>;
  updateAcademicRecord: (id: string, patch: Partial<AcademicRecord>) => Promise<void>;
  deleteAcademicRecord: (id: string) => Promise<void>;

  // Portfolio
  addProject: (project: Omit<ProjectItem, 'id' | 'userId'>) => Promise<void>;
  updateProject: (id: string, patch: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addCertification: (cert: Omit<CertificationItem, 'id' | 'userId'>) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  addActivity: (act: Omit<ActivityItem, 'id' | 'userId'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;

  // Recommendations & Roadmap
  saveRecommendations: (items: RecommendationItem[]) => Promise<void>;
  addRecommendationToActionPlan: (recId: string) => Promise<void>;
  saveRoadmap: (roadmap: LearningRoadmap) => Promise<void>;
  toggleRoadmapTask: (taskId: string) => Promise<void>;
  setRoadmapStatus: (status: LearningRoadmap['status']) => Promise<void>;

  // Action Plan
  addActionTask: (task: Omit<ActionPlanTask, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateActionTask: (id: string, patch: Partial<ActionPlanTask>) => Promise<void>;
  deleteActionTask: (id: string) => Promise<void>;

  // Mock Interviews
  saveInterviewSession: (session: InterviewSession) => Promise<void>;

  // Notifications & Settings
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateSettings: (weights: ReadinessWeights, thresholds: SkillThresholds) => Promise<void>;
  resetSettings: () => Promise<void>;
  resetDemoWorkspace: () => void;
}

const StudentDataContext = createContext<StudentDataContextValue | undefined>(undefined);

function createBlankWorkspace(
  uid: string,
  email: string,
  displayName: string,
  extra?: { collegeName?: string; course?: string; currentSemester?: number }
): StudentWorkspaceData {
  const now = new Date().toISOString();
  return {
    profile: {
      userId: uid,
      fullName: displayName || email.split('@')[0] || 'Student',
      email,
      collegeName: extra?.collegeName || '',
      course: extra?.course || 'MCA',
      currentSemester: extra?.currentSemester || 1,
      graduationYear: new Date().getFullYear() + 1,
      bio: '',
      onboardingCompleted: false,
      interviewExperienceLevel: 'None yet',
      primaryCareerId: 'java-developer',
      secondaryCareerIds: [],
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    },
    skills: [],
    academics: [],
    projects: [],
    certifications: [],
    activities: [],
    recommendations: [],
    roadmap: null,
    actionTasks: [],
    interviews: [],
    progressHistory: [],
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      activeDates: [],
      totalCompletedTasks: 0,
    },
    notifications: [],
    customCareers: DEFAULT_CAREER_PATHS,
    weights: { ...DEFAULT_WEIGHTS },
    thresholds: { ...DEFAULT_THRESHOLDS },
    earnedAchievementDates: {},
  };
}

function makeSafeDocId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function StudentDataProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isDemoMode, activeUserId, pendingRegistration, clearPendingRegistration } = useAuth();
  const [data, setData] = useState<StudentWorkspaceData>(() =>
    isDemoMode ? createDemoWorkspace() : createBlankWorkspace('', '', '')
  );
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const profileDocExistsRef = useRef<boolean>(false);
  const syncedAchievementsRef = useRef<Set<string>>(new Set());

  const pushToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load workspace when user or demo mode changes
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (isDemoMode) {
        const saved = window.sessionStorage.getItem('studentpulse_demo_state');
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as StudentWorkspaceData;
            if (!cancelled) setData(parsed);
            return;
          } catch {
            // Fall through to clean demo seed
          }
        }
        if (!cancelled) setData(createDemoWorkspace());
        return;
      }

      if (!firebaseUser) {
        profileDocExistsRef.current = false;
        syncedAchievementsRef.current = new Set();
        if (!cancelled) {
          setData(createBlankWorkspace('', '', ''));
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const uid = firebaseUser.uid;
      try {
        const profileRef = doc(db, 'studentProfiles', uid);
        const profileSnap = await getDoc(profileRef);

        let workspace = createBlankWorkspace(
          uid,
          firebaseUser.email || '',
          pendingRegistration?.fullName || firebaseUser.displayName || 'Student',
          pendingRegistration ?? undefined
        );

        if (profileSnap.exists()) {
          profileDocExistsRef.current = true;
          const p = profileSnap.data();
          let weights = { ...DEFAULT_WEIGHTS };
          let thresholds = { ...DEFAULT_THRESHOLDS };
          if (typeof p.weightsJson === 'string') {
            try {
              weights = { ...DEFAULT_WEIGHTS, ...JSON.parse(p.weightsJson) };
            } catch {
              /* ignore */
            }
          }
          if (typeof p.thresholdsJson === 'string') {
            try {
              thresholds = { ...DEFAULT_THRESHOLDS, ...JSON.parse(p.thresholdsJson) };
            } catch {
              /* ignore */
            }
          }
          workspace.profile = {
            userId: uid,
            fullName: String(p.fullName || firebaseUser.displayName || 'Student'),
            email: String(p.email || firebaseUser.email || ''),
            collegeName: String(p.collegeName || ''),
            course: String(p.course || 'MCA'),
            currentSemester: Number(p.currentSemester || 1),
            graduationYear: Number(p.graduationYear || new Date().getFullYear() + 1),
            bio: String(p.bio || ''),
            githubUrl: p.githubUrl ? String(p.githubUrl) : '',
            linkedinUrl: p.linkedinUrl ? String(p.linkedinUrl) : '',
            avatarUrl: p.avatarUrl ? String(p.avatarUrl) : firebaseUser.photoURL || '',
            onboardingCompleted: Boolean(p.onboardingCompleted),
            interviewExperienceLevel: String(p.interviewExperienceLevel || 'None yet'),
            primaryCareerId: String(p.primaryCareerId || 'java-developer'),
            secondaryCareerIds: Array.isArray(p.secondaryCareerIds) ? p.secondaryCareerIds : [],
            isDemo: false,
            createdAt: toIsoDateString(p.createdAt),
            updatedAt: toIsoDateString(p.updatedAt),
          };
          workspace.weights = weights;
          workspace.thresholds = thresholds;
        } else if (firebaseUser.emailVerified) {
          // Initialize private user & profile documents for new verified user
          await setDoc(doc(db, 'users', uid), {
            userId: uid,
            email: firebaseUser.email || 'student@example.com',
            displayName: workspace.profile.fullName.slice(0, 120),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await setDoc(profileRef, {
            userId: uid,
            fullName: workspace.profile.fullName.slice(0, 120),
            email: workspace.profile.email.slice(0, 254),
            collegeName: (workspace.profile.collegeName || 'University').slice(0, 200),
            course: workspace.profile.course.slice(0, 80),
            currentSemester: workspace.profile.currentSemester,
            graduationYear: workspace.profile.graduationYear,
            bio: '',
            onboardingCompleted: false,
            interviewExperienceLevel: 'None yet',
            primaryCareerId: workspace.profile.primaryCareerId,
            secondaryCareerIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          profileDocExistsRef.current = true;
          if (pendingRegistration) clearPendingRegistration();
        } else {
          profileDocExistsRef.current = false;
        }

        // Load user-owned collections via strict owner-filtered queries matching firestore.rules
        const loadCollection = async (colName: string): Promise<Array<Record<string, unknown>>> => {
          try {
            const q = query(collection(db, colName), where('userId', '==', uid));
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, colName);
          }
        };

        const [
          rawSkills,
          rawAcademics,
          rawProjects,
          rawCertifications,
          rawActivities,
          rawRecommendations,
          rawRoadmaps,
          rawActionTasks,
          rawInterviews,
          rawInterviewFeedback,
          rawProgressHistory,
          rawNotifications,
          rawEarnedAch,
        ] = await Promise.all([
          loadCollection('studentSkills'),
          loadCollection('academicRecords'),
          loadCollection('projects'),
          loadCollection('certifications'),
          loadCollection('activities'),
          loadCollection('recommendations'),
          loadCollection('learningRoadmaps'),
          loadCollection('actionPlanTasks'),
          loadCollection('interviews'),
          loadCollection('interviewFeedback'),
          loadCollection('progressRecords'),
          loadCollection('notifications'),
          loadCollection('studentAchievements'),
        ]);

        const skills: StudentSkill[] = rawSkills.map((d) => ({
          id: String(d.id),
          userId: String(d.userId || uid),
          name: String(d.name || ''),
          category: String(d.category || 'Technical'),
          selfReportedLevel: (d.selfReportedLevel as StudentSkill['selfReportedLevel']) || 'Beginner',
          selfReportedScore: Number(d.selfReportedScore ?? 0),
          assessmentScore: typeof d.assessmentScore === 'number' ? d.assessmentScore : null,
          previousAssessmentScore:
            typeof d.previousAssessmentScore === 'number' ? d.previousAssessmentScore : null,
          evidenceUrl: d.evidenceUrl ? String(d.evidenceUrl) : '',
          notes: d.notes ? String(d.notes) : '',
          updatedAt: toIsoDateString(d.updatedAt, undefined, true),
        }));

        const academics: AcademicRecord[] = rawAcademics.map((d) => ({
          id: String(d.id),
          userId: String(d.userId || uid),
          semester: Number(d.semester ?? 1),
          subject: String(d.subject || ''),
          marksObtained: Number(d.marksObtained ?? 0),
          maxMarks: Number(d.maxMarks ?? 100),
          assessmentType: (d.assessmentType as AcademicRecord['assessmentType']) || 'Final Exam',
          assessmentDate: toIsoDateString(d.assessmentDate, undefined, true),
          credits: typeof d.credits === 'number' ? d.credits : 4,
        }));

        const projects: ProjectItem[] = rawProjects.map((d) => ({
          id: String(d.id),
          userId: String(d.userId || uid),
          name: String(d.name || ''),
          description: String(d.description || ''),
          category: String(d.category || 'Full Stack'),
          technologies: Array.isArray(d.technologies) ? d.technologies.map(String) : [],
          githubUrl: d.githubUrl ? String(d.githubUrl) : '',
          liveUrl: d.liveUrl ? String(d.liveUrl) : '',
          startDate: toIsoDateString(d.startDate, undefined, true),
          completionDate: d.completionDate ? toIsoDateString(d.completionDate, '', true) : '',
          status: (d.status as ProjectItem['status']) || 'In Progress',
        }));

        const certifications: CertificationItem[] = rawCertifications.map((d) => ({
          id: String(d.id),
          userId: String(d.userId || uid),
          name: String(d.name || ''),
          issuer: String(d.issuer || ''),
          issueDate: toIsoDateString(d.issueDate, undefined, true),
          credentialUrl: d.credentialUrl ? String(d.credentialUrl) : '',
          relatedSkills: Array.isArray(d.relatedSkills) ? d.relatedSkills.map(String) : [],
        }));

        const activities: ActivityItem[] = rawActivities.map((d) => ({
          id: String(d.id),
          userId: String(d.userId || uid),
          title: String(d.title || ''),
          type: (d.type as ActivityItem['type']) || 'Workshop',
          organization: String(d.organization || ''),
          date: toIsoDateString(d.date, undefined, true),
          description: String(d.description || ''),
          relatedSkills: Array.isArray(d.relatedSkills) ? d.relatedSkills.map(String) : [],
        }));

        const recommendations: RecommendationItem[] = rawRecommendations
          .map((d) => ({
            id: String(d.id),
            userId: String(d.userId || uid),
            title: String(d.title || ''),
            explanation: String(d.explanation || ''),
            relatedSkill: String(d.relatedSkill || ''),
            reason: String(d.reason || ''),
            priority: (d.priority as RecommendationItem['priority']) || 'Medium',
            difficulty: (d.difficulty as RecommendationItem['difficulty']) || 'Intermediate',
            estimatedTime: String(d.estimatedTime || ''),
            expectedOutcome: String(d.expectedOutcome || ''),
            suggestedNextAction: String(d.suggestedNextAction || ''),
            source: (d.source as RecommendationItem['source']) || 'rule-based',
            addedToActionPlan: Boolean(d.addedToActionPlan),
            createdAt: toIsoDateString(d.createdAt),
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const roadmaps: LearningRoadmap[] = rawRoadmaps
          .map((d) => {
            const careerId = String(d.careerId || 'java-developer');
            const matchedCareer = DEFAULT_CAREER_PATHS.find((c) => c.id === careerId);
            return {
              id: String(d.id),
              userId: String(d.userId || uid),
              careerId,
              careerTitle: String(d.careerTitle || matchedCareer?.title || 'Target Career'),
              durationDays: (Number(d.durationDays) as 30 | 60 | 90) || 30,
              status: (d.status as LearningRoadmap['status']) || 'Active',
              source: (d.source as LearningRoadmap['source']) || 'rule-based',
              tasks: Array.isArray(d.tasks) ? (d.tasks as LearningRoadmap['tasks']) : [],
              createdAt: toIsoDateString(d.createdAt),
              updatedAt: toIsoDateString(d.updatedAt),
            };
          })
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        const actionTasks: ActionPlanTask[] = rawActionTasks
          .map((d) => ({
            id: String(d.id),
            userId: String(d.userId || uid),
            title: String(d.title || ''),
            description: String(d.description || ''),
            category: (d.category as ActionPlanTask['category']) || 'Learning Activities',
            relatedSkill: String(d.relatedSkill || ''),
            dueDate: toIsoDateString(d.dueDate, undefined, true),
            priority: (d.priority as ActionPlanTask['priority']) || 'Medium',
            estimatedDuration: String(d.estimatedDuration || '3 hours'),
            status: (d.status as ActionPlanTask['status']) || 'Not Started',
            notes: String(d.notes || ''),
            completedAt: d.completedAt ? toIsoDateString(d.completedAt, '', true) : undefined,
            createdAt: toIsoDateString(d.createdAt, undefined, true),
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const feedbackByInterview = new Map<string, InterviewSession['evaluations']>();
        for (const fb of rawInterviewFeedback) {
          const interviewId = String(fb.interviewId || '');
          if (!interviewId) continue;
          const score = Number(fb.score ?? 0);
          const bucket = feedbackByInterview.get(interviewId) ?? [];
          bucket.push({
            questionId: String(fb.id),
            question: String(fb.question || ''),
            topic: String(fb.topic || 'Core Concepts'),
            userAnswer: String(fb.userAnswer || ''),
            score,
            rubric: {
              technicalAccuracy: score,
              clarity: score,
              completeness: score,
              practicalExamples: score,
            },
            strengths: Array.isArray(fb.strengths) ? fb.strengths.map(String) : [],
            weaknesses: Array.isArray(fb.weaknesses) ? fb.weaknesses.map(String) : [],
            improvements: Array.isArray(fb.improvements) ? fb.improvements.map(String) : [],
            exampleAnswer: String(fb.exampleAnswer || ''),
            conceptExplanation: String(fb.conceptExplanation || ''),
          });
          feedbackByInterview.set(interviewId, bucket);
        }

        const interviews: InterviewSession[] = rawInterviews
          .map((d) => ({
            id: String(d.id),
            userId: String(d.userId || uid),
            role: String(d.role || ''),
            topic: String(d.topic || ''),
            difficulty: (d.difficulty as InterviewSession['difficulty']) || 'Intermediate',
            overallScore: Number(d.overallScore ?? 0),
            questionsCount: Number(d.questionsCount ?? 0),
            evaluations: feedbackByInterview.get(String(d.id)) ?? [],
            strongTopics: Array.isArray(d.strongTopics) ? d.strongTopics.map(String) : [],
            weakTopics: Array.isArray(d.weakTopics) ? d.weakTopics.map(String) : [],
            source: (d.source as InterviewSession['source']) || 'rule-based',
            completedAt: toIsoDateString(d.completedAt || d.createdAt),
          }))
          .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

        const progressHistory = rawProgressHistory
          .map((d) => ({
            id: String(d.id),
            date: toIsoDateString(d.date || d.createdAt, undefined, true),
            readinessScore: Number(d.readinessScore ?? 0),
            skillMatchScore: Number(d.skillMatchScore ?? 0),
            tasksCompleted: Number(d.tasksCompleted ?? 0),
            interviewAvg: typeof d.interviewAvg === 'number' ? d.interviewAvg : null,
            note: String(d.note || ''),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const notifications: NotificationItem[] = rawNotifications
          .map((d) => ({
            id: String(d.id),
            userId: String(d.userId || uid),
            title: String(d.title || ''),
            message: String(d.message || ''),
            type: (d.type as NotificationItem['type']) || 'milestone',
            read: Boolean(d.read),
            targetRoute: String(d.targetRoute || '/dashboard'),
            createdAt: toIsoDateString(d.createdAt),
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        // Load streak doc
        try {
          const streakSnap = await getDoc(doc(db, 'learningStreaks', uid));
          if (streakSnap.exists()) {
            const st = streakSnap.data();
            workspace.streak = {
              currentStreak: Number(st.currentStreak || 0),
              longestStreak: Number(st.longestStreak || 0),
              activeDates: Array.isArray(st.activeDates) ? st.activeDates.map(String) : [],
              totalCompletedTasks: Number(st.totalCompletedTasks || 0),
            };
          }
        } catch {
          // Streak doc not created yet
        }

        const earnedDates: Record<string, string> = {};
        const synced = new Set<string>();
        for (const a of rawEarnedAch) {
          const code = String(a.achievementCode || '');
          const earnedDate = String(a.earnedDate || '');
          if (code && earnedDate) {
            earnedDates[code] = earnedDate;
            synced.add(code);
          }
        }
        syncedAchievementsRef.current = synced;

        workspace = {
          ...workspace,
          skills,
          academics,
          projects,
          certifications,
          activities,
          recommendations,
          roadmap: roadmaps[0] ?? null,
          actionTasks,
          interviews,
          progressHistory,
          notifications,
          earnedAchievementDates: earnedDates,
        };

        if (!cancelled) setData(workspace);
      } catch (err) {
        console.error('Failed to load Firestore workspace:', err);
        if (!cancelled) {
          pushToast('error', 'Could not load all cloud records. Verify your account or retry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isDemoMode, activeUserId, pendingRegistration, clearPendingRegistration, pushToast]);

  // Persist demo changes to sessionStorage only (isolated from real Firestore)
  useEffect(() => {
    if (isDemoMode) {
      try {
        window.sessionStorage.setItem('studentpulse_demo_state', JSON.stringify(data));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [data, isDemoMode]);

  const primaryCareer = useMemo(() => {
    return (
      data.customCareers.find((c) => c.id === data.profile.primaryCareerId) ??
      DEFAULT_CAREER_PATHS[0]
    );
  }, [data.customCareers, data.profile.primaryCareerId]);

  const readiness = useMemo(
    () =>
      calculateCareerReadiness({
        skills: data.skills,
        academics: data.academics,
        projects: data.projects,
        certifications: data.certifications,
        activities: data.activities,
        interviews: data.interviews,
        actionTasks: data.actionTasks,
        roadmap: data.roadmap,
        streak: data.streak,
        career: primaryCareer,
        weights: data.weights,
        thresholds: data.thresholds,
      }),
    [data, primaryCareer]
  );

  const academicsAnalytics = useMemo(() => analyzeAcademics(data.academics), [data.academics]);

  const achievements = useMemo(
    () =>
      evaluateAchievements({
        profile: data.profile,
        skills: data.skills,
        projects: data.projects,
        interviews: data.interviews,
        roadmap: data.roadmap,
        streak: data.streak,
        readiness,
        thresholds: data.thresholds,
        earnedDates: data.earnedAchievementDates,
      }),
    [data, readiness]
  );

  const canWriteFirestore = Boolean(firebaseUser && !isDemoMode && firebaseUser.emailVerified);

  // Persist newly earned qualifying achievements to Firestore studentAchievements
  useEffect(() => {
    if (!canWriteFirestore || !firebaseUser || loading) return;
    const newlyEarned = achievements.filter(
      (a) => a.earned && !syncedAchievementsRef.current.has(a.code)
    );
    if (newlyEarned.length === 0) return;

    const uid = firebaseUser.uid;
    const todayIso = new Date().toISOString().slice(0, 10);
    const addedDates: Record<string, string> = {};

    for (const ach of newlyEarned) {
      syncedAchievementsRef.current.add(ach.code);
      const earnedDate = ach.earnedDate || todayIso;
      addedDates[ach.code] = earnedDate;
      const docId = `${uid}_${ach.code}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      setDoc(doc(db, 'studentAchievements', docId), {
        userId: uid,
        achievementCode: ach.code.slice(0, 60),
        earnedDate,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        console.error('Achievement sync error:', err);
      });
    }

    setData((prev) => ({
      ...prev,
      earnedAchievementDates: { ...prev.earnedAchievementDates, ...addedDates },
    }));
  }, [achievements, canWriteFirestore, firebaseUser, loading]);

  const recordQualifyingActivity = useCallback(
    async (note: string) => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const nextDates = Array.from(new Set([...data.streak.activeDates, todayIso])).slice(-365);
      const { currentStreak, longestStreak } = computeLearningStreak(nextDates, todayIso);
      const nextTotalTasks = data.streak.totalCompletedTasks + 1;
      const progressDocId = makeSafeDocId('prog');

      setData((prev) => {
        const prevDates = Array.from(new Set([...prev.streak.activeDates, todayIso])).slice(-365);
        const computed = computeLearningStreak(prevDates, todayIso);
        const nextStreak = {
          currentStreak: computed.currentStreak,
          longestStreak: Math.max(computed.longestStreak, prev.streak.longestStreak),
          activeDates: prevDates,
          totalCompletedTasks: prev.streak.totalCompletedTasks + 1,
        };
        const snap = {
          id: progressDocId,
          date: todayIso,
          readinessScore: readiness.overallScore,
          skillMatchScore: readiness.technicalSkillMatchScore ?? 0,
          tasksCompleted: nextStreak.totalCompletedTasks,
          interviewAvg:
            prev.interviews.length > 0
              ? Math.round(
                  prev.interviews.reduce((s, i) => s + i.overallScore, 0) / prev.interviews.length
                )
              : null,
          note,
        };
        const updatedHistory = [...prev.progressHistory.filter((h) => h.date !== todayIso), snap];
        return {
          ...prev,
          streak: nextStreak,
          progressHistory: updatedHistory,
        };
      });

      if (canWriteFirestore && firebaseUser) {
        const uid = firebaseUser.uid;
        try {
          await setDoc(doc(db, 'learningStreaks', uid), {
            userId: uid,
            currentStreak,
            longestStreak: Math.max(longestStreak, data.streak.longestStreak),
            activeDates: nextDates,
            totalCompletedTasks: nextTotalTasks,
            updatedAt: serverTimestamp(),
          });
          await setDoc(doc(db, 'progressRecords', progressDocId), {
            userId: uid,
            date: todayIso,
            readinessScore: readiness.overallScore,
            skillMatchScore: readiness.technicalSkillMatchScore ?? 0,
            tasksCompleted: nextTotalTasks,
            note: note.slice(0, 300),
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Streak/progress sync error:', err);
        }
      }
    },
    [canWriteFirestore, firebaseUser, data.streak, readiness.overallScore, readiness.technicalSkillMatchScore]
  );

  const addNotificationLocal = useCallback(
    async (notif: Omit<NotificationItem, 'id' | 'userId' | 'createdAt' | 'read'>) => {
      const id = makeSafeDocId('notif');
      const uid = activeUserId || 'demo';
      const item: NotificationItem = {
        ...notif,
        id,
        userId: uid,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        notifications: [item, ...prev.notifications].slice(0, 40),
      }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'notifications', id), {
            userId: firebaseUser.uid,
            title: item.title.slice(0, 160),
            message: item.message.slice(0, 500),
            type: item.type,
            read: false,
            targetRoute: item.targetRoute.slice(0, 100),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Notification write failed:', err);
        }
      }
    },
    [activeUserId, canWriteFirestore, firebaseUser]
  );

  const updateProfile = useCallback(
    async (patch: Partial<StudentProfile>) => {
      const updated = {
        ...data.profile,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, profile: updated }));

      if (canWriteFirestore && firebaseUser) {
        const uid = firebaseUser.uid;
        const profileRef = doc(db, 'studentProfiles', uid);
        const editableFields = {
          fullName: (updated.fullName || 'Student').slice(0, 120),
          email: (updated.email || firebaseUser.email || '').slice(0, 254),
          collegeName: (updated.collegeName || 'University').slice(0, 200),
          course: (updated.course || 'MCA').slice(0, 80),
          currentSemester: Number(updated.currentSemester) || 1,
          graduationYear: Number(updated.graduationYear) || 2027,
          bio: (updated.bio || '').slice(0, 1000),
          githubUrl: (updated.githubUrl || '').slice(0, 300),
          linkedinUrl: (updated.linkedinUrl || '').slice(0, 300),
          avatarUrl: (updated.avatarUrl || '').slice(0, 500),
          onboardingCompleted: Boolean(updated.onboardingCompleted),
          interviewExperienceLevel: (updated.interviewExperienceLevel || 'None yet').slice(0, 60),
          primaryCareerId: updated.primaryCareerId,
          secondaryCareerIds: updated.secondaryCareerIds.slice(0, 8),
          updatedAt: serverTimestamp(),
        };
        try {
          let exists = profileDocExistsRef.current;
          if (!exists) {
            const snap = await getDoc(profileRef);
            exists = snap.exists();
            profileDocExistsRef.current = exists;
          }
          if (exists) {
            await updateDoc(profileRef, editableFields);
          } else {
            await setDoc(doc(db, 'users', uid), {
              userId: uid,
              email: editableFields.email || 'student@example.com',
              displayName: editableFields.fullName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            await setDoc(profileRef, {
              userId: uid,
              ...editableFields,
              createdAt: serverTimestamp(),
            });
            profileDocExistsRef.current = true;
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `studentProfiles/${uid}`);
        }
      }
      pushToast('success', 'Student profile updated.');
    },
    [data.profile, canWriteFirestore, firebaseUser, pushToast]
  );

  const setPrimaryCareer = useCallback(
    async (careerId: string) => {
      const found = data.customCareers.find((c) => c.id === careerId);
      if (!found) return;
      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          primaryCareerId: careerId,
          updatedAt: new Date().toISOString(),
        },
      }));
      if (canWriteFirestore && firebaseUser) {
        const uid = firebaseUser.uid;
        try {
          await updateDoc(doc(db, 'studentProfiles', uid), {
            primaryCareerId: careerId,
            secondaryCareerIds: data.profile.secondaryCareerIds,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Update career error:', err);
        }
      }
      pushToast('success', `Primary career goal set to ${found.title}. Skill-gap analysis refreshed.`);
    },
    [data.customCareers, data.profile.secondaryCareerIds, canWriteFirestore, firebaseUser, pushToast]
  );

  const toggleSecondaryCareer = useCallback(
    async (careerId: string) => {
      const current = data.profile.secondaryCareerIds;
      const next = current.includes(careerId)
        ? current.filter((id) => id !== careerId)
        : [...current, careerId].slice(0, 5);
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, secondaryCareerIds: next, updatedAt: new Date().toISOString() },
      }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await updateDoc(doc(db, 'studentProfiles', firebaseUser.uid), {
            primaryCareerId: data.profile.primaryCareerId,
            secondaryCareerIds: next,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Secondary career update error:', err);
        }
      }
    },
    [data.profile.primaryCareerId, data.profile.secondaryCareerIds, canWriteFirestore, firebaseUser]
  );

  const updateCareerSkillRequirement = useCallback(
    (careerId: string, skillName: string, requiredScore: number) => {
      const clamped = Math.max(20, Math.min(100, Math.round(requiredScore)));
      setData((prev) => ({
        ...prev,
        customCareers: prev.customCareers.map((c) =>
          c.id !== careerId
            ? c
            : {
                ...c,
                requiredSkills: c.requiredSkills.map((rs) =>
                  rs.name === skillName ? { ...rs, requiredScore: clamped } : rs
                ),
              }
        ),
      }));
      pushToast('info', `Updated ${skillName} benchmark to ${clamped}%.`);
    },
    [pushToast]
  );

  const addSkill = useCallback(
    async (skill: Omit<StudentSkill, 'id' | 'userId' | 'updatedAt'>) => {
      const id = makeSafeDocId('skill');
      const uid = activeUserId || 'demo';
      const today = new Date().toISOString().slice(0, 10);
      const item: StudentSkill = { ...skill, id, userId: uid, updatedAt: today };
      setData((prev) => ({ ...prev, skills: [item, ...prev.skills] }));

      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'studentSkills', id), {
            userId: firebaseUser.uid,
            name: item.name.slice(0, 100),
            category: (item.category || 'Technical').slice(0, 60),
            selfReportedLevel: item.selfReportedLevel,
            selfReportedScore: item.selfReportedScore,
            assessmentScore: item.assessmentScore,
            previousAssessmentScore: item.previousAssessmentScore ?? null,
            evidenceUrl: (item.evidenceUrl || '').slice(0, 400),
            notes: (item.notes || '').slice(0, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `studentSkills/${id}`);
        }
      }
      pushToast('success', `Added skill "${item.name}".`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast]
  );

  const updateSkill = useCallback(
    async (id: string, patch: Partial<StudentSkill>) => {
      const existing = data.skills.find((s) => s.id === id);
      if (!existing) return;
      const previousAssessmentScore =
        typeof patch.assessmentScore === 'number' &&
        typeof existing.assessmentScore === 'number' &&
        patch.assessmentScore !== existing.assessmentScore
          ? existing.assessmentScore
          : existing.previousAssessmentScore ?? null;

      const updated: StudentSkill = {
        ...existing,
        ...patch,
        previousAssessmentScore,
        updatedAt: new Date().toISOString().slice(0, 10),
      };

      setData((prev) => ({
        ...prev,
        skills: prev.skills.map((s) => (s.id === id ? updated : s)),
      }));

      if (
        typeof updated.assessmentScore === 'number' &&
        typeof previousAssessmentScore === 'number' &&
        updated.assessmentScore > previousAssessmentScore
      ) {
        await addNotificationLocal({
          title: `Skill Improved: ${updated.name}`,
          message: `Assessment score rose from ${previousAssessmentScore}% to ${updated.assessmentScore}%.`,
          type: 'milestone',
          targetRoute: '/dashboard/skill-gap',
        });
      }

      if (canWriteFirestore && firebaseUser) {
        try {
          await updateDoc(doc(db, 'studentSkills', id), {
            name: updated.name.slice(0, 100),
            category: (updated.category || 'Technical').slice(0, 60),
            selfReportedLevel: updated.selfReportedLevel,
            selfReportedScore: updated.selfReportedScore,
            assessmentScore: updated.assessmentScore,
            previousAssessmentScore: updated.previousAssessmentScore ?? null,
            evidenceUrl: (updated.evidenceUrl || '').slice(0, 400),
            notes: (updated.notes || '').slice(0, 500),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `studentSkills/${id}`);
        }
      }
      pushToast('success', `Updated "${updated.name}".`);
    },
    [data.skills, canWriteFirestore, firebaseUser, pushToast, addNotificationLocal]
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'studentSkills', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `studentSkills/${id}`);
        }
      }
      pushToast('info', 'Skill removed.');
    },
    [canWriteFirestore, pushToast]
  );

  const addAcademicRecord = useCallback(
    async (rec: Omit<AcademicRecord, 'id' | 'userId'>) => {
      const id = makeSafeDocId('acad');
      const uid = activeUserId || 'demo';
      const item: AcademicRecord = { ...rec, id, userId: uid };
      setData((prev) => ({ ...prev, academics: [item, ...prev.academics] }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'academicRecords', id), {
            userId: firebaseUser.uid,
            semester: item.semester,
            subject: item.subject.slice(0, 120),
            marksObtained: item.marksObtained,
            maxMarks: item.maxMarks,
            assessmentType: item.assessmentType,
            assessmentDate: item.assessmentDate,
            credits: item.credits ?? 4,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `academicRecords/${id}`);
        }
      }
      pushToast('success', `Saved academic record for ${item.subject}.`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast]
  );

  const updateAcademicRecord = useCallback(
    async (id: string, patch: Partial<AcademicRecord>) => {
      const existing = data.academics.find((r) => r.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };
      setData((prev) => ({
        ...prev,
        academics: prev.academics.map((r) => (r.id === id ? updated : r)),
      }));
      if (canWriteFirestore) {
        try {
          await updateDoc(doc(db, 'academicRecords', id), {
            semester: updated.semester,
            subject: updated.subject.slice(0, 120),
            marksObtained: updated.marksObtained,
            maxMarks: updated.maxMarks,
            assessmentType: updated.assessmentType,
            assessmentDate: updated.assessmentDate,
            credits: updated.credits ?? 4,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `academicRecords/${id}`);
        }
      }
      pushToast('success', 'Academic record updated.');
    },
    [data.academics, canWriteFirestore, pushToast]
  );

  const deleteAcademicRecord = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, academics: prev.academics.filter((r) => r.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'academicRecords', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `academicRecords/${id}`);
        }
      }
      pushToast('info', 'Academic record deleted.');
    },
    [canWriteFirestore, pushToast]
  );

  const addProject = useCallback(
    async (project: Omit<ProjectItem, 'id' | 'userId'>) => {
      const id = makeSafeDocId('proj');
      const uid = activeUserId || 'demo';
      const item: ProjectItem = { ...project, id, userId: uid };
      setData((prev) => ({ ...prev, projects: [item, ...prev.projects] }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'projects', id), {
            userId: firebaseUser.uid,
            name: item.name.slice(0, 150),
            description: item.description.slice(0, 1500),
            category: item.category.slice(0, 80),
            technologies: item.technologies.slice(0, 20),
            githubUrl: (item.githubUrl || '').slice(0, 400),
            liveUrl: (item.liveUrl || '').slice(0, 400),
            startDate: item.startDate,
            completionDate: item.completionDate || '',
            status: item.status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `projects/${id}`);
        }
      }
      if (item.status === 'Completed') {
        await recordQualifyingActivity(`Completed project: ${item.name}`);
      }
      pushToast('success', `Added project "${item.name}".`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast, recordQualifyingActivity]
  );

  const updateProject = useCallback(
    async (id: string, patch: Partial<ProjectItem>) => {
      const existing = data.projects.find((p) => p.id === id);
      if (!existing) return;
      const becomingCompleted = existing.status !== 'Completed' && patch.status === 'Completed';
      const updated = { ...existing, ...patch };
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? updated : p)),
      }));
      if (canWriteFirestore) {
        try {
          await updateDoc(doc(db, 'projects', id), {
            name: updated.name.slice(0, 150),
            description: updated.description.slice(0, 1500),
            category: updated.category.slice(0, 80),
            technologies: updated.technologies.slice(0, 20),
            githubUrl: (updated.githubUrl || '').slice(0, 400),
            liveUrl: (updated.liveUrl || '').slice(0, 400),
            startDate: updated.startDate,
            completionDate: updated.completionDate || '',
            status: updated.status,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
        }
      }
      if (becomingCompleted) {
        await recordQualifyingActivity(`Completed project: ${updated.name}`);
      }
      pushToast('success', `Updated project "${updated.name}".`);
    },
    [data.projects, canWriteFirestore, pushToast, recordQualifyingActivity]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'projects', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
        }
      }
      pushToast('info', 'Project deleted.');
    },
    [canWriteFirestore, pushToast]
  );

  const addCertification = useCallback(
    async (cert: Omit<CertificationItem, 'id' | 'userId'>) => {
      const id = makeSafeDocId('cert');
      const uid = activeUserId || 'demo';
      const item: CertificationItem = { ...cert, id, userId: uid };
      setData((prev) => ({ ...prev, certifications: [item, ...prev.certifications] }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'certifications', id), {
            userId: firebaseUser.uid,
            name: item.name.slice(0, 150),
            issuer: item.issuer.slice(0, 150),
            issueDate: item.issueDate,
            credentialUrl: (item.credentialUrl || '').slice(0, 400),
            relatedSkills: item.relatedSkills.slice(0, 15),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `certifications/${id}`);
        }
      }
      pushToast('success', `Added certification "${item.name}".`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast]
  );

  const deleteCertification = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, certifications: prev.certifications.filter((c) => c.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'certifications', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `certifications/${id}`);
        }
      }
      pushToast('info', 'Certification removed.');
    },
    [canWriteFirestore, pushToast]
  );

  const addActivity = useCallback(
    async (act: Omit<ActivityItem, 'id' | 'userId'>) => {
      const id = makeSafeDocId('act');
      const uid = activeUserId || 'demo';
      const item: ActivityItem = { ...act, id, userId: uid };
      setData((prev) => ({ ...prev, activities: [item, ...prev.activities] }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'activities', id), {
            userId: firebaseUser.uid,
            title: item.title.slice(0, 150),
            type: item.type,
            organization: item.organization.slice(0, 150),
            date: item.date,
            description: item.description.slice(0, 1000),
            relatedSkills: item.relatedSkills.slice(0, 15),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `activities/${id}`);
        }
      }
      pushToast('success', `Logged activity "${item.title}".`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, activities: prev.activities.filter((a) => a.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'activities', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `activities/${id}`);
        }
      }
      pushToast('info', 'Activity removed.');
    },
    [canWriteFirestore, pushToast]
  );

  const saveRecommendations = useCallback(
    async (items: RecommendationItem[]) => {
      const uid = activeUserId || 'demo';
      const prepared = items.map((rec) => ({
        ...rec,
        id: makeSafeDocId('rec'),
        userId: uid,
      }));
      setData((prev) => ({ ...prev, recommendations: prepared }));
      await addNotificationLocal({
        title: `Generated ${prepared.length} New Career Recommendations`,
        message: `Personalized guidance created for ${primaryCareer.title}. Review and add items to your Action Plan.`,
        type: 'recommendation',
        targetRoute: '/dashboard/recommendations',
      });
      if (canWriteFirestore && firebaseUser) {
        for (const rec of prepared) {
          try {
            await setDoc(doc(db, 'recommendations', rec.id), {
              userId: firebaseUser.uid,
              title: rec.title.slice(0, 200),
              explanation: rec.explanation.slice(0, 1500),
              relatedSkill: rec.relatedSkill.slice(0, 100),
              reason: rec.reason.slice(0, 600),
              priority: rec.priority,
              difficulty: rec.difficulty,
              estimatedTime: rec.estimatedTime.slice(0, 80),
              expectedOutcome: rec.expectedOutcome.slice(0, 600),
              suggestedNextAction: rec.suggestedNextAction.slice(0, 500),
              source: rec.source,
              addedToActionPlan: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.error('Failed saving recommendation:', err);
          }
        }
      }
    },
    [activeUserId, primaryCareer.title, canWriteFirestore, firebaseUser, addNotificationLocal]
  );

  const addActionTask = useCallback(
    async (task: Omit<ActionPlanTask, 'id' | 'userId' | 'createdAt'>) => {
      const id = makeSafeDocId('task');
      const uid = activeUserId || 'demo';
      const item: ActionPlanTask = {
        ...task,
        id,
        userId: uid,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({ ...prev, actionTasks: [item, ...prev.actionTasks] }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'actionPlanTasks', id), {
            userId: firebaseUser.uid,
            title: item.title.slice(0, 200),
            description: item.description.slice(0, 1000),
            category: item.category,
            relatedSkill: item.relatedSkill.slice(0, 100),
            dueDate: item.dueDate,
            priority: item.priority,
            estimatedDuration: item.estimatedDuration.slice(0, 60),
            status: item.status,
            notes: item.notes.slice(0, 1000),
            completedAt: item.completedAt || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `actionPlanTasks/${id}`);
        }
      }
      pushToast('success', `Added task "${item.title}" to Action Plan.`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast]
  );

  const addRecommendationToActionPlan = useCallback(
    async (recId: string) => {
      const rec = data.recommendations.find((r) => r.id === recId);
      if (!rec) return;
      const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      await addActionTask({
        title: rec.title,
        description: rec.suggestedNextAction || rec.explanation,
        category: rec.relatedSkill.toLowerCase().includes('interview')
          ? 'Interview Preparation'
          : 'Learning Activities',
        relatedSkill: rec.relatedSkill,
        dueDate,
        priority: rec.priority,
        estimatedDuration: rec.estimatedTime,
        status: 'Not Started',
        notes: rec.expectedOutcome,
      });
      setData((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, addedToActionPlan: true } : r
        ),
      }));
      if (canWriteFirestore) {
        try {
          await updateDoc(doc(db, 'recommendations', recId), {
            addedToActionPlan: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Recommendation flag update error:', err);
        }
      }
    },
    [data.recommendations, addActionTask, canWriteFirestore]
  );

  const updateActionTask = useCallback(
    async (id: string, patch: Partial<ActionPlanTask>) => {
      const existing = data.actionTasks.find((t) => t.id === id);
      if (!existing) return;
      const becomingCompleted = patch.status === 'Completed' && existing.status !== 'Completed';
      const updated: ActionPlanTask = {
        ...existing,
        ...patch,
        completedAt:
          patch.status === 'Completed'
            ? existing.completedAt || new Date().toISOString().slice(0, 10)
            : patch.status
              ? undefined
              : existing.completedAt,
      };
      setData((prev) => ({
        ...prev,
        actionTasks: prev.actionTasks.map((t) => (t.id === id ? updated : t)),
      }));

      if (becomingCompleted) {
        await recordQualifyingActivity(`Completed action task: ${updated.title}`);
        pushToast('success', `Completed "${updated.title}". Progress & streak updated.`);
      }

      if (canWriteFirestore) {
        try {
          await updateDoc(doc(db, 'actionPlanTasks', id), {
            title: updated.title.slice(0, 200),
            description: updated.description.slice(0, 1000),
            category: updated.category,
            relatedSkill: updated.relatedSkill.slice(0, 100),
            dueDate: updated.dueDate,
            priority: updated.priority,
            estimatedDuration: updated.estimatedDuration.slice(0, 60),
            status: updated.status,
            notes: updated.notes.slice(0, 1000),
            completedAt: updated.completedAt || '',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `actionPlanTasks/${id}`);
        }
      }
    },
    [data.actionTasks, canWriteFirestore, pushToast, recordQualifyingActivity]
  );

  const deleteActionTask = useCallback(
    async (id: string) => {
      setData((prev) => ({ ...prev, actionTasks: prev.actionTasks.filter((t) => t.id !== id) }));
      if (canWriteFirestore) {
        try {
          await deleteDoc(doc(db, 'actionPlanTasks', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `actionPlanTasks/${id}`);
        }
      }
      pushToast('info', 'Task removed from Action Plan.');
    },
    [canWriteFirestore, pushToast]
  );

  const saveRoadmap = useCallback(
    async (roadmap: LearningRoadmap) => {
      const id = makeSafeDocId('roadmap');
      const uid = activeUserId || 'demo';
      const prepared: LearningRoadmap = {
        ...roadmap,
        id,
        userId: uid,
      };
      setData((prev) => ({ ...prev, roadmap: prepared }));
      await addNotificationLocal({
        title: `New ${prepared.durationDays}-Day Roadmap Active`,
        message: `Generated ${prepared.tasks.length} structured milestones for ${prepared.careerTitle}.`,
        type: 'roadmap',
        targetRoute: '/dashboard/roadmap',
      });
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'learningRoadmaps', id), {
            userId: firebaseUser.uid,
            careerId: prepared.careerId,
            careerTitle: prepared.careerTitle.slice(0, 100),
            durationDays: prepared.durationDays,
            status: prepared.status,
            source: prepared.source,
            tasks: prepared.tasks,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Roadmap save error:', err);
        }
      }
      pushToast('success', `${prepared.durationDays}-Day learning roadmap ready.`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast, addNotificationLocal]
  );

  const toggleRoadmapTask = useCallback(
    async (taskId: string) => {
      if (!data.roadmap) return;
      const target = data.roadmap.tasks.find((t) => t.id === taskId);
      if (!target) return;
      const previousStatus = data.roadmap.status;
      const nowCompleted = !target.completed;
      const nextTasks = data.roadmap.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: nowCompleted,
              completedAt: nowCompleted ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : t
      );
      const allDone = nextTasks.length > 0 && nextTasks.every((t) => t.completed);
      const nextStatus: LearningRoadmap['status'] = allDone ? 'Completed' : data.roadmap.status;
      const nextRoadmap: LearningRoadmap = {
        ...data.roadmap,
        tasks: nextTasks,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, roadmap: nextRoadmap }));

      if (canWriteFirestore && previousStatus !== 'Completed') {
        try {
          await updateDoc(doc(db, 'learningRoadmaps', data.roadmap.id), {
            tasks: nextTasks,
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Roadmap task update error:', err);
        }
      }

      if (nowCompleted) {
        await recordQualifyingActivity(`Completed roadmap milestone: ${target.topic}`);
        if (allDone) {
          await addNotificationLocal({
            title: 'Achievement Unlocked: Roadmap Finisher',
            message: `You completed 100% of your ${nextRoadmap.durationDays}-Day ${nextRoadmap.careerTitle} roadmap.`,
            type: 'achievement',
            targetRoute: '/dashboard/achievements',
          });
        }
      }
    },
    [data.roadmap, canWriteFirestore, recordQualifyingActivity, addNotificationLocal]
  );

  const setRoadmapStatus = useCallback(
    async (status: LearningRoadmap['status']) => {
      if (!data.roadmap) return;
      const previousStatus = data.roadmap.status;
      setData((prev) =>
        prev.roadmap
          ? { ...prev, roadmap: { ...prev.roadmap, status, updatedAt: new Date().toISOString() } }
          : prev
      );
      if (canWriteFirestore && previousStatus !== 'Completed') {
        try {
          await updateDoc(doc(db, 'learningRoadmaps', data.roadmap.id), {
            status,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Roadmap status update error:', err);
        }
      }
      pushToast('info', `Roadmap status updated to ${status}.`);
    },
    [data.roadmap, canWriteFirestore, pushToast]
  );

  const saveInterviewSession = useCallback(
    async (session: InterviewSession) => {
      const id = makeSafeDocId('int');
      const uid = activeUserId || 'demo';
      const prepared: InterviewSession = {
        ...session,
        id,
        userId: uid,
      };
      setData((prev) => ({ ...prev, interviews: [prepared, ...prev.interviews] }));
      await recordQualifyingActivity(`Completed ${prepared.topic} mock interview (${prepared.overallScore}/100)`);
      await addNotificationLocal({
        title: `Mock Interview Feedback Ready (${prepared.overallScore}/100)`,
        message: `Completed ${prepared.questionsCount} question(s) on ${prepared.topic} for ${prepared.role}.`,
        type: 'interview',
        targetRoute: '/dashboard/interview',
      });
      if (canWriteFirestore && firebaseUser) {
        try {
          await setDoc(doc(db, 'interviews', id), {
            userId: firebaseUser.uid,
            role: prepared.role.slice(0, 100),
            topic: prepared.topic.slice(0, 100),
            difficulty: prepared.difficulty,
            overallScore: prepared.overallScore,
            questionsCount: prepared.questionsCount,
            strongTopics: prepared.strongTopics.slice(0, 10),
            weakTopics: prepared.weakTopics.slice(0, 10),
            source: prepared.source,
            completedAt: prepared.completedAt,
            createdAt: serverTimestamp(),
          });
          for (const ev of prepared.evaluations) {
            const fbId = makeSafeDocId('fb');
            await setDoc(doc(db, 'interviewFeedback', fbId), {
              userId: firebaseUser.uid,
              interviewId: id,
              topic: (ev.topic || prepared.topic).slice(0, 100),
              question: ev.question.slice(0, 1000),
              userAnswer: ev.userAnswer.slice(0, 4000),
              score: ev.score,
              strengths: ev.strengths.slice(0, 8),
              weaknesses: ev.weaknesses.slice(0, 8),
              improvements: ev.improvements.slice(0, 8),
              exampleAnswer: (ev.exampleAnswer || '').slice(0, 3000),
              conceptExplanation: (ev.conceptExplanation || '').slice(0, 3000),
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error('Interview save error:', err);
        }
      }
      pushToast('success', `Interview session saved (${prepared.overallScore}/100).`);
    },
    [activeUserId, canWriteFirestore, firebaseUser, pushToast, recordQualifyingActivity, addNotificationLocal]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
      if (canWriteFirestore) {
        try {
          await updateDoc(doc(db, 'notifications', id), {
            read: true,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Ignore if local notification
        }
      }
    },
    [canWriteFirestore]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const unreadIds = data.notifications.filter((n) => !n.read).map((n) => n.id);
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    if (canWriteFirestore && unreadIds.length > 0) {
      await Promise.allSettled(
        unreadIds.map((id) =>
          updateDoc(doc(db, 'notifications', id), {
            read: true,
            updatedAt: serverTimestamp(),
          })
        )
      );
    }
    pushToast('info', 'All notifications marked as read.');
  }, [data.notifications, canWriteFirestore, pushToast]);

  const updateSettings = useCallback(
    async (weights: ReadinessWeights, thresholds: SkillThresholds) => {
      setData((prev) => ({ ...prev, weights, thresholds }));
      if (canWriteFirestore && firebaseUser) {
        try {
          await updateDoc(doc(db, 'studentProfiles', firebaseUser.uid), {
            weightsJson: JSON.stringify(weights),
            thresholdsJson: JSON.stringify(thresholds),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Settings sync error:', err);
        }
      }
      pushToast('success', 'Analytics weights & thresholds updated.');
    },
    [canWriteFirestore, firebaseUser, pushToast]
  );

  const resetSettings = useCallback(async () => {
    await updateSettings({ ...DEFAULT_WEIGHTS }, { ...DEFAULT_THRESHOLDS });
  }, [updateSettings]);

  const resetDemoWorkspace = useCallback(() => {
    const fresh = createDemoWorkspace();
    setData(fresh);
    window.sessionStorage.removeItem('studentpulse_demo_state');
    pushToast('info', 'Sample Rahul Sharma workspace reset to initial demo data.');
  }, [pushToast]);

  const unreadNotificationsCount = useMemo(
    () => data.notifications.filter((n) => !n.read).length,
    [data.notifications]
  );

  return (
    <StudentDataContext.Provider
      value={{
        data,
        loading,
        isDemoMode,
        primaryCareer,
        readiness,
        academicsAnalytics,
        achievements,
        unreadNotificationsCount,
        toasts,
        pushToast,
        dismissToast,
        updateProfile,
        setPrimaryCareer,
        toggleSecondaryCareer,
        updateCareerSkillRequirement,
        addSkill,
        updateSkill,
        deleteSkill,
        addAcademicRecord,
        updateAcademicRecord,
        deleteAcademicRecord,
        addProject,
        updateProject,
        deleteProject,
        addCertification,
        deleteCertification,
        addActivity,
        deleteActivity,
        saveRecommendations,
        addRecommendationToActionPlan,
        saveRoadmap,
        toggleRoadmapTask,
        setRoadmapStatus,
        addActionTask,
        updateActionTask,
        deleteActionTask,
        saveInterviewSession,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        resetSettings,
        resetDemoWorkspace,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudentData must be used inside StudentDataProvider');
  return ctx;
}
