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
  Plus,
  Search,
  Calendar,
  Users,
  Edit2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Award,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Company {
  _id: string;
  name: string;
}

interface Applicant {
  _id: string;
  appliedAt: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  resumeUrl: string;
  feedback?: string;
  student: {
    _id: string;
    name: string;
    email: string;
    department: string;
    CGPA: number;
    backlogs: number;
    skills: string[];
  };
}

interface Drive {
  _id: string;
  role: string;
  companyId: Company;
  packageLPA: number;
  cgpaCutoff: number;
  backlogCutoff: number;
  allowedDepartments: string[];
  jobDescription: string;
  deadline: string;
  status: 'Active' | 'Closed';
  applicants: any[];
}

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Electrical Engineering',
];

export const OfficerDrives: React.FC = () => {
  const { toast } = useToast();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<Drive | null>(null);
  const [formData, setFormData] = useState({
    companyId: '',
    role: '',
    packageLPA: 0,
    cgpaCutoff: 0,
    backlogCutoff: 0,
    allowedDepartments: [] as string[],
    jobDescription: '',
    deadline: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  // Applicants Panel State
  const [applicantsDrive, setApplicantsDrive] = useState<Drive | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const drivesRes = await api.get('/officer/drives');
      setDrives(drivesRes.data);

      const cosRes = await api.get('/officer/companies');
      setCompanies(cosRes.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to fetch drives data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDrive(null);
    setFormData({
      companyId: companies[0]?._id || '',
      role: '',
      packageLPA: 6,
      cgpaCutoff: 6.0,
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science'],
      jobDescription: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditModal = (drive: Drive) => {
    setEditingDrive(drive);
    setFormData({
      companyId: drive.companyId?._id || '',
      role: drive.role,
      packageLPA: drive.packageLPA,
      cgpaCutoff: drive.cgpaCutoff,
      backlogCutoff: drive.backlogCutoff,
      allowedDepartments: drive.allowedDepartments,
      jobDescription: drive.jobDescription,
      deadline: new Date(drive.deadline).toISOString().split('T')[0],
      status: drive.status,
    });
    setModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'packageLPA' || name === 'cgpaCutoff' || name === 'backlogCutoff' ? Number(value) : value,
    }));
  };

  const handleDeptCheckbox = (dept: string) => {
    setFormData((prev) => {
      const current = prev.allowedDepartments;
      if (current.includes(dept)) {
        return { ...prev, allowedDepartments: current.filter((d) => d !== dept) };
      } else {
        return { ...prev, allowedDepartments: [...current, dept] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId || !formData.role || !formData.jobDescription || formData.allowedDepartments.length === 0) {
      toast('Please complete all form fields and select at least one department', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingDrive) {
        // Edit existing
        const res = await api.put(`/officer/drives/${editingDrive._id}`, formData);
        setDrives((prev) =>
          prev.map((d) => (d._id === editingDrive._id ? res.data.drive : d))
        );
        toast('Placement drive updated successfully!', 'success');
      } else {
        // Create new
        const res = await api.post('/officer/drives', formData);
        setDrives((prev) => [res.data.drive, ...prev]);
        toast('Placement drive created successfully!', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save placement drive', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driveId: string) => {
    if (!window.confirm('Are you sure you want to delete this placement drive? Applicants data will be lost.')) {
      return;
    }

    try {
      await api.delete(`/officer/drives/${driveId}`);
      setDrives((prev) => prev.filter((d) => d._id !== driveId));
      toast('Placement drive deleted successfully!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to delete drive', 'error');
    }
  };

  // View Applicants workspace
  const openApplicantsPanel = async (drive: Drive) => {
    setApplicantsDrive(drive);
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/officer/drives/${drive._id}/applicants`);
      setApplicants(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load applicants', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const updateStatus = async (applicantId: string, newStatus: 'Shortlisted' | 'Rejected' | 'Selected') => {
    if (!applicantsDrive) return;
    try {
      await api.put(`/officer/drives/${applicantsDrive._id}/applicants/${applicantId}/status`, {
        status: newStatus,
      });

      // Update local state
      setApplicants((prev) =>
        prev.map((app) => (app._id === applicantId ? { ...app, status: newStatus } : app))
      );
      toast(`Applicant status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update applicant status', 'error');
    }
  };

  const filteredDrives = drives.filter((d) => {
    const term = searchQuery.toLowerCase();
    const companyName = d.companyId?.name || '';
    return d.role.toLowerCase().includes(term) || companyName.toLowerCase().includes(term);
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/placement_officer"
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Placement Cycles</h1>
              <p className="text-sm text-zinc-400 mt-1">Publish drive criteria, manage cutoffs, and shortlist applicants.</p>
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            variant="default"
            size="sm"
            className="shadow-lg shadow-purple-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Hiring Drive
          </Button>
        </div>

        {/* Grid containing list on left, applicants workspace on right if selected */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Drives List */}
          <div className={`flex flex-col gap-6 ${applicantsDrive ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search drives by company, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDrives.map((drive) => (
                  <Card
                    key={drive._id}
                    className={`transition-all duration-300 relative overflow-hidden ${
                      applicantsDrive?._id === drive._id
                        ? 'border-purple-500/40 shadow-xl shadow-purple-950/5'
                        : 'hover:border-zinc-700'
                    }`}
                  >
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div>
                        {/* Header: Company & Status */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-semibold">
                              {drive.companyId?.name || 'Unknown Company'}
                            </h4>
                            <h3 className="text-base font-extrabold text-zinc-100 mt-0.5">{drive.role}</h3>
                          </div>
                          {drive.status === 'Active' ? (
                            <Badge variant="success">{drive.status}</Badge>
                          ) : (
                            <Badge variant="secondary">{drive.status}</Badge>
                          )}
                        </div>

                        {/* Criteria & Compensation */}
                        <div className="grid grid-cols-2 gap-3 mb-6 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-850/45">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Package</p>
                            <p className="text-xs font-extrabold text-purple-400 mt-0.5">{drive.packageLPA} LPA</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Cutoff CGPA</p>
                            <p className="text-xs font-extrabold text-zinc-300 mt-0.5">≥ {drive.cgpaCutoff}</p>
                          </div>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <span>Apply Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2">
                        <Button
                          onClick={() => openApplicantsPanel(drive)}
                          variant="secondary"
                          size="sm"
                          className="cursor-pointer"
                        >
                          <Users className="w-4 h-4 mr-1.5 text-purple-450" />
                          Applicants ({drive.applicants?.length || 0})
                        </Button>

                        <div className="flex gap-1.5">
                          <Button
                            onClick={() => openEditModal(drive)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-purple-400 hover:bg-purple-950/20 rounded-xl cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(drive._id)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredDrives.length === 0 && (
                  <div className="col-span-2 text-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-500">
                    No hiring cycles found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Applicants Tracking Workspace Sidebar Panel */}
          {applicantsDrive && (
            <Card className="lg:col-span-1 border-purple-500/15 backdrop-blur-md animate-in slide-in-from-right-5 duration-200">
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Candidate Pipeline</h3>
                    <h2 className="text-base font-extrabold text-zinc-100 mt-0.5 truncate max-w-[150px]">
                      {applicantsDrive.role}
                    </h2>
                  </div>
                  <Button
                    onClick={() => setApplicantsDrive(null)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    ✕ Close Panel
                  </Button>
                </div>

                {loadingApplicants ? (
                  <div className="space-y-4 py-6">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {applicants.map((app) => (
                      <div
                        key={app._id}
                        className="bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 p-4 rounded-2xl space-y-3 transition-colors"
                      >
                        {/* Header student identification */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-extrabold text-zinc-200 text-sm">{app.student.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{app.student.email}</p>
                          </div>
                          {app.status === 'Selected' ? (
                            <Badge variant="success">{app.status}</Badge>
                          ) : app.status === 'Shortlisted' ? (
                            <Badge variant="info">{app.status}</Badge>
                          ) : app.status === 'Rejected' ? (
                            <Badge variant="destructive">{app.status}</Badge>
                          ) : (
                            <Badge variant="secondary">{app.status}</Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-900/60 text-center">
                          <div>
                            <span className="text-[9px] text-zinc-500 font-semibold block">CGPA</span>
                            <span className="text-xs text-zinc-300 font-bold">{app.student.CGPA}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-semibold block">Backlogs</span>
                            <span className="text-xs text-zinc-300 font-bold">{app.student.backlogs}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-semibold block">Branch</span>
                            <span className="text-[10px] text-zinc-300 font-bold truncate block">{app.student.department.split(' ').map(w=>w[0]).join('')}</span>
                          </div>
                        </div>

                        {/* Skills list */}
                        <div className="flex flex-wrap gap-1">
                          {app.student.skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0 border-zinc-800">
                              {s}
                            </Badge>
                          ))}
                        </div>

                        {/* Resume download and actions */}
                        <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3 mt-1">
                          <a
                            href={`${api.defaults.baseURL?.replace('/api', '')}${app.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:underline"
                          >
                            View Resume PDF <ExternalLink className="w-3 h-3" />
                          </a>

                          {/* Status Action Buttons */}
                          <div className="flex gap-1.5">
                            {app.status !== 'Shortlisted' && app.status !== 'Selected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Shortlisted')}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-blue-400 hover:bg-blue-955/20 cursor-pointer"
                                title="Shortlist Candidate"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {app.status !== 'Selected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Selected')}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-emerald-405 hover:bg-emerald-955/20 cursor-pointer"
                                title="Confirm Placement Offer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {app.status !== 'Rejected' && (
                              <Button
                                onClick={() => updateStatus(app._id, 'Rejected')}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-red-405 hover:bg-red-955/20 cursor-pointer"
                                title="Reject Candidate"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {applicants.length === 0 && (
                      <div className="text-center py-10 text-zinc-500 text-xs">
                        No students have applied to this drive yet.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* CRUD Form Modal Overlay */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingDrive ? 'Edit Hiring Drive' : 'Create Hiring Drive'}
        >
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hiring Partner *</label>
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Role Title *</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="e.g. Graduate Engineer Trainee"
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">CTC Package (LPA) *</label>
                  <input
                    type="number"
                    name="packageLPA"
                    value={formData.packageLPA || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 12"
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Min CGPA Cutoff *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpaCutoff"
                    value={formData.cgpaCutoff || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 8.0"
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Max Backlogs Allowed *</label>
                  <input
                    type="number"
                    name="backlogCutoff"
                    value={formData.backlogCutoff}
                    onChange={handleInputChange}
                    placeholder="e.g. 0"
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Application Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Allowed Departments *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {DEPARTMENTS.map((dept) => (
                      <label key={dept} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowedDepartments.includes(dept)}
                          onChange={() => handleDeptCheckbox(dept)}
                          className="rounded border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer"
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Description *</label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Outline job duties, required skills, and assessment steps..."
                    required
                    className="px-4 py-2.5 text-sm bg-zinc-950/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100"
                  />
                </div>
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
                Save Drive
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};
export default OfficerDrives;
