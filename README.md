# Redactor IA de verificaciones — MVP ChequeaBolivia

Primera versión mínima para probar en Vercel.

## Qué hace

- Muestra un formulario con datos editoriales básicos.
- Envía esos datos a una ruta backend de Next.js.
- Llama a la API de OpenAI desde el servidor, sin exponer la API key en el navegador.
- Devuelve un borrador estructurado y editable.

## Qué NO hace todavía

- No guarda verificaciones en base de datos.
- No exporta a Drupal o Word.
- No usa ejemplos previos de ChequeaBolivia.
- No reemplaza revisión humana.

## Variable obligatoria en Vercel

En el proyecto de Vercel crea esta variable de entorno:

```bash
OPENAI_API_KEY=tu_api_key_aqui
```

Opcionalmente puedes crear:

```bash
OPENAI_MODEL=gpt-4.1-mini
```

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

1. Sube este proyecto a GitHub.
2. En Vercel, crea un nuevo proyecto desde ese repositorio.
3. Agrega `OPENAI_API_KEY` en Settings > Environment Variables.
4. Deploy.

## Siguiente módulo sugerido

Después de probar este flujo, el siguiente paso es ajustar el prompt editorial con ejemplos reales de ChequeaBolivia y una estructura definitiva de verificación.
