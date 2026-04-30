import { NextRequest, NextResponse } from "next/server";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, endpoint, payload } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    const targetUrl = `${GROQ_API_BASE}${endpoint}`;

    const groqResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Groq API error", details: data },
        { status: groqResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
