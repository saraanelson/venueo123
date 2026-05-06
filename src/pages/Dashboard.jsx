import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchProposals, fetchConversations } from '../lib/supabase';
import { getDisplayName, roleLabel, timeAgo, statusClass } from '../lib/utils';
import { Search, FileText, MessageSquare, ArrowRight, Inbox } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, roleProfile } = useAuth();
  const [proposals, setProposals]       = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchProposals(user.id),
      fetchConversations(user.id),
    ]).then(([p, c]) => {
      setProposals(p);
      setConversations(c);
    }).finally(() => setLoading(false));
  }, [user]);

  const displayName = getDisplayName(profile, roleProfile);
  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const unreadConvos = conversations.length; // simplified — enhance with unread count

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-surface-300 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-surface-800">
          Hey, {displayName}
        </h1>
        <p className="text-surface-400 mt-1">
          {roleLabel(profile?.role)} account — here's what's happening.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending proposals',  value: pendingCount, icon: FileText, to: '/proposals' },
          { label: 'Conversations',       value: unreadConvos,  icon: MessageSquare, to: '/messages' },
          { label: 'Total proposals',     value: proposals.length, icon: Inbox, to: '/proposals' },
        ].map(s => (
          <Link key={s.label} to={s.to} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <s.icon size={20} className="text-surface-400" strokeWidth={1.8} />
              <ArrowRight size={14} className="text-surface-300" />
            </div>
            <p className="text-2xl font-semibold text-surface-800">{s.value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link to="/find-partners" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Search size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-medium text-surface-800">Find Partners</p>
            <p className="text-xs text-surface-400">Discover creators, businesses, brands & charities</p>
          </div>
        </Link>
        <Link to="/profile" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-surface-100 text-surface-600 flex items-center justify-center">
            <FileText size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-medium text-surface-800">Edit Profile</p>
            <p className="text-xs text-surface-400">Make your profile stand out to potential partners</p>
          </div>
        </Link>
      </div>

      {/* Recent proposals */}
      {proposals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-surface-700">Recent Proposals</h2>
            <Link to="/proposals" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {proposals.slice(0, 5).map(p => (
              <div key={p.id} className="card px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-800 truncate">{p.title}</p>
                  <p className="text-xs text-surface-400">{timeAgo(p.created_at)}</p>
                </div>
                <span className={`badge ${statusClass(p.status)}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
