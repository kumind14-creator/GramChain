const { loadLocalEnv, getOpenAiApiKey, getOpenAiModel } = require("./env");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_TIMEOUT_MS = 8000;
const exampleCache = new Map();

function getTimeoutMs() {
  const rawValue = Number(process.env.OPENAI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_TIMEOUT_MS;
}

function isAiExampleGenerationEnabled() {
  loadLocalEnv();
  return Boolean(getOpenAiApiKey());
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeComparable(value) {
  return compactWhitespace(value).replace(/\s+/g, "");
}

function translationLooksTooGeneric(translationRu) {
  const normalized = compactWhitespace(translationRu).toLowerCase();
  if (!normalized) {
    return true;
  }

  const bannedFragments = [
    "планы изменились",
    "ситуация изменилась",
    "что-то изменилось",
    "все изменилось",
    "так получилось",
    "ситуация не такая уж серьезная",
    "в целом все в порядке",
    "дело обстоит именно так",
    "это действительно происходит",
    "именно так и есть"
  ];

  return bannedFragments.some((fragment) => normalized.includes(fragment));
}

function buildWordCandidates(exercise) {
  const lemma = compactWhitespace(exercise?.word?.lemma);
  if (!lemma) {
    return [];
  }

  const candidates = new Set([lemma]);

  if (lemma.endsWith("?")) {
    candidates.add(lemma.slice(0, -1));
  }

  return Array.from(candidates)
    .map((value) => normalizeComparable(value))
    .filter(Boolean);
}

function buildCacheKey(exercise) {
  return JSON.stringify({
    answer: exercise?.correctAnswer || "",
    wordId: exercise?.word?.id || "",
    wordLemma: exercise?.word?.lemma || "",
    order: Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder : [],
    selectedGrammarIds: Array.isArray(exercise?.selectedGrammarIds) ? exercise.selectedGrammarIds : []
  });
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) {
    return "";
  }

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        return contentItem.text.trim();
      }
    }
  }

  return "";
}

function parseStructuredExample(payload) {
  const outputText = extractOutputText(payload);
  if (!outputText) {
    return null;
  }

  try {
    const parsed = JSON.parse(outputText);
    return {
      sentenceKo: compactWhitespace(parsed.sentenceKo),
      translationRu: compactWhitespace(parsed.translationRu),
      shortNote: compactWhitespace(parsed.shortNote)
    };
  } catch (error) {
    return null;
  }
}

function validateAiExample(exercise, candidate) {
  if (!candidate?.sentenceKo || !candidate?.translationRu) {
    return false;
  }

  const normalizedSentence = normalizeComparable(candidate.sentenceKo);
  const normalizedAnswer = normalizeComparable(exercise?.correctAnswer);

  if (!normalizedSentence || !normalizedAnswer) {
    return false;
  }

  if (!normalizedSentence.includes(normalizedAnswer)) {
    return false;
  }

  const wordCandidates = buildWordCandidates(exercise);
  if (wordCandidates.length > 0 && !wordCandidates.some((value) => normalizedSentence.includes(value))) {
    return false;
  }

  if (compactWhitespace(candidate.sentenceKo) === compactWhitespace(exercise.correctAnswer)) {
    return false;
  }

  if (translationLooksTooGeneric(candidate.translationRu)) {
    return false;
  }

  return true;
}

function buildPrompt(exercise, fallbackExample) {
  const grammarChain = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join(" -> ") : "";
  const selectedGrammar = Array.isArray(exercise?.selectedGrammarIds) ? exercise.selectedGrammarIds.join(", ") : "";

  return [
    "Create one natural Korean example sentence for a Korean grammar learning app.",
    "The sentence must sound like normal everyday Korean.",
    `It must include this exact target phrase unchanged: ${exercise.correctAnswer}`,
    `Target lemma: ${exercise?.word?.lemma || ""}`,
    `Russian meaning of the lemma: ${exercise?.word?.meaningRu || ""}`,
    `Grammar chain ids: ${grammarChain}`,
    `Selected grammar ids: ${selectedGrammar}`,
    `Exercise explanation: ${exercise?.explanation || ""}`,
    fallbackExample?.sentence ? `Fallback local example for reference only: ${fallbackExample.sentence}` : "",
    "Return valid JSON only.",
    "sentenceKo must contain the exact target phrase and add natural context around it.",
    "Do not force topic markers like 는 or 은 when the sentence sounds more natural without them.",
    "Prefer plain time adverbs like 어제 or 아까 unless contrast is really needed.",
    "translationRu must be a natural Russian translation of the full sentence, not a word-for-word gloss.",
    "Avoid literal phrases like мне казалось, что мне хочется when simpler Russian sounds better.",
    "shortNote may briefly explain why the sentence sounds natural."
  ].filter(Boolean).join("\n");
}

