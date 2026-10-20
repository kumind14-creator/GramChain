const path = require("path");

const BANK_FILE = path.join(__dirname, "GramChain-full-example-bank.json");
let examplesByKey = null;

function buildKey(wordId, grammarIds) {
  return `${wordId}|${grammarIds.join(">")}`;
}

function loadBank() {
  if (examplesByKey) {
    return examplesByKey;
  }

  examplesByKey = new Map();
  try {
    const bank = require(BANK_FILE);
    for (const entry of bank.examples || []) {
      const key = buildKey(entry.wordId, entry.grammarIds || []);
      if (!examplesByKey.has(key)) examplesByKey.set(key, []);
      examplesByKey.get(key).push(entry);
    }
  } catch (error) {
    console.warn("Example bank could not be loaded:", error.message || error);
  }
  return examplesByKey;
}

function getExampleBankSize() {
  let total = 0;
  for (const entries of loadBank().values()) total += entries.length;
  return total;
}

// The same exercise must get the same variant for the context request and
// for the later answer check, so the choice depends on the variation id.
function pickVariant(entries, exercise) {
  if (entries.length === 1) return entries[0];
  const seed = String(exercise?.exampleVariation?.id || exercise?.correctAnswer || "");
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return entries[hash % entries.length];
}

function getBankExampleForExercise(exercise) {
  const wordId = exercise?.word?.id;
  const order = exercise?.resolvedOrder;
  if (!exercise?.ok || !wordId || !Array.isArray(order) || order.length === 0) {
    return null;
  }

  const entries = (loadBank().get(buildKey(wordId, order)) || [])
    .filter((entry) => entry.correctAnswer === exercise.correctAnswer &&
      String(entry.sentenceKo || "").includes(exercise.correctAnswer));
  if (entries.length === 0) {
    return null;
  }

  const entry = pickVariant(entries, exercise);
  return {
    sentence: entry.sentenceKo,
    meaningRu: entry.translationRu,
    targetRu: entry.targetRu,
    meaningEn: entry.translationEn,
    targetEn: entry.targetEn,
    naturalnessNote: "",
    sourceType: "example_bank",
    sourceLabel: "GramChain example bank",
    bankId: entry.id,
    reviewStatus: entry.reviewStatus || ""
  };
}

module.exports = {
  getBankExampleForExercise,
  getExampleBankSize
};
