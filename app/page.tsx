"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ChatAgentResponse, ChatMessage, VerificationCase, VerificationDraft } from "../lib/types";

const categories = [
  "Falso",
  "Verdadero",
  "Engañoso",
  "Fuera de contexto",
  "Alterado",
  "Insuficiente evidencia",
  "Impreciso",
  "Sátira"
];

function createEmptyCase(): VerificationCase {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
    titulo_conclusion: "",
    categoria: "Falso",
    contexto: "",
    que_circula: "",
    que_verificamos: "",
    hallazgos_evidencia: "",
    conclusion_categoria: "",
    fuentes: "",
    notas_editoriales: "",
    estado: "borrador"
  };
}

const initialAssistantMessage: ChatMessage = {
  role: "assistant",
  content:
    "Cuéntame el caso en lenguaje natural. Yo iré completando la ficha editorial y te pediré solo los datos que falten."
};

function FieldStatus({ value }: { value: string }) {
  return <span className={value.trim() ? "status ok" : "status missing"}>{value.trim() ? "Completo" : "Falta"}</span>;
}

function asList(items?: string[]) {
  if (!items?.length) return <p className="muted">Sin alertas.</p>;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function renderHallazgos(draft: VerificationDraft) {
  if (!draft.hallazgos_con_evidencia?.length) return <p className="muted">No se generaron hallazgos.</p>;

  return (
    <ul>
      {draft.hallazgos_con_evidencia.map((item, index) => (
        <li key={`${item.hallazgo}-${index}`}>
          <strong>Hallazgo {index + 1}:</strong> {item.hallazgo} {item.evidencia ? `Evidencia: ${item.evidencia}` : ""}
          {item.fuente ? ` Fuente: ${item.fuente}.` : ""}
          {item.enlace ? ` Enlace: ${item.enlace}.` : ""}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [caseData, setCaseData] = useState<VerificationCase>(() => createEmptyCase());
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [chatInput, setChatInput] = useState("");
  const [draft, setDraft] = useState<VerificationDraft | null>(null);
  const [editableText, setEditableText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<ChatAgentResponse["readiness"]>("incompleto");
  const [usedExamples, setUsedExamples] = useState<number | null>(null);

  const completionScore = useMemo(() => {
    const fields = [
      caseData.titulo_conclusion,
      caseData.categoria,
      caseData.contexto,
      caseData.que_circula,
      caseData.que_verificamos,
      caseData.hallazgos_evidencia,
      caseData.conclusion_categoria,
      caseData.fuentes
    ];
    const completed = fields.filter((field) => field.trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [caseData]);

  function updateField(field: keyof VerificationCase, value: string) {
    setCaseData((current) => ({ ...current, [field]: value }));
  }

  function newCase() {
    setCaseData(createEmptyCase());
    setMessages([initialAssistantMessage]);
    setDraft(null);
    setEditableText("");
    setMissingFields([]);
    setReadiness("incompleto");
    setUsedExamples(null);
    setError("");
    setNotice("Nuevo caso iniciado.");
  }

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content) return;

    setLoadingChat(true);
    setError("");
    setNotice("");

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setChatInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData, messages: nextMessages })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo procesar el mensaje.");

      setCaseData(data.updated_case);
      setMissingFields(data.missing_fields || []);
      setReadiness(data.readiness || "incompleto");
      setMessages((current) => [...current, { role: "assistant", content: data.assistant_message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoadingChat(false);
    }
  }

  async function saveCase() {
    setLoadingSave(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la ficha.");
      setNotice(data.saved ? "Ficha guardada en la base de datos." : "Ficha actualizada en pantalla. Supabase aún no está configurado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoadingSave(false);
    }
  }

  async function generateDraft() {
    setLoadingDraft(true);
    setError("");
    setNotice("");
    setDraft(null);
    setEditableText("");

    try {
      const response = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo generar el borrador.");

      setDraft(data.draft);
      setEditableText(data.draft.texto_completo || "");
      setUsedExamples(data.used_style_examples ?? 0);
      setNotice("Borrador generado. Revísalo antes de aprobarlo o publicarlo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoadingDraft(false);
    }
  }

  async function approveFinalText() {
    setLoadingApprove(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData, finalText: editableText, notes: caseData.notas_editoriales })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo aprobar la versión final.");
      setCaseData((current) => ({ ...current, estado: "aprobado" }));
      setNotice(
        data.saved
          ? "Versión aprobada guardada. Desde ahora podrá usarse como ejemplo editorial."
          : "Versión marcada como aprobada en pantalla. Configura Supabase para guardarla como ejemplo."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoadingApprove(false);
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(editableText);
    setNotice("Texto copiado al portapapeles.");
  }

  return (
    <main>
      <section className="header">
        <div className="kicker">ChequeaBolivia · redactor IA interno</div>
        <h1>Agente editorial para verificaciones</h1>
        <p className="subtitle">
          Conversa con el agente, completa la ficha estructurada y genera un borrador con la nueva estructura de redacción de ChequeaBolivia. La IA redacta; el equipo verifica, corrige y aprueba.
        </p>
        <div className="top-actions">
          <button type="button" onClick={newCase}>Nuevo caso</button>
          <button type="button" onClick={saveCase} disabled={loadingSave}>{loadingSave ? "Guardando..." : "Guardar ficha"}</button>
          <button type="button" className="primary small" onClick={generateDraft} disabled={loadingDraft}>
            {loadingDraft ? "Generando..." : "Generar borrador"}
          </button>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="notice">{notice}</div> : null}

      <section className="workspace">
        <aside className="card chat-card">
          <div className="card-title-row">
            <h2>Chat con el agente</h2>
            <span className={`readiness ${readiness}`}>{readiness.replaceAll("_", " ")}</span>
          </div>

          <div className="chat-box">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                <strong>{message.role === "user" ? "Tú" : "Agente"}</strong>
                <p>{message.content}</p>
              </div>
            ))}
            {loadingChat ? (
              <div className="message assistant">
                <strong>Agente</strong>
                <p>Analizando la información...</p>
              </div>
            ) : null}
          </div>

          <form onSubmit={sendChatMessage} className="chat-form">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ej. Circula en TikTok un video que afirma que... Tenemos estas fuentes..."
            />
            <button className="primary" type="submit" disabled={loadingChat || !chatInput.trim()}>
              {loadingChat ? "Enviando..." : "Enviar al agente"}
            </button>
          </form>

          <div className="output-block compact">
            <h3>Campos pendientes</h3>
            {missingFields.length ? asList(missingFields) : <p className="muted">El agente aún no ha marcado campos pendientes o la ficha está completa.</p>}
          </div>
        </aside>

        <section className="card form-card">
          <div className="card-title-row">
            <h2>Ficha estructurada</h2>
            <span className="score">{completionScore}% completo</span>
          </div>

          <div className="form-grid">
            <div className="form-group full">
              <label htmlFor="titulo_conclusion">1. Titular con conclusión *</label>
              <input
                id="titulo_conclusion"
                value={caseData.titulo_conclusion}
                onChange={(event) => updateField("titulo_conclusion", event.target.value)}
                placeholder="Ej. Es falso que..."
              />
              <FieldStatus value={caseData.titulo_conclusion} />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría *</label>
              <select id="categoria" value={caseData.categoria} onChange={(event) => updateField("categoria", event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <input id="estado" value={caseData.estado || "borrador"} onChange={(event) => updateField("estado", event.target.value)} />
            </div>

            <div className="form-group full">
              <label htmlFor="contexto">2. Explicación del contexto *</label>
              <textarea
                id="contexto"
                value={caseData.contexto}
                onChange={(event) => updateField("contexto", event.target.value)}
                placeholder="Antecedentes, discusión pública, fecha, actores o elementos necesarios para ubicar el caso."
              />
              <FieldStatus value={caseData.contexto} />
            </div>

            <div className="form-group full">
              <label htmlFor="que_circula">3. Qué circula *</label>
              <textarea
                id="que_circula"
                value={caseData.que_circula}
                onChange={(event) => updateField("que_circula", event.target.value)}
                placeholder="Qué dice el contenido, formato, plataforma y quién lo publicó o compartió si se sabe."
              />
              <FieldStatus value={caseData.que_circula} />
            </div>

            <div className="form-group full">
              <label htmlFor="que_verificamos">4. Qué verificamos *</label>
              <textarea
                id="que_verificamos"
                value={caseData.que_verificamos}
                onChange={(event) => updateField("que_verificamos", event.target.value)}
                placeholder="Afirmación, contenido o elemento específico que será sometido a verificación."
              />
              <FieldStatus value={caseData.que_verificamos} />
            </div>

            <div className="form-group full">
              <label htmlFor="hallazgos_evidencia">5. Hallazgos con evidencia *</label>
              <textarea
                id="hallazgos_evidencia"
                className="tall"
                value={caseData.hallazgos_evidencia}
                onChange={(event) => updateField("hallazgos_evidencia", event.target.value)}
                placeholder={"Escribe un hallazgo por línea. Ej.\nHallazgo 1: ... Evidencia: ... Fuente/enlace: ...\nHallazgo 2: ... Evidencia: ... Fuente/enlace: ..."}
              />
              <FieldStatus value={caseData.hallazgos_evidencia} />
            </div>

            <div className="form-group full">
              <label htmlFor="conclusion_categoria">6. Conclusión con categoría y evidencia *</label>
              <textarea
                id="conclusion_categoria"
                value={caseData.conclusion_categoria}
                onChange={(event) => updateField("conclusion_categoria", event.target.value)}
                placeholder="Explica por qué corresponde la categoría asignada y cuál es la evidencia principal."
              />
              <FieldStatus value={caseData.conclusion_categoria} />
            </div>

            <div className="form-group full">
              <label htmlFor="fuentes">Fuentes consultadas *</label>
              <textarea
                id="fuentes"
                value={caseData.fuentes}
                onChange={(event) => updateField("fuentes", event.target.value)}
                placeholder="Pega enlaces, nombres de fuentes, entrevistas o documentos utilizados. La IA no debe inventar fuentes."
              />
              <FieldStatus value={caseData.fuentes} />
            </div>

            <div className="form-group full">
              <label htmlFor="notas_editoriales">Notas editoriales</label>
              <textarea
                id="notas_editoriales"
                value={caseData.notas_editoriales}
                onChange={(event) => updateField("notas_editoriales", event.target.value)}
                placeholder="Tono, extensión, advertencias legales, público objetivo, cuidado con nombres propios, etc."
              />
            </div>
          </div>
        </section>
      </section>

      <section className="card draft-card">
        <div className="card-title-row">
          <h2>Borrador generado</h2>
          {usedExamples !== null ? <span className="score">Ejemplos usados: {usedExamples}</span> : null}
        </div>

        {!draft ? (
          <p className="subtitle">Cuando la ficha esté completa, presiona “Generar borrador”. Aquí aparecerá el texto listo para revisar.</p>
        ) : (
          <>
            <div className="draft-grid">
              <div className="output-block">
                <h3>1. Titular con conclusión</h3>
                <p>{draft.titular_conclusion}</p>
              </div>

              <div className="output-block">
                <h3>Categoría</h3>
                <p><span className="badge">{draft.categoria}</span></p>
              </div>

              <div className="output-block">
                <h3>2. Explicación del contexto</h3>
                <p>{draft.explicacion_contexto}</p>
              </div>

              <div className="output-block">
                <h3>3. Qué circula</h3>
                <p>{draft.que_circula}</p>
              </div>

              <div className="output-block">
                <h3>4. Qué verificamos</h3>
                <p>{draft.que_verificamos}</p>
              </div>

              <div className="output-block full">
                <h3>5. Hallazgos con evidencia</h3>
                {renderHallazgos(draft)}
              </div>

              <div className="output-block full">
                <h3>6. Conclusión con categoría y evidencia</h3>
                <p>{draft.conclusion_categoria_evidencia}</p>
              </div>

              <div className="output-block">
                <h3>Versión corta para redes</h3>
                <p>{draft.version_redes}</p>
              </div>

              <div className="output-block">
                <h3>Alertas editoriales</h3>
                {asList(draft.alertas_editoriales)}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="editableText">Texto editable final</label>
              <textarea
                id="editableText"
                className="large"
                value={editableText}
                onChange={(event) => setEditableText(event.target.value)}
              />
            </div>

            <div className="top-actions">
              <button type="button" onClick={copyText}>Copiar texto</button>
              <button type="button" onClick={() => setEditableText(draft.texto_completo)}>Restaurar texto generado</button>
              <button type="button" className="primary small" onClick={approveFinalText} disabled={loadingApprove}>
                {loadingApprove ? "Guardando aprobación..." : "Aprobar y guardar como ejemplo"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
