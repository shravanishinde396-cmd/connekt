import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Award, Calendar as CalendarIcon, CheckCircle, ArrowRight,
  TrendingUp, Sparkles, RefreshCw, Bot, FileText,
  CheckSquare, Bell, ShieldAlert, Cpu, AwardIcon,
  MessageSquare, Download, X
} from 'lucide-react';

interface Company {
  name: string;
  logoUrl?: string;
  industry: string;
}

interface Drive {
  _id: string;
  role: string;
  company: Company;
  packageLPA: number;
  hasApplied: boolean;
  applicationStatus?: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  matchingScore: number;
  deadline: string;
  status: 'Active' | 'Closed';
}

interface StudentProfile {
  profileCompletion: number;
  department: string;
  CGPA: number;
  skills: string[];
  resumeUrl?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>(['Google LLC', 'Microsoft']);

  // AI Feature States
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [probabilityData, setProbabilityData] = useState<any>(null);
  const [probabilityLoading, setProbabilityLoading] = useState(false);

  // Mock interactive interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Mock Calendar Events
  const [calendarEvents] = useState([
    { id: '1', title: 'Google Technical Interview', date: '2026-07-15', time: '10:00 AM', type: 'Interview' },
    { id: '2', title: 'Microsoft Drive Deadline', date: '2026-07-18', time: '11:59 PM', type: 'Deadline' },
    { id: '3', title: 'Stripe PPT Session', date: '2026-07-20', time: '02:00 PM', type: 'Presentation' },
  ]);

  // Mock Offer Letters
  const [offers] = useState([
    { id: '1', company: 'Google LLC', role: 'Associate Software Engineer Intern', package: '22 LPA', date: 'July 10, 2026', file: 'google_offer_letter.pdf' }
  ]);

