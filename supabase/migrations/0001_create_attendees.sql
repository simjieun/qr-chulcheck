create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  name text not null,
  team text not null,
  email text not null,
  qr_token uuid not null,
  qr_code_url text,
  qr_code_storage_path text,
  email_sent_at timestamptz,
  check_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendees_email_idx on public.attendees (email);
create index if not exists attendees_team_idx on public.attendees (team);

create or replace function public.attendees_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_attendees_updated_at
  before update on public.attendees
  for each row execute function public.attendees_set_updated_at();
