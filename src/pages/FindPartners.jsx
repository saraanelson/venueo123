import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchPartnersForRole, getOrCreateConversation } from '../lib/supabase';
import { searchGooglePlaces, CATEGORY_MAP, filterByNeighborhood } from '../lib/googlePlaces';
import { getDisplayName, roleLabel, initials, truncate } from '../lib/utils';
import { Search, MapPin, Star, Award, Globe, Filter, Users } from 'lucide-react';
import ProfileDetailModal from '../components/shared/ProfileDetailModal';
import ProposalModal from '../components/proposals/ProposalModal';

export default function FindPartners() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const myRole = profile?.role;

  // ── State ──
  const [members, setMembers]           = useState({});     // { role: [profiles] }
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Search / filter controls
  const [searchQuery, setSearchQuery]   = useState('');
  const [category, setCategory]         = useState('All');
  const [neighborhood, setNeighborhood] = useState('');
  const [activeTab, setActiveTab]       = useState('members'); // 'members' | 'google'

  // Detail modal
  const [profileTarget, setProfileTarget] = useState(null);
  const [profileIsGoogle, setProfileIsGoogle] = useState(false);

  // Proposal modal
  const [proposalTarget, setProposalTarget] = useState(null);
  const [proposalIsGoogle, setProposalIsGoogle] = useState(false);

  // ── Load member results on mount ──
  useEffect(() => {
    if (!myRole) return;
    fetchPartnersForRole(myRole)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [myRole]);

  // ── Google Places search ──
  async function handleGoogleSearch(e) {
    e?.preventDefault();
    setGoogleLoading(true);

    try {
      const results = await searchGooglePlaces({
        query: searchQuery || undefined,
        location: { lat: 32.7157, lng: -117.1611 }, // Default: San Diego
        radius: 8000,
        category,
      });

      const filtered = neighborhood
        ? filterByNeighborhood(results, neighborhood)
        : results;

      setGoogleResults(filtered);
      setActiveTab('google');
    } catch (err) {
      console.error('Google search failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Handlers ──
  function openProfile(partner, isGoogle) {
    setProfileTarget(partner);
    setProfileIsGoogle(isGoogle);
  }

  function closeProfile() {
    setProfileTarget(null);
  }

  function openProposal(partner, isGoogle) {
    setProposalTarget(partner);
    setProposalIsGoogle(isGoogle);
    closeProfile();
  }

  async function handleMessage(partner) {
    const partnerId = partner.profiles?.id || partner.user_id;
    if (!partnerId) return;

    try {
      await getOrCreateConversation(user.id, partnerId);
      navigate('/messages');
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
    closeProfile();
  }

  // ── Filter members by search query ──
  function getFilteredMembers() {
    const allMembers = Object.entries(members).flatMap(([role, list]) =>
      list.map(m => ({ ...m, _targetRole: role }))
    );

    if (!searchQuery.trim()) return allMembers;

    const q = searchQuery.toLowerCase();
    return allMembers.filter(m => {
      const name = getDisplayName(m.profiles || {}, m).toLowerCase();
      const bio = (m.bio || m.description || '').toLowerCase();
      const tags = (m.tags || []).join(' ').toLowerCase();
      return name.includes(q) || bio.includes(q) || tags.includes(q);
    });
  }

  const filteredMembers = getFilteredMembers();

  // ── Render ──
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-surface-800">Find Partners</h1>
        <p className="text-sm text-surface-400 mt-1">
          Discover creators, businesses, brands, and charities to collaborate with.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleGoogleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              className="input pl-9"
              placeholder="Search members or Google Places…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="input w-auto" value={category} onChange={e => setCategory(e.target.value)}>
            {Object.keys(CATEGORY_MAP).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            className="input w-auto sm:w-40"
            placeholder="Neighborhood"
            value={neighborhood}
            onChange={e => setNeighborhood(e.target.value)}
          />

          <button type="submit" className="btn-primary whitespace-nowrap" disabled={googleLoading}>
            <Globe size={16} />
            {googleLoading ? 'Searching…' : 'Search Google'}
          </button>
        </form>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-surface-800 text-surface-800'
              : 'border-transparent text-surface-400 hover:text-surface-600'
          }`}
        >
          <Users size={14} className="inline mr-1.5 -mt-0.5" />
          Members ({filteredMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('google')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'google'
              ? 'border-surface-800 text-surface-800'
              : 'border-transparent text-surface-400 hover:text-surface-600'
          }`}
        >
          <Globe size={14} className="inline mr-1.5 -mt-0.5" />
          Google Places ({googleResults.length})
        </button>
      </div>

      {/* ── Members tab ── */}
      {activeTab === 'members' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-surface-300 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No member partners found yet.</p>
              <p className="text-xs mt-1">Try searching Google Places or adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map(member => {
                const base = member.profiles || {};
                const name = getDisplayName(base, member);
                return (
                  <button
                    key={member.id}
                    onClick={() => openProfile(member, false)}
                    className="card p-4 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                        {initials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-surface-800 truncate">{name}</p>
                        <span className="badge badge-role text-[10px]">{roleLabel(base.role || member._targetRole)}</span>
                      </div>
                    </div>
                    {(member.bio || member.description) && (
                      <p className="text-xs text-surface-500 leading-relaxed mb-2">
                        {truncate(member.bio || member.description, 100)}
                      </p>
                    )}
                    {member.city && (
                      <div className="flex items-center gap-1 text-xs text-surface-400">
                        <MapPin size={12} />
                        {[member.city, member.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {member.has_hosted_events && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1.5">
                        <Award size={12} /> Has hosted events
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Google Places tab ── */}
      {activeTab === 'google' && (
        <div>
          {googleResults.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <Globe size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No Google Places results yet.</p>
              <p className="text-xs mt-1">Use the search bar above to find local businesses.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {googleResults.map(place => (
                <button
                  key={place.place_id}
                  onClick={() => openProfile(place, true)}
                  className="card p-4 text-left hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-surface-800 mb-1 truncate">{place.name}</p>
                  {place.address && (
                    <div className="flex items-start gap-1 text-xs text-surface-400 mb-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span>{place.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {place.rating && (
                      <div className="flex items-center gap-1 text-xs text-surface-500">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {place.rating}
                      </div>
                    )}
                    <span className="badge bg-blue-50 text-blue-600 border-blue-200 text-[10px]">
                      Google Business
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Profile detail modal ── */}
      {profileTarget && (
        <ProfileDetailModal
          partner={profileTarget}
          isGoogle={profileIsGoogle}
          onClose={closeProfile}
          onPropose={(p) => openProposal(p, profileIsGoogle)}
          onMessage={profileIsGoogle ? null : handleMessage}
        />
      )}

      {/* ── Proposal modal ── */}
      {proposalTarget && (
        <ProposalModal
          target={proposalTarget}
          isGoogle={proposalIsGoogle}
          onClose={() => setProposalTarget(null)}
          onSent={() => {
            setProposalTarget(null);
            // Could show a success toast here
          }}
        />
      )}
    </div>
  );
}
