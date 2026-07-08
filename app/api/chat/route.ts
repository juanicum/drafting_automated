import { NextResponse } from "next/server";
import { buildChatPrompt, CHAT_SYSTEM_PROMPT } from "../../../lib/prompt";
import { callOpenAIJson } from "../../../lib/openai";
import { insertChatMessages, upsertCase } from "../../../lib/supabase";
import type { ChatAgentResponse, ChatMessage, VerificationCase } from "../../../lib/types";

export const runtime = "nodejs";

type ChatRequest = {
  caseData: VerificationCase;
  messages: ChatMessage[];
};

function mergeCase(current: VerificationCase, updates: Partial<VerificationCase>): VerificationCase {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(updates).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    )
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.caseData?.id) {
      return NextResponse.json({ error: "Falta el ID del caso." }, { status: 400 });
    }

    if (!body.messages?.length) {
      return NextResponse.json({ error: "No hay mensajes para analizar." }, { status: 400 });
    }

    const result = await callOpenAIJson<ChatAgentResponse>({
      systemPrompt: CHAT_SYSTEM_PROMPT,
      userPrompt: buildChatPrompt(body.caseData, body.messages),
      temperature: 0.15
    });

    const updatedCase = mergeCase(body.caseData, result.updated_case || {});
    updatedCase.estado = result.readiness === "listo_para_redactar" ? "listo_para_redactar" : "borrador";

    const lastUserMessage = body.messages[body.messages.length - 1];
    await upsertCase(updatedCase);
    await insertChatMessages(updatedCase.id, [
      lastUserMessage,
      { role: "assistant", content: result.assistant_message }
    ]);

    return NextResponse.json({ ...result, updated_case: updatedCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
