import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.js';
import { StatCard } from '../../components/StatCard.js';
import {
  Users,
  ShieldAlert,
  History,
  Settings,
  ShieldCheck,
  Search,
  UserCog,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Company {
  _id: string;
  name: string;
}

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'placement_officer' | 'recruiter' | 'admin';
  companyId?: Company;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'settings'>('users');
  const [loading, setLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Role modification modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newRole, setNewRole] = useState<'student' | 'placement_officer' | 'recruiter' | 'admin'>('student');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Settings Mock States
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [emailVerification, setEmailVerification] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes, companiesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/logs'),
        api.get('/officer/companies'),
      ]);

      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setCompanies(companiesRes.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load administrative logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const openRoleModal = (user: UserAccount) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setSelectedCompanyId(user.companyId?._id || '');
    setRoleModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const res = await api.put(`/admin/users/${selectedUser._id}/role`, {
        role: newRole,
        companyId: newRole === 'recruiter' ? selectedCompanyId : null,
      });

      // Update locally
      const updatedUser = res.data.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? {
                ...u,
                role: updatedUser.role,
                companyId: companies.find((c) => c._id === updatedUser.companyId),
              }
            : u
        )
      );

      // Re-fetch logs to show the new audit log immediately
      const logsRes = await api.get('/admin/logs');
      setLogs(logsRes.data);

      toast('User privileges modified successfully!', 'success');
      setRoleModalOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to alter user role credentials', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-12 bg-zinc-900 rounded-2xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-zinc-900 rounded-3xl"></div>
        </div>
        <div className="h-96 bg-zinc-900 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">System Control Panel</h1>
          <p className="text-sm text-zinc-400 mt-1">Review user accounts, check audit logging logs, and adjust security rules.</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" /> Accounts
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Audit Trails
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={<Users className="w-5 h-5 text-purple-400" />}
          description="Registered system accounts"
        />
        <StatCard
          title="Security Logs"
          value={logs.length}
          icon={<History className="w-5 h-5 text-blue-400" />}
          description="Modifications logged in DB"
        />
        <StatCard
          title="Admins & Officers"
          value={users.filter((u) => u.role === 'admin' || u.role === 'placement_officer').length}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          description="Privileged core users"
        />
        <StatCard
          title="Active Integrations"
          value="Healthy"
          icon={<Settings className="w-5 h-5 text-amber-400" />}
          description="Global configuration healthy"
        />
      </div>

      {/* Tab: Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Organization Mapping</th>
                    <th className="px-6 py-4">Registration Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-zinc-100">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            u.role === 'admin'
                              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                              : u.role === 'placement_officer'
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                              : u.role === 'recruiter'
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                              : 'bg-zinc-950 border border-zinc-850 text-zinc-500'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                        {u.companyId ? u.companyId.name : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openRoleModal(u)}
                          className="flex items-center gap-1 ml-auto px-2.5 py-1.5 bg-zinc-950 border border-zinc-805 hover:bg-zinc-900 text-zinc-400 hover:text-purple-400 rounded-xl transition-all text-xs font-semibold"
                        >
                          <UserCog className="w-3.5 h-3.5" /> Adjust Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit Trails */}
      {activeTab === 'audit' && (
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6">
          <div className="border-b border-zinc-850 pb-4">
            <h2 className="text-lg font-bold text-zinc-200">System Activity Stream</h2>
            <p className="text-xs text-zinc-500 mt-1">Audit security logs for privilege changes, updates, and creation workflows.</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className="bg-zinc-950/60 border border-zinc-850/60 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-800 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-zinc-200">{log.action}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 text-zinc-500 rounded">
                      {log.userRole}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5">{log.target}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Performer: {log.userName} • IP: {log.ipAddress || 'unknown'}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-xs">
                No system activity events recorded in audit log yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 md:p-8 max-w-2xl backdrop-blur-md space-y-6">
          <div className="border-b border-zinc-850 pb-4">
            <h2 className="text-lg font-bold text-zinc-200">Global Configuration Parameters</h2>
            <p className="text-xs text-zinc-500 mt-1">Toggle platform registration rules and active maintenance controls.</p>
          </div>

          <div className="space-y-6">
            {/* Allow Registration */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Student Account Registration</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Toggle user registration forms on landing pages.</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowRegistration(!allowRegistration)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {allowRegistration ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>

            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Enforce Email Activation</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Force student verification via one-time tokens.</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailVerification(!emailVerification)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {emailVerification ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-850/70 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Enforce Maintenance Block</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Block student dashboards for server pipeline upgrades.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {maintenanceMode ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role modification modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateRole}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-6 border-b border-zinc-850 pb-4">
              <h2 className="text-base font-extrabold text-zinc-100">Modify Privileges</h2>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60 mb-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Account</p>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">{selectedUser.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedUser.email}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select System Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="placement_officer">Placement Officer</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Show company mapper dropdown only for recruiter role */}
              {newRole === 'recruiter' && (
                <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-1.5 duration-150">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Associated Employer Company</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Company Profile --</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-5">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold rounded-xl text-zinc-100 transition-all flex items-center gap-1.5"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Apply Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
