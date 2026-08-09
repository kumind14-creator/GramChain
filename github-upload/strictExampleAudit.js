const {
  grammarList,
  generateExercise,
  getExampleForExercise,
  validateExampleQuality
} = require("./grammarEngine");

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

const genericRuPatterns = [
  "кажется",
  "ситуация",
  "происходит",
  "получилось",
  "так бывает",
  "в последнее время",
  "в целом",
  "именно так"
];

function permutations(items, length, prefix = [], result = []) {
  if (prefix.length === length) {
    result.push([...prefix]);
    return result;
  }

  for (const item of items) {
    if (prefix.includes(item)) continue;
    prefix.push(item);
    permutations(items, length, prefix, result);
    prefix.pop();
  }

  return result;
}

function getAllOrders() {
  const ids = grammarList.map((grammar) => grammar.id);
  const orders = [];

  for (const length of [1, 2, 3, 4]) {
    for (const combo of permutations(ids, length)) {
      const exercise = generateExercise(combo);
      if (exercise?.ok) {
        orders.push(exercise.resolvedOrder);
      }
    }
  }

  const unique = new Map();
  for (const order of orders) {
    unique.set(order.join("__"), order);
  }

  return [...unique.values()];
}

function inspectExample(order) {
  const exercise = generateExercise(order);
  if (!exercise?.ok) {
    return {
      grammarIds: order,
      severity: "error",
      issues: ["exercise_generation_failed"]
    };
  }

  const example = getExampleForExercise(exercise);
  if (!example) {
    return {
      grammarIds: order,
      severity: order.length >= 2 ? "warning" : "error",
      issues: ["example_missing"]
    };
  }

  const quality = validateExampleQuality(example, {
    requireChainSpecificity: order.length >= 2
  });

  const issues = [...quality.issues];
  const normalizedMeaning = normalize(example.meaningRu);

  if (order.length >= 2) {
    if (example.sourceType !== "curated") {
      issues.push("chain_not_curated");
    }
    if (example.matchType !== "chain") {
      issues.push("chain_not_served_by_chain_example");
    }
  }

  if (genericRuPatterns.filter((pattern) => normalizedMeaning.includes(pattern)).length >= 2) {
    issues.push("translation_may_be_too_abstract");
  }

  if (/민수는|지수는/.test(example.sentence) && !normalizedMeaning.match(/минсу|чису/)) {
    issues.push("translation_omits_subject_name");
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    grammarIds: order,
    severity: issues.includes("exercise_generation_failed") ? "error" : "warning",
    sourceType: example.sourceType,
    matchType: example.matchType,
    sentence: example.sentence,
    meaningRu: example.meaningRu,
    issues
  };
}

const orders = getAllOrders();
const findings = orders.map(inspectExample).filter(Boolean);
const summary = {
  checked: orders.length,
  findings: findings.length,
  errors: findings.filter((item) => item.severity === "error").length,
  warnings: findings.filter((item) => item.severity === "warning").length,
  items: findings
};

console.log(JSON.stringify(summary, null, 2));
if (summary.errors > 0) {
  process.exitCode = 1;
}
