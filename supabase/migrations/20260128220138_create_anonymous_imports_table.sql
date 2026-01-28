create table if not exists anonymous_imports (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table anonymous_imports enable row level security;

-- No policies needed: default deny means only service_role (Edge Function) can access.
-- We do NOT want anon users to be able to read/write this table directly from the browser.
