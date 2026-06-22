-- RPC that searches shared (community) recipes by title, description, OR ingredient name
-- across the full shared-recipe set. Sibling of search_recipes_by_ingredient, scoped to
-- is_shared = true instead of a single user_id, so Community tab search/tag/time filters
-- aren't limited to whatever infinite-scroll pages have already been fetched.
create or replace function search_shared_recipes_by_ingredient(
  search_term text,
  p_recipe_type text,
  p_tags text[] default '{}',
  p_time_filter text default '',
  p_limit int default 12,
  p_offset int default 0
)
returns setof recipes
language sql
stable
security definer
set search_path = public
as $$
  select *
  from recipes
  where is_shared = true
    and recipe_type = p_recipe_type
    and (
      title ilike '%' || search_term || '%'
      or description ilike '%' || search_term || '%'
      or exists (
        select 1
        from jsonb_array_elements(ingredients) as ing
        where (ing->>'name') ilike '%' || search_term || '%'
      )
    )
    and (array_length(p_tags, 1) is null or tags @> p_tags)
    and (
      p_time_filter = '' or
      (p_time_filter = 'quick' and total_time <= 30) or
      (p_time_filter = 'medium' and total_time > 30 and total_time <= 45) or
      (p_time_filter = 'hour' and total_time > 45 and total_time <= 90) or
      (p_time_filter = 'project' and total_time > 90)
    )
  order by created_at desc
  limit p_limit
  offset p_offset;
$$;

grant execute on function search_shared_recipes_by_ingredient(text, text, text[], text, int, int)
  to authenticated;
