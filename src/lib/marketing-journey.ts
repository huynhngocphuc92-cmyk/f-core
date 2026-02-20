import { normalizeMarketingChannel } from "@/lib/marketing-attribution";

export type JourneyTouchpoint = {
  entityKey: string;
  channel: string;
  occurredAt: string;
};

export type JourneyConversion = {
  id: string;
  entityKeys: string[];
  revenue: number;
  convertedAt: string;
};

type JourneyStep = {
  channel: string;
  occurredAt: string;
  lagHours: number;
};

type JourneyPath = {
  path: string;
  count: number;
};

type CustomerJourney = {
  conversionId: string;
  revenue: number;
  convertedAt: string;
  totalTouchpoints: number;
  timeToConvertHours: number;
  path: string;
  steps: JourneyStep[];
};

export type JourneyReport = {
  totals: {
    journeys: number;
    conversions: number;
    avgTouchpoints: number;
    avgTimeToConvertHours: number;
    attributedRevenue: number;
  };
  topPaths: JourneyPath[];
  journeys: CustomerJourney[];
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function pickEligibleTouchpoints(
  touchpoints: JourneyTouchpoint[],
  conversion: JourneyConversion
) {
  const keys = new Set(conversion.entityKeys);
  return touchpoints
    .filter(
      (touchpoint) =>
        keys.has(touchpoint.entityKey) && touchpoint.occurredAt <= conversion.convertedAt
    )
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function buildJourneyReport(
  touchpoints: JourneyTouchpoint[],
  conversions: JourneyConversion[],
  limit = 20
): JourneyReport {
  const sanitizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(5, Math.floor(limit))) : 20;
  const paths = new Map<string, number>();
  const journeys: CustomerJourney[] = [];
  let revenue = 0;
  let touchpointSum = 0;
  let timeToConvertSum = 0;

  for (const conversion of conversions) {
    const eligible = pickEligibleTouchpoints(touchpoints, conversion);
    if (eligible.length === 0) continue;

    const firstTouchAt = new Date(eligible[0].occurredAt).getTime();
    const convertedAt = new Date(conversion.convertedAt).getTime();
    const timeToConvertHours = round2(Math.max(0, (convertedAt - firstTouchAt) / (1000 * 60 * 60)));
    const path = eligible.map((touchpoint) => normalizeMarketingChannel(touchpoint.channel)).join(" -> ");

    const steps: JourneyStep[] = eligible.map((touchpoint) => ({
      channel: normalizeMarketingChannel(touchpoint.channel),
      occurredAt: touchpoint.occurredAt,
      lagHours: round2(
        Math.max(0, (new Date(touchpoint.occurredAt).getTime() - firstTouchAt) / (1000 * 60 * 60))
      ),
    }));

    journeys.push({
      conversionId: conversion.id,
      revenue: conversion.revenue,
      convertedAt: conversion.convertedAt,
      totalTouchpoints: eligible.length,
      timeToConvertHours,
      path,
      steps,
    });

    touchpointSum += eligible.length;
    timeToConvertSum += timeToConvertHours;
    revenue += conversion.revenue;
    paths.set(path, (paths.get(path) || 0) + 1);
  }

  const topPaths = [...paths.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .slice(0, 5);

  const sortedJourneys = journeys
    .sort((a, b) => b.convertedAt.localeCompare(a.convertedAt))
    .slice(0, sanitizedLimit);

  return {
    totals: {
      journeys: journeys.length,
      conversions: conversions.length,
      avgTouchpoints: journeys.length ? round2(touchpointSum / journeys.length) : 0,
      avgTimeToConvertHours: journeys.length ? round2(timeToConvertSum / journeys.length) : 0,
      attributedRevenue: round2(revenue),
    },
    topPaths,
    journeys: sortedJourneys,
  };
}
