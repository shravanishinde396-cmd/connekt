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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table.js';
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
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Title block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
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

          <Button
            onClick={openCreateModal}
            variant="default"
            size="sm"
            className="shadow-lg shadow-purple-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Register Company
          </Button>
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
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 border-zinc-850 py-0.5">
                          <Tag className="w-3 h-3 text-purple-400" />
                          {c.industry}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-purple-405 hover:underline font-mono"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-550" />
                          Visit Site <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditModal(c)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-purple-400 hover:bg-purple-955/20 rounded-xl cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(c._id)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-405 hover:text-red-405 hover:bg-red-955/20 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredCompanies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-zinc-500">
                        No companies found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* CRUD Form Modal Overlay */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCompany ? 'Edit Partner Company' : 'Register Partner Company'}
        >
          <form onSubmit={handleSave} className="space-y-6">
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
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                variant="default"
                size="sm"
                className="cursor-pointer"
              >
                Save Partner
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};
export default OfficerCompanies;
