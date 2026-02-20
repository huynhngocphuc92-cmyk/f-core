import { vi } from "vitest";

// Mock Prisma client globally
vi.mock("@/lib/prisma", () => ({
  default: createMockPrisma(),
  prisma: createMockPrisma(),
}));

// Mock auth helpers globally
vi.mock("@/lib/auth-helpers", () => ({
  getTenantId: vi.fn().mockResolvedValue("tenant-test-id"),
  getCurrentUser: vi.fn().mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  }),
  getUserData: vi.fn().mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
    tenantId: "tenant-test-id",
    role: "admin",
  }),
  checkOwnership: vi.fn().mockResolvedValue(true),
  checkRole: vi.fn().mockResolvedValue(true),
  checkPermission: vi.fn().mockResolvedValue(true),
  createSupabaseServerClient: vi.fn(),
}));

function createMockPrisma() {
  const mockModelMethods = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  let idCounter = 0;
  const nextId = () => `test-id-${++idCounter}`;

  const matchesWhere = (record: Record<string, unknown>, where?: Record<string, unknown>) => {
    if (!where) return true;

    const toComparable = (value: unknown): string | number => {
      if (value instanceof Date) return value.getTime();
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const asDate = Date.parse(value);
        return Number.isNaN(asDate) ? value : asDate;
      }
      if (typeof value === "boolean") return value ? 1 : 0;
      return String(value ?? "");
    };

    return Object.entries(where).every(([key, expected]) => {
      if (expected === undefined) return true;
      if (expected && typeof expected === "object" && !Array.isArray(expected)) {
        const expectedRecord = expected as Record<string, unknown>;

        if ("equals" in expected) {
          return record[key] === (expected as { equals: unknown }).equals;
        }

        if ("in" in expected) {
          const values = (expected as { in: unknown }).in;
          return Array.isArray(values) ? values.includes(record[key]) : false;
        }

        const actualComparable = toComparable(record[key]);

        if ("gte" in expected) {
          const expectedComparable = toComparable((expected as { gte: unknown }).gte);
          if (!(actualComparable >= expectedComparable)) return false;
        }
        if ("gt" in expected) {
          const expectedComparable = toComparable((expected as { gt: unknown }).gt);
          if (!(actualComparable > expectedComparable)) return false;
        }
        if ("lte" in expected) {
          const expectedComparable = toComparable((expected as { lte: unknown }).lte);
          if (!(actualComparable <= expectedComparable)) return false;
        }
        if ("lt" in expected) {
          const expectedComparable = toComparable((expected as { lt: unknown }).lt);
          if (!(actualComparable < expectedComparable)) return false;
        }

        const hasComparator = Object.keys(expectedRecord).some((op) =>
          ["equals", "in", "gte", "gt", "lte", "lt"].includes(op)
        );
        if (hasComparator) {
          return true;
        }

        return Object.entries(expectedRecord).every(([nestedKey, nestedValue]) => {
          if (nestedValue === undefined) return true;
          return record[nestedKey] === nestedValue;
        });
      }
      return record[key] === expected;
    });
  };

  const applyOrderBy = (
    rows: Array<Record<string, unknown>>,
    orderBy?: Record<string, "asc" | "desc">
  ) => {
    if (!orderBy) return rows;
    const [field, direction] = Object.entries(orderBy)[0] || [];
    if (!field || !direction) return rows;

    return rows.sort((a, b) => {
      const left = a[field];
      const right = b[field];
      if (left instanceof Date && right instanceof Date) {
        return direction === "asc"
          ? left.getTime() - right.getTime()
          : right.getTime() - left.getTime();
      }
      if (typeof left === "string" && typeof right === "string") {
        return direction === "asc"
          ? left.localeCompare(right)
          : right.localeCompare(left);
      }
      return 0;
    });
  };

  const buildStatefulModel = () => {
    const rows: Array<Record<string, unknown>> = [];

    const applyDataToRow = (
      base: Record<string, unknown>,
      data: Record<string, unknown>,
      touchUpdatedAt: boolean
    ) => {
      const next = { ...base };

      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === "object" && "increment" in value) {
          const increment = Number((value as { increment: unknown }).increment);
          const currentValue = Number(next[key] || 0);
          next[key] = currentValue + increment;
          continue;
        }
        next[key] = value;
      }

      if (touchUpdatedAt && !("updatedAt" in data)) {
        next.updatedAt = new Date();
      }

      return next;
    };

    return {
      findMany: vi.fn(async (args?: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc"> }) => {
        const filtered = rows.filter((row) => matchesWhere(row, args?.where)).map((row) => ({ ...row }));
        return applyOrderBy(filtered, args?.orderBy);
      }),
      findFirst: vi.fn(async (args?: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc"> }) => {
        const filtered = rows.filter((row) => matchesWhere(row, args?.where)).map((row) => ({ ...row }));
        const ordered = applyOrderBy(filtered, args?.orderBy);
        return ordered[0] || null;
      }),
      findUnique: vi.fn(async (args?: { where?: Record<string, unknown> }) => {
        const row = rows.find((item) => matchesWhere(item, args?.where));
        return row ? { ...row } : null;
      }),
      create: vi.fn(async (args?: { data?: Record<string, unknown> }) => {
        const now = new Date();
        const data = args?.data || {};
        const row = {
          id: (data.id as string | undefined) || nextId(),
          createdAt: (data.createdAt as Date | undefined) || now,
          updatedAt: (data.updatedAt as Date | undefined) || now,
          ...data,
        };
        rows.push(row);
        return { ...row };
      }),
      createMany: vi.fn(async (args?: { data?: Array<Record<string, unknown>> }) => {
        const payload = args?.data || [];
        for (const item of payload) {
          const now = new Date();
          rows.push({
            id: (item.id as string | undefined) || nextId(),
            createdAt: (item.createdAt as Date | undefined) || now,
            updatedAt: (item.updatedAt as Date | undefined) || now,
            ...item,
          });
        }
        return { count: payload.length };
      }),
      update: vi.fn(async (args?: { where?: Record<string, unknown>; data?: Record<string, unknown> }) => {
        const index = rows.findIndex((item) => matchesWhere(item, args?.where));
        if (index === -1) {
          throw new Error("Record not found");
        }

        const data = args?.data || {};
        const next = applyDataToRow(rows[index], data, true);

        rows[index] = next;
        return { ...next };
      }),
      updateMany: vi.fn(async (args?: { where?: Record<string, unknown>; data?: Record<string, unknown> }) => {
        const data = args?.data || {};
        let count = 0;

        for (let i = 0; i < rows.length; i += 1) {
          if (!matchesWhere(rows[i], args?.where)) continue;
          rows[i] = applyDataToRow(rows[i], data, true);
          count += 1;
        }

        return { count };
      }),
      delete: vi.fn(async (args?: { where?: Record<string, unknown> }) => {
        const index = rows.findIndex((item) => matchesWhere(item, args?.where));
        if (index === -1) {
          throw new Error("Record not found");
        }
        const [deleted] = rows.splice(index, 1);
        return { ...deleted };
      }),
      deleteMany: vi.fn(async (args?: { where?: Record<string, unknown> }) => {
        const before = rows.length;
        if (!args?.where) {
          rows.length = 0;
          return { count: before };
        }

        for (let i = rows.length - 1; i >= 0; i -= 1) {
          if (matchesWhere(rows[i], args.where)) {
            rows.splice(i, 1);
          }
        }
        return { count: before - rows.length };
      }),
      count: vi.fn(async (args?: { where?: Record<string, unknown> }) => {
        return rows.filter((row) => matchesWhere(row, args?.where)).length;
      }),
      upsert: vi.fn(async (args?: {
        where?: Record<string, unknown>;
        update?: Record<string, unknown>;
        create?: Record<string, unknown>;
      }) => {
        const index = rows.findIndex((item) => matchesWhere(item, args?.where));

        if (index !== -1) {
          const data = args?.update || {};
          const next = applyDataToRow(rows[index], data, true);
          rows[index] = next;
          return { ...next };
        }

        const now = new Date();
        const data = args?.create || {};
        const row = {
          id: (data.id as string | undefined) || nextId(),
          createdAt: (data.createdAt as Date | undefined) || now,
          updatedAt: (data.updatedAt as Date | undefined) || now,
          ...data,
        };
        rows.push(row);
        return { ...row };
      }),
      aggregate: vi.fn().mockResolvedValue({}),
      groupBy: vi.fn().mockResolvedValue([]),
    };
  };

  const commerceInvoice = buildStatefulModel();
  const commerceSubscription = buildStatefulModel();
  const commerceDunningConfig = buildStatefulModel();
  const commerceDunningCase = buildStatefulModel();
  const commercePaymentProviderConfig = buildStatefulModel();
  const marketingAdsConnector = buildStatefulModel();
  const marketingAdsCampaign = buildStatefulModel();
  const marketingSocialPost = buildStatefulModel();
  const marketingExperiment = buildStatefulModel();
  const marketingExperimentVariant = buildStatefulModel();
  const dataSyncMapping = buildStatefulModel();
  const dataSyncJob = buildStatefulModel();
  const dataQualityRule = buildStatefulModel();
  const dataQualityMergeAudit = buildStatefulModel();
  const workflowVersionSnapshot = buildStatefulModel();
  const workflowRuntimeRun = buildStatefulModel();
  const workflowRuntimeDeadLetter = buildStatefulModel();
  const contentBlogPost = buildStatefulModel();
  const contentApprovalPolicy = buildStatefulModel();
  const contentApprovalRequest = buildStatefulModel();
  const contentRemixVariant = buildStatefulModel();
  const contentPerformanceEvent = buildStatefulModel();
  const contentReusableBlock = buildStatefulModel();
  const salesPlaybookRun = buildStatefulModel();
  const aiPromptVersion = buildStatefulModel();
  const aiOrchestrationMemory = buildStatefulModel();
  const apiPerformanceBudget = buildStatefulModel();
  const apiPerformanceEvaluation = buildStatefulModel();
  const frontendRouteThreshold = buildStatefulModel();
  const frontendPerformanceEvaluation = buildStatefulModel();
  const releaseChecklistGate = buildStatefulModel();
  const releaseReadinessResult = buildStatefulModel();
  const serviceSlaPolicyConfig = buildStatefulModel();
  const serviceRoutingPolicyConfig = buildStatefulModel();
  const serviceOmnichannelThread = buildStatefulModel();
  const ssoConfig = buildStatefulModel();
  const tenantPolicy = buildStatefulModel();
  const scimUser = buildStatefulModel();

  return {
    contact: mockModelMethods(),
    company: mockModelMethods(),
    deal: mockModelMethods(),
    ticket: mockModelMethods(),
    pipeline: mockModelMethods(),
    pipelineStage: mockModelMethods(),
    activity: mockModelMethods(),
    property: mockModelMethods(),
    propertyDefinition: mockModelMethods(),
    propertyOption: mockModelMethods(),
    emailTemplate: mockModelMethods(),
    meeting: mockModelMethods(),
    workflow: mockModelMethods(),
    workflowAction: mockModelMethods(),
    sequence: mockModelMethods(),
    sequenceStep: mockModelMethods(),
    sequenceEnrollment: mockModelMethods(),
    quote: mockModelMethods(),
    quoteLineItem: mockModelMethods(),
    quoteApprovalRequest: mockModelMethods(),
    quoteBuyerActivity: mockModelMethods(),
    notification: mockModelMethods(),
    landingPage: mockModelMethods(),
    chatWidget: mockModelMethods(),
    chatConversation: mockModelMethods(),
    chatMessage: mockModelMethods(),
    webhook: mockModelMethods(),
    auditLog: mockModelMethods(),
    emailCampaign: mockModelMethods(),
    savedView: mockModelMethods(),
    form: mockModelMethods(),
    formField: mockModelMethods(),
    formSubmission: mockModelMethods(),
    dashboard: mockModelMethods(),
    dashboardWidget: mockModelMethods(),
    report: mockModelMethods(),
    kBArticle: mockModelMethods(),
    kBCategory: mockModelMethods(),
    kBArticleFeedback: mockModelMethods(),
    commerceInvoice,
    commerceSubscription,
    commerceDunningConfig,
    commerceDunningCase,
    commercePaymentProviderConfig,
    marketingAdsConnector,
    marketingAdsCampaign,
    marketingSocialPost,
    marketingExperiment,
    marketingExperimentVariant,
    dataSyncMapping,
    dataSyncJob,
    dataQualityRule,
    dataQualityMergeAudit,
    workflowVersionSnapshot,
    workflowRuntimeRun,
    workflowRuntimeDeadLetter,
    contentBlogPost,
    contentApprovalPolicy,
    contentApprovalRequest,
    contentRemixVariant,
    contentPerformanceEvent,
    contentReusableBlock,
    salesPlaybookRun,
    aiPromptVersion,
    aiOrchestrationMemory,
    apiPerformanceBudget,
    apiPerformanceEvaluation,
    frontendRouteThreshold,
    frontendPerformanceEvaluation,
    releaseChecklistGate,
    releaseReadinessResult,
    serviceSlaPolicyConfig,
    serviceRoutingPolicyConfig,
    serviceOmnichannelThread,
    ssoConfig,
    tenantPolicy,
    scimUser,
    aIConversation: mockModelMethods(),
    aIMessage: mockModelMethods(),
    meetingType: mockModelMethods(),
    meetingLink: mockModelMethods(),
    userAvailability: mockModelMethods(),
    contactCompany: mockModelMethods(),
    dealContact: mockModelMethods(),
    dealCompany: mockModelMethods(),
    user: mockModelMethods(),
    tenant: mockModelMethods(),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn((fn: any) => {
      if (typeof fn === "function") {
        return fn({
          chatMessage: mockModelMethods(),
          chatConversation: mockModelMethods(),
        });
      }
      return Promise.all(fn);
    }),
  };
}
