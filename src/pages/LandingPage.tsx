import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  FolderGit2,
  GitCompare,
  Layers,
  Map,
  MessageSquareCode,
  Sliders,
  Target,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { DEFAULT_CAREER_PATHS } from '../data/careers';
import { createDemoWorkspace } from '../data/demoData';
import { calculateCareerReadiness } from '../utils/analyticsEngine';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    num: '01',
    title: 'Smart Career Readiness',
    desc: 'Weighted indicative readiness score combining technical skills, projects, academics, mock interviews, and daily learning consistency.',
    icon: Target,
    span: 'lg:col-span-2',
  },
  {
    num: '02',
    title: 'AI Skill-Gap Analysis',
    desc: 'Compare your assessed proficiency against industry role benchmarks with automatic priority ranking and zero-assumption handling for unassessed skills.',
    icon: BarChart3,
    span: 'lg:col-span-2',
  },
  {
    num: '03',
    title: 'Technical Skill Tracking',
    desc: 'Track self-reported levels alongside verified assessment scores and project evidence links.',
    icon: Sliders,
    span: 'lg:col-span-1',
  },
  {
    num: '04',
    title: 'Academic Performance Analysis',
    desc: 'Compute semester trends, CGPA, subject strengths, and improvement areas without assuming missing marks are zero.',
    icon: BookOpen,
    span: 'lg:col-span-1',
  },
  {
    num: '05',
    title: 'AI Learning Roadmaps',
    desc: 'Generate adaptive 30, 60, or 90-day structured study plans tailored to your largest skill gaps.',
    icon: Map,
    span: 'lg:col-span-1',
  },
  {
    num: '06',
    title: 'Personalized Action Plans',
    desc: 'Convert guidance into daily tasks, weekly goals, and coding drills with live progress updates.',
    icon: CheckCircle2,
    span: 'lg:col-span-1',
  },
  {
    num: '07',
    title: 'AI Mock Interviews',
    desc: 'Practice text-based technical interviews with structured rubric scores, strengths, weaknesses, and model answers.',
    icon: MessageSquareCode,
    span: 'lg:col-span-2',
  },
  {
    num: '08',
    title: 'Career Comparison',
    desc: 'Compare readiness side by side across roles like Java Developer vs Data Analyst to spot transferable skills.',
    icon: GitCompare,
    span: 'lg:col-span-1',
  },
  {
    num: '09',
    title: 'Project & Certification Tracking',
    desc: 'Organize GitHub repositories, live demos, vendor certifications, and hackathons mapped to target skills.',
    icon: FolderGit2,
    span: 'lg:col-span-1',
  },
  {
    num: '10',
    title: 'Achievement & Streak System',
    desc: 'Unlock verifiable milestone badges and sustain consecutive study streaks driven strictly by real completed activities.',
    icon: Award,
    span: 'lg:col-span-2',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Profile',
    detail: 'Enter your college (SPPU, VTU, NIT, IIIT, Anna Univ), degree (MCA, BCA, B.Tech/B.E.), and semester.',
  },
  {
    step: '02',
    title: 'Choose Your Dream Career',
    detail: 'Select a primary target role from 8 customizable engineering and analytics tracks.',
  },
  {
    step: '03',
    title: 'Add Your Skills & Projects',
    detail: 'Log technical skills, semester marks, GitHub projects, certifications, and activities.',
  },
  {
    step: '04',
    title: 'Analyze Your Readiness',
    detail: 'Run deterministic skill-gap scoring to surface high-priority technical gaps.',
  },
  {
    step: '05',
    title: 'Follow Your AI Learning Journey',
    detail: 'Execute 30/60/90-day roadmaps, daily tasks, and AI-evaluated mock interviews.',
  },
];

