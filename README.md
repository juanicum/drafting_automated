# Agente editorial IA — ChequeaBolivia v2

Versión inicial para probar en Vercel con:

- Chat guiado con un agente editorial.
- Ficha estructurada según la nueva estructura de redacción de ChequeaBolivia.
- Generación de borrador con 6 secciones editoriales.
- Guardado opcional en Supabase.
- Aprobación de versiones finales para que se usen como ejemplos editoriales futuros.

## Estructura editorial incluida

1. Titular con conclusión.
2. Explicación del contexto.
3. Qué circula.
4. Qué verificamos.
5. Hallazgos con evidencia.
6. Conclusión con categoría y evidencia.

## Variables de entorno en Vercel

Obligatoria:

```bash
OPENAI_API_KEY=tu_api_key_aqui
```

Opcional:

```bash
OPENAI_MODEL=gpt-4.1-mini
```

Para guardar en base de datos:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

Sin Supabase configurado, la herramienta igual funciona para conversar y generar borradores, pero no guardará casos ni ejemplos editoriales.

## Crear la base de datos en Supabase

1. Crea un proyecto en Supabase.
2. Entra a SQL Editor.
3. Copia y ejecuta el contenido de `supabase/schema.sql`.
4. En Project Settings > API copia:
   - Project URL → `SUPABASE_URL`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Pega esas variables en Vercel > Settings > Environment Variables.
6. Haz redeploy.

## Probar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Luego abre:

```bash
http://localhost:3000
```

## Subir a Vercel

1. Sube esta carpeta a GitHub.
2. En Vercel, importa el repositorio.
3. Agrega las variables de entorno.
4. Deploy.

## Cómo funciona el “aprendizaje” en esta versión

No entrena un modelo propio. La herramienta guarda versiones aprobadas por el editor en `style_examples`. Luego, cuando genera un nuevo borrador, busca ejemplos aprobados de la misma categoría y los usa como referencia de estilo, sin copiar datos.

Esto evita que la herramienta aprenda automáticamente de borradores incompletos o errores no revisados.
