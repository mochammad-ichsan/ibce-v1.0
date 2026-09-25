import OpenAI from "openai";
import type { AnnotationItem, MyGeneAnnotation } from "./mygene.js";
import { logger } from "../lib/logger.js";

export type IbceLocale = "en" | "id";

export interface IbceLocalizationState {
  requestedLocale: IbceLocale;
  resolvedLocale: IbceLocale;
  status: "source" | "translated" | "fallback";
}

export interface LocalizedMyGeneAnnotation extends MyGeneAnnotation {
  originalName: string;
  originalSummary: string | null;
  biologicalProcesses: Array<AnnotationItem & { originalName: string }>;
  molecularFunctions: Array<AnnotationItem & { originalName: string }>;
  cellularComponents: Array<AnnotationItem & { originalName: string }>;
  pathways: Array<AnnotationItem & { originalName: string }>;
  localization: IbceLocalizationState;
}

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 10_000;
const MAX_TEXTS_PER_REQUEST = 50;
const MAX_TEXT_LENGTH = 4_000;
const MAX_TOTAL_TEXT_LENGTH = 30_000;
const translationCache = new Map<string, CacheEntry>();
const pendingTranslations = new Map<string, Promise<void>>();

function readCached(text: string): string | undefined {
  const entry = translationCache.get(text);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    translationCache.delete(text);
    return undefined;
  }
  translationCache.delete(text);
  translationCache.set(text, entry);
  return entry.value;
}

function writeCached(text: string, value: string): void {
  translationCache.delete(text);
  translationCache.set(text, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  while (translationCache.size > MAX_CACHE_ENTRIES) {
    const oldest = translationCache.keys().next().value;
    if (oldest === undefined) break;
    translationCache.delete(oldest);
  }
}

const client = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ? new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    })
  : null;

function sourceAnnotation(annotation: MyGeneAnnotation, status: "source" | "fallback"): LocalizedMyGeneAnnotation {
  const preserve = (items: AnnotationItem[]) => items.map((item) => ({ ...item, originalName: item.name }));
  return {
    ...annotation,
    originalName: annotation.name,
    originalSummary: annotation.summary,
    biologicalProcesses: preserve(annotation.biologicalProcesses),
    molecularFunctions: preserve(annotation.molecularFunctions),
    cellularComponents: preserve(annotation.cellularComponents),
    pathways: preserve(annotation.pathways),
    localization: {
      requestedLocale: status === "source" ? "en" : "id",
      resolvedLocale: "en",
      status,
    },
  };
}

function collectTexts(annotation: MyGeneAnnotation): string[] {
  return [
    annotation.name,
    annotation.summary,
    ...annotation.biologicalProcesses.map((item) => item.name),
    ...annotation.molecularFunctions.map((item) => item.name),
    ...annotation.cellularComponents.map((item) => item.name),
    ...annotation.pathways.map((item) => item.name),
  ].filter((text): text is string => Boolean(text?.trim()));
}

async function translateMissing(texts: string[]): Promise<void> {
  const unique = [...new Set(texts)];
  if (
    unique.length > MAX_TEXTS_PER_REQUEST
    || unique.some((text) => text.length > MAX_TEXT_LENGTH)
    || unique.reduce((sum, text) => sum + text.length, 0) > MAX_TOTAL_TEXT_LENGTH
  ) {
    throw new Error("Translation input exceeds IBCE safety limits");
  }
  const missing = unique.filter((text) => readCached(text) === undefined);
  if (!missing.length || !client) return;

  const pendingKey = JSON.stringify(missing);
  const existing = pendingTranslations.get(pendingKey);
  if (existing) return existing;

  const request = (async () => {
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Translate biomedical English into precise, natural Indonesian. Preserve gene symbols, identifiers, database names, abbreviations, units, and established scientific notation exactly. Return only JSON with a translations array in the same order. Do not add claims or explanations.",
        },
        {
          role: "user",
          content: JSON.stringify({ texts: missing }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Translation service returned no content");
    const parsed = JSON.parse(content) as { translations?: unknown };
    if (!Array.isArray(parsed.translations) || parsed.translations.length !== missing.length) {
      throw new Error("Translation service returned an invalid translation set");
    }
    parsed.translations.forEach((translated, index) => {
      if (typeof translated !== "string" || !translated.trim()) {
        throw new Error("Translation service returned an invalid translation value");
      }
      writeCached(missing[index]!, translated.trim());
    });
  })();
  pendingTranslations.set(pendingKey, request);
  try {
    await request;
  } finally {
    pendingTranslations.delete(pendingKey);
  }
}

export async function localizeMyGeneAnnotation(
  annotation: MyGeneAnnotation,
  locale: IbceLocale,
): Promise<LocalizedMyGeneAnnotation> {
  if (locale === "en") return sourceAnnotation(annotation, "source");
  if (!client) return sourceAnnotation(annotation, "fallback");

  const texts = collectTexts(annotation);
  if (texts.some((text) => readCached(text) === undefined)) {
    void translateMissing(texts).catch((err: unknown) => {
      logger.warn({ err }, "IBCE annotation background translation failed");
    });
    return sourceAnnotation(annotation, "fallback");
  }

  try {
    const localizeItems = (items: AnnotationItem[]) => items.map((item) => ({
      ...item,
      originalName: item.name,
      name: readCached(item.name) ?? item.name,
    }));
    return {
      ...annotation,
      originalName: annotation.name,
      name: readCached(annotation.name) ?? annotation.name,
      originalSummary: annotation.summary,
      summary: annotation.summary
        ? readCached(annotation.summary) ?? annotation.summary
        : null,
      biologicalProcesses: localizeItems(annotation.biologicalProcesses),
      molecularFunctions: localizeItems(annotation.molecularFunctions),
      cellularComponents: localizeItems(annotation.cellularComponents),
      pathways: localizeItems(annotation.pathways),
      localization: {
        requestedLocale: "id",
        resolvedLocale: "id",
        status: "translated",
      },
    };
  } catch (err) {
    logger.warn({ err }, "IBCE annotation translation fallback");
    return sourceAnnotation(annotation, "fallback");
  }
}