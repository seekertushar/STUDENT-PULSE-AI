import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Save } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';

export function ProfilePage() {
  const { data, updateProfile, primaryCareer } = useStudentData();
  const [fullName, setFullName] = useState(data.profile.fullName);
  const [collegeName, setCollegeName] = useState(data.profile.collegeName);
  const [course, setCourse] = useState(data.profile.course);
  const [currentSemester, setCurrentSemester] = useState(String(data.profile.currentSemester));
  const [graduationYear, setGraduationYear] = useState(String(data.profile.graduationYear));
  const [bio, setBio] = useState(data.profile.bio);
  const [githubUrl, setGithubUrl] = useState(data.profile.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(data.profile.linkedinUrl || '');
  const [interviewExp, setInterviewExp] = useState(data.profile.interviewExperienceLevel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(data.profile.fullName);
    setCollegeName(data.profile.collegeName);
    setCourse(data.profile.course);
    setCurrentSemester(String(data.profile.currentSemester));
    setGraduationYear(String(data.profile.graduationYear));
    setBio(data.profile.bio);
    setGithubUrl(data.profile.githubUrl || '');
    setLinkedinUrl(data.profile.linkedinUrl || '');
    setInterviewExp(data.profile.interviewExperienceLevel);
  }, [data.profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !collegeName.trim()) {
      setError('Full Name and College Name are required.');
      return;
    }
    const sem = Number(currentSemester);
    if (Number.isNaN(sem) || sem < 1 || sem > 12) {
      setError('Semester must be between 1 and 12.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        course,
        currentSemester: sem,
        graduationYear: Number(graduationYear) || 2027,
        bio: bio.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        interviewExperienceLevel: interviewExp,
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            My Student Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep your academic details, links, and career bio current.
          </p>
        </div>
        <Link
          to="/onboarding"
          className="text-xs font-semibold text-[#3267D5] dark:text-[#26C6DA] hover:underline"
        >
          Re-run 6-Step Onboarding Wizard
        </Link>
      </div>

      {/* Profile Header Summary */}
      <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {data.profile.avatarUrl ? (
          <img
            src={data.profile.avatarUrl}
            alt={data.profile.fullName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#142B53] text-white text-xl font-bold flex items-center justify-center">
            {data.profile.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-[#142B53] dark:text-white">
            {data.profile.fullName}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.profile.course} · Semester {data.profile.currentSemester} ·{' '}
            {data.profile.collegeName || 'College not set'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#22A06B]" />
            <span>
              Onboarding {data.profile.onboardingCompleted ? 'Completed' : 'Pending'} · Primary
              Goal: {primaryCareer.title}
            </span>
          </p>
        </div>
      </div>

      {/* Editable Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
      >
        {error && (
          <p role="alert" className="text-sm text-[#E35D6A] font-medium">
            {error}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              disabled
              value={data.profile.email}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="profile-college"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              College / University Name
            </label>
            <input
              id="profile-college"
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div>
            <label
              htmlFor="profile-course"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Course / Program
            </label>
            <select
              id="profile-course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="profile-sem"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Current Semester
              </label>
              <input
                id="profile-sem"
                type="number"
                min={1}
                max={12}
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
            <div>
              <label
                htmlFor="profile-grad"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Graduation Year
              </label>
              <input
                id="profile-grad"
                type="number"
                min={2024}
                max={2035}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="profile-github"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              GitHub Profile URL
            </label>
            <input
              id="profile-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div>
            <label
              htmlFor="profile-linkedin"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              LinkedIn URL
            </label>
            <input
              id="profile-linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="profile-interview-exp"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Interview Experience Summary
            </label>
            <input
              id="profile-interview-exp"
              type="text"
              value={interviewExp}
              onChange={(e) => setInterviewExp(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="profile-bio"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Career Bio & Focus Areas
            </label>
            <textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
