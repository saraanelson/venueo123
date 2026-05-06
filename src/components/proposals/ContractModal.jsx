import { useState } from 'react';
import { X, FileSignature, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProposal, sendMessage, getOrCreateConversation } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

/**
 * Contract / Agreement modal for a proposal.
 * - One party generates the agreement text.
 * - Both parties sign (sender_signed / receiver_signed).
 * - When one party signs, the other is notified via in-app message.
 *
 * Props:
 *   - proposal: proposal row
 *   - onClose: () => void
 *   - onUpdated: (updatedProposal) => void
 */
export default function ContractModal({ proposal, onClose, onUpdated }) {
  const { user } = useAuth();
  const [agreementText, setAgreementText] = useState(proposal.agreement_text || '');
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  const isSender   = user?.id === proposal.sender_id;
  const isReceiver = user?.id === proposal.receiver_id;
  const mySigned   = isSender ? proposal.sender_signed : proposal.receiver_signed;
  const otherSigned = isSender ? proposal.receiver_signed : proposal.sender_signed;
  const hasAgreement = !!proposal.agreement_text;
  const bothSigned = proposal.sender_signed && proposal.receiver_signed;

  function generateAgreement() {
    const text = `PARTNERSHIP AGREEMENT
────────────────────────────────────

Proposal: ${proposal.title}
Event Type: ${proposal.event_type || 'TBD'}
Proposed Date: ${proposal.proposed_date ? formatDate(proposal.proposed_date) : 'TBD'}
Revenue Split: ${proposal.proposed_split || '65/35'}

Description:
${proposal.description || 'No description provided.'}

Terms:
1. Both parties agree to the revenue split specified above.
2. The event host (venue) provides the space; the creator provides the programming.
3. Ticket revenue is collected and split within 7 business days of the event.
4. Either party may cancel with at least 48 hours notice.
5. Both parties agree to promote the event through their respective channels.

────────────────────────────────────
Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    setAgreementText(text);
  }

  async function handleSaveAgreement() {
    setSaving(true);
    try {
      const updated = await updateProposal(proposal.id, { agreement_text: agreementText });
      onUpdated(updated);
    } catch (err) {
      console.error('Failed to save agreement:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSign() {
    setSigning(true);
    try {
      const signField = isSender ? 'sender_signed' : 'receiver_signed';
      const signDateField = isSender ? 'sender_signed_at' : 'receiver_signed_at';

      const updates = {
        [signField]: true,
        [signDateField]: new Date().toISOString(),
      };

      // If the other party already signed, mark as completed
      if (otherSigned) {
        updates.status = 'completed';
      }

      const updated = await updateProposal(proposal.id, updates);

      // Notify the other party via in-app message
      if (!proposal.is_google_business && proposal.receiver_id) {
        const otherUserId = isSender ? proposal.receiver_id : proposal.sender_id;
        try {
          const convo = await getOrCreateConversation(user.id, otherUserId, proposal.id);
          const action = otherSigned ? 'countersigned' : 'signed';
          await sendMessage(
            convo.id,
            user.id,
            `📝 I've ${action} the partnership agreement for "${proposal.title}". ${
              otherSigned
                ? 'Both parties have now signed - the agreement is complete!'
                : 'Please review and countersign when ready.'
            }`
          );
        } catch (msgErr) {
          console.error('Failed to send signature notification:', msgErr);
        }
      }

      onUpdated(updated);
    } catch (err) {
      console.error('Failed to sign agreement:', err);
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg text-surface-800">Partnership Agreement</h2>
            <p className="text-xs text-surface-400">{proposal.title}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status indicators */}
          <div className="flex gap-3 text-sm">
            <div className={`flex items-center gap-1.5 ${proposal.sender_signed ? 'text-emerald-600' : 'text-surface-400'}`}>
              <CheckCircle size={14} /> Sender {proposal.sender_signed ? 'signed' : 'unsigned'}
            </div>
            <div className={`flex items-center gap-1.5 ${proposal.receiver_signed ? 'text-emerald-600' : 'text-surface-400'}`}>
              <CheckCircle size={14} /> Receiver {proposal.receiver_signed ? 'signed' : 'unsigned'}
            </div>
          </div>

          {bothSigned && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
              Both parties have signed. This agreement is complete.
            </div>
          )}

          {/* Agreement text */}
          {hasAgreement ? (
            <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
              <pre className="text-sm text-surface-700 whitespace-pre-wrap font-body leading-relaxed">
                {proposal.agreement_text}
              </pre>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-surface-400 mb-4">No agreement has been generated yet.</p>
              <button onClick={generateAgreement} className="btn-secondary">
                <FileSignature size={16} /> Generate Agreement
              </button>
            </div>
          )}

          {/* Editable draft (if not yet saved or user is editing) */}
          {!hasAgreement && agreementText && (
            <div>
              <label className="label">Review & Edit</label>
              <textarea
                className="input min-h-[200px] resize-y font-mono text-xs leading-relaxed"
                value={agreementText}
                onChange={e => setAgreementText(e.target.value)}
                rows={12}
              />
              <button onClick={handleSaveAgreement} className="btn-primary mt-3" disabled={saving}>
                {saving ? 'Saving...' : 'Save Agreement'}
              </button>
            </div>
          )}

          {/* Sign button */}
          {hasAgreement && !mySigned && !bothSigned && (
            <button onClick={handleSign} className="btn-primary w-full" disabled={signing}>
              <FileSignature size={16} />
              {signing ? 'Signing...' : 'Sign Agreement'}
            </button>
          )}

          {hasAgreement && mySigned && !bothSigned && (
            <p className="text-sm text-surface-400 text-center">
              You've signed. Waiting for the other party to countersign.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
