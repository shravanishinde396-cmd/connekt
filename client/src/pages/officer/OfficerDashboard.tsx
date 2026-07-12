import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { StatCard } from '../../components/StatCard.js';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
  const [activeTab, setActiveTab] = useState<'performance' | 'reports'>('performance');
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
      
      // Request CSV attachment file download
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
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-12 bg-zinc-900 rounded-2xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-96 bg-zinc-900 rounded-3xl"></div>
          <div className="h-96 bg-zinc-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const { summary, departmentBreakdown } = data;

  // Chart data format for department placement rates
  const chartData = departmentBreakdown.map((d) => ({
    name: d.department.split(' ').map(w => w[0]).join(''), // CSE, IT, ECE etc.
    fullName: d.department,
    Total: d.total,
    Placed: d.placed,
    'Rate (%)': d.rate,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Placement Desk</h1>
          <p className="text-sm text-zinc-400 mt-1">Review campus engagement metrics and active drive operations.</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'performance'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart4 className="w-4 h-4" /> Reports & Salary
          </button>
        </div>
      </div>

      {activeTab === 'performance' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Candidates"
              value={summary.totalStudents}
              icon={<Users className="w-5 h-5 text-purple-400" />}
              description="Registered students"
            />
            <StatCard
              title="Placed Students"
              value={summary.placedStudents}
              icon={<Sparkles className="w-5 h-5 text-emerald-400" />}
              trend={{ value: `${summary.placementRate}% Placed`, isPositive: true }}
              description="Confirmed hiring offers"
            />
            <StatCard
              title="Hiring Partners"
              value={summary.totalCompanies}
              icon={<Building2 className="w-5 h-5 text-blue-400" />}
              description="Registered corporations"
            />
            <StatCard
              title="Active Drives"
              value={summary.totalActiveDrives}
              icon={<Briefcase className="w-5 h-5 text-amber-400" />}
              description="Open job applications"
            />
          </div>

          {/* Main split grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2/3: Department Placement BarChart */}
            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-850 p-6 md:p-8 rounded-3xl">
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
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      labelClassName="text-zinc-200 text-xs font-bold font-sans"
                      itemStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Total" fill="#52525b" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="Placed" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1/3: Quick Operations Shortcuts */}
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900/40 border border-zinc-850 p-6 md:p-8 rounded-3xl flex flex-col gap-4">
                <h2 className="text-base font-extrabold text-zinc-100 mb-2">Shortcuts & Tools</h2>
                
                <button
                  onClick={() => navigate('/dashboard/placement_officer/companies')}
                  className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/60 rounded-2xl transition-all group"
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
                  className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/60 rounded-2xl transition-all group"
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
        </>
      ) : (
        /* Salary & Export Reports Tab */
        <div className="space-y-8 animate-in fade-in duration-200">
          {loadingReports || !salaryData ? (
            <div className="h-64 bg-zinc-900 rounded-3xl animate-pulse"></div>
          ) : (
            <>
              {/* Compensation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Highest Package"
                  value={`${salaryData.maxCTC} LPA`}
                  icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                  description="Top recruitment offer made"
                />
                <StatCard
                  title="Average Package"
                  value={`${salaryData.averageCTC} LPA`}
                  icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
                  description="Mean package across hires"
                />
                <StatCard
                  title="Minimum Package"
                  value={`${salaryData.minCTC} LPA`}
                  icon={<TrendingDown className="w-5 h-5 text-amber-400" />}
                  description="Base baseline offer package"
                />
              </div>

              {/* Salary Chart & Export Sheet */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-850 p-6 md:p-8 rounded-3xl">
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
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                          labelClassName="text-zinc-200 text-xs font-bold font-sans"
                          itemStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                        />
                        <Bar dataKey="package" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={32} name="CTC Package (LPA)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CSV Export Desk */}
                <div className="bg-zinc-900/40 border border-zinc-850 p-6 md:p-8 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-100 mb-2">Export Center</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Download placement spreadsheets listing all successfully placed students, matching job titles, packages, and department filters.
                    </p>
                  </div>

                  <button
                    onClick={handleCsvExport}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-zinc-100 font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/10 mt-6"
                  >
                    <Download className="w-4 h-4" /> Download Placed Master CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default OfficerDashboard;
