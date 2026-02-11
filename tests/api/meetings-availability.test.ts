import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

import { GET as getAvailability, PUT as setAvailability } from "@/app/api/meetings/availability/route";

const mockPrisma = vi.mocked(prisma);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue({
    id: "user-test-id",
    email: "test@example.com",
    name: "Test User",
  });
});

describe("GET /api/meetings/availability", () => {
  it("should return user availability slots", async () => {
    mockPrisma.userAvailability.findMany.mockResolvedValue([
      { id: "ua-1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ] as any);

    const request = createMockRequest("/api/meetings/availability");
    const response = await getAvailability(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].dayOfWeek).toBe(1);
  });

  it("should return 401 when not authenticated", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    const request = createMockRequest("/api/meetings/availability");
    const response = await getAvailability(request);

    expect(response.status).toBe(401);
  });
});

describe("PUT /api/meetings/availability", () => {
  it("should replace availability slots", async () => {
    mockPrisma.userAvailability.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.userAvailability.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.userAvailability.findMany.mockResolvedValue([
      { id: "ua-1", dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
      { id: "ua-2", dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
    ] as any);

    const request = createMockRequest("/api/meetings/availability", {
      method: "PUT",
      body: {
        slots: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
        ],
      },
    });
    const response = await setAvailability(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(mockPrisma.userAvailability.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.userAvailability.createMany).toHaveBeenCalled();
  });

  it("should handle empty slots array", async () => {
    mockPrisma.userAvailability.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.userAvailability.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/meetings/availability", {
      method: "PUT",
      body: { slots: [] },
    });
    const response = await setAvailability(request);
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(mockPrisma.userAvailability.createMany).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid time format", async () => {
    const request = createMockRequest("/api/meetings/availability", {
      method: "PUT",
      body: {
        slots: [{ dayOfWeek: 1, startTime: "9am", endTime: "5pm" }],
      },
    });
    const response = await setAvailability(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid dayOfWeek", async () => {
    const request = createMockRequest("/api/meetings/availability", {
      method: "PUT",
      body: {
        slots: [{ dayOfWeek: 8, startTime: "09:00", endTime: "17:00" }],
      },
    });
    const response = await setAvailability(request);

    expect(response.status).toBe(400);
  });
});
