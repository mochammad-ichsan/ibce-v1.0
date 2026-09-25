import OpenAI from "openai";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

const panelSchema = z.enum(["ihc", "prognosis", "cellLine", "patientRna", "functional"]);
const text = (max: number) => z.string().trim().min(1).max(max);
const subjectSchema = z.object({
  gene: text(80),
  summary: z.string().trim().max(2_000).optional(),
  observations: z.array(text(700)).min(1).max(40),
});
export const interpretationInputSchema = z.object({
  panel: panelSchema,
  locale: z.enum(["en", "id"]),
  primary: subjectSchema,
  comparison: subjectSchema.optional(),
}).strict();

export type InterpretationInput = z.infer<typeof interpretationInputSchema>;
export type InterpretationResult = {
  source: "ai" | "unavailable";
  interpretation: string;
  caveats: string[];
  compared: boolean;
};

const MAX_BODY_CHARS = 24_000;
const MAX_OUTPUT_CHARS = 2_400;
const MAX_CAVEATS = 6;
const REQUEST_TIMEOUT_MS = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();
const cache = new Map<string, { value: InterpretationResult; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

const unavailable = (compared: boolean): InterpretationResult => ({
  source: "unavailable",
  interpretation:
    "AI interpretation is unavailable. Review the displayed measurements and their source metadata directly.",
  caveats: [
    "This feature provides educational context, not a diagnosis or treatment recommendation.",
    "Expression, staining, pathway membership, and survival association are observational and do not establish causation.",
  ],
  compared,
});

function client(): OpenAI | null {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  return baseURL && apiKey ? new OpenAI({ baseURL, apiKey, timeout: REQUEST_TIMEOUT_MS }) : null;
}

function allowedRequest(ip: string): boolean {
  const now = Date.now();
  const old = attempts.get(ip);
  if (!old || old.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  old.count += 1;
  return old.count <= RATE_LIMIT;
}

function normalize(input: InterpretationInput): string {
  const clean = (subject: InterpretationInput["primary"]) => ({
    gene: subject.gene.trim().toUpperCase(),
    summary: subject.summary?.trim() ?? "",
    observations: [...subject.observations].map((item) => item.trim()).sort(),
  });
  return JSON.stringify({
    panel: input.panel,
    locale: input.locale,
    primary: clean(input.primary),
    comparison: input.comparison ? clean(input.comparison) : null,
  });
}

/**
 * Patient/sample identifiers are not needed to explain aggregate panel results.
 * Rejecting them here prevents accidental transmission to the model.
 */
function containsIdentifier(value: string): boolean {
  return /\b(?:TCGA[-_][A-Z0-9-]+|patient\s*(?:id|identifier)|sample\s*(?:id|identifier)|donor\s*(?:id|identifier))\b/i.test(value);
}

function safeInput(input: InterpretationInput): boolean {
  const values = [input.primary.summary ?? "", ...input.primary.observations];
  if (input.comparison) values.push(input.comparison.summary ?? "", ...input.comparison.observations);
  return !values.some(containsIdentifier);
}

function parseModel(content: string, compared: boolean): InterpretationResult | null {
  try {
    const value = JSON.parse(content) as { interpretation?: unknown; caveats?: unknown };
    if (
      typeof value.interpretation !== "string" ||
      !value.interpretation.trim() ||
      value.interpretation.length > MAX_OUTPUT_CHARS ||
      !Array.isArray(value.caveats) ||
      value.caveats.length > MAX_CAVEATS ||
      value.caveats.some((item) => typeof item !== "string" || !item.trim() || item.length > 500)
    ) return null;
    const interpretation = value.interpretation.trim();
    const caveats = value.caveats.map((item) => item.trim());
    if (containsIdentifier(interpretation) || caveats.some(containsIdentifier)) return null;
    return {
      source: "ai",
      interpretation,
      caveats,
      compared,
    };
  } catch {
    return null;
  }
}

async function generate(input: InterpretationInput): Promise<InterpretationResult> {
  const compared = Boolean(input.comparison);
  const key = normalize(input);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) cache.delete(key);

  const ai = client();
  if (!ai) return unavailable(compared);

  const language = input.locale === "id" ? "Indonesian" : "English";
  const prompt = {
    panel: input.panel,
    primary: input.primary,
    comparison: input.comparison ?? null,
  };
  try {
    const completion = await ai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a cautious biomedical data educator. Respond only with JSON: {"interpretation":"string","caveats":["string"]}. Write in ${language}. Explain only the supplied observations; do not invent values, citations, mechanisms, or missing context. Clearly separate what is observed from limitations. Never make causal, diagnostic, prognostic, or therapeutic claims. Do not equate expression with protein activity or survival, and do not imply that a pathway annotation proves activation. For a comparison, describe only cautious observed differences or overlap and mention when data are not directly comparable. Keep the interpretation concise (under 120 words) and caveats under 6 items. Do not repeat identifiers or raw observation lists.`,
        },
        { role: "user", content: JSON.stringify(prompt) },
      ],
    }, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const parsed = parseModel(completion.choices[0]?.message?.content ?? "", compared);
    if (!parsed) return unavailable(compared);
    cache.set(key, { value: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
    if (cache.size > 2_000) cache.delete(cache.keys().next().value!);
    return parsed;
  } catch {
    return unavailable(compared);
  }
}

export async function createInterpretation(req: Request, res: Response): Promise<void> {
  const raw = JSON.stringify(req.body ?? {});
  const parsed = interpretationInputSchema.safeParse(req.body);
  if (raw.length > MAX_BODY_CHARS || !parsed.success || !safeInput(parsed.data)) {
    res.status(400).json({ error: "Invalid interpretation request" });
    return;
  }
  if (!allowedRequest(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Too many interpretation requests" });
    return;
  }
  res.json(await generate(parsed.data));
}

router.post("/", createInterpretation);
export { router };
export default router;