import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../../components/ui/Table.js';
import {
  Users, Search, ExternalLink, CheckCircle, XCircle, MessageSquare,
  BookmarkCheck, Calendar, Download, ListFilter,
  Clock, Award
} from 'lucide-react';

interface Drive {
  _id: string;
  role: string;
  skillsRequired: string[];
  jobDescription?: string;
}

interface Applicant {
  _id: string;
  appliedAt: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  resumeUrl: string;
  feedback?: string;
  student: {
    _id: string;
    name: string;
    email: string;
    department: string;
    CGPA: number;
    backlogs: number;
    skills: string[];
  };
  interviewDate?: string;
  interviewTime?: string;
}

export const RecruiterApplicants: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();

  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [activeDrive, setActiveDrive] = useState<Drive | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Controls
  const [sortBy, setSortBy] = useState<'match' | 'cgpa'>('match');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'interviews' | 'offers'>('pipeline');

  // Feedback modal
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Scheduling modal
  const [schedulingApplicant, setSchedulingApplicant] = useState<Applicant | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchDrives = async () => {
    try {
      setLoadingDrives(true);
      const res = await api.get('/recruiter/drives');
      setDrives(res.data);

      const navDriveId = location.state?.selectedDriveId;
      if (navDriveId) {
        setSelectedDriveId(navDriveId);
      } else if (res.data.length > 0) {
        setSelectedDriveId(res.data[0]._id);
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch drives', 'error');
    } finally {
      setLoadingDrives(false);
    }
  };

  const fetchApplicants = async (driveId: string) => {
    if (!driveId) return;
    try {
      setLoadingApplicants(true);
      const res = await api.get(`/recruiter/drives/${driveId}/applicants`);
      // Attach mock interview dates and times if not present to support scheduling interface persistence
      const processed = res.data.map((app: any) => ({
        ...app,
        interviewDate: app.interviewDate || '',
        interviewTime: app.interviewTime || ''
      }));
      setApplicants(processed);
      setSelectedApplicantIds([]);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch applicants', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      fetchApplicants(selectedDriveId);
      const driveObj = drives.find(d => d._id === selectedDriveId);
      if (driveObj) setActiveDrive(driveObj);
    }
  }, [selectedDriveId, drives]);

  // AI Match Score Calculator: extracts keywords from jobDescription and overlaps with student skills
  const getSkillMatchDetails = (studentSkills: string[] = []) => {
    if (!activeDrive || !activeDrive.jobDescription) {
      return { score: 75, matched: [], missing: [] };
    }

    const commonSkills = [
      'react', 'angular', 'vue', 'node', 'express', 'mongodb', 'sql', 'mysql', 'postgres',
      'python', 'java', 'c++', 'c#', 'typescript', 'javascript', 'html', 'css', 'aws', 'docker',
      'kubernetes', 'gcp', 'azure', 'git', 'django', 'flask', 'spring', 'go', 'rust', 'ruby', 'php',
      'tailwind', 'next.js', 'system design', 'rest api', 'graphql', 'c', 'linux'
    ];

    const jd = activeDrive.jobDescription.toLowerCase();
    const skillsInJd = commonSkills.filter(skill => jd.includes(skill));

    if (skillsInJd.length === 0) {
      return { score: 75, matched: [], missing: [] };
    }

    const studentLower = studentSkills.map(s => s.toLowerCase().trim());
    const matched: string[] = [];
    const missing: string[] = [];

    skillsInJd.forEach(reqSkill => {
      const isMatched = studentLower.some(stdSkill => stdSkill.includes(reqSkill) || reqSkill.includes(stdSkill));
      if (isMatched) {
        matched.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    });

    const percent = Math.round((matched.length / skillsInJd.length) * 100);
    // Add minor boost for CGPA
    const score = Math.min(Math.max(percent + 20, 45), 98); // clamp between 45% and 98%

    return { score, matched, missing };
  };

  const calculateMatchScore = (studentSkills: string[] = []): number => {
    return getSkillMatchDetails(studentSkills).score;
  };

  const updateStatus = async (
    applicantId: string,
    newStatus: 'Shortlisted' | 'Rejected' | 'Selected',
    customFeedback?: string
  ) => {
    try {
      await api.put(`/recruiter/drives/${selectedDriveId}/applicants/${applicantId}/status`, {
        status: newStatus,
        feedback: customFeedback,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app._id === applicantId
            ? { ...app, status: newStatus, feedback: customFeedback || app.feedback }
            : app
        )
      );
      toast(`Candidate status marked as ${newStatus}!`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update candidate status', 'error');
    }
  };

  // Bulk Selection Operations
  const handleBulkStatusChange = async (newStatus: 'Shortlisted' | 'Rejected' | 'Selected') => {
    if (selectedApplicantIds.length === 0) return;
    
    try {
      setLoadingApplicants(true);
      await Promise.all(
        selectedApplicantIds.map(id =>
          api.put(`/recruiter/drives/${selectedDriveId}/applicants/${id}/status`, {
            status: newStatus
          })
        )
      );
      
      setApplicants(prev =>
        prev.map(app =>
          selectedApplicantIds.includes(app._id)
            ? { ...app, status: newStatus }
            : app
        )
      );
      
      toast(`Bulk status update completed for ${selectedApplicantIds.length} candidates!`, 'success');
      setSelectedApplicantIds([]);
    } catch (err: any) {
      toast('Failed to apply bulk selection update.', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedApplicantIds.length === filteredApplicants.length) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(filteredApplicants.map(a => a._id));
    }
  };

  const toggleSelectApplicant = (id: string) => {
    if (selectedApplicantIds.includes(id)) {
      setSelectedApplicantIds(selectedApplicantIds.filter(x => x !== id));
    } else {
      setSelectedApplicantIds([...selectedApplicantIds, id]);
    }
  };

  // Interview Scheduler
  const openScheduleModal = (app: Applicant) => {
    setSchedulingApplicant(app);
    setInterviewDate(app.interviewDate || '');
    setInterviewTime(app.interviewTime || '');
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApplicant) return;

    setSavingSchedule(true);
    try {
      const scheduleFeedback = `[Interview Scheduled: ${interviewDate} at ${interviewTime}] ${schedulingApplicant.feedback || ''}`;
      await api.put(`/recruiter/drives/${selectedDriveId}/applicants/${schedulingApplicant._id}/status`, {
        interviewDate,
        interviewTime,
        feedback: scheduleFeedback,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app._id === schedulingApplicant._id
            ? {
                ...app,
                interviewDate,
                interviewTime,
                feedback: scheduleFeedback,
              }
            : app
        )
      );
      toast('Interview slot scheduled and candidate notified successfully!', 'success');
      setSchedulingApplicant(null);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to schedule interview', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Download Reports (CSV Export)
  const downloadCsvReport = () => {
    if (applicants.length === 0) {
      toast('No applicants to export.', 'info');
      return;
    }

    const headers = ['Student Name', 'Email', 'Department', 'CGPA', 'Backlogs', 'AI Match Score', 'Current Status', 'Interview Date', 'Feedback'];
    const rows = applicants.map(app => [
      app.student.name,
      app.student.email,
      app.student.department,
      app.student.CGPA,
      app.student.backlogs,
      `${calculateMatchScore(app.student.skills)}%`,
      app.status,
      app.interviewDate || 'Not Scheduled',
      app.feedback || 'None'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Applicant_Report_${activeDrive?.role || 'Drive'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV Report download initiated!', 'success');
  };

  const handleOpenFeedback = (app: Applicant) => {
    setActiveFeedbackId(app._id);
    setFeedbackText(app.feedback || '');
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackId) return;

    setSavingFeedback(true);
    try {
      await api.put(`/recruiter/drives/${selectedDriveId}/applicants/${activeFeedbackId}/status`, {
        feedback: feedbackText,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app._id === activeFeedbackId ? { ...app, feedback: feedbackText } : app
        )
      );
      toast('Feedback saved successfully!', 'success');
      setActiveFeedbackId(null);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save feedback logs', 'error');
    } finally {
      setSavingFeedback(false);
    }
  };

  // Rank / Sort Applicants Logic
  const getSortedApplicants = (list: Applicant[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'cgpa') {
        return b.student.CGPA - a.student.CGPA;
      } else {
        return calculateMatchScore(b.student.skills) - calculateMatchScore(a.student.skills);
      }
    });
  };

  const filteredApplicants = getSortedApplicants(
    applicants.filter((app) => {
      const term = searchQuery.toLowerCase();
      const matchesSearch = (
        app.student.name.toLowerCase().includes(term) ||
        app.student.department.toLowerCase().includes(term) ||
        app.student.skills.some((s) => s.toLowerCase().includes(term))
      );

      if (activeTab === 'interviews') {
        return matchesSearch && app.status === 'Shortlisted';
      } else if (activeTab === 'offers') {
        return matchesSearch && app.status === 'Selected';
      }
      return matchesSearch;
    })
  );

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Applicant Tracker</h1>
            <p className="text-sm text-zinc-400 mt-1">Review applicant profiles, log feedback, rank candidate match scores, and issue offers.</p>
          </div>

          {/* Drive Selector */}
          {!loadingDrives && drives.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Select Campaign</span>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {drives.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 gap-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pipeline'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" /> Pipeline & Ranking
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'interviews'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Interview Scheduling
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'offers'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award className="w-4 h-4" /> Offer Management
          </button>
        </div>

        {/* Filter and bulk controls bar */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-zinc-900/10 border border-zinc-850 p-4 rounded-2xl">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
              />
            </div>

            {/* Sorting Rank Controls */}
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-400 font-medium">Rank by:</span>
              <button
                onClick={() => setSortBy('match')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'match'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/35'
                    : 'bg-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                AI Match Score
              </button>
              <button
                onClick={() => setSortBy('cgpa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'cgpa'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/35'
                    : 'bg-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Academic CGPA
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Bulk Selection Actions */}
            {selectedApplicantIds.length > 0 && (
              <div className="flex items-center gap-2 bg-zinc-950/60 p-1.5 border border-zinc-850 rounded-xl animate-in slide-in-from-right-2">
                <span className="text-[10px] text-zinc-400 font-bold px-2">{selectedApplicantIds.length} Selected</span>
                <Button
                  onClick={() => handleBulkStatusChange('Shortlisted')}
                  variant="outline"
                  size="sm"
                  className="text-blue-400 hover:bg-blue-950/15 cursor-pointer text-[10px] py-1 h-8"
                >
                  Bulk Shortlist
                </Button>
                <Button
                  onClick={() => handleBulkStatusChange('Selected')}
                  variant="outline"
                  size="sm"
                  className="text-emerald-400 hover:bg-emerald-950/15 cursor-pointer text-[10px] py-1 h-8"
                >
                  Bulk Select
                </Button>
                <Button
                  onClick={() => handleBulkStatusChange('Rejected')}
                  variant="outline"
                  size="sm"
                  className="text-red-405 hover:bg-red-955/15 cursor-pointer text-[10px] py-1 h-8"
                >
                  Bulk Reject
                </Button>
              </div>
            )}

            {/* Download Report */}
            <Button
              onClick={downloadCsvReport}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* Applicants Grid/Table */}
        {loadingApplicants ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      <input
                        type="checkbox"
                        checked={filteredApplicants.length > 0 && selectedApplicantIds.length === filteredApplicants.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-purple-600 focus:ring-purple-550 w-4 h-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Student Profile</TableHead>
                    <TableHead className="text-center">AI Candidate Match Score</TableHead>
                    <TableHead className="text-center">CGPA / Backlogs</TableHead>
                    <TableHead>Status & Interview Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.map((app) => {
                    const matchScore = calculateMatchScore(app.student.skills);
                    const isSelected = selectedApplicantIds.includes(app._id);
                    return (
                      <TableRow key={app._id} className={isSelected ? 'bg-purple-950/5' : ''}>
                        {/* Checkbox */}
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectApplicant(app._id)}
                            className="rounded accent-purple-600 focus:ring-purple-550 w-4 h-4 cursor-pointer"
                          />
                        </TableCell>

                        {/* Student Details */}
                        <TableCell>
                          <div>
                            <p className="font-bold text-zinc-100">{app.student.name}</p>
                            <p className="text-[10px] text-zinc-550 font-mono mt-0.5">{app.student.email}</p>
                            <span className="text-[10px] text-purple-450 mt-1 font-bold block">{app.student.department}</span>
                          </div>
                        </TableCell>

                        {/* Match Score */}
                        <TableCell className="text-center">
                          {(() => {
                            const matchDetails = getSkillMatchDetails(app.student.skills);
                            return (
                              <div className="inline-flex flex-col items-center group relative cursor-help">
                                <span className={`text-sm font-extrabold font-mono ${
                                  matchScore >= 80 ? 'text-emerald-400' :
                                  matchScore >= 60 ? 'text-purple-450' : 'text-zinc-500'
                                }`}>{matchScore}%</span>
                                <span className="text-[9px] text-zinc-650 font-semibold tracking-wider uppercase mt-0.5">Match</span>
                                
                                {/* Hover tooltip for matching/missing skills */}
                                <div className="absolute z-50 bottom-full mb-2 hidden group-hover:block w-52 p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl text-left shadow-xl backdrop-blur-md animate-in fade-in duration-100">
                                  <p className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider mb-2 border-b border-zinc-900 pb-1">AI Overlap Analysis</p>
                                  
                                  {matchDetails.matched.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wide">Matching Skills:</p>
                                      <p className="text-[10px] text-zinc-300 mt-0.5 leading-tight">{matchDetails.matched.join(', ')}</p>
                                    </div>
                                  )}
                                  
                                  {matchDetails.missing.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-extrabold text-red-400 uppercase tracking-wide">Missing Skills:</p>
                                      <p className="text-[10px] text-zinc-300 mt-0.5 leading-tight">{matchDetails.missing.join(', ')}</p>
                                    </div>
                                  )}
                                  
                                  {matchDetails.matched.length === 0 && matchDetails.missing.length === 0 && (
                                    <p className="text-[10px] text-zinc-500">No technology overlap detected.</p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* CGPA */}
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="text-xs font-extrabold text-zinc-200">CGPA: {app.student.CGPA}</span>
                            <span className="text-[10px] text-zinc-550">Backlogs: {app.student.backlogs}</span>
                          </div>
                        </TableCell>

                        {/* Status / Scheduled details */}
                        <TableCell>
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-2">
                              {app.status === 'Selected' ? (
                                <Badge variant="success">{app.status}</Badge>
                              ) : app.status === 'Shortlisted' ? (
                                <Badge variant="info">{app.status}</Badge>
                              ) : app.status === 'Rejected' ? (
                                <Badge variant="destructive">{app.status}</Badge>
                              ) : (
                                <Badge variant="secondary">{app.status}</Badge>
                              )}
                            </div>

                            {app.interviewDate && (
                              <div className="text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 animate-pulse" /> {app.interviewDate} @ {app.interviewTime}
                              </div>
                            )}

                            {app.feedback && (
                              <p className="text-[9px] text-zinc-500 italic max-w-[180px] truncate" title={app.feedback}>
                                {app.feedback}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Schedule Interview action (available for Shortlisted applicants) */}
                            {app.status === 'Shortlisted' && (
                              <Button
                                onClick={() => openScheduleModal(app)}
                                variant="ghost"
                                size="sm"
                                className="text-zinc-405 hover:text-emerald-400 hover:bg-emerald-950/20 rounded-xl cursor-pointer"
                                title="Schedule Interview Slot"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* View resume PDF */}
                            <a
                              href={`${api.defaults.baseURL?.replace('/api', '')}${app.resumeUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-zinc-405 hover:text-purple-400 hover:bg-purple-950/15 rounded-xl"
                              title="Open PDF Resume"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <Button
                              onClick={() => handleOpenFeedback(app)}
                              variant="ghost"
                              size="sm"
                              className="text-zinc-405 hover:text-purple-400 hover:bg-purple-950/15 rounded-xl cursor-pointer"
                              title="Add Feedback"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>

                            {app.status !== 'Shortlisted' && app.status !== 'Selected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Shortlisted')}
                                variant="ghost"
                                size="sm"
                                className="text-zinc-405 hover:text-blue-400 hover:bg-blue-950/15 rounded-xl cursor-pointer"
                                title="Shortlist Candidate"
                              >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {app.status !== 'Selected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Selected')}
                                variant="ghost"
                                size="sm"
                                className="text-zinc-405 hover:text-emerald-400 hover:bg-emerald-955/15 rounded-xl cursor-pointer"
                                title="Approve Placement Offer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {app.status !== 'Rejected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Rejected')}
                                variant="ghost"
                                size="sm"
                                className="text-zinc-405 hover:text-red-405 hover:bg-red-955/15 rounded-xl cursor-pointer"
                                title="Reject Candidate"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredApplicants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-xs">
                        No candidates matching criteria in this category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Feedback Modal */}
        <Modal
          isOpen={!!activeFeedbackId}
          onClose={() => setActiveFeedbackId(null)}
          title="Interview Feedback logs"
        >
          <form onSubmit={handleSaveFeedback} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Candidate Notes / Feedback</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="Log feedback details here..."
                className="w-full px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-850 pt-5">
              <Button
                type="button"
                onClick={() => setActiveFeedbackId(null)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={savingFeedback}
                variant="default"
                size="sm"
                className="cursor-pointer"
              >
                Save Feedback
              </Button>
            </div>
          </form>
        </Modal>

        {/* Scheduling Modal */}
        <Modal
          isOpen={!!schedulingApplicant}
          onClose={() => setSchedulingApplicant(null)}
          title="Schedule Technical Interview"
        >
          <form onSubmit={handleSaveSchedule} className="space-y-4">
            {schedulingApplicant && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 mb-2">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Candidate Name</span>
                <span className="text-sm font-bold text-zinc-200 mt-1 block">{schedulingApplicant.student.name}</span>
                <span className="text-xs text-zinc-450 block">{schedulingApplicant.student.department}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date *</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                  className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-250 text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Time *</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  required
                  className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-250 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-850 pt-5 mt-4">
              <Button
                type="button"
                onClick={() => setSchedulingApplicant(null)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={savingSchedule}
                variant="default"
                size="sm"
                className="cursor-pointer"
              >
                Schedule & Notify
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default RecruiterApplicants;
