import { beforeEach, describe, expect, it } from "vitest";
import {
  buildStructuredSections,
  createReusableBlock,
  getPageTemplate,
  listPageTemplates,
  listReusableBlocks,
  resetContentPageBuilderStoreForTests,
} from "@/lib/content-page-builder";

const TENANT_ID = "tenant-test-id";

describe("content page builder", () => {
  beforeEach(async () => {
    await resetContentPageBuilderStoreForTests();
  });

  it("lists predefined templates", () => {
    const templates = listPageTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("creates reusable blocks and filters by section type", async () => {
    await createReusableBlock(TENANT_ID, "user-1", {
      name: "Hero block",
      sectionType: "hero",
      headline: "Headline",
      body: "Body",
    });

    await createReusableBlock(TENANT_ID, "user-1", {
      name: "CTA block",
      sectionType: "cta",
      headline: "CTA",
      body: "Action",
    });

    const heroBlocks = await listReusableBlocks(TENANT_ID, { sectionType: "hero" });
    expect(heroBlocks).toHaveLength(1);
    expect(heroBlocks[0].sectionType).toBe("hero");
  });

  it("builds structured sections from template and selected blocks", async () => {
    const template = getPageTemplate("product_launch");
    expect(template).toBeTruthy();

    const hero = await createReusableBlock(TENANT_ID, "user-1", {
      name: "Hero",
      sectionType: "hero",
      headline: "Launch faster",
      body: "One platform.",
    });
    const benefits = await createReusableBlock(TENANT_ID, "user-1", {
      name: "Benefits",
      sectionType: "benefits",
      headline: "Why",
      body: "Benefit list",
    });
    const cta = await createReusableBlock(TENANT_ID, "user-1", {
      name: "CTA",
      sectionType: "cta",
      headline: "Start now",
      body: "Book demo",
    });

    const sections = buildStructuredSections({
      template: template!,
      selectedBlocks: [hero, benefits, cta],
    });

    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections[0].type).toBe("hero");
  });
});
