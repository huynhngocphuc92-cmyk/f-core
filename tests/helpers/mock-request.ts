import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API route handlers
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const baseUrl = "http://localhost:3000";
  const urlObj = new URL(url, baseUrl);

  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      urlObj.searchParams.set(key, value);
    }
  }

  const init: RequestInit = {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }

  return new NextRequest(urlObj, init as RequestInit & { signal?: AbortSignal });
}

/**
 * Create async params object matching Next.js 16 pattern
 */
export function createMockParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

/**
 * Extract JSON body from NextResponse
 */
export async function getResponseBody(response: Response) {
  return response.json();
}
