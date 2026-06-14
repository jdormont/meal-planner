import { Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export const E2E_RECIPE_TITLE = '[E2E] Test Recipe';

/**
 * Logs in as the dedicated E2E test user via the UI.
 * Requires E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars.
 * The "chromium" project normally starts already authenticated via storageState,
 * so this is only needed for flows that require a fresh/unauthenticated context.
 */
export async function loginAsTestUser(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set to run the E2E suite.');
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).first().click();

  const form = page.locator('form');
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password').fill(password);
  await form.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('button', { name: 'My Recipes' })).toBeVisible({ timeout: 30_000 });
}

/**
 * Creates a recipe via the UI by navigating to the "new recipe" form and saving
 * with only a title. Returns once the recipe list shows the new recipe.
 */
export async function createTestRecipe(page: Page, title: string = E2E_RECIPE_TITLE) {
  await page.goto('/recipes/new');
  await page.getByPlaceholder('Delicious Pasta Carbonara').fill(title);
  await page.getByRole('button', { name: /Save Recipe|Generating image/ }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 30_000 });
}

/**
 * Deletes any recipes belonging to the E2E test user whose title starts with "[E2E]".
 * Authenticates a standalone Supabase client as the test user (RLS scopes deletes to
 * their own rows) and removes leftover test data so the suite is idempotent.
 */
export async function cleanupTestRecipes() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !email || !password) {
    throw new Error(
      'VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set to clean up E2E test data.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error(`Failed to sign in for cleanup: ${signInError.message}`);
  }

  const { error: deleteError } = await supabase.from('recipes').delete().like('title', '[E2E]%');
  if (deleteError) {
    throw new Error(`Failed to clean up E2E test recipes: ${deleteError.message}`);
  }

  await supabase.auth.signOut();
}
