import { E2E_RECIPE_TITLE, cleanupTestRecipes, createTestRecipe, expect, test } from './fixtures';

test.describe('recipe CRUD', () => {
  test.afterAll(async () => {
    await cleanupTestRecipes();
  });

  test('creating and deleting a recipe', async ({ page }) => {
    await createTestRecipe(page, E2E_RECIPE_TITLE);

    await page.goto('/recipes');
    // The dashboard view shows the recipe in a featured carousel and/or lanes,
    // where the title heading isn't unique. Switch to the full grid view, which
    // has one card per recipe with a Delete Recipe button.
    await page.getByRole('button', { name: 'Browse Full Library' }).click();
    const card = page.locator('.group', { has: page.getByRole('heading', { name: E2E_RECIPE_TITLE }) });
    await expect(card).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await card.getByTitle('Delete Recipe').click();

    await expect(page.getByRole('heading', { name: E2E_RECIPE_TITLE })).toHaveCount(0, { timeout: 10_000 });
  });
});
