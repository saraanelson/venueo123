import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing — check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ─── Profile helpers ────────────────────────────────────────────────────────

const ROLE_TABLE = {
  creator:  'creator_profiles',
  business: 'business_profiles',
  brand:    'brand_profiles',
  charity:  'charity_profiles',
};

export function roleTable(role) {
  return ROLE_TABLE[role] || null;
}

/** Fetch the base profile + role-specific profile for a user. */
export async function fetchFullProfile(userId) {
  const { data: base, error: baseErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (baseErr || !base) return { base: null, roleProfile: null };

  const table = roleTable(base.role);
  if (!table) return { base, roleProfile: null };

  const { data: roleProfile } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .single();

  return { base, roleProfile };
}

/** Upsert role-specific profile data. */
export async function upsertRoleProfile(userId, role, data) {
  const table = roleTable(role);
  if (!table) throw new Error(`Unknown role: ${role}`);

  const { data: result, error } = await supabase
    .from(table)
    .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// ─── Proposal helpers ───────────────────────────────────────────────────────

export async function fetchProposals(userId) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProposal(proposal) {
  const { data, error } = await supabase
    .from('proposals')
    .insert(proposal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProposal(id, updates) {
  const { data, error } = await supabase
    .from('proposals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Conversation / message helpers ─────────────────────────────────────────

export async function getOrCreateConversation(userA, userB, proposalId = null) {
  // Check both orderings
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(participant_a.eq.${userA},participant_b.eq.${userB}),and(participant_a.eq.${userB},participant_b.eq.${userA})`
    )
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      participant_a: userA,
      participant_b: userB,
      proposal_id: proposalId,
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function fetchConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId, senderId, content) {
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  if (msgErr) throw msgErr;

  // Update conversation's last_message
  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return msg;
}

// ─── Discovery helpers ──────────────────────────────────────────────────────

/** Fetch all member profiles of a given role. */
export async function fetchMembersByRole(role) {
  const table = roleTable(role);
  if (!table) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*, profiles!inner(id, full_name, email, role, avatar_url)');

  if (error) throw error;
  return data || [];
}

/** Fetch members across multiple roles (for brand/charity who see businesses + creators). */
export async function fetchPartnersForRole(myRole) {
  const roleTargets = {
    creator:  ['business'],
    business: ['creator'],
    brand:    ['creator', 'business'],
    charity:  ['creator', 'business'],
  };

  const targets = roleTargets[myRole] || [];
  const results = {};

  for (const targetRole of targets) {
    results[targetRole] = await fetchMembersByRole(targetRole);
  }

  return results;
}