  // Mock Notifications list
  const [notifications] = useState([
    { id: '1', title: 'Resume Accepted', msg: 'Your resume was successfully matched with Microsoft requirements.', time: '1 hour ago', unread: true },
    { id: '2', title: 'Interview Scheduled', msg: 'Technical Interview round with Google scheduled.', time: '4 hours ago', unread: true },
    { id: '3', title: 'Profile Status', msg: 'Your placement officer approved your CGPA verification.', time: '1 day ago', unread: false }
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/student/profile');
      setProfile(profileRes.data.profile);

      const drivesRes = await api.get('/student/drives');
      setDrives(drivesRes.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const runAtsAnalysis = async () => {
    if (!profile?.resumeUrl) {
      toast('Please upload your resume in Profile settings first!', 'info');
      return;
    }
    setAtsLoading(true);
    try {
      const res = await api.post('/student/profile/analyze-resume');
      setAtsAnalysis(res.data.analysis);
      toast('AI Resume ATS Audit completed!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to analyze resume.', 'error');
    } finally {
      setAtsLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    setRoadmapLoading(true);
    try {
      const res = await api.get('/ai/career-roadmap');
      setRoadmap(res.data);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load career roadmap advice.', 'error');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const fetchInterviewQuestions = async () => {
    setInterviewLoading(true);
    try {
      const res = await api.post('/ai/interview-questions', {
        role: 'Software Engineer',
        company: 'Product Giant'
      });
      setInterviewQuestions(res.data.questions || []);
      setCurrentQuestionIndex(0);
      setInterviewFeedback(null);
    } catch (err: any) {
      console.error(err);
      toast('Failed to generate interview preparation questions.', 'error');
    } finally {
      setInterviewLoading(false);
    }
  };

  const fetchProbability = async () => {
    setProbabilityLoading(true);
    try {
      const res = await api.post('/ai/eligibility-prediction');
      setProbabilityData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProbabilityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai-resume') {
      if (profile?.resumeUrl && !atsAnalysis) runAtsAnalysis();
    } else if (activeTab === 'roadmap') {
      if (!roadmap) fetchRoadmap();
      if (!probabilityData) fetchProbability();
    } else if (activeTab === 'interview') {
      if (interviewQuestions.length === 0) fetchInterviewQuestions();
    }
  }, [activeTab]);

  const toggleBookmark = (companyName: string) => {
    if (bookmarks.includes(companyName)) {
      setBookmarks(bookmarks.filter(b => b !== companyName));
      toast(`Removed ${companyName} from bookmarks`, 'info');
    } else {
      setBookmarks([...bookmarks, companyName]);
      toast(`Bookmarked ${companyName}`, 'success');
    }
  };

  const submitMockAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setFeedbackLoading(true);
    // Simulate AI feedback review based on keywords matching hints
    setTimeout(() => {
      const hint = interviewQuestions[currentQuestionIndex]?.expectedAnswerHint || '';
      let matches = 0;
      hint.split(' ').forEach((word: string) => {
        if (word.length > 4 && userAnswer.toLowerCase().includes(word.toLowerCase().substring(0, 4))) {
          matches++;
        }
      });

      const score = Math.min(Math.round((matches / Math.max(hint.split(' ').length / 3, 1)) * 100), 100);
      let feedback = '';
      if (score > 60) {
        feedback = `Excellent Answer! Score: ${score}%. Your response covers core concepts and articulates performance optimization details effectively.`;
      } else if (score > 30) {
        feedback = `Good attempt. Score: ${score}%. You covered basics, but you should mention: "${hint.split(',').slice(0, 2).join(',')}".`;
      } else {
        feedback = `Needs detail. Score: ${score}%. Review the expected answer hint to refine your technical articulation.`;
      }

      setInterviewFeedback(feedback);
      setFeedbackLoading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  const appliedDrives = drives.filter((d) => d.hasApplied);
  const eligibleDrives = drives.filter((d) => !d.hasApplied && d.status === 'Active');

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title greeting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Student Workspace</h1>
            <p className="text-sm text-zinc-400 mt-1">Welcome back, {user?.name}. Manage your profile and placement drives.</p>
          </div>

          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin-hover" /> Refresh Sync
          </Button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap border-b border-zinc-800 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Overview & Timeline
          </button>
          <button
            onClick={() => setActiveTab('ai-resume')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai-resume'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Bot className="w-4 h-4" /> AI Resume Score & Suggestions
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Roadmap & Eligibility
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'interview'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Mock Interview Prep
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Bell className="w-4 h-4" /> Calendar & Alerts
          </button>
        </div>

        {/* Tab 1: Overview & Applications Timeline */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-zinc-400">Applications</span>
                    <Briefcase className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                      <NumberCounter value={appliedDrives.length} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Submitted job applications</p>
                </CardContent>
              </Card>

              <Card className="hover:border-zinc-700 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-zinc-400">Eligible Drives</span>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                      <NumberCounter value={eligibleDrives.length} />
                    </span>
                    <Badge variant="success">{eligibleDrives.length} open</Badge>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Available drives right now</p>
                </CardContent>
              </Card>

              <Card className="hover:border-zinc-700 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-zinc-400">Shortlisted Rounds</span>
                    <Award className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                      <NumberCounter value={appliedDrives.filter(d => d.applicationStatus === 'Shortlisted').length} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Interview stage advancements</p>
                </CardContent>
              </Card>

              <Card className="hover:border-zinc-700 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-zinc-400">Offers Issued</span>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                      <NumberCounter value={offers.length} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Selection results pending download</p>
                </CardContent>
              </Card>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Application Timeline History */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center justify-between">
                  Application History & Timeline
                  <Link to="/dashboard/student/drives" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
                    Apply to new drives <ArrowRight className="w-3 h-3" />
                  </Link>
                </h3>

                {appliedDrives.length === 0 ? (
                  <div className="bg-zinc-900/10 border border-zinc-850 p-8 rounded-3xl text-center py-12">
                    <p className="text-zinc-500 text-xs">No active applications. Select a drive and submit your resume to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appliedDrives.map(drive => (
                      <div key={drive._id} className="p-5 bg-zinc-950/60 border border-zinc-850 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 font-bold text-sm">
                              {drive.company.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-zinc-200">{drive.role}</h4>
                              <p className="text-xs text-zinc-500">{drive.company.name}</p>
                            </div>
                          </div>
                          <Badge variant={drive.applicationStatus === 'Selected' ? 'success' : drive.applicationStatus === 'Rejected' ? 'destructive' : 'info'}>
                            {drive.applicationStatus || 'Applied'}
                          </Badge>
                        </div>

                        {/* Progression Stepper */}
                        <div className="flex items-center text-[10px] text-zinc-500 font-semibold justify-between px-4">
                          <span className="text-emerald-400">1. Applied (Completed)</span>
                          <span className={drive.applicationStatus === 'Shortlisted' || drive.applicationStatus === 'Selected' ? 'text-emerald-400' : ''}>2. Technical Interview</span>
                          <span className={drive.applicationStatus === 'Selected' ? 'text-emerald-400' : ''}>3. Offer Decision</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bookmarked companies */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-3">Bookmarked Companies</h3>
                <div className="bg-zinc-900/10 border border-zinc-850 p-6 rounded-3xl space-y-4">
                  {bookmarks.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center">No bookmarked companies yet.</p>
                  ) : (
                    bookmarks.map((company, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-200">{company}</span>
                        <button
                          onClick={() => toggleBookmark(company)}
                          className="p-1 hover:bg-zinc-900 rounded text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  
                  <div className="pt-2">
                    <span className="text-[10px] text-zinc-500">Bookmark companies during Drives search to keep track here.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Resume Score & Suggestions */}
        {activeTab === 'ai-resume' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-zinc-900/10 border border-zinc-850 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 text-purple-400 rounded-full text-xs font-bold">
                  <Bot className="w-3.5 h-3.5" />
                  Gemini ATS Resume Audit
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-100">Audit Your Resume Formatting & Skills</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Upload your PDF resume on the profile page, then click the button below. PlacePilot AI will parse your skills, predict ATS compatibility, look for grammar optimizations, and list recommended keywords.
                </p>
                <Button
                  onClick={runAtsAnalysis}
                  loading={atsLoading}
                  className="shadow-xl shadow-purple-600/10 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Run ATS Resume Check
                </Button>
              </div>

              {/* Resume Score circular progress visualization */}
              <div className="flex flex-col items-center">
                <div className="w-36 h-36 rounded-full border-4 border-zinc-800 flex flex-col items-center justify-center relative bg-zinc-950/60 shadow-inner">
                  <span className="text-4xl font-extrabold font-mono text-purple-400">
                    {atsAnalysis ? atsAnalysis.atsScore : (profile?.resumeUrl ? '--' : '0')}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">ATS Score</span>
                </div>
                {profile?.resumeUrl ? (
                  <span className="text-xs text-zinc-400 mt-3 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> Resume uploaded
                  </span>
                ) : (
                  <span className="text-xs text-red-400 mt-3">No resume uploaded.</span>
                )}
              </div>
            </div>

            {/* Analysis details */}
            {atsAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strength & summary */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <AwardIcon className="w-4.5 h-4.5 text-purple-400" />
                    Resume Strength Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Overall Rating:</span>
                      <span className="font-bold text-zinc-200">{atsAnalysis.strengthRating || 4} / 5</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-850/60">
                      {atsAnalysis.summary}
                    </p>
                  </div>
                </Card>

                {/* Skill gap analysis */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <ShieldAlert className="w-4.5 h-4.5 text-purple-400" />
                    Skill Gap Analysis
                  </h3>
                  <div className="space-y-2">
                    <span className="text-xs text-zinc-400">Identified weak areas or missing tools:</span>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {atsAnalysis.missingSkills?.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="destructive">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Grammar suggestions */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <CheckSquare className="w-4.5 h-4.5 text-purple-400" />
                    Wording & Grammar Enhancements
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    {atsAnalysis.grammarSuggestions?.map((item: string, idx: number) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="text-purple-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Keywords to inject */}
                <Card className="p-6 space-y-4">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <Cpu className="w-4.5 h-4.5 text-purple-400" />
                    Recommended Keywords to Inject
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {atsAnalysis.keywordSuggestions?.map((kw: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Roadmap & Eligibility */}
        {activeTab === 'roadmap' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Probability overview */}
            {roadmapLoading || probabilityLoading ? (
              <div className="h-48 flex items-center justify-center"><Skeleton className="h-full w-full rounded-3xl" /></div>
            ) : (
              <div className="bg-zinc-900/10 border border-zinc-850 p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Score Dial */}
                <div className="flex flex-col items-center justify-center border-r border-zinc-850/65 pr-4">
                  <div className="w-32 h-32 rounded-full border-4 border-zinc-800 flex flex-col items-center justify-center bg-zinc-950/60">
                    <span className="text-4xl font-extrabold font-mono text-purple-400">{probabilityData?.probabilityScore || 85}%</span>
                    <span className="text-[10px] text-zinc-500 uppercase mt-1">Probability</span>
                  </div>
                  <span className="text-xs text-zinc-300 mt-3 font-semibold">Placement Probability Score</span>
                </div>

                {/* Verdict Factors */}
                <div className="md:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 text-purple-400 rounded-full text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Eligibility Verdict
                  </div>
                  <h3 className="text-lg font-bold text-zinc-200">{probabilityData?.verdict}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {probabilityData?.factors?.map((f: any, idx: number) => (
                      <div key={idx} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-zinc-400">{f.name}</span>
                          <span className="text-purple-400">{f.score}/100</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">{f.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Roadmap & Certifications */}
            {roadmap && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Roadmap Steps */}
                <Card className="p-6 space-y-6">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <TrendingUp className="w-4.5 h-4.5 text-purple-400" />
                    Roadmap to Eligibility & Success
                  </h3>
                  <div className="space-y-4">
                    {roadmap.roadmapSteps?.map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-300">{step.phase}</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.target}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recommended Certifications */}
                <Card className="p-6 space-y-6">
                  <h3 className="font-extrabold text-zinc-200 text-sm flex items-center gap-2 border-b border-zinc-850 pb-3">
                    <Award className="w-4.5 h-4.5 text-purple-400" />
                    Recommended Certifications
                  </h3>
                  <div className="space-y-4">
                    {roadmap.recommendedCertifications?.map((c: any, idx: number) => (
                      <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-200">{c.name}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{c.provider} • Difficulty: {c.difficulty}</p>
                        </div>
                        <Badge variant="info" className="text-[9px]">{c.effortDays} Days</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Mock Interview Prep */}
        {activeTab === 'interview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-zinc-900/10 border border-zinc-850 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 text-purple-400 rounded-full text-xs font-bold">
                  <Bot className="w-3.5 h-3.5" />
                  Gemini Interview Assistant
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-100 font-sans">Role-Specific Technical Questions</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Generate mock coding & engineering questions matching your department and profile. Write your response, and click 'Submit Answer' to get grading feedback and advice.
                </p>
                <Button
                  onClick={fetchInterviewQuestions}
                  loading={interviewLoading}
                  className="shadow-xl shadow-purple-600/10 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Re-Generate Questions
                </Button>
              </div>

              <div className="hidden md:block text-purple-500/20"><Bot className="w-32 h-32" /></div>
            </div>

            {/* Questions container */}
            {interviewQuestions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2/3: Active Question workspace */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                      <span className="text-xs text-zinc-400">Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
                      <Badge variant="warning">{interviewQuestions[currentQuestionIndex]?.difficulty}</Badge>
                    </div>

                    <h3 className="text-base font-bold text-zinc-200 leading-relaxed">
                      {interviewQuestions[currentQuestionIndex]?.question}
                    </h3>

                    {/* Response box */}
                    <form onSubmit={submitMockAnswer} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-zinc-400">Your Technical Response</label>
                        <textarea
                          placeholder="Type your detailed explanation or draft code structure here..."
                          value={userAnswer}
                          onChange={(e) => {
                            setUserAnswer(e.target.value);
                            setInterviewFeedback(null);
                          }}
                          rows={6}
                          className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-200 text-xs placeholder-zinc-500"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button
                          type="submit"
                          disabled={!userAnswer.trim() || feedbackLoading}
                          loading={feedbackLoading}
                          className="cursor-pointer"
                        >
                          Grade Answer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCurrentQuestionIndex((prev) => (prev + 1) % interviewQuestions.length);
                            setUserAnswer('');
                            setInterviewFeedback(null);
                          }}
                          className="cursor-pointer"
                        >
                          Next Question
                        </Button>
                      </div>
                    </form>

                    {/* AI Feedback */}
                    <AnimatePresence>
                      {interviewFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-2"
                        >
                          <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                            <Bot className="w-4 h-4" /> AI Evaluation Feedback
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">{interviewFeedback}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>

                {/* Right 1/3: Questions list */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-850 pb-3">Available Questions</h3>
                  <div className="space-y-3">
                    {interviewQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setUserAnswer('');
                          setInterviewFeedback(null);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-colors flex justify-between items-center cursor-pointer ${
                          currentQuestionIndex === idx
                            ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate max-w-[200px]">{q.question}</span>
                        <Badge variant="secondary" className="text-[9px]">{q.difficulty}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Calendar & Alerts */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Left 2/3: Calendar list & Offer Letters */}
            <div className="lg:col-span-2 space-y-8">
              {/* Calendar events */}
              <div className="bg-zinc-900/10 border border-zinc-850 p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  Upcoming Placement Calendar Events
                </h3>

                <div className="space-y-4">
                  {calendarEvents.map(evt => (
                    <div key={evt.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex flex-col items-center justify-center font-mono">
                          <span className="text-[9px] font-bold uppercase">{evt.type.substring(0, 4)}</span>
                          <span className="text-sm font-extrabold">{evt.date.split('-')[2]}</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{evt.title}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{evt.date} • {evt.time}</p>
                        </div>
                      </div>
                      <Badge variant={evt.type === 'Interview' ? 'info' : 'secondary'}>{evt.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer Letters */}
              <div className="bg-zinc-900/10 border border-zinc-850 p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  My Issued Offer Letters
                </h3>

                <div className="space-y-4">
                  {offers.map(off => (
                    <div key={off.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{off.company}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{off.role} • <strong>Package:</strong> {off.package}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </Button>
                    </div>
                  ))}

                  {offers.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">No offer letters issued yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1/3: Alerts & Notification log */}
            <div className="bg-zinc-900/10 border border-zinc-850 p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Notification Stream
              </h3>

              <div className="space-y-4">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-2 relative overflow-hidden">
                    {notif.unread && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500"></div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-350 text-xs">{notif.title}</span>
                      <span className="text-[9px] text-zinc-500">{notif.time}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{notif.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
