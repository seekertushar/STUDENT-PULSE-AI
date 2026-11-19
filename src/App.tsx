import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentDataProvider } from './context/StudentDataContext';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { CareerGoalsPage } from './pages/dashboard/CareerGoalsPage';
import { SkillsPage } from './pages/dashboard/SkillsPage';
import { AcademicsPage } from './pages/dashboard/AcademicsPage';
import { PortfolioPage } from './pages/dashboard/PortfolioPage';
import { SkillGapPage } from './pages/dashboard/SkillGapPage';
import { RecommendationsPage } from './pages/dashboard/RecommendationsPage';
import { RoadmapPage } from './pages/dashboard/RoadmapPage';
import { ActionPlanPage } from './pages/dashboard/ActionPlanPage';
import { InterviewPage } from './pages/dashboard/InterviewPage';
import { CareerComparisonPage } from './pages/dashboard/CareerComparisonPage';
import { AchievementsPage } from './pages/dashboard/AchievementsPage';
import { ProgressPage } from './pages/dashboard/ProgressPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B1324] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#3267D5] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Loading StudentPulse AI workspace…
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function LandingOrAutostart() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('autostart') === '1') {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StudentDataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingOrAutostart />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<OverviewPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="career-goals" element={<CareerGoalsPage />} />
                  <Route path="skills" element={<SkillsPage />} />
                  <Route path="academics" element={<AcademicsPage />} />
                  <Route path="portfolio" element={<PortfolioPage />} />
                  <Route path="skill-gap" element={<SkillGapPage />} />
                  <Route path="recommendations" element={<RecommendationsPage />} />
                  <Route path="roadmap" element={<RoadmapPage />} />
                  <Route path="action-plan" element={<ActionPlanPage />} />
                  <Route path="interview" element={<InterviewPage />} />
                  <Route path="compare" element={<CareerComparisonPage />} />
                  <Route path="achievements" element={<AchievementsPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </StudentDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
