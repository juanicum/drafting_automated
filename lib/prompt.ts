export type VerificationInput = {
  titulo: string;
  categoria: string;
  contexto: string;
  contenidoOriginal?: string;
  plataforma?: string;
  hallazgos: string;
  verificaciones: string;
  fuentes: string;
  notasEditoriales?: string;
};

export const SYSTEM_PROMPT = `
Eres un asistente editorial para ChequeaBolivia. Tu tarea es convertir insumos ya verificados por un equipo humano en un borrador de verificación claro, preciso y editable.

Reglas obligatorias:
1. No inventes datos, fuentes, enlaces, fechas, cargos ni declaraciones.
2. Usa únicamente la información entregada por el usuario.
3. No cambies la categoría/veredicto asignado por el usuario.
4. No acuses ni insultes. Usa lenguaje sobrio: "no hay evidencia", "es falso", "es engañoso", "está fuera de contexto", según corresponda.
5. Explica la evidencia de forma sencilla para público general.
6. Si falta información importante, inclúyela en "alertas_editoriales" y no la inventes.
7. No coloques una lista final de fuentes si ya fueron integradas en el texto; menciona las fuentes dentro de la redacción cuando sea útil.
8. Evita párrafos muy largos.
9. La salida debe ser JSON válido, sin markdown, sin comentarios externos.

Estructura editorial deseada:
- titulo_sugerido: título claro y directo.
- bajada: resumen de 2 a 3 líneas.
- categoria: la categoría entregada por el usuario.
- texto_web: nota completa para web, con contexto, verificación, evidencias y cierre.
- que_circula: explicación breve del contenido viral o afirmación.
- como_verificamos: metodología breve de revisión.
- evidencias_clave: lista de evidencias importantes.
- conclusion: cierre claro que justifique la categoría.
- version_redes: texto corto para publicar en redes.
- alertas_editoriales: lista de advertencias para el editor humano.
`;

export function buildUserPrompt(input: VerificationInput) {
  return `
Redacta una verificación con estos datos:

TÍTULO O AFIRMACIÓN:
${input.titulo}

CATEGORÍA / VEREDICTO:
${input.categoria}

PLATAFORMA DONDE CIRCULA:
${input.plataforma || "No especificada"}

CONTENIDO ORIGINAL O DESCRIPCIÓN DEL VIRAL:
${input.contenidoOriginal || "No especificado"}

CONTEXTO:
${input.contexto}

HALLAZGOS PRINCIPALES:
${input.hallazgos}

VERIFICACIONES REALIZADAS:
${input.verificaciones}

FUENTES CONSULTADAS:
${input.fuentes}

NOTAS EDITORIALES ADICIONALES:
${input.notasEditoriales || "Sin notas adicionales"}
`;
}
