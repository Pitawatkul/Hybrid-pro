-- Hybrid Athlete Training Tracker — initial schema

create extension if not exists "pgcrypto";

-- ============ GOALS / TIMELINE ============
create table macrocycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null,
  goal_description text not null,
  target_date date not null,
  start_date date not null,
  starting_weekly_mileage_km numeric(6,2) not null default 0,
  starting_lift_maxes jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table phases (
  id uuid primary key default gen_random_uuid(),
  macrocycle_id uuid not null references macrocycles(id) on delete cascade,
  phase_type text not null check (phase_type in ('base','build','peak','taper','recovery')),
  sequence_order int not null,
  start_date date not null,
  end_date date not null,
  target_weekly_mileage_km numeric(6,2),
  intensity_bias text not null default 'moderate' check (intensity_bias in ('low','moderate','high')),
  notes text,
  unique (macrocycle_id, sequence_order)
);

-- ============ WEEKLY PLANS ============
create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  macrocycle_id uuid references macrocycles(id),
  phase_id uuid references phases(id),
  week_start_date date not null,
  generated_at timestamptz not null default now(),
  generation_source text not null default 'auto' check (generation_source in ('auto','manual_regenerate','manual_edit')),
  generation_rationale jsonb not null default '[]',
  status text not null default 'active' check (status in ('active','completed','superseded')),
  unique (user_id, week_start_date)
);

-- ============ EXERCISES (reference list) ============
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  primary_muscle_group text not null,
  movement_pattern text not null check (movement_pattern in ('squat','hinge','push','pull','carry','core')),
  affected_by_body_parts text[] not null default '{}',
  is_substitutable boolean not null default true,
  substitute_exercise_id uuid references exercises(id)
);

-- ============ PLANNED SESSIONS ============
create table planned_sessions (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references weekly_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  session_type text not null check (session_type in ('run','lift')),
  day_label text,
  sequence_in_day int not null default 1,

  -- running-specific (null for lift sessions)
  planned_distance_km numeric(6,2),
  planned_duration_min int,
  planned_pace_sec_per_km int,
  run_type text check (run_type in ('easy','tempo','interval','long','recovery','race')),

  -- lifting-specific (null for run sessions)
  planned_exercises jsonb,

  is_injury_modified boolean not null default false,
  modification_note text,
  status text not null default 'planned' check (status in ('planned','completed','skipped','partial'))
);

-- ============ LOGGED / ACTUAL SESSIONS ============
create table logged_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planned_session_id uuid references planned_sessions(id),
  logged_at timestamptz not null default now(),
  session_date date not null,
  session_type text not null check (session_type in ('run','lift')),

  -- running actuals
  actual_distance_km numeric(6,2),
  actual_duration_min int,
  actual_pace_sec_per_km int,
  actual_rpe int check (actual_rpe between 1 and 10),

  -- lifting actuals
  logged_exercises jsonb,

  notes text
);

-- ============ INJURIES ============
create table injuries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body_part text not null,
  severity text not null check (severity in ('mild','moderate','severe')),
  status text not null default 'active' check (status in ('active','recovering','resolved')),
  date_started date not null,
  date_resolved date,
  affected_movement_patterns text[] not null default '{}',
  affects_running boolean not null default false,
  running_volume_reduction_pct int default 0 check (running_volume_reduction_pct between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index idx_planned_sessions_week on planned_sessions(weekly_plan_id);
create index idx_planned_sessions_date on planned_sessions(user_id, session_date);
create index idx_logged_sessions_date on logged_sessions(user_id, session_date);
create index idx_injuries_status on injuries(user_id, status);
create index idx_phases_macrocycle on phases(macrocycle_id, sequence_order);
