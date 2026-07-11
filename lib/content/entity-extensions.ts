import { z } from "zod";

/**
 * Campos por-tipo (opcionais) por entidade (docs/02-content-model.md §8.2).
 * Vivem no nivel plano do frontmatter; validados por extensao combinada ao schema
 * base via `frontmatterSchema.and(getExtension(id))`. Todos opcionais.
 *
 * Nota: os objetos de extensao ficam em modo "strip" (default do z.object) — na
 * intersecao com o schema base (que tem catchall), o base retem TODAS as chaves e
 * a extensao apenas valida/tipa os campos por-tipo declarados aqui.
 */
export const ENTITY_EXTENSIONS: Record<string, z.ZodType> = {
  "founder/objetivo": z.object({
    time_horizon: z.string().optional(),
    north_star_metric: z.string().optional(),
  }),
  "founder/estilo-de-vida": z.object({
    target_income_month: z.number().optional(),
    work_hours_week: z.number().optional(),
  }),
  "direcao/mapa-do-mercado": z.object({
    market: z.string().optional(),
    maturity: z.enum(["nascent", "growing", "mature"]).optional(),
  }),
  "direcao/ima-de-problemas": z.object({
    top_problem: z.string().optional(),
  }),
  "direcao/perfil-ideal-de-cliente": z.object({
    segment: z.string().optional(),
    persona: z.string().optional(),
  }),
  "direcao/tese-de-valor": z.object({
    hypothesis: z.string().optional(),
    confidence: z.enum(["low", "medium", "high"]).optional(),
  }),
  "direcao/oferta": z.object({
    pricing_model: z.string().optional(),
    price: z.number().optional(),
  }),
  "validacao/oferta": z.object({
    experiments_run: z.number().optional(),
    conversion_rate: z.number().min(0).max(1).optional(),
  }),
  "validacao/primeiros-clientes": z.object({
    customers_count: z.number().optional(),
    paying_count: z.number().optional(),
  }),
  "caixa/fluxo-de-caixa": z.object({
    currency: z.string().optional(),
    net_month: z.number().optional(),
    runway_months: z.number().optional(),
  }),
  "caixa/erp": z.object({
    system_name: z.string().optional(),
    tax_regime: z.string().optional(),
  }),
};

/** Extensao por-tipo de um id, ou um objeto vazio se a entidade nao tiver campos por-tipo. */
export function getExtension(id: string): z.ZodType {
  return ENTITY_EXTENSIONS[id] ?? z.object({});
}
