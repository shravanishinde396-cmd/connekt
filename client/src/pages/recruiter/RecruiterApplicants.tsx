import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
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
    <div className="flex flex-col gap-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Applicant Tracker</h1>
          <p className="text-sm text-zinc-400 mt-1">Review applicant profiles, log feedback, and process shortlist results.</p>
        </div>

        {/* Drive Selector */}
        {!loadingDrives && drives.length > 0 && (
          <div className="flex flex-col gap-1">
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
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-900 rounded-xl"></div>
          <div className="h-12 bg-zinc-900 rounded-xl"></div>
        </div>
      ) : (
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850">
                <tr>
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4 text-center">CGPA / Backlogs</th>
                  <th className="px-6 py-4">Resume / Skills</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredApplicants.map((app) => (
                  <tr key={app._id} className="hover:bg-zinc-900/10 transition-colors">
                    {/* Identity */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-zinc-100">{app.student.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{app.student.email}</p>
                        <p className="text-[10px] text-purple-400 mt-1 font-semibold">{app.student.department}</p>
                      </div>
                    </td>

                    {/* CGPA */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col gap-0.5">
                        <span className="text-xs font-extrabold text-zinc-200">CGPA: {app.student.CGPA}</span>
                        <span className="text-[10px] text-zinc-500">Backlogs: {app.student.backlogs}</span>
                      </div>
                    </td>

                    {/* Resume & Skills */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 max-w-xs">
                        <a
                          href={`${api.defaults.baseURL?.replace('/api', '')}${app.resumeUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline font-mono"
                        >
                          View PDF Resume <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <div className="flex flex-wrap gap-1">
                          {app.student.skills.map((s) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 bg-zinc-950 text-zinc-400 rounded border border-zinc-850">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Status badge & Feedback */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            app.status === 'Selected'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : app.status === 'Shortlisted'
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                              : app.status === 'Rejected'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {app.status}
                        </span>

                        {app.feedback && (
                          <div className="text-[10px] text-zinc-400 bg-zinc-950/50 p-2 rounded-xl border border-zinc-850/50 max-w-[200px] leading-relaxed">
                            <span className="font-bold text-[9px] uppercase tracking-wider block text-zinc-500 mb-0.5">Notes:</span>
                            {app.feedback}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Feedback Logger */}
                        <button
                          onClick={() => handleOpenFeedback(app)}
                          className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 text-zinc-400 hover:text-purple-400 rounded-xl transition-all"
                          title="Add Interview Notes / Feedback"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {app.status !== 'Shortlisted' && app.status !== 'Selected' && (
                          <button
                            onClick={() => updateStatus(app._id, 'Shortlisted')}
                            className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 text-zinc-400 hover:text-blue-400 rounded-xl transition-all"
                            title="Shortlist for next rounds"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {app.status !== 'Selected' && (
                          <button
                            onClick={() => updateStatus(app._id, 'Selected')}
                            className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 text-zinc-400 hover:text-emerald-400 rounded-xl transition-all"
                            title="Confirm Placement Offer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {app.status !== 'Rejected' && (
                          <button
                            onClick={() => updateStatus(app._id, 'Rejected')}
                            className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplicants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-zinc-500">
                      No candidate applications found for this campaign.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {activeFeedbackId && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveFeedback}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-zinc-850 pb-4">
              <h2 className="text-base font-extrabold text-zinc-100">Log Interview Feedback</h2>
              <button
                type="button"
                onClick={() => setActiveFeedbackId(null)}
                className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Candidate Notes / Interview Details</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Cleared round 1 technical interview, strong system design concepts. Schedule round 2."
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-5">
              <button
                type="button"
                onClick={() => setActiveFeedbackId(null)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFeedback}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold rounded-xl text-zinc-100 transition-all flex items-center gap-1.5"
              >
                {savingFeedback ? (
                  <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Save Notes</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default RecruiterApplicants;
