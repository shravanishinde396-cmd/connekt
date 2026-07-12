import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import {
  Briefcase,
  Award,
  Calendar,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
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
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
          <div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Derived stats
  const appliedDrives = drives.filter((d) => d.hasApplied);
  const totalAppliedCount = appliedDrives.length;
  
  const shortlistedCount = appliedDrives.filter(
    (d) => d.applicationStatus === 'Shortlisted' || d.applicationStatus === 'Selected'
  ).length;

  const offersCount = appliedDrives.filter((d) => d.applicationStatus === 'Selected').length;

  // Total eligible active drives
  const eligibleDrives = drives.filter((d) => !d.hasApplied && d.status === 'Active');
  const eligibleCount = eligibleDrives.length;

  const completionPercent = profile?.profileCompletion || 0;

  // Mocked upcoming interviews for layout rendering (tied with Socket/calendar later)
  const upcomingInterviews = [
    {
      id: '1',
      company: 'Google LLC',
      role: 'Associate Software Engineer Intern',
      date: 'July 12, 2026',
      time: '10:00 AM (IST)',
      type: 'Technical Round 1 (Virtual)',
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title greeting */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Student Workspace</h1>
            <p className="text-sm text-zinc-400 mt-1">Welcome back, {user?.name}. Keep track of your job search progress.</p>
          </div>

          {/* Sync / Refresh */}
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Sync
          </Button>
        </div>

        {/* Profile Completion Callout */}
        {completionPercent < 100 && (
          <div className="bg-gradient-to-r from-purple-950/20 via-zinc-900/60 to-zinc-900/40 border border-purple-500/25 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
            
            <div className="flex gap-4 items-start max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-100 text-sm">Complete Your Placement Profile</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Your profile is only {completionPercent}% complete. Recruiters prioritize applicants with fully detailed qualifications, academic scores, and resumes.
                </p>
                
                {/* Progress bar */}
                <div className="w-full max-w-sm mt-3 flex items-center gap-3">
                  <div className="flex-1 bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">{completionPercent}%</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate('/dashboard/student/profile')}
              variant="default"
              className="shrink-0 shadow-lg shadow-purple-600/10 cursor-pointer"
            >
              Update Profile <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-zinc-400">Applied Drives</span>
                <div className="p-2 bg-zinc-800/50 rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                  <NumberCounter value={totalAppliedCount} />
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Submitted job applications</p>
            </CardContent>
          </Card>

          <Card className="hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-zinc-400">Eligible Drives</span>
                <div className="p-2 bg-zinc-800/50 rounded-xl text-emerald-400 group-hover:text-emerald-350 transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                  <NumberCounter value={eligibleCount} />
                </span>
                <Badge variant="success">{eligibleCount} open</Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Available for application</p>
            </CardContent>
          </Card>

          <Card className="hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-zinc-400">Shortlisted</span>
                <div className="p-2 bg-zinc-800/50 rounded-xl text-blue-400 group-hover:text-blue-350 transition-colors">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                  <NumberCounter value={shortlistedCount} />
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Advanced in recruitment</p>
            </CardContent>
          </Card>

          <Card className="hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-zinc-400">Offers Received</span>
                <div className="p-2 bg-zinc-800/50 rounded-xl text-emerald-400 group-hover:text-emerald-350 transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-100 tracking-tight">
                  <NumberCounter value={offersCount} />
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Pending selection result</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2/3: Application Tracker Timeline */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <h2 className="text-lg font-bold text-zinc-200">Application Pipeline</h2>
              <Link to="/dashboard/student/drives" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
                Browse More Drives <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {appliedDrives.length === 0 ? (
              <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-3xl p-8 text-center py-12">
                <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-400">No Job Applications Yet</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  You haven't applied to any placement drives. Browse eligible drives and submit your resume to begin!
                </p>
                <Button
                  onClick={() => navigate('/dashboard/student/drives')}
                  variant="outline"
                  size="sm"
                  className="mt-4 cursor-pointer"
                >
                  View Eligible Drives
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appliedDrives.map((drive) => (
                  <div
                    key={drive._id}
                    className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-3xl flex flex-col md:flex-row justify-between gap-4 md:items-center hover:border-zinc-800 transition-colors"
                  >
                    {/* Company & Role */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {drive.company.logoUrl ? (
                          <img src={drive.company.logoUrl} alt={drive.company.name} className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-zinc-200">{drive.role}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{drive.company.name}</p>
                      </div>
                    </div>

                    {/* Horizontal pipeline stepper */}
                    <div className="flex items-center gap-2 max-w-xs w-full justify-between px-2">
                      {/* Step 1: Applied */}
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                          ✓
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 font-semibold">Applied</span>
                      </div>

                      <div className="flex-1 h-0.5 bg-zinc-800 mx-2"></div>

                      {/* Step 2: Shortlisted */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            drive.applicationStatus === 'Shortlisted' || drive.applicationStatus === 'Selected'
                              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {drive.applicationStatus === 'Shortlisted' || drive.applicationStatus === 'Selected' ? '✓' : '2'}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 font-semibold">Shortlist</span>
                      </div>

                      <div className="flex-1 h-0.5 bg-zinc-800 mx-2"></div>

                      {/* Step 3: Selection */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            drive.applicationStatus === 'Selected'
                              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                              : drive.applicationStatus === 'Rejected'
                              ? 'bg-red-500/20 border border-red-500 text-red-400'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {drive.applicationStatus === 'Selected' ? '✓' : drive.applicationStatus === 'Rejected' ? '✗' : '3'}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1 font-semibold">Result</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {drive.applicationStatus === 'Selected' ? (
                        <Badge variant="success">Selected!</Badge>
                      ) : drive.applicationStatus === 'Rejected' ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : (
                        <Badge variant="info">{drive.applicationStatus || 'Applied'}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right 1/3: Schedule & Calendar Alerts */}
          <div className="flex flex-col gap-6">
            <div className="border-b border-zinc-850 pb-3">
              <h2 className="text-lg font-bold text-zinc-200">Placement Events</h2>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Calendar Event Log</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400">
                  <Clock className="w-3.5 h-3.5" /> 1 Scheduled
                </span>
              </div>

              {upcomingInterviews.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-2xl space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400">{evt.company}</h4>
                    <h3 className="text-sm font-extrabold text-zinc-200 mt-0.5">{evt.role}</h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-400 border-t border-zinc-900 pt-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Event</span>
                      <span className="text-zinc-300 font-medium">{evt.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Date</span>
                      <span className="text-zinc-300 font-semibold">{evt.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Time</span>
                      <span className="text-zinc-300 font-mono text-[11px]">{evt.time}</span>
                    </div>
                  </div>
                </div>
              ))}

              {upcomingInterviews.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No interviews scheduled yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default StudentDashboard;
