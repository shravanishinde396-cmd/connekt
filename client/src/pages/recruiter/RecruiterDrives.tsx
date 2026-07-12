import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import {
  Calendar,
  Search,
  Users,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Drive {
  _id: string;
  role: string;
  packageLPA: number;
  cgpaCutoff: number;
  backlogCutoff: number;
  allowedDepartments: string[];
  jobDescription: string;
  deadline: string;
  status: 'Active' | 'Closed';
  applicants: any[];
}

export const RecruiterDrives: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruiter/drives');
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

  const filteredDrives = drives.filter((d) =>
    d.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Hiring Campaigns</h1>
        <p className="text-sm text-zinc-400 mt-1">Review active and completed placement drives for your organization.</p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by job role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDrives.map((drive) => (
            <div
              key={drive._id}
              onClick={() => navigate('/dashboard/recruiter/applicants', { state: { selectedDriveId: drive._id } })}
              className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-750 p-6 rounded-3xl cursor-pointer flex flex-col justify-between transition-all duration-300 relative overflow-hidden group"
            >
              <div>
                {/* Header: Role & Status */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-extrabold text-zinc-100 group-hover:text-purple-400 transition-colors">
                    {drive.role}
                  </h3>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      drive.status === 'Active'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-950 border border-zinc-850 text-zinc-500'
                    }`}
                  >
                    {drive.status}
                  </span>
                </div>

                {/* Criteria & Compensation */}
                <div className="grid grid-cols-3 gap-2 mb-6 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-850/45 text-center">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Package</p>
                    <p className="text-xs font-extrabold text-purple-400 mt-0.5">{drive.packageLPA} LPA</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Cutoff CGPA</p>
                    <p className="text-xs font-extrabold text-zinc-300 mt-0.5">≥ {drive.cgpaCutoff}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Allowed Branches</p>
                    <p className="text-xs font-extrabold text-zinc-300 mt-0.5">{drive.allowedDepartments.length}</p>
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>Apply Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Footer: Applicants count & details trigger */}
              <div className="flex items-center justify-between border-t border-zinc-850/60 pt-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-zinc-400 font-semibold">
                  <Users className="w-4 h-4 text-purple-400" />
                  Candidates Applied: {drive.applicants?.length || 0}
                </span>

                <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                  Review Candidates
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}

          {filteredDrives.length === 0 && (
            <div className="col-span-2 text-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-500">
              <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-zinc-400">No hiring drives registered</h4>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default RecruiterDrives;
