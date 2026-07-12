import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import {
  Users,
  Building2,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Download,
  DollarSign,
  TrendingDown,
  BarChart4,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface SummaryStats {
  totalStudents: number;
  placedStudents: number;
  placementRate: number;
  totalCompanies: number;
  totalActiveDrives: number;
}

interface DeptBreakdown {
  department: string;
  total: number;
  placed: number;
  rate: number;
}

interface AnalyticsState {
  summary: SummaryStats;
  departmentBreakdown: DeptBreakdown[];
}

interface SalaryReport {
  averageCTC: number;
  maxCTC: number;
  minCTC: number;
  distribution: {
    label: string;
    package: number;
    applicants: number;
  }[];
}

export const OfficerDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsState | null>(null);

  // Salary report state
  const [salaryData, setSalaryData] = useState<SalaryReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/officer/analytics');
      setData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch analytics metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryReports = async () => {
    try {
      setLoadingReports(true);
      const res = await api.get('/officer/reports/salary-stats');
      setSalaryData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch salary reports', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchSalaryReports();
    }
  }, [activeTab]);

  const handleCsvExport = async () => {
    try {
      toast('Generating CSV master sheet...', 'success');
      
      const response = await api.get('/officer/reports/export-csv', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placepilot_placed_candidates.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast('CSV Report downloaded successfully!', 'success');
    } catch (err: any) {
      toast('Failed to export candidate CSV report', 'error');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const { summary, departmentBreakdown } = data;

  const chartData = departmentBreakdown.map((d) => ({
    name: d.department.split(' ').map((w) => w[0]).join(''),
    fullName: d.department,
    Total: d.total,
    Placed: d.placed,
    'Rate (%)': d.rate,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Placement Desk</h1>
          <p className="text-sm text-zinc-400 mt-1">Review campus engagement metrics and active drive operations.</p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val)}>
          <TabsList>
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart4 className="w-4 h-4 mr-1" /> Reports & Salary
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full">
        <TabsContent value="performance" className="space-y-8 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-zinc-400">Total Candidates</span>
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                    <NumberCounter value={summary.totalStudents} />
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Registered students</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-zinc-400">Placed Students</span>
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                    <NumberCounter value={summary.placedStudents} />
                  </span>
                  <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    <NumberCounter value={summary.placementRate} suffix="%" /> Placed
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Confirmed hiring offers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-zinc-400">Hiring Partners</span>
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                    <NumberCounter value={summary.totalCompanies} />
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Registered corporations</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-zinc-400">Active Drives</span>
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-amber-400 group-hover:text-amber-300 transition-colors">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                    <NumberCounter value={summary.totalActiveDrives} />
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Open job applications</p>
              </CardContent>
            </Card>
          </div>

          {/* Main split grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2/3: Department Placement BarChart */}
            <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-zinc-100">Department Placement Performance</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Compares total enrolled vs successfully placed candidates by branch.</p>
                </div>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                      labelClassName="text-zinc-200 text-xs font-bold font-sans"
                      itemStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Total" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="Placed" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1/3: Quick Operations Shortcuts */}
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl flex flex-col gap-4 backdrop-blur-md">
                <h2 className="text-base font-extrabold text-zinc-100 mb-2">Shortcuts & Tools</h2>
                
                <button
                  onClick={() => navigate('/dashboard/placement_officer/companies')}
                  className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/60 rounded-2xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-zinc-200">Manage Companies</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Register new hiring partners</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/placement_officer/drives')}
                  className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/60 rounded-2xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Briefcase className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-zinc-200">Placement Cycles</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Create cutoffs & shortlist lists</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-8 animate-in fade-in duration-200">
          {loadingReports || !salaryData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Compensation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-zinc-400">Highest Package</span>
                      <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-emerald-400 group-hover:text-emerald-300 transition-colors">
                        <DollarSign className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                        <NumberCounter value={salaryData.maxCTC} suffix=" LPA" />
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">Top recruitment offer made</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-zinc-400">Average Package</span>
                      <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                        <NumberCounter value={salaryData.averageCTC} decimals={1} suffix=" LPA" />
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">Mean package across hires</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-zinc-400">Minimum Package</span>
                      <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-amber-400 group-hover:text-amber-300 transition-colors">
                        <TrendingDown className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                        <NumberCounter value={salaryData.minCTC} suffix=" LPA" />
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">Base baseline offer package</p>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Chart & Export Sheet */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md">
                  <h2 className="text-base font-extrabold text-zinc-100 mb-6">CTC Package Distribution (LPA)</h2>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salaryData.distribution}
                        margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="label" stroke="#71717a" fontSize={9} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                          labelClassName="text-zinc-200 text-xs font-bold font-sans"
                          itemStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                        />
                        <Bar dataKey="package" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={32} name="CTC Package (LPA)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CSV Export Desk */}
                <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl flex flex-col justify-between backdrop-blur-md">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-100 mb-2">Export Center</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Download placement spreadsheets listing all successfully placed students, matching job titles, packages, and department filters.
                    </p>
                  </div>

                  <button
                    onClick={handleCsvExport}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-zinc-100 font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/10 mt-6 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Placed Master CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default OfficerDashboard;
