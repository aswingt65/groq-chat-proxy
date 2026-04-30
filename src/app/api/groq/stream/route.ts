import { NextRequest } from "next/server";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, payload } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groqResponse = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      return new Response(
        JSON.stringify({
          error: errorData.error?.message || "Groq API error",
          details: errorData,
        }),
        {
          status: groqResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward the streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`)
                  );
                } catch {
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
