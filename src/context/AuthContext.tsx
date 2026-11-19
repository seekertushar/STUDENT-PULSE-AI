import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface RegistrationDetails {
  fullName: string;
  email: string;
  password: string;
  collegeName: string;
  course: string;
  currentSemester: number;
}

interface AuthContextValue {
  firebaseUser: User | null;
  isDemoMode: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  activeUserId: string | null;
  pendingRegistration: Omit<RegistrationDetails, 'password'> | null;
  clearPendingRegistration: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerWithEmail: (details: RegistrationDetails) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<boolean>;
  enterDemoMode: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authVersion, setAuthVersion] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      window.sessionStorage.setItem('studentpulse_demo_mode', '1');
      return true;
    }
    return window.sessionStorage.getItem('studentpulse_demo_mode') === '1';
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState<Omit<RegistrationDetails, 'password'> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
        window.sessionStorage.removeItem('studentpulse_demo_mode');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    setIsDemoMode(false);
    window.sessionStorage.removeItem('studentpulse_demo_mode');
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, googleAuthProvider);
  };

  const loginWithEmail = async (email: string, password: string, rememberMe = true) => {
    setIsDemoMode(false);
    window.sessionStorage.removeItem('studentpulse_demo_mode');
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (details: RegistrationDetails) => {
    setIsDemoMode(false);
    window.sessionStorage.removeItem('studentpulse_demo_mode');
    await setPersistence(auth, browserLocalPersistence);
    const cred = await createUserWithEmailAndPassword(auth, details.email.trim(), details.password);
    await updateProfile(cred.user, { displayName: details.fullName.trim() });
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Verification email dispatch may be throttled; keep signup functional
    }
    setPendingRegistration({
      fullName: details.fullName.trim(),
      email: details.email.trim(),
      collegeName: details.collegeName.trim(),
      course: details.course.trim(),
      currentSemester: details.currentSemester,
    });
  };

  const requestPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshAuthUser = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    setFirebaseUser(auth.currentUser);
    setAuthVersion((v) => v + 1);
    return Boolean(auth.currentUser.emailVerified);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    window.sessionStorage.setItem('studentpulse_demo_mode', '1');
  };

  const logout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      window.sessionStorage.removeItem('studentpulse_demo_mode');
      return;
    }
    await signOut(auth);
  };

  const isAuthenticated = Boolean(firebaseUser) || isDemoMode;
  const activeUserId = firebaseUser
    ? `${firebaseUser.uid}${authVersion >= 0 ? '' : ''}`
    : isDemoMode
      ? 'demo-rahul-sharma-fictional'
      : null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        isDemoMode,
        authLoading,
        isAuthenticated,
        activeUserId,
        pendingRegistration,
        clearPendingRegistration: () => setPendingRegistration(null),
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        requestPasswordReset,
        resendVerificationEmail,
        refreshAuthUser,
        enterDemoMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
