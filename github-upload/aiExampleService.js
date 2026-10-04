const { loadLocalEnv, getOpenAiApiKey, getOpenAiModel } = require("./env");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_TIMEOUT_MS = 20000;
const TRANSLATION_POLICY_VERSION = "v11-varied-examples";
const MAX_GENERATION_ATTEMPTS = 3;
const exampleCache = new Map();
const recentExamplesByGroup = new Map();
const CONTEXT_ANGLES = {
  time: "Use a specific time or everyday routine as context; vary the opening.",
  place: "Use a concrete place or setting naturally suited to the word.",
  person: "Use an appropriate participant or shared activity, respecting Korean person restrictions.",
  object: "Use a specific object or topic suited to the word; for adjectives, describe a concrete subject.",
  occasion: "Use a simple occasion or purpose suited to the word, without inventing an obstacle or reversal."
};
let lastGenerationFailure = null;
let lastGenerationFailureDetail = null;

function getTimeoutMs() {
  const rawValue = Number(process.env.OPENAI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_TIMEOUT_MS;
}

function isAiExampleGenerationEnabled() {
  loadLocalEnv();
  return Boolean(getOpenAiApiKey());
}

function getAiExampleGenerationStatus() {
  return {
    enabled: isAiExampleGenerationEnabled(),
    failure: lastGenerationFailure,
    detail: lastGenerationFailureDetail
  };
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

function translationLooksTooLiteral(translationRu) {
  const normalized = compactWhitespace(translationRu).toLowerCase();

  // "Мне хотелось слушать" mirrors Korean grammar but sounds stilted in these short examples.
  return /\bмне хотелось\s+\S+(ть|ти|чь)\b/u.test(normalized);
}

function hasCyrillic(value) {
  return /[А-Яа-яЁё]/u.test(String(value || ""));
}

function hasLatin(value) {
  return /[A-Za-z]/u.test(String(value || ""));
}

function hasKorean(value) {
  return /[\uAC00-\uD7A3]/u.test(String(value || ""));
}

function isBarePastWishOrPlan(exercise, sentenceKo) {
  const answer = compactWhitespace(exercise?.correctAnswer);
  if (!/(고 싶었어요|려고 했어요)$/u.test(answer)) {
    return false;
  }

  const prefix = compactWhitespace(sentenceKo)
    .replace(answer, "")
    .replace(/[.?!]/g, "")
    .trim();

  // A past wish or plan needs a concrete reason, obstacle, or outcome. A bare
  // time phrase plus object (for example, "어제 문을 닫고 싶었어요") is not enough.
  const contextMarkers = /서|지만|는데|으니까|니까|때문에|고 나서|후에|다가|그래서/u;
  return !contextMarkers.test(prefix);
}

function containsKnownTemplateFiller(sentenceKo) {
  const normalized = compactWhitespace(sentenceKo);
  return [
    "바로 연락해 주세요",
    "집에서 조용히 쉴 거예요",
    "결국 집에서 쉬었어요",
    "잠깐 혼자 있고 싶어요"
  ].some((fragment) => normalized.includes(fragment));
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
    translationPolicyVersion: TRANSLATION_POLICY_VERSION,
    variationId: exercise?.exampleVariation?.id || "",
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
      targetRu: compactWhitespace(parsed.targetRu),
      translationEn: compactWhitespace(parsed.translationEn),
      targetEn: compactWhitespace(parsed.targetEn),
      shortNote: compactWhitespace(parsed.shortNote)
    };
  } catch (error) {
    return null;
  }
}

