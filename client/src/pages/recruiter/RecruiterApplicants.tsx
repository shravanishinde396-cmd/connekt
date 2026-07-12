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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table.js';
import {
  Users,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  BookmarkCheck,
} from 'lucide-react';

interface Drive {
  _id: string;
  role: string;
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
}

export const RecruiterApplicants: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();

  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback modal / input state
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const fetchDrives = async () => {
    try {
      setLoadingDrives(true);
      const res = await api.get('/recruiter/drives');
      setDrives(res.data);

      // Set initial selected drive (either from navigation state or first drive in list)
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
      setApplicants(res.data);
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
    }
  }, [selectedDriveId]);

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

      // Update state locally
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

  const filteredApplicants = applicants.filter((app) => {
    const term = searchQuery.toLowerCase();
    return (
      app.student.name.toLowerCase().includes(term) ||
      app.student.department.toLowerCase().includes(term) ||
      app.student.skills.some((s) => s.toLowerCase().includes(term))
    );
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Applicant Tracker</h1>
            <p className="text-sm text-zinc-400 mt-1">Review applicant profiles, log feedback, and process shortlist results.</p>
          </div>

          {/* Drive Selector */}
          {!loadingDrives && drives.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Select Campaign</span>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-purple-500"
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

        {/* Filter and stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/10 border border-zinc-850 p-4 rounded-2xl">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search candidates by name, branch, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="flex gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" /> Total Sourced: {applicants.length}
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Hired Pool: {applicants.filter(a => a.status === 'Selected').length}
            </span>
          </div>
        </div>

        {/* Loading list */}
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
                    <TableHead>Student Profile</TableHead>
                    <TableHead className="text-center">CGPA / Backlogs</TableHead>
                    <TableHead>Resume / Skills</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.map((app) => (
                    <TableRow key={app._id}>
                      {/* Identity */}
                      <TableCell>
                        <div>
                          <p className="font-bold text-zinc-100">{app.student.name}</p>
                          <p className="text-[10px] text-zinc-550 font-mono mt-0.5">{app.student.email}</p>
                          <p className="text-[10px] text-purple-450 mt-1 font-semibold">{app.student.department}</p>
                        </div>
                      </TableCell>

                      {/* CGPA */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col gap-0.5">
                          <span className="text-xs font-extrabold text-zinc-200">CGPA: {app.student.CGPA}</span>
                          <span className="text-[10px] text-zinc-550">Backlogs: {app.student.backlogs}</span>
                        </div>
                      </TableCell>

                      {/* Resume & Skills */}
                      <TableCell>
                        <div className="flex flex-col gap-2 max-w-xs">
                          <a
                            href={`${api.defaults.baseURL?.replace('/api', '')}${app.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-405 hover:underline font-mono"
                          >
                            View PDF Resume <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <div className="flex flex-wrap gap-1">
                            {app.student.skills.map((s) => (
                              <Badge key={s} variant="outline" className="text-[9px] px-1 py-0 border-zinc-800">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status badge & Feedback */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          {app.status === 'Selected' ? (
                            <Badge variant="success">{app.status}</Badge>
                          ) : app.status === 'Shortlisted' ? (
                            <Badge variant="info">{app.status}</Badge>
                          ) : app.status === 'Rejected' ? (
                            <Badge variant="destructive">{app.status}</Badge>
                          ) : (
                            <Badge variant="secondary">{app.status}</Badge>
                          )}

                          {app.feedback && (
                            <div className="text-[10px] text-zinc-400 bg-zinc-950/50 p-2 rounded-xl border border-zinc-850/50 max-w-[200px] leading-relaxed">
                              <span className="font-bold text-[9px] uppercase tracking-wider block text-zinc-500 mb-0.5">Notes:</span>
                              {app.feedback}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* Feedback Logger */}
                          <Button
                            onClick={() => handleOpenFeedback(app)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-405 hover:text-purple-400 hover:bg-purple-950/20 rounded-xl cursor-pointer"
                            title="Add Interview Notes / Feedback"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>

                          {app.status !== 'Shortlisted' && app.status !== 'Selected' && (
                            <Button
                              onClick={() => updateStatus(app._id, 'Shortlisted')}
                              variant="ghost"
                              size="sm"
                              className="text-zinc-405 hover:text-blue-400 hover:bg-blue-950/20 rounded-xl cursor-pointer"
                              title="Shortlist for next rounds"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {app.status !== 'Selected' && (
                            <Button
                              onClick={() => updateStatus(app._id, 'Selected')}
                              variant="ghost"
                              size="sm"
                              className="text-zinc-405 hover:text-emerald-400 hover:bg-emerald-950/20 rounded-xl cursor-pointer"
                              title="Confirm Placement Offer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {app.status !== 'Rejected' && (
                            <Button
                              onClick={() => updateStatus(app._id, 'Rejected')}
                              variant="ghost"
                              size="sm"
                              className="text-zinc-405 hover:text-red-405 hover:bg-red-955/20 rounded-xl cursor-pointer"
                              title="Reject Candidate"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredApplicants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                        No candidate applications found for this campaign.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Feedback Modal Overlay */}
        <Modal
          isOpen={!!activeFeedbackId}
          onClose={() => setActiveFeedbackId(null)}
          title="Log Interview Feedback"
        >
          <form onSubmit={handleSaveFeedback} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Candidate Notes / Interview Details</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="e.g. Cleared round 1 technical interview, strong system design concepts. Schedule round 2."
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
                Save Notes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};
export default RecruiterApplicants;
