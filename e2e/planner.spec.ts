import { cleanupTestRecipes, createTestRecipe, expect, test } from './fixtures';

const PLANNER_RECIPE_TITLE = '[E2E] Planner Recipe';

test.describe('planner', () => {
  test.afterAll(async () => {
    await cleanupTestRecipes();
  });

  test('adding a recipe to today\'s dinner shows it on the calendar', async ({ page }) => {
    await createTestRecipe(page, PLANNER_RECIPE_TITLE);

    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/planner/meals/new?date=${today}&type=dinner`);

    await page.getByRole('button', { name: 'Add Recipe' }).click();
    await page.getByPlaceholder('Search your recipes...').fill(PLANNER_RECIPE_TITLE);
    await page.getByRole('button', { name: new RegExp(PLANNER_RECIPE_TITLE.replace(/[[\]]/g, '\\$&')) }).click();

    await page.getByRole('button', { name: 'Save Meal' }).click();

    await expect(page).toHaveURL(/\/planner/);
    await expect(page.getByText(PLANNER_RECIPE_TITLE).first()).toBeVisible({ timeout: 30_000 });
  });
});
