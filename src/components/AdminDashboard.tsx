import { useState, useEffect } from 'react';
import { supabase, UserProfile, LLMModel } from '../lib/supabase';
import { Shield, Search, CheckCircle, XCircle, Users, Clock, UserCheck, UserX, Loader2, RotateCcw, Trash2, Settings, Cpu } from 'lucide-react';

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type TabType = 'users' | 'models';

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');

  useEffect(() => {
    loadUsers();
    loadModels();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load users');
      }

      const { users: data } = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(term) ||
          user.id.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-status`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'APPROVED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve user');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user?')) return;

    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-status`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'REJECTED' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject user');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const setPending = async (userId: string) => {
    if (!confirm('Are you sure you want to set this user back to pending status?')) return;

    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-status`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: 'PENDING' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user status');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    const confirmMessage = `Are you sure you want to permanently delete ${userName}?\n\nThis will delete:\n- User account\n- All recipes\n- All chats\n- All meals\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    const doubleConfirm = confirm('Please confirm one more time. This action is permanent and cannot be undone.');
    if (!doubleConfirm) return;

    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const loadModels = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const updateUserModel = async (userId: string, modelId: string | null) => {
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user-model`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, modelId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user model');
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user model:', error);
      alert('Failed to update user model. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleModelActive = async (modelId: string, isActive: boolean) => {
    setActionLoading(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-models`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle_active', modelId, isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle model status');
      }

      await loadModels();
    } catch (error) {
      console.error('Error toggling model status:', error);
      alert('Failed to toggle model status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const setDefaultModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to set this as the default model for all users?')) return;

    setActionLoading(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-models`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'set_default', modelId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set default model');
      }

      await loadModels();
    } catch (error) {
      console.error('Error setting default model:', error);
      alert('Failed to set default model. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStats = () => {
    return {
      total: users.length,
      pending: users.filter((u) => u.status === 'PENDING').length,
      approved: users.filter((u) => u.status === 'APPROVED').length,
      rejected: users.filter((u) => u.status === 'REJECTED').length,
    };
  };

  const stats = getStats();
  const defaultModel = models.find(m => m.is_default);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Loading user management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-lg">
          <Shield className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users and AI models</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
            activeTab === 'models'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Cpu className="w-5 h-5" />
          LLM Models
        </button>
      </div>

      {activeTab === 'users' && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-6 shadow-sm border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Pending</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
        </div>

        <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-900">Approved</span>
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
        </div>

        <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <UserX className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-red-900">Rejected</span>
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterStatus === status
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Admin</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">AI Model</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Logins</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Recipes</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Chats</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Meals</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Signed Up</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 font-mono">{user.user_id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {user.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {user.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_admin && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.assigned_model_id || ''}
                        onChange={(e) => updateUserModel(user.user_id, e.target.value || null)}
                        disabled={actionLoading === user.user_id}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:opacity-50"
                      >
                        <option value="">Default ({defaultModel?.model_name || 'None'})</option>
                        {models.filter(m => m.is_active).map(model => (
                          <option key={model.id} value={model.id}>
                            {model.model_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{user.login_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{user.recipe_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{user.chat_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{user.meal_count ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {!user.is_admin && (
                        <div className="flex gap-2 justify-end">
                          {user.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveUser(user.user_id)}
                                disabled={actionLoading === user.user_id}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                                title="Approve user"
                              >
                                {actionLoading === user.user_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => rejectUser(user.user_id)}
                                disabled={actionLoading === user.user_id}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                                title="Reject user"
                              >
                                {actionLoading === user.user_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                          {(user.status === 'APPROVED' || user.status === 'REJECTED') && (
                            <button
                              onClick={() => setPending(user.user_id)}
                              disabled={actionLoading === user.user_id}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                              title="Set back to pending"
                            >
                              {actionLoading === user.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.user_id, user.full_name)}
                            disabled={actionLoading === user.user_id}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                            title="Delete user permanently"
                          >
                            {actionLoading === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activeTab === 'models' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">LLM Model Configuration</h3>
                <p className="text-sm text-gray-600">Manage AI models and assign them to users</p>
              </div>
            </div>

            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    model.is_default
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{model.model_name}</h4>
                        {model.is_default && (
                          <span className="px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded-full">
                            DEFAULT
                          </span>
                        )}
                        {!model.is_active && (
                          <span className="px-2 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <strong>Provider:</strong> {model.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <strong>Model ID:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">{model.model_identifier}</code>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!model.is_default && (
                        <button
                          onClick={() => setDefaultModel(model.id)}
                          disabled={actionLoading === model.id || !model.is_active}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === model.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => toggleModelActive(model.id, !model.is_active)}
                        disabled={actionLoading === model.id || model.is_default}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          model.is_active
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={model.is_default ? 'Cannot deactivate default model' : ''}
                      >
                        {actionLoading === model.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : model.is_active ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {model.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
