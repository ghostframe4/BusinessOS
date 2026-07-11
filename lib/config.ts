import { z } from "zod";

/**
 * Configuracao de ambiente validada por zod (falha cedo no boot se algo faltar).
 * Sem lib extra de env. Ver docs/04-technical-spec.md secao 10.
 */
const schema = z.object({
  // --- Conteudo (ativo hoje) ---
  CONTENT_STORE: z.enum(["file", "supabase"]).default("file"),
  CONTENT_ROOT: z.string().default("content"),
  FOUNDER_EMAIL: z.email().default("ruanbraz@overlens.com.br"),
});

export const config = schema.parse(process.env);

export type AppConfig = z.infer<typeof schema>;
