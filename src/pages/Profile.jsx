import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { upsertRoleProfile } from '../lib/supabase';
import { Save, CheckCircle } from 'lucide-react';

// Field definitions per role
const ROLE_FIELDS = {
  creator: [
    { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'How partners will see you' },
    { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell potential partners about yourself and your events…' },
    { key: 'category', label: 'Category', type: 'select', options: ['yoga', 'art', 'music', 'wellness', 'fitness', 'cooking', 'photography', 'other'] },
    { key: 'audience_size', label: 'Audience Size', type: 'select', options: ['Under 1K', '1K-5K', '5K-10K', '10K-50K', '50K+'] },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourhandle' },
    { key: 'tiktok', label: 'TikTok', type: 'text', placeholder: '@yourhandle' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'San Diego' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'CA' },
    { key: 'event_types', label: 'Event Types', type: 'tags', placeholder: 'workshop, popup, class, performance' },
    { key: 'tags', label: 'Tags / Keywords', type: 'tags', placeholder: 'mindfulness, acrylic painting, live music' },
  ],
  business: [
    { key: 'business_name', label: 'Business Name', type: 'text', placeholder: 'Your business name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your space and what makes it great for events…' },
    { key: 'category', label: 'Category', type: 'select', options: ['cafe', 'bar', 'restaurant', 'gallery', 'studio', 'gym', 'spa', 'bookstore', 'retail', 'event_space', 'other'] },
    { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'San Diego' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'CA' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: '(619) 555-0100' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourhandle' },
    { key: 'capacity', label: 'Capacity', type: 'number', placeholder: 'Max guests' },
    { key: 'amenities', label: 'Amenities', type: 'tags', placeholder: 'wifi, projector, sound system, kitchen' },
    { key: 'has_hosted_events', label: 'Has Hosted Events Before', type: 'checkbox' },
    { key: 'tags', label: 'Tags / Keywords', type: 'tags', placeholder: 'cozy, downtown, outdoor patio' },
  ],
  brand: [
    { key: 'brand_name', label: 'Brand Name', type: 'text', placeholder: 'Your brand name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What does your brand do and what kind of partnerships interest you?' },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'Health & Wellness, Fashion, Food…' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourhandle' },
    { key: 'partnership_types', label: 'Partnership Types', type: 'tags', placeholder: 'sponsorship, product placement, collab' },
    { key: 'budget_range', label: 'Budget Range', type: 'select', options: ['Under $500', '$500-$2K', '$2K-$5K', '$5K-$10K', '$10K+'] },
    { key: 'target_audience', label: 'Target Audience', type: 'text', placeholder: 'Who are you trying to reach?' },
    { key: 'tags', label: 'Tags / Keywords', type: 'tags', placeholder: 'sustainable, local, wellness' },
  ],
  charity: [
    { key: 'org_name', label: 'Organization Name', type: 'text', placeholder: 'Your organization name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your cause and what kind of events interest you…' },
    { key: 'cause', label: 'Cause / Focus Area', type: 'text', placeholder: 'Education, Environment, Health…' },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@yourhandle' },
    { key: 'partnership_types', label: 'Partnership Types', type: 'tags', placeholder: 'fundraiser, awareness event, volunteer day' },
    { key: 'event_interest', label: 'Event Interests', type: 'tags', placeholder: 'gala, popup, community workshop' },
    { key: 'tags', label: 'Tags / Keywords', type: 'tags', placeholder: 'nonprofit, community, youth' },
  ],
};

export default function Profile() {
  const { user, profile, roleProfile, refreshProfile } = useAuth();
  const [form, setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const role = profile?.role;
  const fields = ROLE_FIELDS[role] || [];

  // Populate form from existing roleProfile
  useEffect(() => {
    if (roleProfile) {
      const initial = {};
      fields.forEach(f => {
        const val = roleProfile[f.key];
        if (f.type === 'tags') {
          initial[f.key] = Array.isArray(val) ? val.join(', ') : (val || '');
        } else if (f.type === 'checkbox') {
          initial[f.key] = !!val;
        } else {
          initial[f.key] = val ?? '';
        }
      });
      setForm(initial);
    }
  }, [roleProfile]);

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      // Convert tag strings to arrays
      const data = { ...form };
      fields.forEach(f => {
        if (f.type === 'tags' && typeof data[f.key] === 'string') {
          data[f.key] = data[f.key].split(',').map(s => s.trim()).filter(Boolean);
        }
        if (f.type === 'number' && data[f.key] !== '') {
          data[f.key] = parseInt(data[f.key], 10) || null;
        }
      });

      await upsertRoleProfile(user.id, role, data);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!role) {
    return <p className="text-surface-400 py-12 text-center">Loading profile…</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-surface-800">My Profile</h1>
        <p className="text-sm text-surface-400 mt-1">
          This is what potential partners will see when they find you.
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 sm:p-8 max-w-2xl space-y-5">
        {fields.map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>

            {field.type === 'text' || field.type === 'number' ? (
              <input
                type={field.type}
                className="input"
                placeholder={field.placeholder}
                value={form[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder={field.placeholder}
                value={form[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                rows={4}
              />
            ) : field.type === 'select' ? (
              <select
                className="input"
                value={form[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
              >
                <option value="">Select…</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            ) : field.type === 'tags' ? (
              <input
                type="text"
                className="input"
                placeholder={field.placeholder}
                value={form[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-400"
                  checked={!!form[field.key]}
                  onChange={e => handleChange(field.key, e.target.checked)}
                />
                <span className="text-sm text-surface-600">Yes</span>
              </label>
            ) : null}

            {field.type === 'tags' && (
              <p className="text-xs text-surface-400 mt-1">Separate with commas</p>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle size={16} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
