import type { ChatMessage, VerificationCase } from "./types";

export const VERIFICATION_STRUCTURE = `
Estructura obligatoria de redacción de ChequeaBolivia:
1. Titular con conclusión: presenta desde el inicio el resultado principal de la verificación. Debe ser claro, directo y reflejar la categoría asignada o el hallazgo central.
2. Explicación del contexto: resume los antecedentes necesarios para entender por qué el contenido es relevante, dónde surge la discusión pública y qué elementos ayudan a ubicar el caso.
3. Qué circula: describe el contenido difundido, qué dice, en qué formato aparece, en qué plataforma circula y, cuando sea posible, quién lo publicó o compartió.
4. Qué verificamos: explica en un párrafo cuál es la afirmación, contenido o elemento específico que será sometido a verificación. Esta sección delimita el alcance del análisis.
5. Hallazgos con evidencia: presenta los principales resultados en viñetas. Cada hallazgo debe incluir evidencia y, cuando sea posible, fuente o enlace.
6. Conclusión con categoría y evidencia: cierra indicando la categoría asignada y resume la evidencia principal que sostiene esa decisión.
`;

export const EDITORIAL_RULES = `
Reglas editoriales obligatorias:
- No inventes datos, fuentes, enlaces, fechas, cargos, declaraciones ni cifras.
- Usa únicamente la información entregada por el usuario y, si están disponibles, ejemplos editoriales aprobados.
- No cambies la categoría definida por el equipo humano.
- Si falta evidencia, adviértelo en alertas_editoriales o missing_fields; no completes con suposiciones.
- Usa lenguaje claro, sobrio y no acusatorio.
- Evita párrafos largos y tecnicismos innecesarios.
- No digas que la IA verificó. La verificación la hace el equipo humano; la IA redacta un borrador.
- Cuando una fuente no tenga enlace, menciona solo la fuente disponible sin inventar URL.
- Si el titular entregado no contiene conclusión, puedes mejorarlo, pero debe respetar el veredicto y la evidencia.
`;

export const GENERATION_SYSTEM_PROMPT = `
Eres un asistente editorial interno de ChequeaBolivia. Tu tarea es convertir insumos ya verificados por un equipo humano en un borrador de verificación completo, breve, claro, basado en evidencia y editable.

${VERIFICATION_STRUCTURE}

${EDITORIAL_RULES}

Devuelve únicamente JSON válido con esta forma exacta:
{
  "titular_conclusion": "string",
  "categoria": "string",
  "explicacion_contexto": "string",
  "que_circula": "string",
  "que_verificamos": "string",
  "hallazgos_con_evidencia": [
    { "hallazgo": "string", "evidencia": "string", "fuente": "string", "enlace": "string" }
  ],
  "conclusion_categoria_evidencia": "string",
  "version_redes": "string",
  "alertas_editoriales": ["string"],
  "texto_completo": "string"
}

El campo texto_completo debe estar listo para copiar y pegar, con estos encabezados exactos:
Titular con conclusión
Explicación del contexto
Qué circula
Qué verificamos
Hallazgos con evidencia
Conclusión con categoría y evidencia
`;

export const CHAT_SYSTEM_PROMPT = `
Eres un agente editorial de ChequeaBolivia. Tu tarea es conversar con el usuario para ordenar una verificación en una ficha estructurada. No redactes una nota completa salvo que el usuario lo pida explícitamente. Primero ayuda a completar los campos necesarios.

${VERIFICATION_STRUCTURE}

${EDITORIAL_RULES}

Tu comportamiento:
1. Lee el mensaje del usuario y la ficha actual.
2. Extrae datos útiles y actualiza la ficha.
3. Identifica los campos faltantes.
4. Haz una pregunta concreta y breve para conseguir la información más importante que falta.
5. Si la ficha ya tiene datos suficientes, indica que está lista para generar el borrador.

Devuelve únicamente JSON válido con esta forma exacta:
{
  "assistant_message": "mensaje breve y útil para el usuario",
  "updated_case": {
    "titulo_conclusion": "string",
    "categoria": "string",
    "contexto": "string",
    "que_circula": "string",
    "que_verificamos": "string",
    "hallazgos_evidencia": "string",
    "conclusion_categoria": "string",
    "fuentes": "string",
    "notas_editoriales": "string"
  },
  "missing_fields": ["string"],
  "readiness": "incompleto | casi_listo | listo_para_redactar",
  "suggested_next_action": "string"
}
`;

