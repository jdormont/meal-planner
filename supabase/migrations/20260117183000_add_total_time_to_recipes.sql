alter table recipes add column total_time int generated always as (prep_time_minutes + cook_time_minutes) stored;
