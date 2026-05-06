-- ============================================================================
-- VENUEO DATABASE SCHEMA
-- Run this in the Supabase SQL Editor to set up all tables and policies.
-- ============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── USER PROFILES ──────────────────────────────────────────────────────────

-- Every authenticated user gets a row here on sign-up.
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null check (role in ('creator', 'business', 'brand', 'charity')),
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── ROLE-SPECIFIC PROFILE TABLES ───────────────────────────────────────────

create table public.creator_profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  display_name  text,
  bio           text,
  category      text,                       -- e.g. 'yoga', 'art', 'music', 'wellness'
  audience_size text,                       -- e.g. '1K-5K', '5K-10K', '10K-50K'
  instagram     text,
  tiktok        text,
  website       text,
  city          text,
  state         text,
  event_types   text[],                     -- e.g. '{workshop,popup,class,performance}'
  portfolio_urls text[],
  tags          text[],
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id)
);

create table public.business_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  business_name     text,
  description       text,
  category          text,                   -- e.g. 'cafe', 'gallery', 'studio', 'bar'
  address           text,
  city              text,
  state             text,
  phone             text,
  website           text,
  instagram         text,
  capacity          int,
  amenities         text[],                 -- e.g. '{wifi,projector,sound_system,kitchen}'
  availability      text,                   -- free-text or JSON string
  has_hosted_events boolean default false,
  photos            text[],
  tags              text[],
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(user_id)
);

create table public.brand_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  brand_name      text,
  description     text,
  industry        text,
  website         text,
  instagram       text,
  partnership_types text[],                 -- e.g. '{sponsorship,product_placement,collab}'
  budget_range    text,
  target_audience text,
  tags            text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

create table public.charity_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  org_name        text,
  description     text,
  cause           text,
  website         text,
  instagram       text,
  partnership_types text[],
  event_interest  text[],
  tags            text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

-- ─── PROPOSALS ──────────────────────────────────────────────────────────────

create table public.proposals (
  id                uuid primary key default uuid_generate_v4(),
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  receiver_id       uuid references public.profiles(id) on delete set null,
  -- For Google Business listings (external, non-member targets):
  is_google_business boolean default false,
  google_place_id   text,
  google_business_name text,
  google_business_address text,
  -- Proposal content:
  title             text not null,
  description       text,
  event_type        text,
  proposed_date     date,
  proposed_split    text default '65/35',   -- revenue split
  status            text default 'pending' check (status in ('pending','accepted','declined','completed','cancelled')),
  -- Contract / agreement:
  agreement_text    text,
  sender_signed     boolean default false,
  receiver_signed   boolean default false,
  sender_signed_at  timestamptz,
  receiver_signed_at timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── MESSAGES ───────────────────────────────────────────────────────────────

create table public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  proposal_id   uuid references public.proposals(id) on delete set null,
  last_message  text,
  last_message_at timestamptz default now(),
  created_at    timestamptz default now(),
  unique(participant_a, participant_b)
);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  read            boolean default false,
  created_at      timestamptz default now()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

create index idx_proposals_sender    on public.proposals(sender_id);
create index idx_proposals_receiver  on public.proposals(receiver_id);
create index idx_proposals_status    on public.proposals(status);
create index idx_messages_convo      on public.messages(conversation_id);
create index idx_messages_created    on public.messages(created_at);
create index idx_conversations_a     on public.conversations(participant_a);
create index idx_conversations_b     on public.conversations(participant_b);

-- ─── ROW-LEVEL SECURITY ────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.charity_profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Role profiles: readable by all, editable by owner
create policy "Role profiles viewable by all"
  on public.creator_profiles for select using (true);
create policy "Creator can manage own profile"
  on public.creator_profiles for all using (auth.uid() = user_id);

create policy "Business profiles viewable by all"
  on public.business_profiles for select using (true);
create policy "Business can manage own profile"
  on public.business_profiles for all using (auth.uid() = user_id);

create policy "Brand profiles viewable by all"
  on public.brand_profiles for select using (true);
create policy "Brand can manage own profile"
  on public.brand_profiles for all using (auth.uid() = user_id);

create policy "Charity profiles viewable by all"
  on public.charity_profiles for select using (true);
create policy "Charity can manage own profile"
  on public.charity_profiles for all using (auth.uid() = user_id);

-- Proposals: sender and receiver can see their own
create policy "Users can view own proposals"
  on public.proposals for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can create proposals"
  on public.proposals for insert with check (auth.uid() = sender_id);
create policy "Participants can update proposals"
  on public.proposals for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Conversations: participants can see/create
create policy "Participants can view conversations"
  on public.conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);
create policy "Users can create conversations"
  on public.conversations for insert with check (
    auth.uid() = participant_a or auth.uid() = participant_b
  );
create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = participant_a or auth.uid() = participant_b);

-- Messages: conversation participants can see/create
create policy "Conversation members can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (auth.uid() = c.participant_a or auth.uid() = c.participant_b)
    )
  );
create policy "Conversation members can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);
create policy "Recipients can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (auth.uid() = c.participant_a or auth.uid() = c.participant_b)
    )
  );

-- ─── HELPER FUNCTION: Auto-create profile on signup ─────────────────────────
-- (Call this from a Supabase Edge Function or handle in the client on first login)
