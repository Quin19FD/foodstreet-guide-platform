import { test as base } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Awaited<ReturnType<typeof login>>;
};

async function login(page: Awaited<ReturnType<(typeof base)["page"]>>) {
  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
  return page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
