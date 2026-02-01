import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText("required")).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.click('a[href*="register"]');
    await expect(page).toHaveURL(/.*register/);
  });
});
