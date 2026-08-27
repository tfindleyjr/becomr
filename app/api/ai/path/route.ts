import OpenAI from "openai";
import { NextResponse } from "next/server";

const schema = {
  type: "object",
  properties: {
    path: {
      type: "object",
      properties: {
        name: { type: "string" },
        glyph: { type: "string" },
        capability: { type: "string" },
        region: { type: "string" },
        nodes: {
          type: "array",
          minItems: 5,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              xpRequired: { type: "integer" },
              boss: { type: "boolean" }
            },
            required: ["title", "xpRequired", "boss"],
            additionalProperties: false
          }
        }
      },
      required: ["name", "glyph", "capability", "region", "nodes"],
      additionalProperties: false
    },
    firstQuest: {
      type: "object",
      properties: {
        title: { type: "string" },
        proof: { type: "string" },
        xp: { type: "integer" }
      },
      required: ["title", "proof", "xp"],
      additionalProperties: false
    },
    weeklyBoss: {
      type: "object",
      properties: {
        title: { type: "string" },
        proof: { type: "string" },
        xp: { type: "integer" }
      },
      required: ["title", "proof", "xp"],
      additionalProperties: false
    },
    rationale: { type: "string" }
  },
  required: ["path", "firstQuest", "weeklyBoss", "rationale"],
  additionalProperties: false
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
    }

    const body = await req.json();
    const goal = String(body.goal || "").trim();
    const level = String(body.level || "beginner");
    const capacity = String(body.capacity || "steady");
    const context = String(body.context || "").trim();

    if (!goal) return NextResponse.json({ error: "A goal is required." }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: "You are BECOMR's progression architect. Build practical capability trees, not academic syllabi. Every node must represent something demonstrable in real life. Progress from foundations to independent execution. Proof must be measurable. Avoid vague goals like 'learn more' or 'practice'. Keep the path motivating but realistic."
        },
        {
          role: "user",
          content: `Goal: ${goal}\nCurrent level: ${level}\nAvailable capacity: ${capacity}\nExtra context: ${context || "none"}\n\nCreate one coherent skill path with 5-8 ordered nodes, a first real-world Proof quest, and a Weekly Boss. XP thresholds must increase from 0 upward. The first node must start at 0 XP.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "becomr_progression",
          strict: true,
          schema
        }
      }
    });

    const output = response.output_text?.trim();
    if (!output) {
      console.error("BECOMR AI: empty model output", response);
      return NextResponse.json({ error: "OpenAI returned no progression data. Check the server terminal for details." }, { status: 502 });
    }

    try {
      return NextResponse.json(JSON.parse(output));
    } catch (parseError) {
      console.error("BECOMR AI: invalid JSON output", output, parseError);
      return NextResponse.json({ error: "OpenAI returned malformed progression data. Please try again." }, { status: 502 });
    }
  } catch (error: any) {
    console.error("BECOMR AI route error:", error);

    const status = Number(error?.status) || 500;
    let message = error?.message || "The AI progression request failed.";

    if (status === 401) message = "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local.";
    if (status === 429) message = "OpenAI rate limit or quota reached. Check your API billing/usage and try again.";
    if (status === 404) message = "The configured OpenAI model was not found or is not available to this API project.";

    return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}
