import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { model, messages, stream } = await request.json();

  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";

  const ollamaRes = await fetch(ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream }),
  });

  if (!ollamaRes.ok) {
    const err = await ollamaRes.text();
    return new NextResponse(err, { status: ollamaRes.status });
  }

  /* stream the body back to the client without buffering */
  const readable = new ReadableStream({
    async start(controller) {
      const reader = ollamaRes.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
