import React, { useState } from 'react';
import { Award, Calendar, ExternalLink, FolderGit2, Plus, Trash2, Trophy, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useStudentData } from '../../context/StudentDataContext';
import type { ActivityType, ProjectStatus } from '../../types/student';

export function PortfolioPage() {
  const {
    data,
    addProject,
    updateProject,
    deleteProject,
    addCertification,
    deleteCertification,
    addActivity,
    deleteActivity,
  } = useStudentData();

  const [tab, setTab] = useState<'projects' | 'certifications' | 'activities'>('projects');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'project' | 'cert' | 'activity';
    id: string;
    label: string;
  } | null>(null);

  // Project fields
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCat, setPCat] = useState('Backend Application');
  const [pTech, setPTech] = useState('');
  const [pGithub, setPGithub] = useState('');
  const [pLive, setPLive] = useState('');
  const [pStatus, setPStatus] = useState<ProjectStatus>('In Progress');

  // Cert fields
  const [cName, setCName] = useState('');
  const [cIssuer, setCIssuer] = useState('');
  const [cDate, setCDate] = useState(new Date().toISOString().slice(0, 10));
  const [cUrl, setCUrl] = useState('');
  const [cSkills, setCSkills] = useState('');

  // Activity fields
  const [aTitle, setATitle] = useState('');
  const [aType, setAType] = useState<ActivityType>('Hackathon');
  const [aOrg, setAOrg] = useState('');
  const [aDate, setADate] = useState(new Date().toISOString().slice(0, 10));
  const [aDesc, setADesc] = useState('');
  const [aSkills, setASkills] = useState('');

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pDesc.trim()) return;
    await addProject({
      name: pName.trim(),
      description: pDesc.trim(),
      category: pCat,
      technologies: pTech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      githubUrl: pGithub.trim(),
      liveUrl: pLive.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      completionDate: pStatus === 'Completed' ? new Date().toISOString().slice(0, 10) : undefined,
      status: pStatus,
    });
    setPName('');
    setPDesc('');
    setPTech('');
    setPGithub('');
    setPLive('');
    setFormOpen(false);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cIssuer.trim()) return;
    await addCertification({
      name: cName.trim(),
      issuer: cIssuer.trim(),
      issueDate: cDate,
      credentialUrl: cUrl.trim(),
      relatedSkills: cSkills
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setCName('');
    setCIssuer('');
    setCUrl('');
    setCSkills('');
    setFormOpen(false);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aTitle.trim()) return;
    await addActivity({
      title: aTitle.trim(),
      type: aType,
      organization: aOrg.trim() || 'Campus / Community',
      date: aDate,
      description: aDesc.trim(),
      relatedSkills: aSkills
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setATitle('');
    setAOrg('');
    setADesc('');
    setASkills('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#142B53] dark:text-white">
            Projects, Certifications & Activities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showcase verifiable engineering evidence linked to your career target skills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3267D5] hover:bg-[#2755B8] rounded-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add {tab === 'projects' ? 'Project' : tab === 'certifications' ? 'Certification' : 'Activity'}
        </button>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-lg w-fit">
        {(
          [
            { id: 'projects', label: `Projects (${data.projects.length})` },
            { id: 'certifications', label: `Certifications (${data.certifications.length})` },
            { id: 'activities', label: `Activities (${data.activities.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setFormOpen(false);
            }}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-[#142B53] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#142B53] dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Contextual Add Form */}
      {formOpen && tab === 'projects' && (
        <form
          onSubmit={handleSaveProject}
          className="bg-white dark:bg-[#111C33] border border-[#3267D5]/50 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Add New Project
            </h2>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Project Name"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <select
              value={pStatus}
              onChange={(e) => setPStatus(e.target.value as ProjectStatus)}
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <input
              type="text"
              value={pCat}
              onChange={(e) => setPCat(e.target.value)}
              placeholder="Category (e.g., Backend Application)"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="text"
              value={pTech}
              onChange={(e) => setPTech(e.target.value)}
              placeholder="Technologies (comma-separated, e.g., Core Java, SQL)"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="url"
              value={pGithub}
              onChange={(e) => setPGithub(e.target.value)}
              placeholder="GitHub Repository URL (optional)"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="url"
              value={pLive}
              onChange={(e) => setPLive(e.target.value)}
              placeholder="Live Demo URL (optional)"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <textarea
              required
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Describe the architecture, features, and measurable outcome..."
              className="sm:col-span-2 px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3267D5] rounded-lg"
            >
              Save Project
            </button>
          </div>
        </form>
      )}

      {formOpen && tab === 'certifications' && (
        <form
          onSubmit={handleSaveCert}
          className="bg-white dark:bg-[#111C33] border border-[#3267D5]/50 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Add Certification
            </h2>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Certification Name"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="text"
              required
              value={cIssuer}
              onChange={(e) => setCIssuer(e.target.value)}
              placeholder="Issuing Organization"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="date"
              value={cDate}
              onChange={(e) => setCDate(e.target.value)}
              className="px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="url"
              value={cUrl}
              onChange={(e) => setCUrl(e.target.value)}
              placeholder="Credential URL (optional)"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="text"
              value={cSkills}
              onChange={(e) => setCSkills(e.target.value)}
              placeholder="Related Skills (comma-separated)"
              className="sm:col-span-2 px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3267D5] rounded-lg"
            >
              Save Certification
            </button>
          </div>
        </form>
      )}

      {formOpen && tab === 'activities' && (
        <form
          onSubmit={handleSaveActivity}
          className="bg-white dark:bg-[#111C33] border border-[#3267D5]/50 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#142B53] dark:text-white">
              Log Activity / Hackathon / Internship
            </h2>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={aTitle}
              onChange={(e) => setATitle(e.target.value)}
              placeholder="Activity Title"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <select
              value={aType}
              onChange={(e) => setAType(e.target.value as ActivityType)}
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Workshop">Workshop</option>
              <option value="Coding Competition">Coding Competition</option>
              <option value="Internship">Internship</option>
              <option value="Technical Event">Technical Event</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              value={aOrg}
              onChange={(e) => setAOrg(e.target.value)}
              placeholder="Organization / Host"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="date"
              value={aDate}
              onChange={(e) => setADate(e.target.value)}
              className="px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <input
              type="text"
              value={aSkills}
              onChange={(e) => setASkills(e.target.value)}
              placeholder="Related Skills (comma-separated)"
              className="sm:col-span-2 px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
            <textarea
              rows={2}
              value={aDesc}
              onChange={(e) => setADesc(e.target.value)}
              placeholder="Summary of role and outcomes..."
              className="sm:col-span-2 px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1324]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3267D5] rounded-lg"
            >
              Save Activity
            </button>
          </div>
        </form>
      )}

      {/* Projects View */}
      {tab === 'projects' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.projects.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
              No projects logged yet. Add a completed or in-progress project to strengthen your
              readiness score.
            </div>
          ) : (
            data.projects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover border-b border-slate-100 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-full h-32 bg-[#EAF1FF] dark:bg-[#0B1324] border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      <FolderGit2 className="w-8 h-8 text-[#3267D5]/60" />
                    </div>
                  )}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{p.category}</span>
                      <span
                        className={`font-semibold ${
                          p.status === 'Completed'
                            ? 'text-[#22A06B]'
                            : p.status === 'In Progress'
                              ? 'text-[#3267D5] dark:text-[#26C6DA]'
                              : 'text-slate-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#142B53] dark:text-white">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {p.description}
                    </p>
                    {p.technologies.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                        {p.technologies.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#3267D5] dark:text-[#26C6DA] hover:underline"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {p.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateProject(p.id, {
                            status: 'Completed',
                            completionDate: new Date().toISOString().slice(0, 10),
                          })
                        }
                        className="font-medium text-[#22A06B] hover:underline"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ kind: 'project', id: p.id, label: p.name })}
                    aria-label={`Delete project ${p.name}`}
                    className="text-slate-400 hover:text-[#E35D6A]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Certifications View */}
      {tab === 'certifications' && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.certifications.length === 0 ? (
            <div className="md:col-span-2 bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
              No certifications added yet.
            </div>
          ) : (
            data.certifications.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Award className="w-4 h-4 text-[#3267D5]" />
                    <span>
                      {c.issuer} · Issued {c.issueDate}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-[#142B53] dark:text-white">
                    {c.name}
                  </h3>
                  {c.relatedSkills.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Skills: {c.relatedSkills.join(' · ')}
                    </p>
                  )}
                  {c.credentialUrl && (
                    <a
                      href={c.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#3267D5] hover:underline pt-1"
                    >
                      Verify Credential <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ kind: 'cert', id: c.id, label: c.name })}
                  aria-label={`Delete certification ${c.name}`}
                  className="text-slate-400 hover:text-[#E35D6A]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Activities View */}
      {tab === 'activities' && (
        <div className="space-y-3">
          {data.activities.length === 0 ? (
            <div className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
              No hackathons, workshops, or internships logged yet.
            </div>
          ) : (
            data.activities.map((a) => (
              <div
                key={a.id}
                className="bg-white dark:bg-[#111C33] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-[#F2A93B]" />
                    <span>
                      {a.type} · {a.organization} ·{' '}
                      <Calendar className="w-3 h-3 inline -mt-0.5" /> {a.date}
                    </span>
                  </p>
                  <h3 className="font-display font-semibold text-[#142B53] dark:text-white">
                    {a.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{a.description}</p>
                  {a.relatedSkills.length > 0 && (
                    <p className="text-xs text-slate-500 pt-1">
                      Related Skills: {a.relatedSkills.join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ kind: 'activity', id: a.id, label: a.title })}
                  aria-label={`Delete activity ${a.title}`}
                  className="text-slate-400 hover:text-[#E35D6A]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Remove "${deleteTarget?.label}"?`}
        message="This record will be deleted from your portfolio and your readiness score will update."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === 'project') await deleteProject(deleteTarget.id);
          if (deleteTarget.kind === 'cert') await deleteCertification(deleteTarget.id);
          if (deleteTarget.kind === 'activity') await deleteActivity(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
