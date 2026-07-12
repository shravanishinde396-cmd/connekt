import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import {
  BookOpen,
  GraduationCap,
  Briefcase,
  Award,
  Upload,
  Plus,
  Trash,
  FileText,
  Save,
  X,
} from 'lucide-react';

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  percentageOrCGPA: number;
}

interface Project {
  title: string;
  description: string;
  technologiesUsed: string[];
  link?: string;
}

interface Experience {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

interface Certification {
  name: string;
  organization: string;
  issueDate: string;
}

interface ProfileState {
  department: string;
  batch: string;
  CGPA: number;
  backlogs: number;
  skills: string[];
  education: Education[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  resumeUrl?: string;
  profileCompletion: number;
}

export const StudentProfile: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'academic' | 'education' | 'skills' | 'experience' | 'certs'>('academic');

  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<ProfileState>({
    department: 'TBD',
    batch: '',
    CGPA: 0,
    backlogs: 0,
    skills: [],
    education: [],
    projects: [],
    experience: [],
    certifications: [],
    profileCompletion: 0,
  });

  // Temp form states for adding items
  const [newSkill, setNewSkill] = useState('');
  
  const [newEdu, setNewEdu] = useState<Education>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    percentageOrCGPA: 0,
  });

  const [newProj, setNewProj] = useState<Project>({
    title: '',
    description: '',
    technologiesUsed: [],
    link: '',
  });
  const [projTechText, setProjTechText] = useState('');

  const [newExp, setNewExp] = useState<Experience>({
    company: '',
    role: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  });

  const [newCert, setNewCert] = useState<Certification>({
    name: '',
    organization: '',
    issueDate: '',
  });

  // Fetch student profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/profile');
      setProfile(res.data.profile);
      setUserName(res.data.user?.name || '');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (key: keyof ProfileState, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        name: userName,
        department: profile.department,
        batch: profile.batch,
        CGPA: Number(profile.CGPA),
        backlogs: Number(profile.backlogs),
        skills: profile.skills,
        education: profile.education,
        projects: profile.projects,
        experience: profile.experience,
        certifications: profile.certifications,
      };

      const res = await api.put('/student/profile', payload);
      setProfile(res.data.profile);
      toast('Profile updated successfully!', 'success');
    } catch (err: any) {
      const details = err.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msg = details.map((d: any) => d.message).join(', ');
        toast(`Validation failed: ${msg}`, 'error');
      } else {
        toast(err.response?.data?.error || 'Failed to save profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Resume PDF Upload
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.type !== 'application/pdf') {
      toast('Only PDF resumes are supported', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/student/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile((prev) => ({
        ...prev,
        resumeUrl: res.data.resumeUrl,
        profileCompletion: res.data.profileCompletion,
      }));
      toast('Resume uploaded successfully!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to upload resume', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Add Item Helpers
  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      const updated = [...profile.skills, newSkill.trim()];
      handleProfileChange('skills', updated);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = profile.skills.filter((s) => s !== skillToRemove);
    handleProfileChange('skills', updated);
  };

  const addEducation = () => {
    if (newEdu.institution && newEdu.degree && newEdu.fieldOfStudy) {
      const updated = [...profile.education, newEdu];
      handleProfileChange('education', updated);
      setNewEdu({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', percentageOrCGPA: 0 });
    }
  };

  const removeEducation = (index: number) => {
    const updated = profile.education.filter((_, i) => i !== index);
    handleProfileChange('education', updated);
  };

  const addProject = () => {
    if (newProj.title && newProj.description) {
      const techArray = projTechText
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '');
      const updatedProj = { ...newProj, technologiesUsed: techArray };
      const updated = [...profile.projects, updatedProj];
      handleProfileChange('projects', updated);
      setNewProj({ title: '', description: '', technologiesUsed: [], link: '' });
      setProjTechText('');
    }
  };

  const removeProject = (index: number) => {
    const updated = profile.projects.filter((_, i) => i !== index);
    handleProfileChange('projects', updated);
  };

  const addExperience = () => {
    if (newExp.company && newExp.role && newExp.startDate) {
      const updated = [...profile.experience, newExp];
      handleProfileChange('experience', updated);
      setNewExp({ company: '', role: '', description: '', startDate: '', endDate: '', isCurrent: false });
    }
  };

  const removeExperience = (index: number) => {
    const updated = profile.experience.filter((_, i) => i !== index);
    handleProfileChange('experience', updated);
  };

  const addCertification = () => {
    if (newCert.name && newCert.organization && newCert.issueDate) {
      const updated = [...profile.certifications, newCert];
      handleProfileChange('certifications', updated);
      setNewCert({ name: '', organization: '', issueDate: '' });
    }
  };

  const removeCertification = (index: number) => {
    const updated = profile.certifications.filter((_, i) => i !== index);
    handleProfileChange('certifications', updated);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-zinc-900 rounded-xl w-48 mb-4"></div>
        <div className="h-4 bg-zinc-900 rounded w-full"></div>
        <div className="h-96 bg-zinc-900 rounded-3xl mt-6"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title & Progress Tracker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Manage Placement Profile</h1>
          <p className="text-sm text-zinc-400 mt-1">Keep your credentials up to date to remain placement eligible.</p>
        </div>

        {/* Profile Completion bar */}
        <div className="w-full md:max-w-xs bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-zinc-400">Profile Completion</span>
            <span className="text-purple-400">{profile.profileCompletion}%</span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
            <div
              className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${profile.profileCompletion}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="flex flex-col gap-2">
          {(
            [
              { id: 'academic', label: 'Academic Details', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'education', label: 'Education History', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'skills', label: 'Skills & Resume', icon: <FileText className="w-4 h-4" /> },
              { id: 'experience', label: 'Projects & Internships', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'certs', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-zinc-100 shadow-lg shadow-purple-600/10'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* Save Button */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-sm transition-colors mt-6 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>

        {/* Tab Workspace Panel */}
        <div className="lg:col-span-3 bg-zinc-900/45 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          {/* TAB 1: Academic */}
          {activeTab === 'academic' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Academic & Personal Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Department</label>
                  <select
                    value={profile.department}
                    onChange={(e) => handleProfileChange('department', e.target.value)}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  >
                    <option value="TBD">TBD</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Batch Year</label>
                  <input
                    type="text"
                    placeholder="2026"
                    value={profile.batch}
                    onChange={(e) => handleProfileChange('batch', e.target.value)}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CGPA (Current)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="8.50"
                    value={profile.CGPA || ''}
                    onChange={(e) => handleProfileChange('CGPA', Number(e.target.value))}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Backlogs</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={profile.backlogs}
                    onChange={(e) => handleProfileChange('backlogs', Number(e.target.value))}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Education */}
          {activeTab === 'education' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Education History</h2>
              
              {/* Display List */}
              <div className="space-y-4">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{edu.institution}</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        {edu.degree} in {edu.fieldOfStudy} ({formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'})
                      </p>
                      <p className="text-xs text-purple-400 font-mono mt-0.5">Score: {edu.percentageOrCGPA}</p>
                    </div>
                    <button onClick={() => removeEducation(idx)} className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Education
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Institution / School"
                    value={newEdu.institution}
                    onChange={(e) => setNewEdu((p) => ({ ...p, institution: e.target.value }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.Tech, HSC)"
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu((p) => ({ ...p, degree: e.target.value }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study (e.g. CSE)"
                    value={newEdu.fieldOfStudy}
                    onChange={(e) => setNewEdu((p) => ({ ...p, fieldOfStudy: e.target.value }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Percentage or CGPA"
                    value={newEdu.percentageOrCGPA || ''}
                    onChange={(e) => setNewEdu((p) => ({ ...p, percentageOrCGPA: Number(e.target.value) }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newEdu.startDate}
                      onChange={(e) => setNewEdu((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">End Date (Optional)</label>
                    <input
                      type="date"
                      value={newEdu.endDate}
                      onChange={(e) => setNewEdu((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-4 px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-zinc-100 font-semibold rounded-lg"
                >
                  Confirm Entry
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Skills & Resume */}
          {activeTab === 'skills' && (
            <div className="flex flex-col gap-8">
              {/* Resume upload */}
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Placement Resume</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <p className="text-sm text-zinc-400">
                      Upload your official placement resume in PDF format (Max 5MB). Recruiters will view this resume directly when you apply for drives.
                    </p>
                    {profile.resumeUrl ? (
                      <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-purple-400">
                        <FileText className="w-4 h-4" />
                        <a href={`${api.defaults.baseURL?.replace('/api', '')}${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="hover:underline">
                          View Uploaded Resume PDF
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-red-400 font-semibold mt-4">No resume uploaded yet.</p>
                    )}
                  </div>

                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-purple-500/40 bg-zinc-950/30 hover:bg-zinc-950/60 rounded-3xl p-6 text-center cursor-pointer transition-all duration-300">
                      {uploading ? (
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                          <span className="text-xs font-semibold text-zinc-300">Choose PDF resume</span>
                          <span className="text-[10px] text-zinc-500 mt-1">PDF format under 5MB only</span>
                        </>
                      )}
                      <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-col gap-4 mt-4">
                <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Technical Skills</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Python, Docker, UI/UX"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 max-w-xs w-full"
                  />
                  <button onClick={addSkill} className="px-4 bg-purple-600 hover:bg-purple-700 text-zinc-100 rounded-xl text-xs font-bold">
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-medium text-zinc-300"
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-zinc-500 hover:text-zinc-200">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {profile.skills.length === 0 && <span className="text-zinc-500 text-xs">No skills registered yet.</span>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Experience & Projects */}
          {activeTab === 'experience' && (
            <div className="flex flex-col gap-8">
              {/* Projects */}
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Academic/Personal Projects</h2>
                
                <div className="space-y-4">
                  {profile.projects.map((proj, idx) => (
                    <div key={idx} className="flex justify-between items-start p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">{proj.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{proj.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {proj.technologiesUsed.map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 bg-purple-950/20 text-purple-400 rounded-md font-mono border border-purple-950">
                              {t}
                            </span>
                          ))}
                        </div>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline block mt-2 font-mono">
                            {proj.link}
                          </a>
                        )}
                      </div>
                      <button onClick={() => removeProject(idx)} className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl shrink-0">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl mt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Project
                  </h3>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={newProj.title}
                      onChange={(e) => setNewProj((p) => ({ ...p, title: e.target.value }))}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <textarea
                      placeholder="Project description, architecture, and achievements..."
                      rows={3}
                      value={newProj.description}
                      onChange={(e) => setNewProj((p) => ({ ...p, description: e.target.value }))}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <input
                      type="text"
                      placeholder="Technologies Used (comma separated, e.g. React, Mongoose, Flask)"
                      value={projTechText}
                      onChange={(e) => setProjTechText(e.target.value)}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <input
                      type="text"
                      placeholder="Project Link (GitHub / Live URL)"
                      value={newProj.link}
                      onChange={(e) => setNewProj((p) => ({ ...p, link: e.target.value }))}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={addProject}
                      className="self-start px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-zinc-100 font-semibold rounded-lg mt-2"
                    >
                      Add Project Entry
                    </button>
                  </div>
                </div>
              </div>

              {/* Internships/Experience */}
              <div className="flex flex-col gap-4 mt-4">
                <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Work Experience & Internships</h2>

                <div className="space-y-4">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-start p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">
                          {exp.role} at {exp.company}
                        </h4>
                        <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                        </p>
                        <p className="text-xs text-zinc-400 mt-2">{exp.description}</p>
                      </div>
                      <button onClick={() => removeExperience(idx)} className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl shrink-0">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl mt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Experience
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Company / Organization Name"
                      value={newExp.company}
                      onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Software Dev Intern)"
                      value={newExp.role}
                      onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
                      className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                    <div className="md:col-span-2">
                      <textarea
                        placeholder="Description of duties, tasks, and technologies used..."
                        rows={3}
                        value={newExp.description}
                        onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newExp.startDate}
                        onChange={(e) => setNewExp((p) => ({ ...p, startDate: e.target.value }))}
                        className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-semibold block mb-1">End Date</label>
                      <input
                        type="date"
                        value={newExp.endDate}
                        disabled={newExp.isCurrent}
                        onChange={(e) => setNewExp((p) => ({ ...p, endDate: e.target.value }))}
                        className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300 disabled:opacity-40"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newExp.isCurrent}
                        onChange={(e) => setNewExp((p) => ({ ...p, isCurrent: e.target.checked }))}
                        className="rounded border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                      />
                      <span className="text-xs text-zinc-400">This is my current role</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="mt-4 px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-zinc-100 font-semibold rounded-lg"
                  >
                    Add Experience Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Certifications */}
          {activeTab === 'certs' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-zinc-850 pb-3">Professional Certifications</h2>

              <div className="space-y-4">
                {profile.certifications.map((cert, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{cert.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Issued by {cert.organization} ({formatDate(cert.issueDate)})
                      </p>
                    </div>
                    <button onClick={() => removeCertification(idx)} className="p-2 text-red-400 hover:bg-red-950/20 rounded-xl">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Certification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Certification Name"
                    value={newCert.name}
                    onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Issuing Organization"
                    value={newCert.organization}
                    onChange={(e) => setNewCert((p) => ({ ...p, organization: e.target.value }))}
                    className="px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={newCert.issueDate}
                      onChange={(e) => setNewCert((p) => ({ ...p, issueDate: e.target.value }))}
                      className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCertification}
                  className="mt-4 px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-zinc-100 font-semibold rounded-lg"
                >
                  Add Certification Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentProfile;
