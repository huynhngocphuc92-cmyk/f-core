import { z } from "zod";

export const seoRecommendationInputSchema = z.object({
  title: z.string().default(""),
  slug: z.string().default(""),
  content: z.string().default(""),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keyword: z.string().optional().nullable(),
});

type SeoCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function toWords(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildSeoRecommendation(input: z.infer<typeof seoRecommendationInputSchema>) {
  const payload = seoRecommendationInputSchema.parse(input);
  const contentText = stripHtml(payload.content);
  const words = toWords(contentText);
  const wordCount = words.length;
  const keyword = (payload.keyword || "").trim().toLowerCase();
  const title = payload.title.trim();
  const metaTitle = (payload.metaTitle || title).trim();
  const metaDescription = (payload.metaDescription || "").trim();
  const slug = payload.slug.trim().toLowerCase();

  const keywordOccurrences = keyword
    ? words.filter((word) => word === keyword || word.includes(keyword)).length
    : 0;
  const keywordDensityPct = wordCount ? round2((keywordOccurrences / wordCount) * 100) : 0;

  const checks: SeoCheck[] = [
    {
      id: "title-length",
      label: "Title length 30-60 chars",
      passed: title.length >= 30 && title.length <= 60,
      detail: `Current: ${title.length} chars`,
      weight: 15,
    },
    {
      id: "meta-title-length",
      label: "Meta title length 30-60 chars",
      passed: metaTitle.length >= 30 && metaTitle.length <= 60,
      detail: `Current: ${metaTitle.length} chars`,
      weight: 10,
    },
    {
      id: "meta-description-length",
      label: "Meta description length 120-160 chars",
      passed: metaDescription.length >= 120 && metaDescription.length <= 160,
      detail: `Current: ${metaDescription.length} chars`,
      weight: 15,
    },
    {
      id: "content-length",
      label: "Content length at least 300 words",
      passed: wordCount >= 300,
      detail: `Current: ${wordCount} words`,
      weight: 20,
    },
    {
      id: "has-headings",
      label: "Uses headings (H1/H2/H3 or markdown headings)",
      passed: /<h[1-3]\b/i.test(payload.content) || /^#{1,3}\s+/m.test(payload.content),
      detail: "Add structured section headings for scanability",
      weight: 10,
    },
    {
      id: "has-internal-links",
      label: "Contains internal links",
      passed: /href=["']\/[^"']+["']/i.test(payload.content),
      detail: "Link to related internal resources",
      weight: 10,
    },
  ];

  if (keyword) {
    checks.push(
      {
        id: "keyword-title",
        label: "Keyword appears in title",
        passed: title.toLowerCase().includes(keyword),
        detail: keyword,
        weight: 10,
      },
      {
        id: "keyword-slug",
        label: "Keyword appears in slug",
        passed: slug.includes(keyword),
        detail: slug || "no-slug",
        weight: 5,
      },
      {
        id: "keyword-density",
        label: "Keyword density between 0.5% and 2.5%",
        passed: keywordDensityPct >= 0.5 && keywordDensityPct <= 2.5,
        detail: `Current: ${keywordDensityPct}%`,
        weight: 5,
      }
    );
  }

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const passedWeight = checks.filter((check) => check.passed).reduce((sum, check) => sum + check.weight, 0);
  const score = totalWeight ? Math.round((passedWeight / totalWeight) * 100) : 0;

  const suggestions = checks
    .filter((check) => !check.passed)
    .map((check) => check.label)
    .slice(0, 8);

  const grade = score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs_work" : "poor";

  return {
    score,
    grade,
    checks,
    suggestions,
    metrics: {
      wordCount,
      keywordDensityPct,
      keywordOccurrences,
      titleLength: title.length,
      metaDescriptionLength: metaDescription.length,
    },
  };
}
