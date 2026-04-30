import { NextRequest } from "next/server";

const GROQ_BASE = "https://api.groq.com";

/**
 * Transparent proxy for Groq API.
 *
 * Usage: Replace `https://api.groq.com` with your app's URL + `/api/proxy/groq`
 *
 * Pass your API key via the standard Authorization header:
 *   Authorization: Bearer gsk_xxxxx
 */

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const subPath = path.join("/");
  const targetUrl = `${GROQ_BASE}/${subPath}`;

  // Forward query params if any
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  // Build forwarded headers (pass through auth + content-type)
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) {
    headers["Authorization"] = auth;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // Read body for methods that have one
  let body: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  // Detect if the request is asking for streaming
  let isStreamRequest = false;
  if (body && contentType?.includes("application/json")) {
    try {
      const parsed = JSON.parse(body as string);
      isStreamRequest = parsed.stream === true;
    } catch {
      // not JSON, ignore
    }
  }

  const groqResponse = await fetch(fullUrl, {
    method: request.method,
    headers,
    body,
  });

  // If streaming, pipe the response body directly
  if (isStreamRequest && groqResponse.body) {
    return new Response(groqResponse.body, {
      status: groqResponse.status,
      headers: {
        "Content-Type": groqResponse.headers.get("content-type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        // Forward rate-limit headers
        ...copyHeaders(groqResponse, [
          "x-ratelimit-limit-requests",
          "x-ratelimit-limit-tokens",
          "x-ratelimit-remaining-requests",
          "x-ratelimit-remaining-tokens",
          "x-ratelimit-reset-requests",
          "x-ratelimit-reset-tokens",
          "x-groq-id",
        ]),
      },
    });
  }

  // Non-streaming: forward the full response
  const responseBody = await groqResponse.arrayBuffer();
  return new Response(responseBody, {
    status: groqResponse.status,
    headers: {
      "Content-Type": groqResponse.headers.get("content-type") || "application/json",
      ...copyHeaders(groqResponse, [
        "x-ratelimit-limit-requests",
        "x-ratelimit-limit-tokens",
        "x-ratelimit-remaining-requests",
        "x-ratelimit-remaining-tokens",
        "x-ratelimit-reset-requests",
        "x-ratelimit-reset-tokens",
        "x-groq-id",
      ]),
    },
  });
}

function copyHeaders(
  response: Response,
  headerNames: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of headerNames) {
    const value = response.headers.get(name);
    if (value) {
      result[name] = value;
    }
  }
  return result;
}

// Support all HTTP methods
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const OPTIONS = proxyRequest;
