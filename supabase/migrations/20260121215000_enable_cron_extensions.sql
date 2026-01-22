/*
  # Enable Cron and Net Extensions
  
  Required for the weekly planner scheduling.
*/

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
