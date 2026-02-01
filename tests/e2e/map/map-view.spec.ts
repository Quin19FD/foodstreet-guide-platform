import { expect, test } from "@playwright/test";

test.describe("Map View", () => {
  test("should display map component", async ({ page }) => {
    await page.goto("/map");
    await expect(page.locator(".map-container")).toBeVisible();
  });

  test("should show POI markers", async ({ page }) => {
    await page.goto("/map");
    await expect(page.locator(".poi-marker")).toHaveCount(3);
  });

  test("should open POI detail on marker click", async ({ page }) => {
    await page.goto("/map");
    await page.click(".poi-marker:first-child");
    await expect(page.locator(".poi-detail")).toBeVisible();
  });
});
