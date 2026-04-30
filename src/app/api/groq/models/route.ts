import { NextRequest, NextResponse } from "next/server";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const groqResponse = await fetch(`${GROQ_API_BASE}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to fetch models", details: data },
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
