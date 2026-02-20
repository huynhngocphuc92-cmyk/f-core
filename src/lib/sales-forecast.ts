type ForecastGranularity = "month" | "quarter";

export type SalesForecastDeal = {
  amount: number | null;
  probability: number | null;
  closeDate: Date | null;
  closedReason: string | null;
  closedAt: Date | null;
  stageProbability?: number | null;
};

export type ForecastPoint = {
  key: string;
  startDate: string;
  endDate: string;
  pipelineAmount: number;
  weightedForecast: number;
  trendBaseline: number;
  forecast: number;
  confidenceLow: number;
  confidenceHigh: number;
};

export type SalesForecastResult = {
  generatedAt: string;
  summary: {
    openDealAmount: number;
    weightedPipeline: number;
    trendGrowthPct: number;
    confidencePct: number;
  };
  monthly: ForecastPoint[];
  quarterly: ForecastPoint[];
};

type Period = {
  key: string;
  start: Date;
  end: Date;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfQuarter(date: Date) {
  const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

function addMonths(date: Date, count: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function addQuarters(date: Date, count: number) {
  return addMonths(date, count * 3);
}

function periodKey(date: Date, granularity: ForecastGranularity) {
  if (granularity === "month") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${quarter}`;
}

function inPeriod(date: Date, period: Period) {
  return date.getTime() >= period.start.getTime() && date.getTime() < period.end.getTime();
}

function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function buildFuturePeriods(now: Date, granularity: ForecastGranularity, count: number): Period[] {
  const start = granularity === "month" ? startOfMonth(now) : startOfQuarter(now);
  const periods: Period[] = [];

  for (let i = 0; i < count; i += 1) {
    const periodStart =
      granularity === "month" ? addMonths(start, i) : addQuarters(start, i);
    const periodEnd =
      granularity === "month" ? addMonths(periodStart, 1) : addQuarters(periodStart, 1);
    periods.push({
      key: periodKey(periodStart, granularity),
      start: periodStart,
      end: periodEnd,
    });
  }

  return periods;
}

function buildHistoricalWonSeries(
  deals: SalesForecastDeal[],
  now: Date,
  granularity: ForecastGranularity,
  lookbackCount: number
) {
  const currentStart = granularity === "month" ? startOfMonth(now) : startOfQuarter(now);
  const starts: Date[] = [];

  for (let i = lookbackCount; i > 0; i -= 1) {
    starts.push(granularity === "month" ? addMonths(currentStart, -i) : addQuarters(currentStart, -i));
  }

  const totals = starts.map((start) => {
    const end = granularity === "month" ? addMonths(start, 1) : addQuarters(start, 1);
    return deals
      .filter((deal) => deal.closedReason === "won" && deal.closedAt && inPeriod(deal.closedAt, { key: "", start, end }))
      .reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  });

  return totals;
}

function calculateTrendGrowth(values: number[]) {
  if (values.length < 6) return 0;
  const midpoint = Math.floor(values.length / 2);
  const older = values.slice(0, midpoint);
  const recent = values.slice(midpoint);
  const olderAvg = older.reduce((sum, value) => sum + value, 0) / older.length;
  const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  if (olderAvg <= 0) return recentAvg > 0 ? 0.15 : 0;
  return clamp((recentAvg - olderAvg) / olderAvg, -0.35, 0.6);
}

function buildForecastSeries(args: {
  deals: SalesForecastDeal[];
  now: Date;
  granularity: ForecastGranularity;
  horizon: number;
  lookback: number;
}) {
  const periods = buildFuturePeriods(args.now, args.granularity, args.horizon);
  const wonHistory = buildHistoricalWonSeries(args.deals, args.now, args.granularity, args.lookback);
  const trendGrowth = calculateTrendGrowth(wonHistory);
  const wonMean =
    wonHistory.length > 0
      ? wonHistory.reduce((sum, value) => sum + value, 0) / wonHistory.length
      : 0;
  const volatility = wonMean > 0 ? stdDev(wonHistory) / wonMean : 0.3;
  const confidencePct = round(clamp(90 - volatility * 60, 55, 92), 1);
  const bandWidth = clamp(0.15 + volatility * 0.5, 0.12, 0.45);

  const points: ForecastPoint[] = periods.map((period, index) => {
    const periodDeals = args.deals.filter(
      (deal) => deal.closeDate && deal.closedReason !== "won" && deal.closedReason !== "lost" && inPeriod(deal.closeDate, period)
    );
    const pipelineAmount = periodDeals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
    const weightedForecast = periodDeals.reduce((sum, deal) => {
      const probabilityPct = clamp(
        Number(deal.probability ?? deal.stageProbability ?? 50),
        0,
        100
      );
      return sum + Number(deal.amount || 0) * (probabilityPct / 100);
    }, 0);

    const trendBaseline = wonMean * (1 + trendGrowth * Math.min(index + 1, 4));
    const forecast = weightedForecast > 0 ? weightedForecast * 0.7 + trendBaseline * 0.3 : trendBaseline;

    return {
      key: period.key,
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
      pipelineAmount: round(pipelineAmount),
      weightedForecast: round(weightedForecast),
      trendBaseline: round(trendBaseline),
      forecast: round(forecast),
      confidenceLow: round(forecast * (1 - bandWidth)),
      confidenceHigh: round(forecast * (1 + bandWidth)),
    };
  });

  return {
    points,
    trendGrowthPct: round(trendGrowth * 100, 1),
    confidencePct,
  };
}

export function buildSalesForecast(args: {
  deals: SalesForecastDeal[];
  now?: Date;
}): SalesForecastResult {
  const now = args.now ?? new Date();
  const deals = args.deals;
  const openDeals = deals.filter((deal) => deal.closedReason !== "won" && deal.closedReason !== "lost");

  const openDealAmount = openDeals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, deal) => {
    const probabilityPct = clamp(Number(deal.probability ?? deal.stageProbability ?? 50), 0, 100);
    return sum + Number(deal.amount || 0) * (probabilityPct / 100);
  }, 0);

  const monthly = buildForecastSeries({
    deals,
    now,
    granularity: "month",
    horizon: 6,
    lookback: 6,
  });
  const quarterly = buildForecastSeries({
    deals,
    now,
    granularity: "quarter",
    horizon: 4,
    lookback: 8,
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      openDealAmount: round(openDealAmount),
      weightedPipeline: round(weightedPipeline),
      trendGrowthPct: monthly.trendGrowthPct,
      confidencePct: monthly.confidencePct,
    },
    monthly: monthly.points,
    quarterly: quarterly.points,
  };
}
