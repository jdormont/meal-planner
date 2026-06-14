import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

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

  await page.context().storageState({ path: authFile });
});
