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
