import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
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
    if (score >= 80) return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-purple-450 bg-purple-500/10 border-purple-500/20';
    return 'text-amber-450 bg-amber-500/10 border-amber-500/20';
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 mb-4 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title & Search bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
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
            <Card
              key={drive._id}
              onClick={() => setSelectedDrive(drive)}
              className="cursor-pointer hover:shadow-2xl hover:shadow-purple-950/5 hover:-translate-y-0.5 transition-all duration-350 relative overflow-hidden group"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full">
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
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {drive.applicationStatus || 'Applied'}
                    </Badge>
                  ) : drive.isEligible ? (
                    <Badge variant="info">
                      Eligible to Apply
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Ineligible
                    </Badge>
                  )}

                  <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
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
        <Modal
          isOpen={!!selectedDrive}
          onClose={() => setSelectedDrive(null)}
          title={`${selectedDrive?.role || 'Hiring Drive Details'} — ${selectedDrive?.company?.name || ''}`}
        >
          {selectedDrive && (
            <div className="space-y-6">
              {/* Drive info details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Match Score</p>
                  <p className="text-base font-extrabold text-purple-400 mt-1">{selectedDrive.matchingScore}%</p>
                </div>
              </div>

              {/* Description & Eligibility requirements */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 divide-y divide-zinc-850/50">
                <div className="pb-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Job Description</h4>
                  <p className="text-sm text-zinc-350 leading-relaxed font-sans">{selectedDrive.jobDescription}</p>
                </div>

                <div className="pt-3 pb-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Departments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDrive.allowedDepartments.map((dept) => (
                      <Badge key={dept} variant="outline">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>

                {!selectedDrive.isEligible && (
                  <div className="pt-3 text-left">
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
                  <Button
                    onClick={() => setSelectedDrive(null)}
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Close
                  </Button>

                  {selectedDrive.hasApplied ? (
                    <Button
                      disabled
                      variant="secondary"
                      size="sm"
                      className="cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Applied
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApply(selectedDrive._id)}
                      disabled={!selectedDrive.isEligible}
                      loading={applyingId === selectedDrive._id}
                      variant="default"
                      size="sm"
                      className="cursor-pointer"
                    >
                      Apply Instantly
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
};
export default StudentDrives;
