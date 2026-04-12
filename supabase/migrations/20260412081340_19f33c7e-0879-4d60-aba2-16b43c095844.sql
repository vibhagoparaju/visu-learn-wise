-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  difficulty_level text default 'beginner' check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  tutor_name text default 'VISU',
  ai_personality text default 'friendly' check (ai_personality in ('friendly', 'professional', 'motivating')),
  voice_enabled boolean default false,
  xp integer default 0,
  level integer default 1,
  streak_days integer default 0,
  last_study_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Student'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Chat conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New Chat',
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Users can manage own conversations" on public.conversations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage own messages" on public.chat_messages
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Uploaded documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_path text,
  status text default 'uploading' check (status in ('uploading', 'processing', 'done', 'error')),
  topics jsonb default '[]'::jsonb,
  summary text,
  key_points jsonb default '[]'::jsonb,
  formulas jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents" on public.documents
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Study progress per topic
create table public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  subtopic text,
  mastery_pct integer default 0 check (mastery_pct between 0 and 100),
  strength text default 'not-started' check (strength in ('strong', 'moderate', 'weak', 'not-started')),
  questions_attempted integer default 0,
  questions_correct integer default 0,
  last_studied_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, topic, subtopic)
);

alter table public.study_progress enable row level security;

create policy "Users can manage own progress" on public.study_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Study plans
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_date date not null,
  tasks jsonb default '[]'::jsonb,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.study_plans enable row level security;

create policy "Users can manage own plans" on public.study_plans
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create storage bucket for uploads
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Users can upload own documents" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own documents" on storage.objects
  for select to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own documents" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);