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
    model: process.env.OPENAI_MODEL || "gpt-5.6",
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

  return NextResponse.json(JSON.parse(response.output_text));
}