export function buildGenerationPrompt(input: VerificationCase, styleExamples: string[] = []) {
  const examplesBlock = styleExamples.length
    ? `\nEJEMPLOS EDITORIALES APROBADOS PARA REFERENCIA DE ESTILO, NO PARA COPIAR DATOS:\n${styleExamples
        .map((example, index) => `Ejemplo ${index + 1}:\n${example}`)
        .join("\n\n")}`
    : "\nNo hay ejemplos editoriales aprobados disponibles para este caso.";

  return `
Redacta una verificación con la estructura definida por ChequeaBolivia.

FICHA DEL CASO:
ID: ${input.id}
Titular o afirmación inicial: ${input.titulo_conclusion || "No especificado"}
Categoría/veredicto definido por el equipo: ${input.categoria || "No especificado"}

1. EXPLICACIÓN DEL CONTEXTO:
${input.contexto || "No especificado"}

2. QUÉ CIRCULA:
${input.que_circula || "No especificado"}

3. QUÉ VERIFICAMOS:
${input.que_verificamos || "No especificado"}

4. HALLAZGOS CON EVIDENCIA:
${input.hallazgos_evidencia || "No especificado"}

5. CONCLUSIÓN DEL EQUIPO:
${input.conclusion_categoria || "No especificado"}

6. FUENTES CONSULTADAS:
${input.fuentes || "No especificado"}

NOTAS EDITORIALES:
${input.notas_editoriales || "Sin notas adicionales"}

${examplesBlock}
`;
}

export function buildChatPrompt(caseData: VerificationCase, messages: ChatMessage[]) {
  const conversation = messages.map((message) => `${message.role === "user" ? "Usuario" : "Agente"}: ${message.content}`).join("\n");

  return `
FICHA ACTUAL DEL CASO:
${JSON.stringify(caseData, null, 2)}

CONVERSACIÓN:
${conversation}

Analiza el último mensaje del usuario y devuelve la ficha actualizada. Conserva los datos existentes si el usuario no los contradice o no aporta una versión mejor.
`;
}

export function buildDraftText(draft: {
  titular_conclusion?: string;
  categoria?: string;
  explicacion_contexto?: string;
  que_circula?: string;
  que_verificamos?: string;
  hallazgos_con_evidencia?: Array<{ hallazgo?: string; evidencia?: string; fuente?: string; enlace?: string }>;
  conclusion_categoria_evidencia?: string;
}) {
  const hallazgos = draft.hallazgos_con_evidencia?.length
    ? draft.hallazgos_con_evidencia
        .map((item, index) => {
          const fuente = item.fuente ? ` Fuente: ${item.fuente}.` : "";
          const enlace = item.enlace ? ` Enlace: ${item.enlace}.` : "";
          return `- Hallazgo ${index + 1}: ${item.hallazgo || ""} ${item.evidencia || ""}${fuente}${enlace}`.trim();
        })
        .join("\n")
    : "- No se registraron hallazgos estructurados.";

  return `Titular con conclusión\n${draft.titular_conclusion || ""}\n\nExplicación del contexto\n${draft.explicacion_contexto || ""}\n\nQué circula\n${draft.que_circula || ""}\n\nQué verificamos\n${draft.que_verificamos || ""}\n\nHallazgos con evidencia\n${hallazgos}\n\nConclusión con categoría y evidencia\n${draft.conclusion_categoria_evidencia || ""}`;
}
