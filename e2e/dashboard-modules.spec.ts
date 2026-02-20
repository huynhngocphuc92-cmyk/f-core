import { test, expect } from "@playwright/test";

const dashboardRoutes = [
  "/dashboard",
  "/contacts",
  "/companies",
  "/deals",
  "/sales/forecast",
  "/sales/playbooks",
  "/sales/documents",
  "/sales/calls",
  "/sales/coaching",
  "/commerce/payments",
  "/commerce/invoices",
  "/commerce/subscriptions",
  "/commerce/dunning",
  "/commerce/revenue",
  "/marketing/ads",
  "/marketing/social",
  "/marketing/attribution",
  "/marketing/journey",
  "/marketing/experiments",
  "/marketing/analytics",
  "/content/blog",
  "/content/seo",
  "/content/approvals",
  "/content/remix",
  "/content/performance",
  "/content/pages",
  "/data/sync",
  "/data/mappings",
  "/data/quality",
  "/data/lineage",
  "/qa/performance",
  "/qa/frontend-performance",
  "/qa/release-readiness",
  "/quotes",
  "/tickets",
  "/service/inbox",
  "/service/sla",
  "/service/routing",
  "/service/surveys",
  "/service/analytics",
  "/workflows",
  "/workflows/runtime",
  "/settings",
  "/settings/properties",
  "/settings/webhooks",
  "/settings/sso",
  "/settings/policies",
  "/ai-assistant/orchestration",
  "/ai-assistant/prompts",
  "/ai-assistant/evals",
  "/ai-assistant/agents/sales",
  "/ai-assistant/agents/service",
  "/ai-assistant/agents/knowledge",
  "/ai-assistant/agents/prospecting",
];

test.describe("Dashboard module routes", () => {
  for (const route of dashboardRoutes) {
    test(`loads ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }
});
