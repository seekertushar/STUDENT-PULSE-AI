import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  const { loginWithGoogle, loginWithEmail, registerWithEmail, requestPasswordReset, enterDemoMode } =
    useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('MCA');
  const [currentSemester, setCurrentSemester] = useState('3');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (next: 'login' | 'register' | 'forgot') => {
    setMode(next);
    setErrorMsg('');
    setSuccessMsg('');
    if (next !== 'forgot') {
      setSearchParams(next === 'register' ? { mode: 'register' } : {});
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setErrorMsg(
        msg.includes('popup-closed')
          ? 'Sign-in popup was closed before completing authentication.'
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await requestPasswordReset(email);
        setSuccessMsg('Password reset link sent. Check your inbox.');
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not send reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Full Name is required.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!collegeName.trim()) {
        setErrorMsg('College Name is required.');
        return;
      }
      const semNum = Number(currentSemester);
      if (Number.isNaN(semNum) || semNum < 1 || semNum > 12) {
        setErrorMsg('Current Semester must be between 1 and 12.');
        return;
      }

      setSubmitting(true);
      try {
        await registerWithEmail({
          fullName,
          email,
          password,
          collegeName,
          course,
          currentSemester: semNum,
        });
        navigate('/onboarding');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed.';
        if (msg.includes('operation-not-allowed')) {
          setErrorMsg(
            'Email/Password sign-in is not yet enabled in your Firebase Console (Authentication → Sign-in method → Email/Password). You can sign in immediately with Google Sign-In or launch the Demo Account below.'
          );
        } else {
          setErrorMsg(msg);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Login mode
    setSubmitting(true);
    try {
      await loginWithEmail(email, password, rememberMe);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      if (msg.includes('operation-not-allowed')) {
        setErrorMsg(
          'Email/Password sign-in is not enabled in the Firebase Console yet. Use Google Sign-In or launch the Demo Account below.'
        );
      } else {
        setErrorMsg('Invalid email or password. Check your credentials or use Google Sign-In.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B1324] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link to="/">
          <BrandLogo />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-5xl w-full mx-auto my-8 grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Context Panel */}
        <div className="lg:col-span-5 bg-[#142B53] text-white rounded-2xl p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#26C6DA]">StudentPulse AI Account Access</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              Your private career readiness workspace.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every student account is isolated with Firebase Authentication and owner-scoped
              Firestore security rules. Track skills, academic marks, projects, roadmaps, and mock
              interviews securely across devices.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white/10 border border-white/15 space-y-3">
            <p className="text-sm font-semibold text-white">
              Want to explore immediately without signing in?
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Launch the clearly labeled fictional demo profile for <strong>Rahul Sharma</strong>{' '}
              (MCA Sem 3, SPPU Pune · Java Developer) with populated skills, projects, 30-day
              roadmap, and interview history.
            </p>
            <button
              type="button"
              onClick={() => {
                enterDemoMode();
                navigate('/dashboard');
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#142B53] bg-[#26C6DA] hover:bg-[#1fb5c8] rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Launch Fictional Demo Account
            </button>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#142B53] text-[#142B53] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#142B53] text-[#142B53] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-[#142B53] dark:text-white">
              {mode === 'login'
                ? 'Sign in to your student account'
                : mode === 'register'
                  ? 'Create your StudentPulse AI account'
                  : 'Reset your password'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login'
                ? 'Use Google Sign-In (recommended) or your registered email credentials.'
                : mode === 'register'
                  ? 'Enter your academic details to begin your 6-step onboarding.'
                  : 'Enter your email address to receive a Firebase password reset link.'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#142B53] dark:text-white bg-white dark:bg-[#0B1324] border border-slate-300 dark:border-slate-700 hover:border-[#3267D5] rounded-lg transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3a7.17 7.17 0 0 1-10.67-3.77H1.4v3.09A12 12 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.39 14.32A7.21 7.21 0 0 1 5.01 12c0-.81.14-1.59.38-2.32V6.59H1.4a12 12 0 0 0 0 10.82l3.99-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.4 6.59l3.99 3.09A7.16 7.16 0 0 1 12 4.75z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 text-xs text-slate-400">or continue with email</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>
            </>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#b93844] dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-[#1a7d53] dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Ananya Deshmukh"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya.deshmukh@college.ac.in"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className={mode === 'login' ? 'sm:col-span-2' : ''}>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                    />
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="auth-college"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    College / University Name
                  </label>
                  <input
                    id="auth-college"
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g., Savitribai Phule Pune University / NIT Trichy"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="auth-course"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Course / Degree
                  </label>
                  <select
                    id="auth-course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                  >
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Tech CSE">B.Tech Computer Science &amp; Engg</option>
                    <option value="B.E. Computer Engg">B.E. Computer Engineering</option>
                    <option value="B.Tech IT">B.Tech Information Technology</option>
                    <option value="B.Sc CS">B.Sc Computer Science</option>
                    <option value="M.Tech CSE">M.Tech Computer Science</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="auth-semester"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Semester
                  </label>
                  <input
                    id="auth-semester"
                    type="number"
                    min={1}
                    max={12}
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324] text-[#142B53] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3267D5]"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#3267D5] focus:ring-[#3267D5]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : mode === 'register'
                    ? 'Create Account & Continue'
                    : 'Send Password Reset Link'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
              >
                Return to Login
              </button>
            )}
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 pb-2">
        StudentPulse AI · Protected by Firebase Authentication & owner-isolated Firestore rules
      </p>
    </div>
  );
}
