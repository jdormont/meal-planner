import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, Upload } from 'lucide-react';

type CuisineProfile = {
  id: string;
  cuisine_name: string;
  style_focus: string;
  profile_data: any;
  is_active: boolean;
  keywords: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
};

export default function CuisineProfileManager() {
  const [profiles, setProfiles] = useState<CuisineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<CuisineProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editMode, setEditMode] = useState<'form' | 'json'>('form');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cuisine_profiles')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading profiles:', error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  async function toggleActive(profile: CuisineProfile) {
    const { error } = await supabase
      .from('cuisine_profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', profile.id);

    if (error) {
      console.error('Error toggling active status:', error);
    } else {
      loadProfiles();
    }
  }

  async function deleteProfile(profile: CuisineProfile) {
    if (!confirm(`Are you sure you want to delete the ${profile.cuisine_name} profile?`)) {
      return;
    }

    const { error } = await supabase
      .from('cuisine_profiles')
      .delete()
      .eq('id', profile.id);

    if (error) {
      console.error('Error deleting profile:', error);
    } else {
      loadProfiles();
    }
  }

  async function updateDisplayOrder(profile: CuisineProfile, direction: 'up' | 'down') {
    const currentIndex = profiles.findIndex(p => p.id === profile.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= profiles.length) {
      return;
    }

    const targetProfile = profiles[targetIndex];

    await supabase
      .from('cuisine_profiles')
      .update({ display_order: targetProfile.display_order })
      .eq('id', profile.id);

    await supabase
      .from('cuisine_profiles')
      .update({ display_order: profile.display_order })
      .eq('id', targetProfile.id);

    loadProfiles();
  }

  function startCreate() {
    setEditingProfile({
      id: '',
      cuisine_name: '',
      style_focus: '',
      profile_data: {
        cuisine_identity: { name: '', style_focus: '' },
        culinary_philosophy: [],
        ingredient_boundaries: { common: [], avoid: [], conditional: [] },
        technique_defaults: [],
        flavor_balance_norms: {},
        canonical_recipe_structure: { title_pattern: '', component_order: [], timing_target: '' },
        generation_guardrails: { dont_suggest: [], do_suggest: [], flexibility_notes: [] }
      },
      is_active: true,
      keywords: [],
      display_order: profiles.length,
      created_at: '',
      updated_at: ''
    });
    setIsCreating(true);
    setEditMode('form');
    setJsonError('');
  }

  function startEdit(profile: CuisineProfile) {
    setEditingProfile({ ...profile });
    setIsCreating(false);
    setEditMode('form');
    setJsonError('');
  }

  function cancelEdit() {
    setEditingProfile(null);
    setIsCreating(false);
    setJsonError('');
  }

  async function saveProfile() {
    if (!editingProfile) return;

    if (!editingProfile.cuisine_name || !editingProfile.style_focus) {
      alert('Cuisine name and style focus are required');
      return;
    }

    if (isCreating) {
      const { error } = await supabase
        .from('cuisine_profiles')
        .insert({
          cuisine_name: editingProfile.cuisine_name,
          style_focus: editingProfile.style_focus,
          profile_data: editingProfile.profile_data,
          is_active: editingProfile.is_active,
          keywords: editingProfile.keywords,
          display_order: editingProfile.display_order
        });

      if (error) {
        console.error('Error creating profile:', error);
        alert('Error creating profile: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('cuisine_profiles')
        .update({
          cuisine_name: editingProfile.cuisine_name,
          style_focus: editingProfile.style_focus,
          profile_data: editingProfile.profile_data,
          is_active: editingProfile.is_active,
          keywords: editingProfile.keywords,
          display_order: editingProfile.display_order
        })
        .eq('id', editingProfile.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
        return;
      }
    }

    cancelEdit();
    loadProfiles();
  }

  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setEditingProfile(prev => prev ? { ...prev, profile_data: json } : null);
        setJsonError('');
      } catch (error) {
        setJsonError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  function handleJsonEdit(value: string) {
    try {
      const json = JSON.parse(value);
      setEditingProfile(prev => prev ? { ...prev, profile_data: json } : null);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON');
    }
  }

  function updateKeywords(value: string) {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setEditingProfile(prev => prev ? { ...prev, keywords } : null);
  }

  if (loading) {
    return <div className="text-center py-8">Loading cuisine profiles...</div>;
  }

  if (editingProfile) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {isCreating ? 'Create New Cuisine Profile' : `Edit ${editingProfile.cuisine_name} Profile`}
          </h2>
          <button
            onClick={cancelEdit}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cuisine Name
              </label>
              <input
                type="text"
                value={editingProfile.cuisine_name}
                onChange={(e) => setEditingProfile({ ...editingProfile, cuisine_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Chinese, Italian, Mexican"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Style Focus
              </label>
              <input
                type="text"
                value={editingProfile.style_focus}
                onChange={(e) => setEditingProfile({ ...editingProfile, style_focus: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Weeknight home cooking, not restaurant-style"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Detection Keywords (comma-separated)
              </label>
              <textarea
                value={editingProfile.keywords.join(', ')}
                onChange={(e) => updateKeywords(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="e.g., chinese, stir fry, wok, soy sauce, ginger"
              />
              <p className="text-xs text-slate-500 mt-1">
                These keywords are used to detect when this cuisine profile should be activated
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProfile.is_active}
                  onChange={(e) => setEditingProfile({ ...editingProfile, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Display Order:</label>
                <input
                  type="number"
                  value={editingProfile.display_order}
                  onChange={(e) => setEditingProfile({ ...editingProfile, display_order: parseInt(e.target.value) })}
                  className="w-20 px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Profile Data</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode('form')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  editMode === 'form'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Form
              </button>
              <button
                onClick={() => setEditMode('json')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  editMode === 'json'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                JSON
              </button>
              {editMode === 'json' && (
                <label className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {jsonError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {jsonError}
            </div>
          )}

          {editMode === 'json' ? (
            <textarea
              value={JSON.stringify(editingProfile.profile_data, null, 2)}
              onChange={(e) => handleJsonEdit(e.target.value)}
              className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            />
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-2">Culinary Philosophy</label>
                <textarea
                  value={(editingProfile.profile_data.culinary_philosophy || []).join('\n')}
                  onChange={(e) => setEditingProfile({
                    ...editingProfile,
                    profile_data: {
                      ...editingProfile.profile_data,
                      culinary_philosophy: e.target.value.split('\n').filter(l => l.trim())
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={5}
                  placeholder="One principle per line"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-2">Common Ingredients (comma-separated)</label>
                <textarea
                  value={(editingProfile.profile_data.ingredient_boundaries?.common || []).join(', ')}
                  onChange={(e) => setEditingProfile({
                    ...editingProfile,
                    profile_data: {
                      ...editingProfile.profile_data,
                      ingredient_boundaries: {
                        ...editingProfile.profile_data.ingredient_boundaries,
                        common: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-2">Technique Defaults</label>
                <textarea
                  value={(editingProfile.profile_data.technique_defaults || []).join('\n')}
                  onChange={(e) => setEditingProfile({
                    ...editingProfile,
                    profile_data: {
                      ...editingProfile.profile_data,
                      technique_defaults: e.target.value.split('\n').filter(l => l.trim())
                    }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={5}
                  placeholder="One technique per line"
                />
              </div>

              <p className="text-slate-600 italic">
                For advanced editing of all fields, switch to JSON mode
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={cancelEdit}
            className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isCreating ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cuisine Profile Management</h2>
          <p className="text-slate-600 mt-1">
            Manage cuisine-specific cooking profiles that guide AI recommendations
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">No cuisine profiles found</p>
          <button
            onClick={startCreate}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Cuisine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Style Focus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {profiles.map((profile, index) => (
                <tr key={profile.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateDisplayOrder(profile, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-slate-900 font-medium w-6 text-center">
                        {profile.display_order}
                      </span>
                      <button
                        onClick={() => updateDisplayOrder(profile, 'down')}
                        disabled={index === profiles.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{profile.cuisine_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 max-w-xs truncate">
                      {profile.style_focus}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500">
                      {profile.keywords.slice(0, 3).join(', ')}
                      {profile.keywords.length > 3 && ` +${profile.keywords.length - 3}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(profile)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        profile.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(profile)}
                        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProfile(profile)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
