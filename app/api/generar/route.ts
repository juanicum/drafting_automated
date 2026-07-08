import { NextResponse } from "next/server";
import { buildDraftText, buildGenerationPrompt, GENERATION_SYSTEM_PROMPT } from "../../../lib/prompt";
import { callOpenAIJson } from "../../../lib/openai";
import { getStyleExamples, insertDraft, upsertCase } from "../../../lib/supabase";
import type { VerificationCase, VerificationDraft } from "../../../lib/types";

export const runtime = "nodejs";

function hasMinimumFields(input: Partial<VerificationCase>) {
  return Boolean(
    input.titulo_conclusion?.trim() &&
      input.categoria?.trim() &&
      input.contexto?.trim() &&
      input.que_circula?.trim() &&
      input.que_verificamos?.trim() &&
      input.hallazgos_evidencia?.trim() &&
      input.conclusion_categoria?.trim() &&
      input.fuentes?.trim()
  );
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as VerificationCase;

    if (!input.id) {
      return NextResponse.json({ error: "Falta el ID del caso." }, { status: 400 });
    }

    if (!hasMinimumFields(input)) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios: titular, categoría, contexto, qué circula, qué verificamos, hallazgos, conclusión y fuentes. Puedes completarlos desde el chat o desde la ficha."
        },
        { status: 400 }
      );
    }

    const styleExamples = await getStyleExamples(input.categoria, 3);

    const draft = await callOpenAIJson<VerificationDraft>({
      systemPrompt: GENERATION_SYSTEM_PROMPT,
      userPrompt: buildGenerationPrompt(input, styleExamples),
      temperature: 0.2
    });

    const normalizedDraft: VerificationDraft = {
      ...draft,
      categoria: input.categoria,
      texto_completo: draft.texto_completo?.trim() || buildDraftText(draft)
    };

    await upsertCase({ ...input, estado: "redactado" });
    await insertDraft(input.id, normalizedDraft);

    return NextResponse.json({ draft: normalizedDraft, used_style_examples: styleExamples.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
