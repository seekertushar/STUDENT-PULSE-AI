import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useStudentData } from '../context/StudentDataContext';
import { SELF_REPORTED_LEVEL_SCORES } from '../utils/analyticsEngine';
import type { ProficiencyLevel } from '../types/student';

const STEPS = [
  'Personal Information',
  'Academic Information',
  'Career Interests',
  'Technical Skills',
  'Projects & Certifications',
  'Interview Experience',
];

export function OnboardingPage() {
  const { data, updateProfile, addSkill, addProject, addCertification } = useStudentData();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 & 2
  const [fullName, setFullName] = useState(data.profile.fullName);
  const [collegeName, setCollegeName] = useState(data.profile.collegeName);
  const [course, setCourse] = useState(data.profile.course || 'MCA');
  const [currentSemester, setCurrentSemester] = useState(String(data.profile.currentSemester || 3));
  const [graduationYear, setGraduationYear] = useState(String(data.profile.graduationYear || 2027));
  const [bio, setBio] = useState(data.profile.bio || '');

  // Step 3
  const [primaryCareerId, setPrimaryCareerId] = useState(data.profile.primaryCareerId || 'java-developer');
  const [secondaryIds, setSecondaryIds] = useState<string[]>(data.profile.secondaryCareerIds);

  // Step 4: Draft new skills
  const [draftSkills, setDraftSkills] = useState<
    { name: string; level: ProficiencyLevel; assessmentScore: string }[]
  >([
    { name: 'Core Java', level: 'Intermediate', assessmentScore: '' },
    { name: 'SQL', level: 'Intermediate', assessmentScore: '' },
  ]);
  const [newSkillName, setNewSkillName] = useState('');

  // Step 5: Optional starter project & cert
  const [projName, setProjName] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');

  // Step 6: Interview experience
  const [interviewExp, setInterviewExp] = useState(
    data.profile.interviewExperienceLevel || 'Beginner — 0 to 1 interviews attempted'
  );
  const [validationError, setValidationError] = useState('');

  const completionPct = Math.round(((step + 1) / STEPS.length) * 100);

  const handleNext = () => {
    setValidationError('');
    if (step === 0 && !fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (step === 1 && !collegeName.trim()) {
      setValidationError('Please enter your college or university name.');
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        course,
        currentSemester: Number(currentSemester) || 1,
        graduationYear: Number(graduationYear) || 2027,
        bio: bio.trim(),
        primaryCareerId,
        secondaryCareerIds: secondaryIds.filter((id) => id !== primaryCareerId),
        interviewExperienceLevel: interviewExp,
        onboardingCompleted: true,
      });

      // Add any newly entered skills that don't already exist
      const existingNames = new Set(data.skills.map((s) => s.name.toLowerCase()));
      for (const item of draftSkills) {
        if (item.name.trim() && !existingNames.has(item.name.trim().toLowerCase())) {
          const parsedAssess =
            item.assessmentScore.trim() !== '' ? Number(item.assessmentScore) : null;
          await addSkill({
            name: item.name.trim(),
            category: 'Technical',
            selfReportedLevel: item.level,
            selfReportedScore: SELF_REPORTED_LEVEL_SCORES[item.level],
            assessmentScore:
              parsedAssess !== null && !Number.isNaN(parsedAssess)
                ? Math.max(0, Math.min(100, parsedAssess))
                : null,
          });
        }
      }

      if (projName.trim()) {
        await addProject({
          name: projName.trim(),
          description: projDesc.trim() || 'Student portfolio project added during onboarding.',
          category: 'Software Project',
          technologies: projTech
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          startDate: new Date().toISOString().slice(0, 10),
          status: 'In Progress',
        });
      }

      if (certName.trim() && certIssuer.trim()) {
        await addCertification({
          name: certName.trim(),
          issuer: certIssuer.trim(),
          issueDate: new Date().toISOString().slice(0, 10),
          relatedSkills: [],
        });
      }

      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B1324] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Step {step + 1} of {STEPS.length} · {completionPct}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#3267D5] rounded-full transition-all duration-200"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="grid grid-cols-6 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {STEPS.map((label, idx) => (
              <span
                key={label}
                className={`truncate ${
                  idx <= step ? 'font-semibold text-[#142B53] dark:text-white' : ''
                }`}
              >
                {idx + 1}. {label.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-display text-xl font-bold text-[#142B53] dark:text-white">
              {STEPS[step]}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              You can edit every detail later from your StudentPulse AI dashboard.
            </p>
          </div>

          {validationError && (
            <p role="alert" className="text-sm text-[#E35D6A] font-medium">
              {validationError}
            </p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Short Career Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your academic focus and internship or placement goals..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  College / University
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g., Savitribai Phule Pune University / NIT Surathkal"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Course
                </label>
                <select
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Grad Year
                  </label>
                  <input
                    type="number"
                    min={2024}
                    max={2035}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Primary Career Goal
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.customCareers.map((career) => {
                    const selected = primaryCareerId === career.id;
                    return (
                      <button
                        key={career.id}
                        type="button"
                        onClick={() => setPrimaryCareerId(career.id)}
                        className={`text-left p-4 rounded-xl border transition-colors ${
                          selected
                            ? 'border-[#3267D5] bg-[#EAF1FF] dark:bg-[#1C2F59]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#142B53] dark:text-white">
                          {career.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {career.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Additional Interests (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.customCareers
                    .filter((c) => c.id !== primaryCareerId)
                    .map((c) => {
                      const active = secondaryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setSecondaryIds((prev) =>
                              active ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            active
                              ? 'border-[#3267D5] bg-[#3267D5] text-white'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {c.title}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Add a technical skill (e.g., Spring Boot, Python, DSA)"
                  className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSkillName.trim()) return;
                    setDraftSkills((prev) => [
                      ...prev,
                      { name: newSkillName.trim(), level: 'Intermediate', assessmentScore: '' },
                    ]);
                    setNewSkillName('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#3267D5] rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2.5">
                {draftSkills.map((sk, idx) => (
                  <div
                    key={`${sk.name}-${idx}`}
                    className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-[#F6F8FC] dark:bg-[#0B1324] border border-slate-200 dark:border-slate-800"
                  >
                    <span className="col-span-5 text-sm font-medium truncate">{sk.name}</span>
                    <select
                      aria-label={`Proficiency for ${sk.name}`}
                      value={sk.level}
                      onChange={(e) =>
                        setDraftSkills((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, level: e.target.value as ProficiencyLevel } : item
                          )
                        )
                      }
                      className="col-span-4 px-2 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111C33]"
                    >
                      <option value="Beginner">Beginner (25)</option>
                      <option value="Intermediate">Intermediate (50)</option>
                      <option value="Advanced">Advanced (75)</option>
                      <option value="Expert">Expert (90)</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Test %"
                      value={sk.assessmentScore}
                      onChange={(e) =>
                        setDraftSkills((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, assessmentScore: e.target.value } : item
                          )
                        )
                      }
                      className="col-span-2 px-2 py-1.5 text-xs font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111C33]"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftSkills((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove ${sk.name}`}
                      className="col-span-1 flex justify-center text-slate-400 hover:text-[#E35D6A]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#142B53] dark:text-white">
                  Add a Key Project (Optional)
                </p>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Project Name (e.g., Campus Placement Portal)"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  placeholder="Technologies (comma-separated, e.g., Java, Spring Boot, SQL)"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Brief summary of what you built..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-[#142B53] dark:text-white">
                  Add a Certification (Optional)
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g., Programming in Java (Elite)"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                  />
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="e.g., NPTEL — IIT Kharagpur / Oracle"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Select your current technical interview comfort level so StudentPulse AI can
                calibrate your initial preparation activities.
              </p>
              <div className="space-y-2.5">
                {[
                  'None yet — preparing for my first interview',
                  'Beginner — 1 to 2 mock or internship interviews',
                  'Intermediate — comfortable with core CS, practicing DSA & SQL',
                  'Experienced — completed multiple technical campus rounds',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setInterviewExp(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors flex items-center justify-between ${
                      interviewExp === opt
                        ? 'border-[#3267D5] bg-[#EAF1FF] dark:bg-[#1C2F59] text-[#142B53] dark:text-white font-medium'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {interviewExp === opt && <CheckCircle2 className="w-4 h-4 text-[#3267D5]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate('/dashboard') : setStep((s) => s - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Skip to Dashboard' : 'Previous'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#22A06B] hover:bg-[#1b8558] rounded-lg transition-colors disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Saving Profile...' : 'Complete Onboarding & Open Dashboard'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
