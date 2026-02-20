import { describe, expect, it } from "vitest";
import { buildSeoRecommendation } from "@/lib/content-seo";

describe("content seo recommendation", () => {
  it("builds score and suggestions", () => {
    const report = buildSeoRecommendation({
      title: "How to optimize your landing page conversion with actionable SEO checklist",
      slug: "optimize-landing-page-seo",
      content:
        "<h1>Guide</h1><p>seo seo seo seo tips</p><a href='/blog/seo'>Read more</a>" +
        "word ".repeat(320),
      metaTitle: "Optimize Landing Page SEO for Better Conversion Results",
      metaDescription:
        "Practical on-page SEO checklist for landing pages with clear steps to improve keyword relevance, structure, and internal linking for better conversion outcomes.",
      keyword: "seo",
    });

    expect(report.score).toBeGreaterThan(0);
    expect(report.metrics.wordCount).toBeGreaterThan(300);
    expect(report.checks.length).toBeGreaterThan(5);
    expect(Array.isArray(report.suggestions)).toBe(true);
  });

  it("returns low score for thin content", () => {
    const report = buildSeoRecommendation({
      title: "Short title",
      slug: "short",
      content: "Tiny content only",
      metaDescription: "",
      keyword: "marketing",
    });

    expect(report.score).toBeLessThan(70);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});
