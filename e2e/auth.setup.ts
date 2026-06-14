import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test as setup } from './fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
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

  // Mark onboarding as seen so the wizard modal doesn't cover the app and
  // intercept clicks in the other specs.
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
      await supabase.from('user_profiles').update({ has_seen_onboarding: true }).eq('id', data.user.id);
    }
    await supabase.auth.signOut();
  }

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'My Recipes' })).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
