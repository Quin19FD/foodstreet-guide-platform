import { expect, test } from "@playwright/test";

test.describe("Payment Checkout", () => {
  test("should display order summary", async ({ page }) => {
    await page.goto("/order/checkout");
    await expect(page.locator(".order-summary")).toBeVisible();
  });

  test("should show payment method options", async ({ page }) => {
    await page.goto("/order/checkout");
    await expect(page.locator('input[name="payment-method"]')).toHaveCount(3);
  });

  test("should generate VietQR code", async ({ page }) => {
    await page.goto("/order/checkout");
    await page.click('button:has-text("VietQR")');
    await expect(page.locator(".qr-code")).toBeVisible();
  });
});
