import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createProposal } from '../../lib/supabase';
import { getDisplayName } from '../../lib/utils';

/**
 * Modal for creating a new partnership proposal.
 *
 * Props:
 *   - target: partner object (member or google listing)
 *   - isGoogle: boolean
 *   - onClose: () => void
 *   - onSent: (proposal) => void
 */
export default function ProposalModal({ target, isGoogle, onClose, onSent }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: '',
    proposed_date: '',
    proposed_split: '65/35',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const targetName = isGoogle
    ? target.name
    : getDisplayName(target.profiles || {}, target);

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Please add a title.'); return; }

    setSending(true);
    setError('');

    try {
      const proposal = {
        sender_id: user.id,
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        proposed_date: form.proposed_date || null,
        proposed_split: form.proposed_split,
      };

      if (isGoogle) {
        proposal.is_google_business = true;
        proposal.google_place_id = target.place_id;
        proposal.google_business_name = target.name;
        proposal.google_business_address = target.address;
        proposal.receiver_id = null;
      } else {
        proposal.is_google_business = false;
        proposal.receiver_id = target.profiles?.id || target.user_id;
      }

      const created = await createProposal(proposal);
      onSent?.(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send proposal.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg text-surface-800">New Proposal</h2>
            <p className="text-xs text-surface-400">To: {targetName}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Proposal Title</label>
            <input
              className="input"
              placeholder="e.g. Weekend Yoga Popup at Your Cafe"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Describe what you have in mind - the event, the vibe, what you'd bring..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Event Type</label>
              <select className="input" value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                <option value="">Select...</option>
                <option value="popup">Popup Event</option>
                <option value="workshop">Workshop</option>
                <option value="class">Class / Session</option>
                <option value="performance">Performance</option>
                <option value="market">Market / Fair</option>
                <option value="fundraiser">Fundraiser</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Proposed Date</label>
              <input
                type="date"
                className="input"
                value={form.proposed_date}
                onChange={e => handleChange('proposed_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Revenue Split</label>
            <select className="input" value={form.proposed_split} onChange={e => handleChange('proposed_split', e.target.value)}>
              <option value="50/50">50 / 50</option>
              <option value="60/40">60 / 40 (creator / venue)</option>
              <option value="65/35">65 / 35 (creator / venue)</option>
              <option value="70/30">70 / 30 (creator / venue)</option>
              <option value="custom">Custom - discuss in messages</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={sending}>
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}
