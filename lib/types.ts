export type VerificationCase = {
  id: string;
  titulo_conclusion: string;
  categoria: string;
  contexto: string;
  que_circula: string;
  que_verificamos: string;
  hallazgos_evidencia: string;
  conclusion_categoria: string;
  fuentes: string;
  notas_editoriales: string;
  estado?: "borrador" | "listo_para_redactar" | "redactado" | "aprobado";
};

export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type HallazgoConEvidencia = {
  hallazgo: string;
  evidencia: string;
  fuente?: string;
  enlace?: string;
};

export type VerificationDraft = {
  titular_conclusion: string;
  categoria: string;
  explicacion_contexto: string;
  que_circula: string;
  que_verificamos: string;
  hallazgos_con_evidencia: HallazgoConEvidencia[];
  conclusion_categoria_evidencia: string;
  version_redes: string;
  alertas_editoriales: string[];
  texto_completo: string;
};

export type ChatAgentResponse = {
  assistant_message: string;
  updated_case: Partial<VerificationCase>;
  missing_fields: string[];
  readiness: "incompleto" | "casi_listo" | "listo_para_redactar";
  suggested_next_action: string;
};
