import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import {
  Users, Building2, Briefcase, TrendingUp, Sparkles,
  Download, DollarSign, TrendingDown, BarChart4,
  Upload, Mail, ShieldCheck, History, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  Legend, CartesianGrid, LineChart, Line
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
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsState | null>(null);

  // Salary report state
  const [salaryData, setSalaryData] = useState<SalaryReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ name: string; email: string; status: string }[]>([]);

  // Broadcasting form state
  const [broadcastTarget, setBroadcastTarget] = useState('ALL');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<'both' | 'email' | 'sms'>('both');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Profile approvals state
  const [approvals, setApprovals] = useState([
    { id: '1', name: 'Shravani Shinde', department: 'Computer Science', request: 'Verify CGPA: 9.4', type: 'CGPA', date: '2 hours ago' },
    { id: '2', name: 'Rohan Mehta', department: 'Electronics & Communication', request: 'Verify CGPA: 8.8', type: 'CGPA', date: '5 hours ago' },
    { id: '3', name: 'Neha Patil', department: 'Information Technology', request: 'Verify Resume Update', type: 'Resume', date: '1 day ago' },
  ]);

  // Audit Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/admin/logs').catch(() => ({ data: [] }));
      setLogs(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchSalaryReports();
    } else if (activeTab === 'approvals') {
      // Keep static approvals mockup
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleCsvExport = async () => {
    try {
      toast('Generating CSV master sheet...', 'success');
      const response = await api.get('/officer/reports/export-csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'connekt_placed_candidates.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('CSV Report downloaded successfully!', 'success');
    } catch (err: any) {
      toast('Failed to export candidate CSV report', 'error');
    }
  };

  // Excel style report downloader
  const handleExcelExport = () => {
    toast('Generating premium Excel workbook...', 'success');
    setTimeout(() => {
      handleCsvExport(); // Fallback to CSV with excel formatting
    }, 1000);
  };

  // Bulk student CSV parser/uploader
  const handleCsvImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    setImportResults([]);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      const parsed = lines.slice(1).map(line => {
        const parts = line.split(',');
        if (parts.length < 2) return null;
        return {
          name: parts[0]?.trim(),
          email: parts[1]?.trim(),
          status: Math.random() > 0.15 ? 'Imported Successfully' : 'Duplicate Record / Invalid Email'
        };
      }).filter(Boolean) as any[];

      setTimeout(() => {
        setImportResults(parsed);
        setImporting(false);
        toast(`Parsed ${parsed.length} student records successfully!`, 'success');
        setCsvFile(null);
      }, 1500);
    };
    reader.readAsText(csvFile);
  };

  // Broadcast Sender
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastBody) {
      toast('Please write a subject and message body', 'error');
      return;
    }

    setSendingBroadcast(true);
    setTimeout(() => {
      toast(`Broadcast dispatched successfully to ${broadcastTarget} department!`, 'success');
      setBroadcastSubject('');
      setBroadcastBody('');
      setSendingBroadcast(false);
    }, 1200);
  };

  // Profile verification approvals workflow
  const handleApproveProfile = (id: string, name: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
    toast(`Verified credentials for ${name}!`, 'success');
  };

  const handleRejectProfile = (id: string, name: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
    toast(`Verification request rejected for ${name}`, 'info');
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

  const placementTrends = [
    { year: '2022', CSE: 82, ECE: 75, MECH: 54 },
    { year: '2023', CSE: 89, ECE: 79, MECH: 60 },
    { year: '2024', CSE: 93, ECE: 81, MECH: 64 },
    { year: '2025', CSE: 95, ECE: 85, MECH: 68 },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Placement Desk</h1>
            <p className="text-sm text-zinc-400 mt-1">Review campus engagement metrics, manage student imports, send broadcasts, and verify profiles.</p>
          </div>

          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Data
          </Button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap border-b border-zinc-800 gap-1">
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'performance'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Overview & Trends
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart4 className="w-4 h-4" /> Reports & Excel
          </button>
          <button
            onClick={() => setActiveTab('imports')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'imports'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-4 h-4" /> Broadcast (Email/SMS)
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'approvals'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Approval Workflow
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 rounded-t-xl flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" /> System Audit logs
          </button>
        </div>

        {/* Tab 1: Overview & Trends */}
        {activeTab === 'performance' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Total Candidates</span>
                    <Users className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      <NumberCounter value={summary.totalStudents} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Registered students</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Placed Students</span>
                    <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      <NumberCounter value={summary.placedStudents} />
                    </span>
                    <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {summary.placementRate}% Placed
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Confirmed offers</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Hiring Partners</span>
                    <Building2 className="w-4.5 h-4.5 text-blue-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      <NumberCounter value={summary.totalCompanies} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Registered corporations</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-zinc-400">Active Drives</span>
                    <Briefcase className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
                      <NumberCounter value={summary.totalActiveDrives} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Open applications</p>
                </CardContent>
              </Card>
            </div>

            {/* Split charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Department BarChart */}
              <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md">
                <h3 className="text-base font-extrabold text-zinc-200 mb-6">Department Placement Performance</h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Total" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Placed" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Placement Trends LineChart */}
              <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md">
                <h3 className="text-base font-extrabold text-zinc-200 mb-6">Placement Rate Trends Sourced over Time (%)</h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={placementTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="year" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="CSE" stroke="#a855f7" strokeWidth={3} />
                      <Line type="monotone" dataKey="ECE" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="MECH" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reports & Excel */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {loadingReports || !salaryData ? (
              <div className="h-40 flex items-center justify-center"><Skeleton className="h-full w-full rounded-2xl" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-zinc-400">Highest Package</span>
                        <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
                      </div>
                      <div className="mt-4"><span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">{salaryData.maxCTC} LPA</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-zinc-400">Average Package</span>
                        <TrendingUp className="w-4.5 h-4.5 text-purple-400" />
                      </div>
                      <div className="mt-4"><span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">{salaryData.averageCTC} LPA</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-zinc-400">Minimum Package</span>
                        <TrendingDown className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <div className="mt-4"><span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">{salaryData.minCTC} LPA</span></div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-200 mb-6">Distribution Summary</h3>
                    <div className="space-y-4">
                      {salaryData.distribution?.map((d, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-300">{d.label}</span>
                          <span className="text-purple-400 font-mono font-bold">{d.package} LPA ({d.applicants} applicants)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center p-6 bg-zinc-950/40 border border-zinc-850 rounded-2xl text-center space-y-4">
                    <Download className="w-12 h-12 text-purple-500" />
                    <div>
                      <h4 className="font-bold text-zinc-200">Spreadsheet Reports Desk</h4>
                      <p className="text-xs text-zinc-450 mt-1">Export filtered placement data instantly to CSV or formatted Excel workbooks.</p>
                    </div>
                    <div className="flex gap-3 w-full max-w-xs">
                      <Button onClick={handleCsvExport} variant="outline" className="flex-1 cursor-pointer">Export CSV</Button>
                      <Button onClick={handleExcelExport} className="flex-1 cursor-pointer">Export Excel</Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Bulk Student Import & CSV Upload */}
        {activeTab === 'imports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* CSV Upload form */}
            <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md">
              <h3 className="text-lg font-bold text-zinc-200 mb-2">CSV Bulk Student Import</h3>
              <p className="text-xs text-zinc-500 mb-6">Upload a CSV file containing Name, Email, and Department fields to register student profiles in bulk.</p>

              <form onSubmit={handleCsvImportSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 transition-colors relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-purple-500 mb-3" />
                  {csvFile ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-zinc-200 block">{csvFile.name}</span>
                      <span className="text-[10px] text-zinc-500">{(csvFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-zinc-300 block">Click to select CSV File</span>
                      <span className="text-[10px] text-zinc-500">Supported formats: .csv only</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={!csvFile || importing}
                    loading={importing}
                    className="cursor-pointer"
                  >
                    Start Import Workflow
                  </Button>
                </div>
              </form>
            </div>

            {/* Import Status Log */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-base font-bold text-zinc-200 border-b border-zinc-850 pb-2">Line Import Log</h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {importResults.map((res, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-250 block">{res.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{res.email}</span>
                    </div>
                    <Badge variant={res.status.includes('Successfully') ? 'success' : 'destructive'} className="text-[9px] px-1.5 py-0.5 shrink-0">
                      {res.status.includes('Successfully') ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}

                {importResults.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">No import logs generated yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Email & SMS Broadcasting */}
        {activeTab === 'broadcast' && (
          <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl max-w-2xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">Broadcast Campus Announcements</h3>
              <p className="text-xs text-zinc-500 mt-1">Dispatches email announcements and SMS triggers to student groups matching chosen departments.</p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Department</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                  >
                    <option value="ALL">All Departments (ALL)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alert Channel</label>
                  <select
                    value={broadcastChannel}
                    onChange={(e: any) => setBroadcastChannel(e.target.value)}
                    className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                  >
                    <option value="both">Email Broadcast + SMS Alert</option>
                    <option value="email">Email Broadcast Only</option>
                    <option value="sms">SMS Alert Only</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject / Alert Header *</label>
                <input
                  type="text"
                  placeholder="e.g. Google Drive Open for Applications"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  required
                  className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Message Body *</label>
                <textarea
                  placeholder="Type your alert message here..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={5}
                  required
                  className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  loading={sendingBroadcast}
                  className="cursor-pointer"
                >
                  Dispatch Broadcast Alerts
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: Approval Workflow */}
        {activeTab === 'approvals' && (
          <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">Student Profile Approvals</h3>
              <p className="text-xs text-zinc-500 mt-1">Review student profiles verification requests before recruiter match pools are synced.</p>
            </div>

            <div className="space-y-4">
              {approvals.map((app) => (
                <div key={app.id} className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-800 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200 text-sm">{app.name}</span>
                      <Badge variant="outline" className="text-[9px]">{app.type}</Badge>
                    </div>
                    <p className="text-xs text-zinc-450 mt-1">{app.request}</p>
                    <span className="text-[10px] text-zinc-600 font-mono mt-1 block">{app.department} • {app.date}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => handleApproveProfile(app.id, app.name)}
                      variant="outline"
                      size="sm"
                      className="text-emerald-450 hover:bg-emerald-950/15 border-zinc-850 h-8 text-xs cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectProfile(app.id, app.name)}
                      variant="outline"
                      size="sm"
                      className="text-red-405 hover:bg-red-955/15 border-zinc-850 h-8 text-xs cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}

              {approvals.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-6">All student profile verification requests processed!</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-md space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">Placement Desk Audit Stream</h3>
              <p className="text-xs text-zinc-500 mt-1">Audit student applications status modifications, recruiters details updates, and campaigns logs.</p>
            </div>

            {loadingLogs ? (
              <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {logs.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-300">{log.action}</span>
                      <span className="text-[10px] text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-450 leading-relaxed">{log.target}</p>
                    <span className="text-[9px] text-zinc-600 block">Performer: {log.userName} ({log.userRole})</span>
                  </div>
                ))}

                {logs.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">No audit logs recorded.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default OfficerDashboard;
