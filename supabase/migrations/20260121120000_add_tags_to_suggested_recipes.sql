-- Add structured feature columns to suggested_recipes table
alter table suggested_recipes 
add column if not exists protein text,
add column if not exists carb text,
add column if not exists method text;

comment on column suggested_recipes.protein is 'Primary protein source (e.g. chicken, beef, tofu)';
comment on column suggested_recipes.carb is 'Primary carbohydrate base (e.g. pasta, rice, potato)';
comment on column suggested_recipes.method is 'Primary cooking method (e.g. roast, fry, stew)';
