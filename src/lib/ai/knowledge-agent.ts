import { z } from "zod";

export const knowledgeAgentRequestSchema = z.object({
  query: z.string().min(3).max(2000),
  maxCitations: z.number().int().min(1).max(8).default(4),
});

export type KnowledgeAgentArticleInput = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string | null;
  tags: string[];
  category: { name: string; slug: string } | null;
  viewCount: number;
  helpfulCount: number;
  publishedAt: Date | null;
};

export type KnowledgeAgentCitation = {
  articleId: string;
  title: string;
  slug: string;
  relevance: number;
  snippet: string;
};

export type KnowledgeAgentResponse = {
  generatedAt: string;
  query: string;
  confidence: number;
  answer: string;
  citations: KnowledgeAgentCitation[];
  safety: {
    grounded: boolean;
    hasSufficientContext: boolean;
    missingTopics: string[];
  };
};

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(" ")
    .filter((part) => part.length >= 2);
}

function clip(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
}

function computeRelevance(queryTerms: string[], article: KnowledgeAgentArticleInput) {
  const searchable = normalizeText(
    [article.title, article.excerpt || "", article.contentHtml || "", article.tags.join(" "), article.category?.name || ""]
      .join(" ")
  );

  let matches = 0;
  for (const term of queryTerms) {
    if (searchable.includes(term)) matches += 1;
  }

  const termCoverage = queryTerms.length === 0 ? 0 : matches / queryTerms.length;
  const qualitySignal = Math.min(1, (article.helpfulCount + article.viewCount / 100) / 10);
  const score = termCoverage * 80 + qualitySignal * 20;

  return Math.round(score);
}

function buildSnippet(article: KnowledgeAgentArticleInput, queryTerms: string[]) {
  const source = article.excerpt || article.contentHtml || article.title;
  const normalized = normalizeText(source);
  const focus = queryTerms.find((term) => normalized.includes(term));

  if (!focus) return clip(source.replace(/\s+/g, " ").trim(), 180);

  const index = normalized.indexOf(focus);
  const raw = source.replace(/\s+/g, " ").trim();
  const start = Math.max(0, index - 60);
  return clip(raw.slice(start, start + 180), 180);
}

export function buildKnowledgeAgentAnswer(args: {
  query: string;
  maxCitations?: number;
  articles: KnowledgeAgentArticleInput[];
}): KnowledgeAgentResponse {
  const payload = knowledgeAgentRequestSchema.parse({
    query: args.query,
    maxCitations: args.maxCitations,
  });

  const queryTerms = tokenize(payload.query);
  const ranked = args.articles
    .map((article) => ({
      article,
      relevance: computeRelevance(queryTerms, article),
    }))
    .filter((item) => item.relevance > 15)
    .sort((a, b) => b.relevance - a.relevance);

  const citations = ranked.slice(0, payload.maxCitations).map((item) => ({
    articleId: item.article.id,
    title: item.article.title,
    slug: item.article.slug,
    relevance: item.relevance,
    snippet: buildSnippet(item.article, queryTerms),
  }));

  const hasSufficientContext = citations.length > 0;
  const grounded = citations.length >= 2 || (citations[0]?.relevance || 0) >= 70;
  const confidence = hasSufficientContext
    ? Math.max(40, Math.min(94, Math.round((citations[0]?.relevance || 0) * 0.9)))
    : 25;
  const missingTopics = queryTerms.filter(
    (term) => !citations.some((citation) => normalizeText(citation.snippet).includes(term))
  );

  const answer = hasSufficientContext
    ? `Based on the knowledge base, here are the most relevant points for "${payload.query}". Prioritize the cited articles for exact steps and policy details.`
    : `I could not find enough grounded knowledge-base context for "${payload.query}". Please refine the query or add relevant KB articles before taking action.`;

  return {
    generatedAt: new Date().toISOString(),
    query: payload.query,
    confidence,
    answer,
    citations,
    safety: {
      grounded,
      hasSufficientContext,
      missingTopics: missingTopics.slice(0, 8),
    },
  };
}
