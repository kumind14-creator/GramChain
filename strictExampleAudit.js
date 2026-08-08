const {
  grammarList,
  naturalChainWhitelist,
  naturalTripleChainWhitelist,
  naturalQuadChainWhitelist,
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

function getAllOrders() {
  return [
    ...grammarList.map((grammar) => [grammar.id]),
    ...naturalChainWhitelist,
    ...naturalTripleChainWhitelist,
    ...naturalQuadChainWhitelist
  ];
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
      severity: "error",
      issues: ["example_missing"]
    };
  }

  const quality = validateExampleQuality(example, {
    requireChainSpecificity: order.length >= 2
  });

  const issues = [...quality.issues];
  const normalizedMeaning = normalize(example.meaningRu);

  if (example.sourceType === "generated") {
    issues.push("uses_generated_example");
  }

  if (order.length >= 2 && example.matchType !== "chain") {
    issues.push("chain_not_served_by_chain_example");
  }

  if (genericRuPatterns.filter((pattern) => normalizedMeaning.includes(pattern)).length >= 2) {
    issues.push("translation_may_be_too_abstract");
  }

  if (/минсу는|민수는/.test(example.sentence) && !normalizedMeaning.includes("минсу")) {
    issues.push("translation_omits_subject_name");
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    grammarIds: order,
    severity: issues.includes("exercise_generation_failed") || issues.includes("example_missing") ? "error" : "warning",
    sourceType: example.sourceType,
    matchType: example.matchType,
    sentence: example.sentence,
    meaningRu: example.meaningRu,
    issues
  };
}

const findings = getAllOrders().map(inspectExample).filter(Boolean);
const summary = {
  checked: getAllOrders().length,
  findings: findings.length,
  errors: findings.filter((item) => item.severity === "error").length,
  warnings: findings.filter((item) => item.severity === "warning").length,
  items: findings
};

console.log(JSON.stringify(summary, null, 2));
if (summary.errors > 0) {
  process.exitCode = 1;
}

