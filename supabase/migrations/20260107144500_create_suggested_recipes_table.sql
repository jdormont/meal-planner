create table if not exists suggested_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table suggested_recipes enable row level security;

create policy "Users can view their own suggested recipes"
  on suggested_recipes for select
  using (auth.uid() = user_id);

-- Service role can do everything (edge functions use service role sometimes, but usually anon/service)
-- We'll allow insert for authenticated users too, as the edge function runs with the user's auth context? 
-- Actually, the edge function will likely use the service role key for admin tasks, or we can just allow insert for the user if we call it with their token.
-- The plan says "Edge function runs with user's session token". So we need INSERT policy for the user.
create policy "Users can insert their own suggested recipes"
  on suggested_recipes for insert
  with check (auth.uid() = user_id);

-- Create an index on user_id and created_at for fast filtering
create index suggested_recipes_user_id_created_at_idx on suggested_recipes (user_id, created_at desc);
