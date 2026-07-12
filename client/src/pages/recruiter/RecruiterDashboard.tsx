import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { StatCard } from '../../components/StatCard.js';
import {
  Briefcase,
  Users,
  FileCheck,
  Award,
  Building2,
  Globe,
  Tag,
  PenLine,
  LayoutDashboard,
  Settings,
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
  applicants: {
    status: string;
  }[];
}

export const RecruiterDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'metrics' | 'editor'>('metrics');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);

  // Editor form state
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const companyRes = await api.get('/recruiter/company');
      setCompany(companyRes.data);
      setFormData({
        name: companyRes.data.name,
        website: companyRes.data.website,
        industry: companyRes.data.industry,
        description: companyRes.data.description,
        logoUrl: companyRes.data.logoUrl || '',
      });

      const drivesRes = await api.get('/recruiter/drives');
      setDrives(drivesRes.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load recruiter workspace metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.website || !formData.industry || !formData.description) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/recruiter/company', formData);
      setCompany(res.data.company);
      toast('Company profile updated successfully!', 'success');
      setActiveTab('metrics');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save company edits', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-12 bg-zinc-900 rounded-2xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
        </div>
        <div className="h-64 bg-zinc-900 rounded-3xl"></div>
      </div>
    );
  }

  // Calculate dynamic metrics from drives
  const totalDrives = drives.length;
  let totalApplicants = 0;
  let shortlistedCount = 0;
  let offersCount = 0;

  drives.forEach((d) => {
    totalApplicants += d.applicants?.length || 0;
    d.applicants?.forEach((app) => {
      if (app.status === 'Shortlisted') shortlistedCount++;
      if (app.status === 'Selected') offersCount++;
    });
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Recruitment Portal</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage corporate profiles, track applications, and hire talent.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'metrics'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Company Profile
          </button>
        </div>
      </div>

      {activeTab === 'metrics' ? (
        <>
          {/* Company identity card */}
          {company && (
            <div className="bg-gradient-to-r from-zinc-900/40 via-zinc-900/50 to-zinc-950/20 border border-zinc-850 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
              <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              <div className="text-center md:text-left flex-1 min-w-0">
                <h2 className="text-xl font-extrabold text-zinc-100">{company.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Tag className="w-3.5 h-3.5 text-purple-400" /> {company.industry}
                  </span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 text-zinc-500" /> Visit Website
                  </a>
                </div>
                <p className="text-xs text-zinc-400 mt-3 leading-relaxed max-w-2xl">{company.description}</p>
              </div>
              <button
                onClick={() => setActiveTab('editor')}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-750 hover:bg-zinc-900 text-zinc-300 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                <PenLine className="w-4 h-4 text-purple-400" /> Edit Profile
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Hiring Cycles"
              value={totalDrives}
              icon={<Briefcase className="w-5 h-5 text-purple-400" />}
              description="Active and closed drives"
            />
            <StatCard
              title="Candidates Sourced"
              value={totalApplicants}
              icon={<Users className="w-5 h-5 text-blue-400" />}
              description="Total applicants across drives"
            />
            <StatCard
              title="Shortlisted candidates"
              value={shortlistedCount}
              icon={<FileCheck className="w-5 h-5 text-emerald-400" />}
              description="Candidates in review rounds"
            />
            <StatCard
              title="Placed Offers"
              value={offersCount}
              icon={<Award className="w-5 h-5 text-amber-400" />}
              description="Selection offers confirmed"
            />
          </div>
        </>
      ) : (
        /* Company Profile Editor Form */
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 md:p-8 max-w-2xl backdrop-blur-md">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-zinc-850 pb-4">
              <h2 className="text-lg font-bold text-zinc-200">Company Details</h2>
              <p className="text-xs text-zinc-500 mt-1">Adjust company profile information showcased to applicant students.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Website URL *</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Industry Verticals *</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Logo Image URL</label>
                <input
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Company Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-850 pt-5 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold rounded-xl text-zinc-100 transition-all flex items-center gap-1.5"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Save Profile</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default RecruiterDashboard;
