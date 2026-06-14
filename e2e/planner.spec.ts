import { test, expect } from '@playwright/test';
import { E2E_RECIPE_TITLE, cleanupTestRecipes, createTestRecipe } from './fixtures';

test.describe('planner', () => {
  test.afterAll(async () => {
    await cleanupTestRecipes();
  });

  test('adding a recipe to today\'s dinner shows it on the calendar', async ({ page }) => {
    await createTestRecipe(page, E2E_RECIPE_TITLE);

    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/planner/meals/new?date=${today}&type=dinner`);

    await page.getByRole('button', { name: 'Add Recipe' }).click();
    await page.getByPlaceholder('Search your recipes...').fill(E2E_RECIPE_TITLE);
    await page.getByRole('button', { name: new RegExp(E2E_RECIPE_TITLE.replace(/[[\]]/g, '\\$&')) }).click();

    await page.getByRole('button', { name: 'Save Meal' }).click();

    await expect(page).toHaveURL(/\/planner/);
    await expect(page.getByText(E2E_RECIPE_TITLE).first()).toBeVisible({ timeout: 30_000 });
  });
});
