import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMessages, sendMessage, supabase } from '../../lib/supabase';
import { formatTime, timeAgo, initials } from '../../lib/utils';
import { Send, ArrowLeft } from 'lucide-react';

/**
 * Chat window for a single conversation.
 *
 * Props:
 *   - conversation: conversation row
 *   - partnerName: string
 *   - onBack: () => void  — mobile back navigation
 */
export default function ChatWindow({ conversation, partnerName, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg]     = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  // Load messages
  useEffect(() => {
    if (!conversation) return;

    loadMessages();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const data = await fetchMessages(conversation.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = newMsg.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMsg('');

    try {
      await sendMessage(conversation.id, user.id, text);
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMsg(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-400">
        <p className="text-sm">Select a conversation to start chatting.</p>
      </div>
    );
  }

  // Group messages by date
  function groupByDate(msgs) {
    const groups = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const dateStr = new Date(msg.created_at).toLocaleDateString();
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ type: 'date', date: dateStr, label: formatDateLabel(msg.created_at) });
      }
      groups.push({ type: 'message', ...msg });
    });

    return groups;
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 px-4 py-3 border-b border-surface-200 flex items-center gap-3 bg-white">
        {onBack && (
          <button onClick={onBack} className="btn-ghost p-1.5 lg:hidden">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
          {initials(partnerName)}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-800">{partnerName}</p>
          <p className="text-xs text-surface-400">
            {conversation.last_message_at ? timeAgo(conversation.last_message_at) : 'New conversation'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${item.date}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-surface-200" />
                <span className="text-[11px] text-surface-400 font-medium">{item.label}</span>
                <div className="flex-1 h-px bg-surface-200" />
              </div>
            );
          }

          const isMe = item.sender_id === user.id;
          return (
            <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-surface-800 text-white rounded-br-md'
                    : 'bg-surface-100 text-surface-700 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{item.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-surface-400' : 'text-surface-400'}`}>
                  {formatTime(item.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="shrink-0 px-4 py-3 border-t border-surface-200 bg-white">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Type a message…"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary px-3"
            disabled={!newMsg.trim() || sending}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
