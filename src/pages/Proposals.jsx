import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProposals, updateProposal, fetchFullProfile } from '../lib/supabase';
import { formatDate, timeAgo, statusClass, truncate } from '../lib/utils';
import { FileText, Check, X, FileSignature, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import ContractModal from '../components/proposals/ContractModal';

export default function Proposals() {
  const { user } = useAuth();

  const [proposals, setProposals]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all'); // 'all' | 'sent' | 'received' | 'pending' | 'accepted'
  const [contractTarget, setContractTarget] = useState(null);

  // Cache of display names for sender/receiver IDs
  const [nameCache, setNameCache] = useState({});

  const loadProposals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchProposals(user.id);
      setProposals(data);

      // Resolve display names for all unique user IDs
      const ids = new Set();
      data.forEach(p => {
        if (p.sender_id) ids.add(p.sender_id);
        if (p.receiver_id) ids.add(p.receiver_id);
      });

      const cache = { ...nameCache };
      for (const id of ids) {
        if (!cache[id]) {
          try {
            const { base, roleProfile } = await fetchFullProfile(id);
            const name = roleProfile?.display_name || roleProfile?.business_name ||
                         roleProfile?.brand_name || roleProfile?.org_name ||
                         base?.full_name || base?.email?.split('@')[0] || 'Unknown';
            cache[id] = name;
          } catch { cache[id] = 'Unknown'; }
        }
      }
      setNameCache(cache);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  async function handleStatusChange(proposal, newStatus) {
    try {
      const updated = await updateProposal(proposal.id, { status: newStatus });
      setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Failed to update proposal:', err);
    }
  }

  function handleContractUpdated(updated) {
    setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
    setContractTarget(updated);
  }

  // ── Filtering ──
  const filtered = proposals.filter(p => {
    if (filter === 'sent')     return p.sender_id === user.id;
    if (filter === 'received') return p.receiver_id === user.id;
    if (filter === 'pending')  return p.status === 'pending';
    if (filter === 'accepted') return p.status === 'accepted';
    return true;
  });

  function getPartnerName(proposal) {
    if (proposal.is_google_business) return proposal.google_business_name || 'Google Business';
    const partnerId = proposal.sender_id === user.id ? proposal.receiver_id : proposal.sender_id;
    return nameCache[partnerId] || 'Loading…';
  }

  function isSent(proposal) {
    return proposal.sender_id === user.id;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-surface-300 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-surface-800">Proposals</h1>
          <p className="text-sm text-surface-400 mt-1">Manage your partnership proposals and agreements.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: 'all',      label: 'All' },
          { key: 'sent',     label: 'Sent' },
          { key: 'received', label: 'Received' },
          { key: 'pending',  label: 'Pending' },
          { key: 'accepted', label: 'Accepted' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap"
            style={filter === f.key ? { backgroundColor: '#1f2937', color: 'white', borderColor: '#1f2937' } : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-surface-400">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No proposals match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(proposal => (
            <div key={proposal.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Direction indicator + title */}
                  <div className="flex items-center gap-2 mb-1">
                    {isSent(proposal)
                      ? <ArrowUpRight size={14} className="text-blue-500 shrink-0" />
                      : <ArrowDownLeft size={14} className="text-emerald-500 shrink-0" />
                    }
                    <h3 className="font-medium text-surface-800 truncate">{proposal.title}</h3>
                  </div>

                  <p className="text-xs text-surface-400 mb-2">
                    {isSent(proposal) ? 'To' : 'From'}: {getPartnerName(proposal)}
                    {' · '}
                    {timeAgo(proposal.created_at)}
                    {proposal.proposed_date && ' · Event: ' + formatDate(proposal.proposed_date)}
                  </p>

                  {proposal.description && (
                    <p className="text-sm text-surface-500 mb-3">
                      {truncate(proposal.description, 120)}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge">{proposal.status}</span>
                    {proposal.proposed_split && (
                      <span className="badge bg-surface-100 text-surface-600 border-surface-200">
                        {proposal.proposed_split} split
                      </span>
                    )}
                    {proposal.is_google_business && (
                      <span className="badge bg-blue-50 text-blue-600 border-blue-200">
                        Google Business
                      </span>
                    )}
                    {(proposal.sender_signed || proposal.receiver_signed) && (
                      <span className="badge bg-emerald-50 text-emerald-600 border-emerald-200">
                        {proposal.sender_signed && proposal.receiver_signed
                          ? 'Fully signed'
                          : 'Partially signed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Accept/Decline for pending received proposals */}
                  {proposal.status === 'pending' && !isSent(proposal) && (
                    <>
                      <button
                        onClick={() => handleStatusChange(proposal, 'accepted')}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(proposal, 'declined')}
                        className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* Agreement button for accepted proposals */}
                  {proposal.status === 'accepted' && (
                    <button
                      onClick={() => setContractTarget(proposal)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Agreement
                    </button>
                  )}

                  {/* Cancel for pending sent proposals */}
                  {proposal.status === 'pending' && isSent(proposal) && (
                    <button
                      onClick={() => handleStatusChange(proposal, 'cancelled')}
                      className="btn-ghost text-xs px-3 py-1.5 text-surface-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract modal */}
      {contractTarget && (
        <ContractModal
          proposal={contractTarget}
          onClose={() => setContractTarget(null)}
          onUpdated={handleContractUpdated}
        />
      )}
    </div>
  );
}
