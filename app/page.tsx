"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  titulo: string;
  categoria: string;
  plataforma: string;
  contenidoOriginal: string;
  contexto: string;
  hallazgos: string;
  verificaciones: string;
  fuentes: string;
  notasEditoriales: string;
};

type Draft = {
  titulo_sugerido?: string;
  bajada?: string;
  categoria?: string;
  texto_web?: string;
  que_circula?: string;
  como_verificamos?: string;
  evidencias_clave?: string[];
  conclusion?: string;
  version_redes?: string;
  alertas_editoriales?: string[];
};

const initialForm: FormState = {
  titulo: "",
  categoria: "Falso",
  plataforma: "",
  contenidoOriginal: "",
  contexto: "",
  hallazgos: "",
  verificaciones: "",
  fuentes: "",
  notasEditoriales: ""
};

function asList(items?: string[]) {
  if (!items?.length) return <p>No se generaron elementos.</p>;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editableText, setEditableText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullDraftText = useMemo(() => {
    if (!draft) return "";

    return [
      draft.titulo_sugerido ? `Título: ${draft.titulo_sugerido}` : "",
      draft.categoria ? `Categoría: ${draft.categoria}` : "",
      draft.bajada ? `\nBajada:\n${draft.bajada}` : "",
      draft.texto_web ? `\nTexto web:\n${draft.texto_web}` : "",
      draft.version_redes ? `\nVersión redes:\n${draft.version_redes}` : "",
      draft.alertas_editoriales?.length
        ? `\nAlertas editoriales:\n- ${draft.alertas_editoriales.join("\n- ")}`
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }, [draft]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setDraft(null);
    setEditableText("");

    try {
      const response = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo generar el borrador.");

      setDraft(data.draft);
      setEditableText(
        [
          data.draft?.titulo_sugerido ? `Título: ${data.draft.titulo_sugerido}` : "",
          data.draft?.categoria ? `Categoría: ${data.draft.categoria}` : "",
          data.draft?.bajada ? `\nBajada:\n${data.draft.bajada}` : "",
          data.draft?.texto_web ? `\nTexto web:\n${data.draft.texto_web}` : "",
          data.draft?.version_redes ? `\nVersión redes:\n${data.draft.version_redes}` : ""
        ]
          .filter(Boolean)
          .join("\n")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyEditableText() {
    await navigator.clipboard.writeText(editableText || fullDraftText);
  }

  return (
    <main>
      <section className="header">
        <div className="kicker">ChequeaBolivia · MVP interno</div>
        <h1>Redactor IA de verificaciones</h1>
        <p className="subtitle">
          Llena los insumos editoriales ya verificados. La IA no decide el veredicto: solo convierte la información en un borrador claro y editable.
        </p>
      </section>

      <section className="grid">
        <form className="card" onSubmit={handleSubmit}>
          <h2>Datos para la verificación</h2>

          <div className="form-group">
            <label htmlFor="titulo">Título o afirmación *</label>
            <input
              id="titulo"
              value={form.titulo}
              onChange={(event) => updateField("titulo", event.target.value)}
              placeholder="Ej. Es falso que..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoria">Categoría / veredicto *</label>
            <select
              id="categoria"
              value={form.categoria}
              onChange={(event) => updateField("categoria", event.target.value)}
              required
            >
              <option>Falso</option>
              <option>Verdadero</option>
              <option>Engañoso</option>
              <option>Fuera de contexto</option>
              <option>Insuficiente evidencia</option>
              <option>Alterado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="plataforma">Plataforma donde circula</label>
            <input
              id="plataforma"
              value={form.plataforma}
              onChange={(event) => updateField("plataforma", event.target.value)}
              placeholder="TikTok, Facebook, WhatsApp, X..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contenidoOriginal">Contenido original o descripción del viral</label>
            <textarea
              id="contenidoOriginal"
              value={form.contenidoOriginal}
              onChange={(event) => updateField("contenidoOriginal", event.target.value)}
              placeholder="Describe qué dice el post, video, imagen o cadena."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contexto">Contexto *</label>
            <textarea
              id="contexto"
              value={form.contexto}
              onChange={(event) => updateField("contexto", event.target.value)}
              placeholder="Explica por qué circula, cuándo apareció y qué lo vuelve relevante."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hallazgos">Hallazgos principales *</label>
            <textarea
              id="hallazgos"
              value={form.hallazgos}
              onChange={(event) => updateField("hallazgos", event.target.value)}
              placeholder="Resume lo más importante encontrado por el equipo."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verificaciones">Verificaciones realizadas *</label>
            <textarea
              id="verificaciones"
              value={form.verificaciones}
              onChange={(event) => updateField("verificaciones", event.target.value)}
              placeholder="Ej. búsqueda inversa, consulta a fuente oficial, revisión de fecha, entrevista, base de datos..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fuentes">Fuentes consultadas *</label>
            <textarea
              id="fuentes"
              value={form.fuentes}
              onChange={(event) => updateField("fuentes", event.target.value)}
              placeholder="Pega nombres de fuentes, enlaces o documentos usados."
              required
            />
            <div className="help">La IA solo debe usar estas fuentes; no debería inventar otras.</div>
          </div>

          <div className="form-group">
            <label htmlFor="notasEditoriales">Notas editoriales</label>
            <textarea
              id="notasEditoriales"
              value={form.notasEditoriales}
              onChange={(event) => updateField("notasEditoriales", event.target.value)}
              placeholder="Tono, extensión, cuidado legal, público objetivo, etc."
            />
          </div>

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Generando borrador..." : "Generar borrador"}
          </button>
        </form>

        <section className="card">
          <h2>Borrador generado</h2>

          {error ? <div className="error">{error}</div> : null}

          {!draft && !error ? (
            <p className="subtitle">El borrador aparecerá aquí después de enviar el formulario.</p>
          ) : null}

          {draft ? (
            <>
              <div className="actions">
                <button type="button" onClick={copyEditableText}>Copiar texto editable</button>
                <button type="button" onClick={() => setEditableText(fullDraftText)}>Restaurar versión generada</button>
              </div>

              <div className="output-block">
                <h3>Vista rápida</h3>
                <p><span className="badge">{draft.categoria}</span></p>
                <h3>{draft.titulo_sugerido}</h3>
                <p>{draft.bajada}</p>
              </div>

              <div className="output-block">
                <h3>Qué circula</h3>
                <p>{draft.que_circula}</p>
              </div>

              <div className="output-block">
                <h3>Cómo verificamos</h3>
                <p>{draft.como_verificamos}</p>
              </div>

              <div className="output-block">
                <h3>Evidencias clave</h3>
                {asList(draft.evidencias_clave)}
              </div>

              <div className="output-block">
                <h3>Conclusión</h3>
                <p>{draft.conclusion}</p>
              </div>

              <div className="output-block">
                <h3>Alertas editoriales</h3>
                {asList(draft.alertas_editoriales)}
              </div>

              <div className="form-group">
                <label htmlFor="editableText">Texto editable para copiar / pegar</label>
                <textarea
                  id="editableText"
                  className="large"
                  value={editableText}
                  onChange={(event) => setEditableText(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
