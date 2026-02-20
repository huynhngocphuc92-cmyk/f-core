import { test, expect } from "@playwright/test";

test.describe("Quotes CPQ experience", () => {
  test("quotes list and CPQ detail surface render without runtime errors", async ({
    page,
  }) => {
    const listResponse = await page.goto("/quotes");
    expect(listResponse?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/quotes$/);
    await expect(page.getByRole("heading", { name: "Quotes" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const quoteLinks = page.locator("tbody a[href^='/quotes/']");
    const quoteCount = await quoteLinks.count();

    if (quoteCount === 0) {
      await expect(page.getByText("No quotes found")).toBeVisible();
      return;
    }

    await quoteLinks.first().click();
    await expect(page).toHaveURL(/\/quotes\/[^/]+$/);
    await expect(page.getByText("CPQ Controls")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Request Approval" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark E-sign Sent" })
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
