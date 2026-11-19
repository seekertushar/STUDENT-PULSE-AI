import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Compass,
  FolderGit2,
  GitCompare,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LogOut,
  Map,
  Menu,
  MessageSquareCode,
  Moon,
  Settings,
  Sliders,
  Sun,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { useTheme } from '../context/ThemeContext';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/profile', label: 'My Profile', icon: User },
      { to: '/dashboard/career-goals', label: 'Career Goals', icon: Compass },
    ],
  },
  {
    label: 'Portfolio & Evidence',
    items: [
      { to: '/dashboard/skills', label: 'My Skills', icon: Sliders },
      { to: '/dashboard/academics', label: 'Academic Performance', icon: GraduationCap },
      { to: '/dashboard/portfolio', label: 'Projects & Certifications', icon: FolderGit2 },
    ],
  },
  {
    label: 'Analysis & AI Guidance',
    items: [
      { to: '/dashboard/skill-gap', label: 'Skill-Gap Analysis', icon: Briefcase },
      { to: '/dashboard/recommendations', label: 'AI Recommendations', icon: Lightbulb },
      { to: '/dashboard/roadmap', label: 'Learning Roadmap', icon: Map },
      { to: '/dashboard/action-plan', label: 'My Action Plan', icon: ClipboardList },
      { to: '/dashboard/interview', label: 'Interview Preparation', icon: MessageSquareCode },
      { to: '/dashboard/compare', label: 'Career Comparison', icon: GitCompare },
    ],
  },
  {
    label: 'Growth & Account',
    items: [
      { to: '/dashboard/achievements', label: 'Achievements', icon: Award },
      { to: '/dashboard/progress', label: 'Progress Tracking', icon: TrendingUp },
      { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function DashboardLayout() {
  const { logout, isDemoMode, firebaseUser, resendVerificationEmail, refreshAuthUser } = useAuth();
  const { data, loading, primaryCareer, unreadNotificationsCount, toasts, pushToast, dismissToast } =
    useStudentData();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [checkingVerify, setCheckingVerify] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    navigate('/');
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      await resendVerificationEmail();
      pushToast('success', 'Verification email sent. Please check your inbox or spam folder.');
    } catch {
      pushToast('error', 'Could not send verification email right now. Please try again shortly.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerify(true);
    try {
      const verified = await refreshAuthUser();
      if (verified) {
        pushToast('success', 'Email verified! Cloud Firestore sync is now active.');
      } else {
        pushToast('info', 'Email is still pending verification. Click the link in your inbox first.');
      }
    } catch {
      pushToast('error', 'Could not refresh verification status.');
    } finally {
      setCheckingVerify(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#111C33] border-r border-slate-200 dark:border-slate-800">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link to="/dashboard" className="focus:outline-none" onClick={() => setMobileMenuOpen(false)}>
          <BrandLogo />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation drawer"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#EAF1FF] dark:bg-[#1C2F59] text-[#142B53] dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-[#142B53] dark:hover:text-white'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.label === 'Notifications' && unreadNotificationsCount > 0 && (
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#3267D5] dark:text-[#26C6DA]">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#E35D6A] dark:hover:text-[#E35D6A] hover:bg-red-50/70 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F6F8FC] dark:bg-[#0B1324] text-[#202B3C] dark:text-[#E6ECF5]">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {isDemoMode && (
          <div className="bg-[#142B53] text-white px-4 sm:px-6 py-2 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#26C6DA] shrink-0" />
              <span>
                <strong>Sample Demonstration Account</strong> — Fictional profile for Rahul Sharma
                (MCA, SPPU Pune · Java Developer). Isolated from real Firestore accounts.
              </span>
            </p>
            <Link
              to="/auth?mode=register"
              className="text-xs font-medium text-[#26C6DA] hover:underline whitespace-nowrap shrink-0"
            >
              Create Real Account
            </Link>
          </div>
        )}

        {!isDemoMode && firebaseUser && !firebaseUser.emailVerified && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-2.5 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <p className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>
                <strong>Verify your email</strong> ({firebaseUser.email}) to enable persistent Cloud
                Firestore writes across sessions.
              </span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-700 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50"
              >
                {resendingEmail ? 'Sending...' : 'Resend Link'}
              </button>
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checkingVerify}
                className="px-2.5 py-1 rounded-md bg-[#142B53] text-white font-medium hover:bg-[#1C3B72] disabled:opacity-50"
              >
                {checkingVerify ? 'Checking...' : "I've Verified"}
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-[#111C33]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-display font-semibold text-[#142B53] dark:text-white truncate">
                Welcome back, {data.profile.fullName}!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Your journey to career readiness continues · Target: {primaryCareer.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/dashboard/notifications"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#3267D5] text-white text-[10px] font-mono font-semibold tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-expanded={profileMenuOpen}
                aria-label="Open student profile menu"
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {data.profile.avatarUrl ? (
                  <img
                    src={data.profile.avatarUrl}
                    alt={data.profile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#142B53] text-white text-xs font-semibold flex items-center justify-center">
                    {data.profile.fullName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="hidden md:block text-left">
                  <span className="block text-xs font-semibold text-[#142B53] dark:text-white leading-tight">
                    {data.profile.fullName}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {data.profile.course} · Sem {data.profile.currentSemester}
                  </span>
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-40">
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/onboarding"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Compass className="w-4 h-4" />
                    Run Onboarding Wizard
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E35D6A] hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {loading && !isDemoMode ? (
            <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-[#3267D5]" />
              <p className="text-sm font-medium">Loading your verified student workspace from Firestore...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Non-blocking Toasts */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#142B53] dark:bg-slate-900 text-white border border-slate-700 shadow-lg text-sm"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  toast.type === 'error'
                    ? 'text-[#E35D6A]'
                    : toast.type === 'info'
                      ? 'text-[#26C6DA]'
                      : 'text-[#22A06B]'
                }`}
              />
              <span>{toast.text}</span>
            </span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Sign out of StudentPulse AI?"
        message={
          isDemoMode
            ? 'You are currently exploring the fictional Rahul Sharma demonstration account. Signing out returns you to the public homepage.'
            : 'Your profile, skills, projects, and interview history remain safely saved in your account.'
        }
        confirmLabel="Logout"
        danger={false}
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </div>
  );
}
