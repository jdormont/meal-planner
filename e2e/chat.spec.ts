import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test('AI chat suggests a recipe and saves it to the recipe list', async ({ page }) => {
  await page.goto('/chat');

  const input = page.getByPlaceholder('Ask me for recipe ideas, cooking tips, or substitutions...');
  await input.fill('suggest a simple pasta recipe');
  await input.locator('xpath=following-sibling::button[1]').click();

  const suggestionCard = page.locator('.group').filter({ has: page.getByTitle('Save Recipe') }).first();
  await expect(suggestionCard).toBeVisible({ timeout: 60_000 });

  const recipeTitle = (await suggestionCard.locator('h3').first().textContent())?.trim();
  expect(recipeTitle).toBeTruthy();

  await suggestionCard.getByTitle('Save Recipe').click();

  // Saving navigates to a pre-filled "new recipe" form; submit it to add to the list.
  await expect(page).toHaveURL(/\/recipes\/new/);
  await page.getByRole('button', { name: /Save Recipe|Generating image/ }).click();

  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: recipeTitle! })).toBeVisible({ timeout: 30_000 });

  // Clean up the recipe created from this AI suggestion.
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  await supabase.auth.signInWithPassword({
    email: process.env.E2E_TEST_EMAIL!,
    password: process.env.E2E_TEST_PASSWORD!,
  });
  await supabase.from('recipes').delete().eq('title', recipeTitle!);
  await supabase.auth.signOut();
});
