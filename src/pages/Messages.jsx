import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchConversations, fetchFullProfile } from '../lib/supabase';
import { timeAgo, initials, truncate } from '../lib/utils';
import { MessageSquare, Plus } from 'lucide-react';
import ChatWindow from '../components/messaging/ChatWindow';

export default function Messages() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeConvo, setActiveConvo]     = useState(null);
  const [nameCache, setNameCache]         = useState({});

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    setLoading(true);
    try {
      const convos = await fetchConversations(user.id);
      setConversations(convos);

      // Resolve partner names
      const cache = { ...nameCache };
      for (const c of convos) {
        const partnerId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        if (!cache[partnerId]) {
          try {
            const { base, roleProfile } = await fetchFullProfile(partnerId);
            cache[partnerId] =
              roleProfile?.display_name || roleProfile?.business_name ||
              roleProfile?.brand_name || roleProfile?.org_name ||
              base?.full_name || base?.email?.split('@')[0] || 'Unknown';
          } catch { cache[partnerId] = 'Unknown'; }
        }
      }
      setNameCache(cache);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  function getPartnerInfo(convo) {
    const partnerId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
    return {
      id: partnerId,
      name: nameCache[partnerId] || 'Loading…',
    };
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
      <div className="mb-6 lg:hidden">
        {!activeConvo && (
          <>
            <h1 className="font-display text-2xl text-surface-800">Messages</h1>
            <p className="text-sm text-surface-400 mt-1">Chat with your partners.</p>
          </>
        )}
      </div>

      <div className="card overflow-hidden flex" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* ── Conversation list ── */}
        <div className={`w-full lg:w-80 border-r border-surface-200 flex flex-col bg-white ${
          activeConvo ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* List header */}
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <h2 className="font-medium text-sm text-surface-700">Conversations</h2>
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-surface-400">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No conversations yet.</p>
                <p className="text-xs mt-1">Start one from Find Partners.</p>
              </div>
            ) : (
              conversations.map(convo => {
                const partner = getPartnerInfo(convo);
                const isActive = activeConvo?.id === convo.id;

                return (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConvo(convo)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-surface-50 transition-colors ${
                      isActive ? 'bg-surface-100' : 'hover:bg-surface-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(partner.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-surface-800 truncate">{partner.name}</p>
                        <span className="text-[10px] text-surface-400 shrink-0 ml-2">
                          {convo.last_message_at ? timeAgo(convo.last_message_at) : ''}
                        </span>
                      </div>
                      {convo.last_message && (
                        <p className="text-xs text-surface-400 truncate">{truncate(convo.last_message, 50)}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        <div className={`flex-1 flex flex-col ${
          !activeConvo ? 'hidden lg:flex' : 'flex'
        }`}>
          <ChatWindow
            conversation={activeConvo}
            partnerName={activeConvo ? getPartnerInfo(activeConvo).name : ''}
            onBack={() => setActiveConvo(null)}
          />
        </div>
      </div>
    </div>
  );
}
