import { NextResponse } from "next/server";
import { buildUserPrompt, SYSTEM_PROMPT, type VerificationInput } from "../../../lib/prompt";

export const runtime = "nodejs";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function hasMinimumFields(input: Partial<VerificationInput>) {
  return Boolean(
    input.titulo?.trim() &&
    input.categoria?.trim() &&
    input.contexto?.trim() &&
    input.hallazgos?.trim() &&
    input.verificaciones?.trim() &&
    input.fuentes?.trim()
  );
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("La IA no devolvió un JSON válido.");
    return JSON.parse(match[0]);
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar OPENAI_API_KEY en Vercel o en .env.local." },
        { status: 500 }
      );
    }

    const input = (await request.json()) as Partial<VerificationInput>;

    if (!hasMinimumFields(input)) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: título, categoría, contexto, hallazgos, verificaciones y fuentes." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input as VerificationInput) }
        ]
      })
    });

    const data = (await response.json()) as OpenAIChatResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Error al llamar a la API de OpenAI." },
        { status: response.status }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "La IA no devolvió contenido." },
        { status: 500 }
      );
    }

    const draft = tryParseJson(content);
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
