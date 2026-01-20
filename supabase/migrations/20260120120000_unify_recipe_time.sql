-- Drop the generated column if it exists
alter table recipes drop column if exists total_time;

-- Add the new column
alter table recipes add column total_time integer default 0;

-- Migrate existing data
update recipes set total_time = coalesce(prep_time_minutes, 0) + coalesce(cook_time_minutes, 0);

-- Drop old columns
alter table recipes drop column prep_time_minutes;
alter table recipes drop column cook_time_minutes;
