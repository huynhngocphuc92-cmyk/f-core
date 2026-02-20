import { test, expect } from "@playwright/test";

test.describe("I18n language switch", () => {
  test("switches between English, Vietnamese, and German from sidebar", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const languageSelect = page.locator("aside select").first();

    await languageSelect.selectOption("vi");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" })
    ).toBeVisible();
    await expect(page.locator("aside")).toContainText("Cài đặt");

    await languageSelect.selectOption("de");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator("aside")).toContainText("Einstellungen");

    await languageSelect.selectOption("en");
    await expect(page.locator("aside")).toContainText("Settings");
  });

  test("persists selected locale after refresh", async ({ page }) => {
    await page.goto("/dashboard");

    const languageSelect = page.locator("aside select").first();
    await languageSelect.selectOption("vi");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" })
    ).toBeVisible();
    await expect(page.locator("aside")).toContainText("Cài đặt");
  });

  test("localizes key workspace pages after switching language", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const languageSelect = page.locator("aside select").first();
    await languageSelect.selectOption("vi");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" })
    ).toBeVisible();
    await expect(page.locator("aside")).toContainText("Cài đặt");

    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Liên hệ" })).toBeVisible();

    await page.goto("/companies");
    await expect(page.getByRole("heading", { name: "Công ty" })).toBeVisible();

    await page.goto("/sales/forecast");
    await expect(
      page.getByRole("heading", { name: "Dự báo bán hàng" })
    ).toBeVisible();

    await page.goto("/service/inbox");
    await expect(
      page.getByRole("heading", { name: "Hộp thư dịch vụ" })
    ).toBeVisible();

    await page.goto("/marketing/analytics");
    await expect(
      page.getByRole("heading", { name: "Không gian phân tích marketing" })
    ).toBeVisible();

    await page.goto("/content/blog");
    await expect(page.getByRole("heading", { name: "Quản lý blog" })).toBeVisible();

    await page.goto("/data/sync");
    await expect(
      page.getByRole("heading", { name: "Khung đồng bộ dữ liệu" })
    ).toBeVisible();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Bảng điều khiển" })
    ).toBeVisible();

    await languageSelect.selectOption("de");
    await expect(page.locator("aside")).toContainText("Einstellungen");
    await page.getByRole("link", { name: "Kontakte" }).first().click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByRole("heading", { name: "Kontakte" })).toBeVisible();
  });
});
