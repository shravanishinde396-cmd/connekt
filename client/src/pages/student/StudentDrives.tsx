import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
} from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  website: string;
  industry: string;
  description: string;
  logoUrl?: string;
}

interface Drive {
  _id: string;
  role: string;
  company: Company;
  packageLPA: number;
  cgpaCutoff: number;
  backlogCutoff: number;
  allowedDepartments: string[];
  jobDescription: string;
  deadline: string;
  status: 'Active' | 'Closed';
  isEligible: boolean;
  ineligibilityReason?: string;
  hasApplied: boolean;
  applicationStatus?: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  matchingScore: number;
}

export const StudentDrives: React.FC = () => {
  const { toast } = useToast();
  
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/drives');
      setDrives(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch drives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleApply = async (driveId: string) => {
    setApplyingId(driveId);
    try {
      const res = await api.post(`/student/drives/${driveId}/apply`);
      toast(res.data.message || 'Applied successfully!', 'success');
      
      // Update local state
      setDrives((prev) =>
        prev.map((d) =>
          d._id === driveId
            ? { ...d, hasApplied: true, applicationStatus: 'Applied' }
            : d
        )
      );
      
      // If modal is open, update selected drive as well
      if (selectedDrive?._id === driveId) {
        setSelectedDrive((prev) => prev ? { ...prev, hasApplied: true, applicationStatus: 'Applied' } : null);
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to submit application', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredDrives = drives.filter((drive) => {
    const term = searchQuery.toLowerCase();
    return (
      drive.role.toLowerCase().includes(term) ||
      drive.company.name.toLowerCase().includes(term) ||
      drive.company.industry.toLowerCase().includes(term)
    );
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-zinc-900 rounded-xl w-64 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-zinc-900 rounded-3xl"></div>
          <div className="h-48 bg-zinc-900 rounded-3xl"></div>
          <div className="h-48 bg-zinc-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Placement Opportunities</h1>
          <p className="text-sm text-zinc-400 mt-1">Browse active corporate hiring drives and apply instantly.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Grid of Drives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDrives.map((drive) => (
          <div
            key={drive._id}
            onClick={() => setSelectedDrive(drive)}
            className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-750 p-6 rounded-3xl cursor-pointer flex flex-col justify-between transition-all duration-300 group hover:shadow-2xl hover:shadow-purple-950/5 hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div>
              {/* Top Row: Logo & Match Score */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  {drive.company.logoUrl ? (
                    <img src={drive.company.logoUrl} alt={drive.company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-500" />
                  )}
                </div>

                <div className={`flex items-center gap-1 px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider ${getMatchScoreColor(drive.matchingScore)}`}>
                  <Sparkles className="w-3 h-3" />
                  {drive.matchingScore}% Match
                </div>
              </div>

              {/* Company & Role */}
              <div className="mb-4">
                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{drive.company.name}</h4>
                <h3 className="text-base font-extrabold text-zinc-100 group-hover:text-purple-400 transition-colors mt-0.5">
                  {drive.role}
                </h3>
              </div>

              {/* Drive Details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-bold">
                    {drive.packageLPA} LPA
                  </span>
                  <span>Package Offered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>Deadline: {new Date(drive.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Application & Eligibility Badges */}
            <div className="flex items-center justify-between border-t border-zinc-850/60 pt-4 mt-2">
              {drive.hasApplied ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  {drive.applicationStatus || 'Applied'}
                </span>
              ) : drive.isEligible ? (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                  Eligible to Apply
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ineligible
                </span>
              )}

              <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                View Details
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}

        {filteredDrives.length === 0 && (
          <div className="col-span-3 py-16 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl text-center">
            <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="font-bold text-zinc-300">No Placement Drives Found</h3>
            <p className="text-xs text-zinc-500 mt-1">There are no active placement drives matching your criteria right now.</p>
          </div>
        )}
      </div>

      {/* Detail Modal Overlay */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 mb-6 border-b border-zinc-850 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  {selectedDrive.company.logoUrl ? (
                    <img src={selectedDrive.company.logoUrl} alt={selectedDrive.company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-100">{selectedDrive.role}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-zinc-400">{selectedDrive.company.name}</span>
                    <span className="text-xs text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500 font-mono">{selectedDrive.company.industry}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDrive(null)}
                className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drive info details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Compensation</p>
                <p className="text-base font-extrabold text-purple-400 mt-1">{selectedDrive.packageLPA} LPA</p>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">CGPA Cutoff</p>
                <p className="text-base font-extrabold text-zinc-300 mt-1">≥ {selectedDrive.cgpaCutoff}</p>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Max Backlogs</p>
                <p className="text-base font-extrabold text-zinc-300 mt-1">{selectedDrive.backlogCutoff}</p>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Application Matches</p>
                <p className="text-base font-extrabold text-purple-400 mt-1">{selectedDrive.matchingScore}%</p>
              </div>
            </div>

            {/* Description & Eligibility requirements */}
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 divide-y divide-zinc-850/50">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Job Description</h4>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">{selectedDrive.jobDescription}</p>
              </div>

              <div className="pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Departments</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDrive.allowedDepartments.map((dept) => (
                    <span key={dept} className="text-xs px-2.5 py-1 bg-zinc-950 border border-zinc-850 text-zinc-400 rounded-lg">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {!selectedDrive.isEligible && (
                <div className="pt-4 text-left">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Eligibility Deficiencies
                  </h4>
                  <p className="text-xs text-red-200 bg-red-950/15 border border-red-900/30 p-3 rounded-xl leading-relaxed">
                    You cannot submit an application because: <strong className="font-semibold block mt-1">{selectedDrive.ineligibilityReason}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            <div className="flex justify-between items-center border-t border-zinc-850 pt-6 mt-6">
              <a
                href={selectedDrive.company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Visit Company Website <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="px-5 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
                >
                  Close
                </button>

                {selectedDrive.hasApplied ? (
                  <button
                    disabled
                    className="px-6 py-2.5 bg-purple-900/40 text-purple-400 border border-purple-800/40 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(selectedDrive._id)}
                    disabled={!selectedDrive.isEligible || applyingId === selectedDrive._id}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-850 disabled:text-zinc-600 border border-transparent disabled:border-zinc-800 text-xs font-bold rounded-xl text-zinc-100 transition-all flex items-center gap-1.5"
                  >
                    {applyingId === selectedDrive._id ? (
                      <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>Apply Instantly</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentDrives;
