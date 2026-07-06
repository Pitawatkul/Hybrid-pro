-- Row Level Security — single-user app reachable at a public URL, so this is
-- the real access-control layer (auth is just the login gate).

alter table macrocycles enable row level security;
alter table phases enable row level security;
alter table weekly_plans enable row level security;
alter table planned_sessions enable row level security;
alter table logged_sessions enable row level security;
alter table injuries enable row level security;

create policy "own rows only" on macrocycles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on weekly_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on planned_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on logged_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on injuries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "phases via macrocycle owner" on phases for all
  using (exists (select 1 from macrocycles m where m.id = phases.macrocycle_id and m.user_id = auth.uid()))
  with check (exists (select 1 from macrocycles m where m.id = phases.macrocycle_id and m.user_id = auth.uid()));

-- exercises: public reference data, readable by any authenticated user, no user_id column
alter table exercises enable row level security;
create policy "readable by any authenticated user" on exercises for select using (auth.role() = 'authenticated');
