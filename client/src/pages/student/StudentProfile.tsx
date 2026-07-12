import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
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
  Sparkles,
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

interface ResumeAnalysis {
  atsScore: number;
  summary: string;
  missingSkills: string[];
  grammarSuggestions: string[];
  keywordSuggestions: string[];
  strengthRating: number;
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
  resumeAnalysis?: ResumeAnalysis;
}

export const StudentProfile: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('academic');

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

  const handleAnalyzeResume = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post('/student/profile/analyze-resume');
      setProfile((prev) => ({
        ...prev,
        resumeAnalysis: res.data.analysis,
      }));
      toast('Resume analyzed successfully by AI!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to analyze resume', 'error');
    } finally {
      setAnalyzing(false);
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
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48 mb-4 rounded-xl" />
        <Skeleton className="h-4 w-full rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title & Progress Tracker */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Manage Placement Profile</h1>
            <p className="text-sm text-zinc-400 mt-1">Keep your credentials up to date to remain placement eligible.</p>
          </div>

          {/* Profile Completion bar */}
          <div className="w-full md:max-w-xs bg-zinc-900/10 border border-zinc-800 p-4 rounded-2xl backdrop-blur-md">
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

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(val) => setActiveTab(val)}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Sidebar Tabs */}
            <div className="flex flex-col gap-2">
              <TabsList className="flex flex-col items-stretch w-full gap-1.5 bg-transparent border-0 p-0">
                <TabsTrigger value="academic" className="justify-start px-4 py-3 rounded-xl text-sm font-semibold border border-transparent hover:border-zinc-800/80">
                  <BookOpen className="w-4 h-4" /> Academic Details
                </TabsTrigger>
                <TabsTrigger value="education" className="justify-start px-4 py-3 rounded-xl text-sm font-semibold border border-transparent hover:border-zinc-800/80">
                  <GraduationCap className="w-4 h-4" /> Education History
                </TabsTrigger>
                <TabsTrigger value="skills" className="justify-start px-4 py-3 rounded-xl text-sm font-semibold border border-transparent hover:border-zinc-800/80">
                  <FileText className="w-4 h-4" /> Skills & Resume
                </TabsTrigger>
                <TabsTrigger value="experience" className="justify-start px-4 py-3 rounded-xl text-sm font-semibold border border-transparent hover:border-zinc-800/80">
                  <Briefcase className="w-4 h-4" /> Projects & Internships
                </TabsTrigger>
                <TabsTrigger value="certs" className="justify-start px-4 py-3 rounded-xl text-sm font-semibold border border-transparent hover:border-zinc-800/80">
                  <Award className="w-4 h-4" /> Certifications
                </TabsTrigger>
              </TabsList>

              {/* Save Button */}
              <Button
                onClick={saveProfile}
                loading={saving}
                variant="default"
                className="w-full mt-4 py-3 cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" /> Save All Changes
              </Button>
            </div>

            {/* Tab Workspace Panel */}
            <div className="lg:col-span-3">
              {/* TAB 1: Academic */}
              <TabsContent value="academic">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Academic & Personal Info</h2>
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
                          className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-200"
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Education */}
              <TabsContent value="education">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Education History</h2>
                    
                    {/* Display List */}
                    <div className="space-y-4">
                      {profile.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-200">{edu.institution}</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              {edu.degree} in {edu.fieldOfStudy} ({formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'})
                            </p>
                            <span className="inline-block text-[10px] text-purple-400 font-mono mt-1 font-semibold uppercase tracking-wider">
                              Score: {edu.percentageOrCGPA}
                            </span>
                          </div>
                          <Button
                            onClick={() => removeEducation(idx)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
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
                          <label className="text-[10px] text-zinc-550 text-zinc-500 font-semibold block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={newEdu.startDate}
                            onChange={(e) => setNewEdu((p) => ({ ...p, startDate: e.target.value }))}
                            className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-550 text-zinc-500 font-semibold block mb-1">End Date (Optional)</label>
                          <input
                            type="date"
                            value={newEdu.endDate}
                            onChange={(e) => setNewEdu((p) => ({ ...p, endDate: e.target.value }))}
                            className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-300"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={addEducation}
                        variant="secondary"
                        size="sm"
                        className="mt-4 cursor-pointer"
                      >
                        Confirm Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Skills & Resume */}
              <TabsContent value="skills">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-6">
                    {/* Resume upload */}
                    <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Placement Resume</h2>
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

                    {/* AI Resume Analyzer */}
                    {profile.resumeUrl && (
                      <div className="mt-4 p-6 border border-zinc-800 bg-zinc-950/20 rounded-2xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-850 pb-4">
                          <div>
                            <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5">
                              <Sparkles className="w-5 h-5 text-purple-400" /> AI Resume Reviewer
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Let Gemini analyze your resume ATS compatibility and placement readiness.</p>
                          </div>
                          <button
                            onClick={handleAnalyzeResume}
                            disabled={analyzing}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-zinc-100 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/10"
                          >
                            {analyzing ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
                                Auditing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" /> Run AI Resume Audit
                              </>
                            )}
                          </button>
                        </div>

                        {profile.resumeAnalysis ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                            {/* Left: ATS Score & strength */}
                            <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl flex flex-col items-center justify-center text-center">
                              <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="6" fill="transparent" />
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="#a855f7"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * profile.resumeAnalysis.atsScore) / 100}
                                    className="transition-all duration-1000"
                                  />
                                </svg>
                                <span className="absolute text-xl font-extrabold text-zinc-100">{profile.resumeAnalysis.atsScore}%</span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-200 mt-4">ATS Compatibility Score</h4>
                              <div className="flex gap-1 mt-2 text-yellow-450">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < profile.resumeAnalysis!.strengthRating ? 'text-purple-400' : 'text-zinc-700'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
                                Strength Rating: {profile.resumeAnalysis.strengthRating}/5
                              </p>
                            </div>

                            {/* Right: Detailed suggestions */}
                            <div className="md:col-span-2 space-y-4">
                              <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Professional Profile Summary</h4>
                                <p className="text-xs text-zinc-300 leading-relaxed mt-1">{profile.resumeAnalysis.summary}</p>
                              </div>

                              {profile.resumeAnalysis.missingSkills?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recommended Skills to Add</h4>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {profile.resumeAnalysis.missingSkills.map((skill, sIdx) => (
                                      <Badge key={sIdx} variant="destructive">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {profile.resumeAnalysis.keywordSuggestions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ATS Keywords to Inject</h4>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {profile.resumeAnalysis.keywordSuggestions.map((kw, kwIdx) => (
                                      <Badge key={kwIdx} variant="secondary">
                                        {kw}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {profile.resumeAnalysis.grammarSuggestions?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Wording & Structure Suggestions</h4>
                                  <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-zinc-400">
                                    {profile.resumeAnalysis.grammarSuggestions.map((sug, sugIdx) => (
                                      <li key={sugIdx}>{sug}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-zinc-500 text-xs">
                            No analysis results yet. Click "Run AI Resume Audit" to get instant Gemini AI feedback.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills Tags */}
                    <div className="flex flex-col gap-4 mt-4">
                      <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Technical Skills</h2>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Python, Docker, UI/UX"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                          className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 max-w-xs w-full"
                        />
                        <Button onClick={addSkill} variant="secondary" size="sm" className="cursor-pointer">
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-medium text-zinc-300"
                          >
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {profile.skills.length === 0 && <span className="text-zinc-500 text-xs">No skills registered yet.</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: Experience & Projects */}
              <TabsContent value="experience">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-8">
                    {/* Projects */}
                    <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Academic/Personal Projects</h2>
                      
                      <div className="space-y-4">
                        {profile.projects.map((proj, idx) => (
                          <div key={idx} className="flex justify-between items-start p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                            <div>
                              <h4 className="text-sm font-bold text-zinc-200">{proj.title}</h4>
                              <p className="text-xs text-zinc-400 mt-1">{proj.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {proj.technologiesUsed.map((t) => (
                                  <Badge key={t} variant="outline">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                              {proj.link && (
                                <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline block mt-2 font-mono">
                                  {proj.link}
                                </a>
                              )}
                            </div>
                            <Button
                              onClick={() => removeProject(idx)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
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
                          <Button
                            type="button"
                            onClick={addProject}
                            variant="secondary"
                            size="sm"
                            className="self-start mt-2 cursor-pointer"
                          >
                            Add Project Entry
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Internships/Experience */}
                    <div className="flex flex-col gap-4 mt-4">
                      <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Work Experience & Internships</h2>

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
                            <Button
                              onClick={() => removeExperience(idx)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
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
                              className="rounded border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer"
                            />
                            <span className="text-xs text-zinc-400">This is my current role</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={addExperience}
                          variant="secondary"
                          size="sm"
                          className="mt-4 cursor-pointer"
                        >
                          Add Experience Entry
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 5: Certifications */}
              <TabsContent value="certs">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <h2 className="text-xl font-bold border-b border-zinc-850 pb-3 text-zinc-100">Professional Certifications</h2>

                    <div className="space-y-4">
                      {profile.certifications.map((cert, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-200">{cert.name}</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              Issued by {cert.organization} ({formatDate(cert.issueDate)})
                            </p>
                          </div>
                          <Button
                            onClick={() => removeCertification(idx)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
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
                          <label className="text-[10px] text-zinc-550 text-zinc-500 font-semibold block mb-1">Issue Date</label>
                          <input
                            type="date"
                            value={newCert.issueDate}
                            onChange={(e) => setNewCert((p) => ({ ...p, issueDate: e.target.value }))}
                            className="w-full px-4 py-2 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-305"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={addCertification}
                        variant="secondary"
                        size="sm"
                        className="mt-4 cursor-pointer"
                      >
                        Add Certification Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </PageTransition>
  );
};
export default StudentProfile;
