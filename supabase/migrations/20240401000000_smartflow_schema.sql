-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'crew', 'citizen')),
  zone text, -- e.g., 'Zone-1', 'Zone-2'
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REPORTS (citizen submissions)
create table reports (
  id uuid default uuid_generate_v4() primary key,
  citizen_id uuid references profiles(id) on delete cascade,
  description text not null,
  location jsonb not null, -- { "lat": 17.385, "lng": 78.486, "address": "..." }
  zone text default 'Zone-1', -- added to map reports to crew zones
  image_url text, -- Supabase Storage path
  status text default 'pending' check (status in ('pending','assigned','resolved','rejected')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  assigned_to uuid references profiles(id), -- crew member
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ALERTS (from ESP32 simulation)
create table alerts (
  id uuid default uuid_generate_v4() primary key,
  node_id text not null,
  water_level float,
  gas_level float,
  flow_rate float,
  alert_type text check (alert_type in ('overflow','gas','blockage','maintenance')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  status text default 'active' check (status in ('active','acknowledged','resolved','false_alarm')),
  zone text not null, -- for crew routing
  acknowledged_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- NOTIFICATIONS (real-time feed)
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  message text not null,
  alert_id uuid references alerts(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  priority text default 'medium',
  read boolean default false,
  created_at timestamptz default now()
);

-- NODES (sensor metadata)
create table nodes (
  id text primary key, -- e.g., 'NODE_HYD_01'
  name text not null,
  location jsonb not null, -- { lat, lng }
  zone text not null,
  status text default 'online' check (status in ('online','offline','maintenance')),
  last_seen timestamptz default now()
);

-- INDEXES for performance
create index idx_reports_status on reports(status, created_at desc);
create index idx_reports_citizen on reports(citizen_id);
create index idx_alerts_zone_priority on alerts(zone, priority, created_at desc);
create index idx_alerts_status on alerts(status) where status = 'active';
create index idx_notifications_user on notifications(user_id, read, created_at desc);
create index idx_profiles_role_zone on profiles(role, zone) where role = 'crew';

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table profiles enable row level security;
alter table reports enable row level security;
alter table alerts enable row level security;
alter table notifications enable row level security;

-- Profiles: Users can read own profile; admin/crew can read crew profiles in their zone
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Crew can read crew in same zone" on profiles for select 
  using (role = 'crew' AND zone = (select zone from profiles where id = auth.uid()));

-- Reports: Citizens can CRUD own; crew can read pending in zone; admin can all
create policy "Citizens manage own reports" on reports for all using (citizen_id = auth.uid());
create policy "Crew view pending reports in zone" on reports for select 
  using (status = 'pending' AND 
         exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'crew' and p.zone = reports.zone));
create policy "Admin full access reports" on reports for all 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Alerts: Crew can view active in zone; admin all; citizens none
create policy "Crew view alerts in zone" on alerts for select 
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'crew' and p.zone = alerts.zone));
create policy "Admin full access alerts" on alerts for all 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Notifications: Users can only access their own
create policy "Users manage own notifications" on notifications for all using (user_id = auth.uid());