function buildPromptV2(exercise, fallbackExample) {
  const grammarChain = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join(" -> ") : "";
  const selectedGrammar = Array.isArray(exercise?.selectedGrammarIds) ? exercise.selectedGrammarIds.join(", ") : "";

  return [
    "Create one natural Korean example sentence for a Korean grammar learning app.",
    "The sentence must sound like normal everyday Korean.",
    `It must include this exact target phrase unchanged: ${exercise.correctAnswer}`,
    `Target lemma: ${exercise?.word?.lemma || ""}`,
    `Russian meaning of the lemma: ${exercise?.word?.meaningRu || ""}`,
    `Grammar chain ids: ${grammarChain}`,
    `Selected grammar ids: ${selectedGrammar}`,
    `Exercise explanation: ${exercise?.explanation || ""}`,
    fallbackExample?.sentence ? `Fallback local example for reference only: ${fallbackExample.sentence}` : "",
    "Return valid JSON only.",
    "sentenceKo must contain the exact target phrase and add natural context around it.",
    "Use a natural Korean sentence that a native speaker could realistically say.",
    "Do not force unnecessary topic contrast if a simpler sentence is more natural.",
    "Prefer simple time adverbs like 어제, 오늘, 아까, 지금 when they fit.",
    "translationRu must be a natural Russian translation of the whole sentence, not a word-for-word gloss.",
    "translationRu must preserve the concrete action and the concrete result of the Korean sentence.",
    "If the Korean sentence says someone did not intend, did not want, or tried not to do X but eventually did Y, the Russian translation must mention both X and Y explicitly.",
    "Never replace concrete actions with vague summaries like 'планы изменились', 'ситуация изменилась', 'что-то произошло' or similar paraphrases.",
    "Avoid unnatural literal Russian such as 'мне хотелось любить', 'я не собираюсь встать', or 'мне казалось, что мне хочется'.",
    "Good Russian translation example: Вчера я не собиралась вставать рано, но в итоге осталась отдыхать дома.",
    "Bad Russian translation example: Вчера я не собираюсь встать пораньше, но потом планы изменились.",
    "shortNote may briefly explain why the sentence sounds natural."
  ].filter(Boolean).join("\n");
}

async function requestAiExample(exercise, fallbackExample) {
  loadLocalEnv();

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return null;
  }

  const model = getOpenAiModel() || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: buildPromptV2(exercise, fallbackExample),
        reasoning: {
          effort: "low"
        },
        temperature: 0.3,
        max_output_tokens: 220,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "grammar_example",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                sentenceKo: {
                  type: "string"
                },
                translationRu: {
                  type: "string"
                },
                shortNote: {
                  type: "string"
                }
              },
              required: ["sentenceKo", "translationRu"]
            }
          }
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`OpenAI API returned ${response.status}${errorText ? `: ${errorText}` : ""}`);
    }

    const payload = await response.json();
    const candidate = parseStructuredExample(payload);

    if (!validateAiExample(exercise, candidate)) {
      return null;
    }

    return {
      sentence: candidate.sentenceKo,
      meaningRu: candidate.translationRu,
      naturalnessNote: candidate.shortNote || "",
      sourceType: "ai_generated",
      sourceLabel: `OpenAI (${model})`
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiExampleForExercise(exercise, options = {}) {
  if (!exercise?.ok || !exercise?.correctAnswer) {
    return null;
  }

  if (!isAiExampleGenerationEnabled()) {
    return null;
  }

  const cacheKey = buildCacheKey(exercise);
  const cached = exampleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const aiExample = await requestAiExample(exercise, options.fallbackExample || null);
    if (!aiExample) {
      return null;
    }

    exampleCache.set(cacheKey, aiExample);
    return aiExample;
  } catch (error) {
    console.warn("Failed to generate AI example, using fallback:", error.message || error);
    return null;
  }
}

module.exports = {
  generateAiExampleForExercise,
  isAiExampleGenerationEnabled
};
