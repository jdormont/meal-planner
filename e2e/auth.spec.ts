import { test, expect } from '@playwright/test';

test('logged-in user is redirected to the recipes view', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/recipes/);
  await expect(page.getByRole('button', { name: 'My Recipes' })).toHaveClass(/bg-terracotta-500/);
});

// This test runs in an unauthenticated context (no storageState) so it can exercise
// the sign-in form and, when configured, a second account stuck in PENDING status.
test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('pending user sees the account approval gate', async ({ page }) => {
    const pendingEmail = process.env.E2E_PENDING_EMAIL;
    const pendingPassword = process.env.E2E_PENDING_PASSWORD;

    test.skip(
      !pendingEmail || !pendingPassword,
      'E2E_PENDING_EMAIL / E2E_PENDING_PASSWORD not configured'
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();

    const form = page.locator('form');
    await form.getByLabel('Email').fill(pendingEmail!);
    await form.getByLabel('Password').fill(pendingPassword!);
    await form.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('heading', { name: /Account Under Review|Account Not Approved/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: 'My Recipes' })).not.toBeVisible();
  });
});
