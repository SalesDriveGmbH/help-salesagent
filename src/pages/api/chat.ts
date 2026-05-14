import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { retrieveRelevantArticles } from "../../lib/knowledge";
import { rateLimit } from "../../lib/rate-limit";
import { buildSystemPrompt, CLAUDE_MODEL } from "../../lib/claude";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const limited = await rateLimit({ key: `chat:${clientAddress}`, max: 30, window: 3600 });
  if (limited) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: "no_messages" }), { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  const query = lastUser?.content ?? "";

  const articles = await retrieveRelevantArticles(query, { topK: 5 });
  const systemPrompt = buildSystemPrompt(articles);

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "anthropic_key_missing" }), { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await client.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages.slice(-10).map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: String(m.content ?? ""),
          })),
        });
        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (e: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: e?.message ?? "stream_error" })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