export function LandingPage() {
  const { enterDemoMode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedCareerId, setSelectedCareerId] = useState('java-developer');

  const demoPreview = useMemo(() => {
    const sample = createDemoWorkspace();
    const career =
      DEFAULT_CAREER_PATHS.find((c) => c.id === selectedCareerId) ?? DEFAULT_CAREER_PATHS[0];
    const readiness = calculateCareerReadiness({
      skills: sample.skills,
      academics: sample.academics,
      projects: sample.projects,
      certifications: sample.certifications,
      activities: sample.activities,
      interviews: sample.interviews,
      actionTasks: sample.actionTasks,
      roadmap: sample.roadmap,
      streak: sample.streak,
      career,
    });
    return { sample, career, readiness };
  }, [selectedCareerId]);

  const handleLaunchDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B1324] text-[#202B3C] dark:text-[#E6ECF5]">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111C33]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <Link to="/" className="whitespace-nowrap shrink-0">
            <BrandLogo />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#top"
              className="hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#features"
              className="hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#careers"
              className="hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Career Paths
            </a>
            <a
              href="#about"
              className="hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#3267D5] transition-colors whitespace-nowrap shrink-0"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium tracking-wide text-[#3267D5] dark:text-[#26C6DA]">
              Understand Your Skills · Discover Your Gaps · Build Your Future
            </p>
            <h1
              className="font-display font-bold tracking-tight text-[#142B53] dark:text-white leading-[1.1]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
            >
              Your Skills Today. Your Dream Career Tomorrow.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Discover your potential, identify skill gaps, and build a personalized learning
              journey with the power of AI. Designed for Indian MCA, BCA, B.Tech / B.E., CS, and IT
              students preparing for internships and T&amp;P campus placements.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/auth?mode=register"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleLaunchDemo}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#142B53] dark:text-white bg-white dark:bg-[#111C33] border border-slate-300 dark:border-slate-700 hover:border-[#3267D5] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Explore Demo Account
              </button>
              <a
                href="#features"
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Explore Features
              </a>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span>8 Customizable Career Tracks</span>
              <span aria-hidden="true">·</span>
              <span>Deterministic Skill-Gap Engine</span>
              <span aria-hidden="true">·</span>
              <span>30/60/90-Day AI Roadmaps</span>
              <span aria-hidden="true">·</span>
              <span>AI Mock Interviews</span>
            </div>
          </div>

          {/* Interactive Live Student Dashboard Preview */}
          <div className="lg:col-span-6">
            <div className="h-full bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/src/assets/images/avatar_rahul_demo_1795107482927.jpg"
                    alt="Rahul Sharma sample profile"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#142B53] dark:text-white">
                      Rahul Sharma · MCA Sem 3 (SPPU Pune)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sample Preview · Target: {demoPreview.career.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                  {(['java-developer', 'data-analyst'] as const).map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setSelectedCareerId(cid)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        selectedCareerId === cid
                          ? 'bg-white dark:bg-[#142B53] text-[#142B53] dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cid === 'java-developer' ? 'Java Dev' : 'Data Analyst'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Readiness Ring + Key Metrics */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 flex flex-col items-center justify-center py-2">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#3267D5"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * demoPreview.readiness.overallScore) / 100}
                      />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white">
                        {demoPreview.readiness.overallScore}%
                      </span>
                      <span className="text-[10px] text-slate-500">Readiness</span>
                    </span>
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Skill Match</p>
                    <p className="text-lg font-mono font-semibold tabular-nums text-[#142B53] dark:text-white mt-0.5">
                      {demoPreview.readiness.technicalSkillMatchScore ?? 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gaps Found</p>
                    <p className="text-lg font-mono font-semibold tabular-nums text-[#E35D6A] mt-0.5">
                      {demoPreview.readiness.gapsIdentifiedCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Projects Done</p>
                    <p className="text-lg font-mono font-semibold tabular-nums text-[#22A06B] mt-0.5">
                      2
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mock Interview</p>
                    <p className="text-lg font-mono font-semibold tabular-nums text-[#3267D5] dark:text-[#26C6DA] mt-0.5">
                      65/100
                    </p>
                  </div>
                </div>
              </div>

              {/* Skill Comparison Bars */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#142B53] dark:text-white">
                    Live Skill vs Target Benchmark ({demoPreview.career.title})
                  </span>
                  <span className="text-slate-500 font-mono">Current / Req</span>
                </div>
                {demoPreview.readiness.skillGaps.slice(0, 4).map((item) => (
                  <div key={item.skillName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-200 truncate">
                        {item.skillName}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {item.currentScore !== null ? `${item.currentScore}%` : 'N/A'} /{' '}
                        {item.requiredScore}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.currentScore === null
                            ? 'bg-slate-300 dark:bg-slate-700'
                            : item.currentScore >= item.requiredScore
                              ? 'bg-[#22A06B]'
                              : item.gap && item.gap >= 30
                                ? 'bg-[#E35D6A]'
                                : 'bg-[#3267D5]'
                        }`}
                        style={{ width: `${item.currentScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Active 30-Day Roadmap · 3/8 milestones completed</span>
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  className="font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
                >
                  Inspect Full Workspace →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Unified Platform Section */}
      <section
        id="about"
        className="bg-white dark:bg-[#111C33] border-y border-slate-200 dark:border-slate-800 py-16 lg:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <img
              src="/src/assets/images/hero_campus_workspace_1795107425091.jpg"
              alt="College engineering students collaborating in a modern computer science lab"
              referrerPolicy="no-referrer"
              className="w-full h-full min-h-[260px] object-cover"
            />
          </div>
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <p className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA]">
              Why StudentPulse AI Exists
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#142B53] dark:text-white">
              Stop guessing how your marks, skills, and projects add up for placements.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              College students track semester grades in one portal, coding practice on spreadsheets,
              projects on GitHub, and interview prep in scattered notes. When campus placement
              season arrives, it is hard to see which exact skill gaps matter most for a target role.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              StudentPulse AI unifies academic performance, self-reported and assessed technical
              skills, portfolio projects, certifications, and text-based mock interviews into one
              evidence-backed readiness engine — turning gaps into 30, 60, or 90-day action plans.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200/80 dark:border-slate-800">
                <p className="text-xl font-mono font-bold tabular-nums text-[#142B53] dark:text-white">
                  5 Factors
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Skills, Projects, Academics, Interviews & Consistency
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200/80 dark:border-slate-800">
                <p className="text-xl font-mono font-bold tabular-nums text-[#3267D5] dark:text-[#26C6DA]">
                  0 Guesswork
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Missing data renormalizes weights transparently
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200/80 dark:border-slate-800">
                <p className="text-xl font-mono font-bold tabular-nums text-[#22A06B]">
                  100% Isolated
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Owner-scoped Firestore security rules per student
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 Core Features Asymmetric Bento Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA]">
            Complete Platform Capabilities
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#142B53] dark:text-white">
            Ten connected modules engineered for career readiness.
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Every update you make to your skills, semester scores, projects, or action tasks updates
            your analytics, recommendations, and achievements in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.num}
                className={`${f.span} bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-[#3267D5]/50 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{f.num}.</span>
                  <Icon className="w-5 h-5 text-[#3267D5] dark:text-[#26C6DA]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works — 5 Visual Stages */}
      <section
        id="how-it-works"
        className="bg-[#142B53] text-white py-16 lg:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-[#26C6DA]">Five-Stage Student Workflow</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              From raw profile data to interview-ready execution.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {HOW_IT_WORKS.map((stage) => (
              <div
                key={stage.step}
                className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3"
              >
                <span className="text-sm font-mono font-semibold text-[#26C6DA]">
                  Stage {stage.step}
                </span>
                <h3 className="font-display text-base font-semibold text-white">{stage.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{stage.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Career Paths */}
      <section id="careers" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-[#3267D5] dark:text-[#26C6DA]">
              Customizable Skill Benchmarks
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#142B53] dark:text-white">
              Built-in technology career tracks ready for comparison.
            </h2>
          </div>
          <Link
            to="/auth?mode=register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline whitespace-nowrap"
          >
            Select Your Career Track
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEFAULT_CAREER_PATHS.map((career) => (
            <div
              key={career.id}
              className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-semibold text-[#142B53] dark:text-white">
                    {career.title}
                  </h3>
                  <Compass className="w-4 h-4 text-[#3267D5] dark:text-[#26C6DA] shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {career.tagline}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Core Skills ({career.requiredSkills.length})
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {career.requiredSkills
                    .slice(0, 4)
                    .map((s) => s.name)
                    .join(' · ')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Final Conversion CTA */}
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
              Ready to measure your actual career readiness?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Sign in with Google or create your student account to persist your portfolio in
              Firestore, or launch the pre-seeded Rahul Sharma demonstration account immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/auth?mode=register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors whitespace-nowrap"
            >
              Create Student Account
            </Link>
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="px-5 py-2.5 text-sm font-semibold text-[#142B53] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Try Demo Account
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C33] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <BrandLogo />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Understand Your Skills. Discover Your Gaps. Build Your Future.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <a href="#top" className="hover:text-[#142B53] dark:hover:text-white">
              Home
            </a>
            <a href="#about" className="hover:text-[#142B53] dark:hover:text-white">
              About
            </a>
            <a href="#features" className="hover:text-[#142B53] dark:hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#142B53] dark:hover:text-white">
              How It Works
            </a>
            <a href="#careers" className="hover:text-[#142B53] dark:hover:text-white">
              Career Paths
            </a>
            <Link to="/auth" className="hover:text-[#142B53] dark:hover:text-white">
              Student Login
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} StudentPulse AI. Built for Indian college &amp; campus readiness.
          </p>
        </div>
      </footer>
    </div>
  );
}