function validateAiExample(exercise, candidate) {
  if (!candidate?.sentenceKo || !candidate?.translationRu || !candidate?.targetRu || !candidate?.translationEn || !candidate?.targetEn) {
    return false;
  }

  if (!hasKorean(candidate.sentenceKo) || !hasCyrillic(candidate.translationRu) || !hasLatin(candidate.translationEn)) {
    return false;
  }

  if (candidate.sentenceKo.length < 12 || candidate.sentenceKo.length > 80 || candidate.translationRu.length < 12 || candidate.translationEn.length < 12) {
    return false;
  }

  // Keep the situation and both translations short enough for one exercise.
  if (compactWhitespace(candidate.sentenceKo).split(" ").length > 14 ||
      [candidate.translationRu, candidate.translationEn].some((text) =>
        compactWhitespace(text).split(" ").length > 28 || text.length > 220)) {
    return false;
  }
  if (![candidate.sentenceKo, candidate.translationRu, candidate.translationEn]
      .every((text) => /^[^.!?。！？]+[.!?。！？]$/u.test(compactWhitespace(text)))) {
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

  // A completed polite target ends the sentence; it cannot be joined with a comma.
  if (normalizedAnswer.endsWith("요") &&
      !normalizedSentence.endsWith(`${normalizedAnswer}.`)) {
    return false;
  }

  // The exact completed answer already contains the conjugated target word.
  // Do not additionally require the dictionary form (for example, 재미없다
  // is correctly realized as 재미없어지는 in a completed exercise).

  if (compactWhitespace(candidate.sentenceKo) === compactWhitespace(exercise.correctAnswer)) {
    return false;
  }

  if (containsKnownTemplateFiller(candidate.sentenceKo)) {
    return false;
  }

  const contrastRequired = (exercise?.resolvedOrder || exercise?.selectedGrammarIds || []).includes("jiman");
  if (!contrastRequired && (
    /지만|하지만|그런데|그러나|는데도|에도 불구하고/u.test(candidate.sentenceKo) ||
    /\b(but|however|although|nevertheless)\b/i.test(candidate.translationEn) ||
    /(?:^|[\s,;])(?:но|однако|хотя|зато)(?=[\s,;.!?]|$)/iu.test(candidate.translationRu)
  )) {
    return false;
  }

  if (!candidate.translationRu.includes(candidate.targetRu)) {
    return false;
  }

  if (!candidate.translationEn.includes(candidate.targetEn)) {
    return false;
  }

  const lastGrammarId = exercise?.resolvedOrder?.[exercise.resolvedOrder.length - 1];
  if (lastGrammarId === "myeon_eumyeon") {
    const answerIndex = normalizedSentence.indexOf(normalizedAnswer);
    const followingText = answerIndex === -1
      ? ""
      : normalizedSentence.slice(answerIndex + normalizedAnswer.length);

    // -면/으면 is a conditional connector, never a polite sentence ending.
    if (followingText.startsWith("요") || followingText.length < 2) {
      return false;
    }
  }

  if (translationLooksTooGeneric(candidate.translationRu)) {
    return false;
  }

  if (translationLooksTooLiteral(candidate.translationRu)) {
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
    "targetRu must be an exact continuous fragment of translationRu that conveys the target Korean phrase.",
    "translationEn must be a natural English translation of the full sentence.",
    "targetEn must be an exact continuous fragment of translationEn that conveys the target Korean phrase.",
    "Avoid literal phrases like мне казалось, что мне хочется when simpler Russian sounds better.",
    "shortNote may briefly explain why the sentence sounds natural."
  ].filter(Boolean).join("\n");
}

function buildPromptV2(exercise, fallbackExample) {
  const grammarChain = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join(" -> ") : "";
  const selectedGrammar = Array.isArray(exercise?.selectedGrammarIds) ? exercise.selectedGrammarIds.join(", ") : "";
  const angle = CONTEXT_ANGLES[exercise?.exampleVariation?.angle] || CONTEXT_ANGLES.object;
  const recent = recentExamplesByGroup.get(exercise?.exampleVariation?.groupId) || [];

  return [
    "Create one natural Korean example sentence for a Korean grammar learning app.",
    "The sentence must sound like normal everyday Korean.",
    "Write exactly ONE short sentence: at most 14 Korean space-separated words and 80 characters. Each translation must be one sentence, at most 28 words and 220 characters.",
    "Use only one simple context detail. Do not append a second event, contrast, obstacle, or outcome after the target phrase.",
    "If the exact target ends in 요, put it at the END of the Korean sentence followed immediately by a period. Never write 요, 하지만 or join complete sentences with a comma.",
    "If the target is a connector such as -지만, -아서/어서, -면/으면 or -(으)ㄹ 때, complete it with one brief main clause. Do not put a period immediately after an unfinished connector.",
    `Context focus for this exercise: ${angle}`,
    "Vary the setting, participants, opening and sentence structure. Do not merely substitute a new verb into a fixed sentence template.",
    "Add contrast ONLY if the selected grammar chain contains jiman (-지만). Otherwise do not use 하지만, 그런데, 그러나, extra -지만, but, however, although, но or хотя.",
    "Do not add a reason or an outcome unless the selected grammar requires it. A simple time, place or object can provide sufficient context.",
    recent.length ? `Recent examples in this practice set (avoid their opening and sentence frame): ${JSON.stringify(recent)}` : "",
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
    "Do not start every example with a time adverb; follow the context focus when natural.",
    "translationRu must be a natural Russian translation of the whole sentence, not a word-for-word gloss.",
    "translationRu must preserve the concrete action and the concrete result of the Korean sentence.",
    "targetRu must be an exact continuous fragment of translationRu that conveys the target Korean phrase. It will be underlined for the learner, so keep it short and meaningful.",
    "translationEn must be a natural English translation of the whole sentence.",
    "targetEn must be an exact continuous fragment of translationEn that conveys the target Korean phrase. It will be underlined for the learner, so keep it short and meaningful.",
    "Never replace concrete actions with vague summaries like 'планы изменились', 'ситуация изменилась', 'что-то произошло' or similar paraphrases.",
    "Avoid unnatural literal Russian such as 'мне хотелось любить', 'я не собираюсь встать', or 'мне казалось, что мне хочется'.",
    "Do not use 'мне хотелось + infinitive' as a default translation of a past desire. Prefer a natural neutral Russian form such as 'Вчера хотелось послушать любимую музыку.' or a clear personal form such as 'Вчера я хотел(а) посмотреть фильм.'",
    "If the chain ends in -면/으면, the target phrase is a conditional connector: never add 요 after it and always add a natural consequence after the condition.",
    "For -고 싶다 + -(으)ㄴ 것 같다 + -면, prefer a natural third-person context and a brief main clause.",
    "Past desire or intention does not require an obstacle, a reason or an unrealized outcome. A brief concrete statement is acceptable.",
    "Never use generic filler such as '바로 연락해 주세요', '결국 집에서 쉬었어요', or '집에서 조용히 쉴 거예요' unless it is genuinely required by the context.",
    "Before returning, silently verify that the Korean sentence, Russian translation, and English translation describe the same concrete situation.",
    "Return no generic practice-template text. The sentence must be specific enough to be a useful situation before the learner answers.",
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
        // Includes reasoning as well as the Korean example and both translations.
        max_output_tokens: 2000,
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
                targetRu: {
                  type: "string"
                },
                translationEn: {
                  type: "string"
                },
                targetEn: {
                  type: "string"
                },
                shortNote: {
                  type: "string"
                }
              },
              required: ["sentenceKo", "translationRu", "targetRu", "translationEn", "targetEn", "shortNote"]
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
    if (payload.status === "incomplete") {
      throw new Error(`OpenAI response incomplete: ${payload.incomplete_details?.reason || "unknown reason"}.`);
    }
    if (payload.status === "failed" || payload.error) {
      throw new Error(`OpenAI response failed: ${payload.error?.code || "unknown error"}.`);
    }
    if (!extractOutputText(payload)) {
      throw new Error("OpenAI returned no example text.");
    }
    const candidate = parseStructuredExample(payload);
    if (!candidate) {
      throw new Error("OpenAI example could not be parsed as JSON.");
    }

    if (!validateAiExample(exercise, candidate)) {
      return null;
    }

    return {
      sentence: candidate.sentenceKo,
      meaningRu: candidate.translationRu,
      targetRu: candidate.targetRu,
      meaningEn: candidate.translationEn,
      targetEn: candidate.targetEn,
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
    lastGenerationFailure = "not_configured";
    lastGenerationFailureDetail = "OPENAI_API_KEY is not configured.";
    return null;
  }

  const cacheKey = buildCacheKey(exercise);
  const cached = exampleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const aiExample = await requestAiExample(exercise, options.fallbackExample || null);
      if (aiExample) {
        if (exampleCache.size >= 300) exampleCache.delete(exampleCache.keys().next().value);
        exampleCache.set(cacheKey, aiExample);
        const groupId = exercise?.exampleVariation?.groupId;
        if (groupId) {
          if (!recentExamplesByGroup.has(groupId) && recentExamplesByGroup.size >= 100) {
            recentExamplesByGroup.delete(recentExamplesByGroup.keys().next().value);
          }
          const recent = recentExamplesByGroup.get(groupId) || [];
          recentExamplesByGroup.set(groupId, [...recent, aiExample.sentence].slice(-4));
        }
        lastGenerationFailure = null;
        lastGenerationFailureDetail = null;
        return aiExample;
      }

      lastError = "The AI response did not pass the example-quality validation.";
    } catch (error) {
      console.warn(`AI example attempt ${attempt} failed:`, error.message || error);
      lastError = error.message || String(error);
    }
  }

  lastGenerationFailure = "generation_failed";
  lastGenerationFailureDetail = `No valid AI example after ${MAX_GENERATION_ATTEMPTS} attempts. ${lastError || ""}`.trim();
  return null;
}

module.exports = {
  generateAiExampleForExercise,
  isAiExampleGenerationEnabled,
  getAiExampleGenerationStatus,
  validateAiExample
};
