import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Company {
  _id: string;
  name: string;
  website: string;
  industry: string;
  description: string;
  logoUrl?: string;
}

export const OfficerCompanies: React.FC = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/officer/companies');
      setCompanies(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      website: '',
      industry: '',
      description: '',
      logoUrl: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      website: company.website,
      industry: company.industry,
      description: company.description,
      logoUrl: company.logoUrl || '',
    });
    setModalOpen(true);
  };

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
      if (editingCompany) {
        // Edit existing
        const res = await api.put(`/officer/companies/${editingCompany._id}`, formData);
        setCompanies((prev) =>
          prev.map((c) => (c._id === editingCompany._id ? res.data.company : c))
        );
        toast('Company updated successfully!', 'success');
      } else {
        // Create new
        const res = await api.post('/officer/companies', formData);
        setCompanies((prev) => [...prev, res.data.company]);
        toast('Company registered successfully!', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save company information', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/officer/companies/${companyId}`);
      setCompanies((prev) => prev.filter((c) => c._id !== companyId));
      toast('Company deleted successfully!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to delete company', 'error');
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const term = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.industry.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/placement_officer"
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Hiring Partner Registry</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage official company registrations and details.</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-zinc-100 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/10"
        >
          <Plus className="w-4 h-4" /> Register Company
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search partners by name or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-10 bg-zinc-900 rounded-xl"></div>
          <div className="h-10 bg-zinc-900 rounded-xl"></div>
          <div className="h-10 bg-zinc-900 rounded-xl"></div>
        </div>
      ) : (
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Industry</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredCompanies.map((c) => (
                  <tr key={c._id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                          {c.logoUrl ? (
                            <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-4.5 h-4.5 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100">{c.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-xs mt-0.5">{c.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-950 border border-zinc-855 px-2.5 py-1 rounded-lg">
                        <Tag className="w-3 h-3 text-purple-400" />
                        {c.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline font-mono"
                      >
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 hover:text-purple-400 rounded-xl transition-all text-zinc-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 hover:text-red-400 rounded-xl transition-all text-zinc-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-zinc-500">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Form Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-zinc-850 pb-4">
              <h2 className="text-lg font-extrabold text-zinc-100">
                {editingCompany ? 'Edit Partner Company' : 'Register Partner Company'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Tech Inc."
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
                  placeholder="https://example.com"
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Industry *</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Dev, FinTech"
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
                  placeholder="https://images.unsplash.com/... (optional)"
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe company operations, workspace environment..."
                  required
                  className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
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
                  <>Save Partner</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default OfficerCompanies;
