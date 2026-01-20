alter table chat_messages
add column if not exists suggestions jsonb default '[]'::jsonb,
add column if not exists cuisine_metadata jsonb default '{}'::jsonb;
