import { z } from "zod";

/**
 * Configuracao de ambiente validada por zod (falha cedo no boot se algo faltar).
 * Sem lib extra de env. Ver docs/04-technical-spec.md secao 10 e ADR 0001.
 *
 * IMPORTANTE: este modulo e SERVER-ONLY (le chaves secretas). Client components
 * nunca devem importa-lo; o browser le `NEXT_PUBLIC_*` direto de `process.env`
 * (o Next inlina essas no bundle). Ver lib/supabase/client.ts.
 */

/**
 * Trata string vazia como ausente. `.env` frequentemente carrega chaves com valor
 * vazio (ex.: `ANTHROPIC_API_KEY=`) como placeholder — isso e "nao configurado",
 * nao um valor invalido. Sem isto, `""` presente falharia o `.min(1)`.
 */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const schema = z
  .object({
    // --- Conteudo ---
    CONTENT_STORE: z.enum(["file", "supabase"]).default("file"),
    CONTENT_ROOT: z.string().default("content"),
    FOUNDER_EMAIL: z.email().default("ruanbraz@overlens.com.br"),

    // --- Supabase (obrigatorias quando CONTENT_STORE=supabase) ---
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
      emptyToUndefined,
      z.string().url().optional(),
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),

    // --- IA (cabo solto: presenca da chave liga a IA no runtime) ---
    ANTHROPIC_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    // Chat da pagina Principal (ChatGPT/OpenAI). Cabo solto proprio.
    OPENAI_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    // Embeddings do RAG (Google gemini-embedding-001). Cabo solto proprio.
    GOOGLE_GENERATIVE_AI_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),

    // --- Storage ---
    SUPABASE_STORAGE_BUCKET: z.string().default("attachments"),
  })
  .refine(
    (c) =>
      c.CONTENT_STORE !== "supabase" ||
      (c.NEXT_PUBLIC_SUPABASE_URL &&
        c.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        c.SUPABASE_SERVICE_ROLE_KEY),
    {
      message:
        "CONTENT_STORE=supabase exige NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
      path: ["CONTENT_STORE"],
    },
  );

export const config = schema.parse(process.env);

export type AppConfig = z.infer<typeof schema>;

/** A IA esta ligada? (cabo solto — liga sozinho quando a ANTHROPIC_API_KEY existe.) */
export const AI_ENABLED = Boolean(config.ANTHROPIC_API_KEY);

/** O chat da pagina Principal esta ligado? (cabo solto — OPENAI_API_KEY.) */
export const CHAT_ENABLED = Boolean(config.OPENAI_API_KEY);

/** O RAG (embeddings + base de conhecimento) esta ligado? (cabo solto — GOOGLE_GENERATIVE_AI_API_KEY.) */
export const RAG_ENABLED = Boolean(config.GOOGLE_GENERATIVE_AI_API_KEY);
