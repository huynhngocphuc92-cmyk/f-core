import type { ReportDefinition } from "@/lib/validations/reports";

// ============================================
// Field Whitelist - Security: Only allow known fields
// ============================================

const FIELD_WHITELIST: Record<string, Set<string>> = {
  deals: new Set(["id", "name", "amount", "currency", "closeDate", "createdAt", "updatedAt", "closedAt", "closedReason", "probability", "dealType", "priority"]),
  contacts: new Set(["id", "email", "firstName", "lastName", "phone", "lifecycleStage", "leadStatus", "jobTitle", "city", "state", "country", "createdAt", "updatedAt"]),
  companies: new Set(["id", "name", "domain", "industry", "type", "size", "annualRevenue", "city", "state", "country", "createdAt", "updatedAt"]),
  activities: new Set(["id", "type", "subject", "status", "priority", "callDuration", "callOutcome", "callDirection", "emailStatus", "createdAt", "updatedAt", "completedAt"]),
};

const TABLE_MAP: Record<string, string> = {
  deals: '"Deal"',
  contacts: '"Contact"',
  companies: '"Company"',
  activities: '"Activity"',
};

// ============================================
// Validate field access
// ============================================

function validateField(dataSource: string, field: string): boolean {
  const whitelist = FIELD_WHITELIST[dataSource];
  if (!whitelist) return false;
  return whitelist.has(field);
}

// ============================================
// Sanitize SQL alias to prevent injection
// ============================================

function sanitizeAlias(label: string): string {
  return label.replace(/[^a-zA-Z0-9_ ]/g, "").slice(0, 63);
}

// ============================================
// Build SQL Query from ReportDefinition
// ============================================

export interface QueryResult {
  sql: string;
  params: unknown[];
}

export function buildReportQuery(
  definition: ReportDefinition,
  tenantId: string
): QueryResult {
  const { dataSource, metrics, dimensions, filters, dateRange } = definition;

  const table = TABLE_MAP[dataSource];
  if (!table) throw new Error(`Invalid data source: ${dataSource}`);

  const params: unknown[] = [tenantId];
  let paramIndex = 2;

  // Build SELECT clause
  const selectParts: string[] = [];
  const groupByParts: string[] = [];

  // Add dimensions to SELECT
  for (const dim of dimensions) {
    if (!validateField(dataSource, dim.field)) {
      throw new Error(`Invalid field: ${dim.field} for ${dataSource}`);
    }

    if (dim.type === "temporal" && dim.granularity) {
      const trunc = dim.granularity === "day" ? "day" : dim.granularity === "week" ? "week" : dim.granularity === "month" ? "month" : dim.granularity === "quarter" ? "quarter" : "year";
      selectParts.push(`date_trunc('${trunc}', "${dim.field}") AS "${sanitizeAlias(dim.label || dim.field)}"`);
      groupByParts.push(`date_trunc('${trunc}', "${dim.field}")`);
    } else {
      selectParts.push(`"${dim.field}" AS "${sanitizeAlias(dim.label || dim.field)}"`);
      groupByParts.push(`"${dim.field}"`);
    }
  }

  // Add metrics to SELECT
  for (const metric of metrics) {
    if (metric.aggregate === "count" && metric.field === "*") {
      selectParts.push(`COUNT(*) AS "${sanitizeAlias(metric.label || "count")}"`);
    } else {
      if (!validateField(dataSource, metric.field)) {
        throw new Error(`Invalid field: ${metric.field} for ${dataSource}`);
      }
      const agg = metric.aggregate.toUpperCase();
      selectParts.push(`${agg}("${metric.field}") AS "${sanitizeAlias(metric.label || `${metric.aggregate}_${metric.field}`)}"`);
    }
  }

  // If no dimensions and only count, add a simple select
  if (selectParts.length === 0) {
    selectParts.push("COUNT(*) AS count");
  }

  // Build WHERE clause
  const whereParts: string[] = [`"tenantId" = $1`];

  // Add soft delete filter
  if (dataSource !== "activities") {
    whereParts.push(`"deletedAt" IS NULL`);
  }

  // Add date range filter
  if (dateRange) {
    const dateField = validateField(dataSource, dateRange.dateField) ? dateRange.dateField : "createdAt";
    const { start, end } = resolveDateRange(dateRange);
    if (start) {
      whereParts.push(`"${dateField}" >= $${paramIndex}`);
      params.push(start);
      paramIndex++;
    }
    if (end) {
      whereParts.push(`"${dateField}" <= $${paramIndex}`);
      params.push(end);
      paramIndex++;
    }
  }

  // Add filters
  for (const filter of filters) {
    if (!validateField(dataSource, filter.field)) {
      throw new Error(`Invalid filter field: ${filter.field} for ${dataSource}`);
    }

    switch (filter.operator) {
      case "eq":
        whereParts.push(`"${filter.field}" = $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "neq":
        whereParts.push(`"${filter.field}" != $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "gt":
        whereParts.push(`"${filter.field}" > $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "gte":
        whereParts.push(`"${filter.field}" >= $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "lt":
        whereParts.push(`"${filter.field}" < $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "lte":
        whereParts.push(`"${filter.field}" <= $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;
      case "contains":
        whereParts.push(`"${filter.field}" ILIKE $${paramIndex}`);
        params.push(`%${filter.value}%`);
        paramIndex++;
        break;
      case "in":
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value.map(() => `$${paramIndex++}`);
          whereParts.push(`"${filter.field}" IN (${placeholders.join(", ")})`);
          params.push(...(filter.value as unknown[]));
        }
        break;
      case "isNull":
        whereParts.push(`"${filter.field}" IS NULL`);
        break;
      case "isNotNull":
        whereParts.push(`"${filter.field}" IS NOT NULL`);
        break;
    }
  }

  // Assemble query
  let sql = `SELECT ${selectParts.join(", ")} FROM ${table}`;
  sql += ` WHERE ${whereParts.join(" AND ")}`;

  if (groupByParts.length > 0) {
    sql += ` GROUP BY ${groupByParts.join(", ")}`;
  }

  // Order by first dimension or first metric
  if (dimensions.length > 0 && dimensions[0].type === "temporal") {
    sql += ` ORDER BY ${groupByParts[0]} ASC`;
  } else if (metrics.length > 0) {
    const orderLabel = sanitizeAlias(metrics[0].label || (metrics[0].aggregate === "count" && metrics[0].field === "*" ? "count" : `${metrics[0].aggregate}_${metrics[0].field}`));
    sql += ` ORDER BY "${orderLabel}" DESC`;
  }

  sql += ` LIMIT 1000`;

  return { sql, params };
}

// ============================================
// Date Range Resolver
// ============================================

function resolveDateRange(dateRange: ReportDefinition["dateRange"]): { start: string | null; end: string | null } {
  if (!dateRange) return { start: null, end: null };

  if (dateRange.type === "custom") {
    return { start: dateRange.start || null, end: dateRange.end || null };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateRange.preset) {
    case "today":
      return { start: today.toISOString(), end: now.toISOString() };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday.toISOString(), end: today.toISOString() };
    }
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString(), end: now.toISOString() };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString(), end: now.toISOString() };
    }
    case "last90": {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      return { start: d.toISOString(), end: now.toISOString() };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case "thisQuarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    default:
      return { start: null, end: null };
  }
}
