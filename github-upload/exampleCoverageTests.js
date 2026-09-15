const {
  wordList,
  generateExercise
} = require("./grammarEngine");
const { getSafeExample } = require("./server");

const grammarIds = ["go_sipda", "past_tense"];
const missing = [];

for (const word of wordList) {
  const exercise = generateExercise(grammarIds, word.id);
  if (!exercise.ok) {
    continue;
  }

  const example = getSafeExample(exercise);
  if (
    !example?.sentence
    || !example.sentence.includes(exercise.correctAnswer)
    || !example.meaningRu
    || !example.meaningEn
    || !example.targetRu
    || !example.targetEn
  ) {
    missing.push(`${word.id}: ${exercise.correctAnswer}`);
    continue;
  }

  if (example.sourceType !== "curated") {
    throw new Error(`Unsafe generated fallback was returned for ${word.id}.`);
  }
}

if (missing.length > 0) {
  throw new Error(`Missing curated situations: ${missing.join(", ")}`);
}

console.log("Curated situation coverage tests passed.");
