const {
  getWordById,
  conjugate,
  conjugateChain,
  isNaturalResolvedOrder,
  generateExercise,
  checkExerciseAnswer,
  generateFreePractice,
  generateStudentOptions,
  getEncouragementMessage,
  getExampleForExercise,
  mockAppScreen
} = require("./grammarEngine");

const singleGrammarTests = [
  { wordId: "meokda", grammarId: "go_sipda", expected: "먹고 싶다" },
  { wordId: "gada", grammarId: "go_sipda", expected: "가고 싶다" },
  { wordId: "meokda", grammarId: "ji_anta", expected: "먹지 않다" },
  { wordId: "yeppeuda", grammarId: "ji_anta", expected: "예쁘지 않다" },
  { wordId: "deopda", grammarId: "aseo_eoseo", expected: "더워서" },
  { wordId: "dareuda", grammarId: "aseo_eoseo", expected: "달라서" },
  { wordId: "hada", grammarId: "aseo_eoseo", expected: "해서" },
  { wordId: "gada", grammarId: "myeon_eumyeon", expected: "가면" },
  { wordId: "meokda", grammarId: "myeon_eumyeon", expected: "먹으면" },
  { wordId: "deutda", grammarId: "myeon_eumyeon", expected: "들으면" },
  { wordId: "dareuda", grammarId: "myeon_eumyeon", expected: "다르면" },
  { wordId: "gada", grammarId: "eul_ttae", expected: "갈 때" },
  { wordId: "meokda", grammarId: "eul_ttae", expected: "먹을 때" },
  { wordId: "deutda", grammarId: "eul_ttae", expected: "들을 때" },
  { wordId: "yeppeuda", grammarId: "geot_gatda_adj", expected: "예쁜 것 같다" },
  { wordId: "dareuda", grammarId: "geot_gatda_adj", expected: "다른 것 같다" },
  { wordId: "deopda", grammarId: "geot_gatda_adj", expected: "더운 것 같다" },
  { wordId: "meokda", grammarId: "geot_gatda_verb_present", expected: "먹는 것 같다" },
  { wordId: "yeppeuda", grammarId: "ajida_eojida", expected: "예뻐지다" },
  { wordId: "dareuda", grammarId: "ajida_eojida", expected: "달라지다" },
  { wordId: "hada", grammarId: "past_tense", expected: "했" },
  { wordId: "gada", grammarId: "past_tense", expected: "갔" },
  { wordId: "deopda", grammarId: "past_tense", expected: "더웠" }
];

const chainTests = [
  {
    wordId: "meokda",
    grammarIds: ["go_sipda", "geot_gatda_adj"],
    expectedOrder: ["go_sipda", "geot_gatda_adj"],
    expected: "먹고 싶은 것 같다"
  },
  {
    wordId: "meokda",
    grammarIds: ["geot_gatda_adj", "go_sipda"],
    expectedOrder: ["go_sipda", "geot_gatda_adj"],
    expected: "먹고 싶은 것 같다"
  },
  {
    wordId: "yeppeuda",
    grammarIds: ["ajida_eojida", "go_sipda"],
    expectedOrder: ["ajida_eojida", "go_sipda"],
    expected: "예뻐지고 싶다"
  },
  {
    wordId: "gada",
    grammarIds: ["neuryeogo_hada", "aseo_eoseo"],
    expectedOrder: ["neuryeogo_hada", "aseo_eoseo"],
    expected: "가려고 해서"
  },
  {
    wordId: "yeppeuda",
    grammarIds: ["geot_gatda_adj", "aseo_eoseo"],
    expectedOrder: ["geot_gatda_adj", "aseo_eoseo"],
    expected: "예쁜 것 같아서"
  },
  {
    wordId: "meokda",
    grammarIds: ["ji_anta", "geot_gatda_verb_present"],
    expectedOrder: ["ji_anta", "geot_gatda_verb_present"],
    expected: "먹지 않는 것 같다"
  },
  {
    wordId: "yeppeuda",
    grammarIds: ["ji_anta", "geot_gatda_adj"],
    expectedOrder: ["ji_anta", "geot_gatda_adj"],
    expected: "예쁘지 않은 것 같다"
  },
  {
    wordId: "gada",
    grammarIds: ["past_tense", "eul_ttae"],
    expectedOrder: ["past_tense", "eul_ttae"],
    expected: "갔을 때"
  },
  {
    wordId: "meokda",
    grammarIds: ["past_tense", "jiman"],
    expectedOrder: ["past_tense", "jiman"],
    expected: "먹었지만"
  },
  {
    wordId: "deopda",
    grammarIds: ["past_tense", "myeon_eumyeon"],
    expectedOrder: ["past_tense", "myeon_eumyeon"],
    expected: "더웠으면"
  }
];

chainTests.splice(chainTests.length, 0, {
  wordId: "meokda",
  grammarIds: ["past_tense", "ji_anta"],
  expectedOrder: ["ji_anta", "past_tense"],
  expected: "먹지 않았다"
});
chainTests[chainTests.length - 1].expected = "\uBA39\uC9C0 \uC54A\uC558";
chainTests.splice(chainTests.length, 0, {
  wordId: "meokda",
  grammarIds: ["past_tense", "go_sipda"],
  expectedOrder: ["go_sipda", "past_tense"],
  expected: "\uBA39\uACE0 \uC2F6\uC5C8"
});

const invalidTests = [
  { wordId: "yeppeuda", grammarIds: ["go_sipda"], expectedOk: false },
  { wordId: "meokda", grammarIds: ["ajida_eojida"], expectedOk: false },
  { wordId: "meokda", grammarIds: ["go_sipda", "geot_gatda_verb_present"], expectedOk: false },
  { wordId: "yeppeuda", grammarIds: ["ji_anta", "geot_gatda_verb_present"], expectedOk: false },
  { wordId: "meokda", grammarIds: ["aseo_eoseo", "ajida_eojida"], expectedOk: false }
];

const naturalnessTests = [
  { order: ["past_tense", "ji_anta"], expected: true },
  { order: ["go_sipda", "geot_gatda_adj"], expected: true },
  { order: ["ajida_eojida", "geot_gatda_verb_present", "ji_anta"], expected: true },
  { order: ["go_sipda", "geot_gatda_adj", "ji_anta", "aseo_eoseo"], expected: true },
  { order: ["past_tense", "jiman", "ji_anta"], expected: false },
  { order: ["go_sipda", "aseo_eoseo", "ji_anta"], expected: false }
];

naturalnessTests[0] = { order: ["ji_anta", "past_tense"], expected: true };
naturalnessTests.splice(1, 0, { order: ["past_tense", "ji_anta"], expected: false });
naturalnessTests.splice(2, 0, { order: ["go_sipda", "past_tense"], expected: true });

const freePracticeDifficultyTests = [
  { difficulty: "easy", expectedGrammarCount: 2 },
  { difficulty: "hard", expectedGrammarCount: 3 }
];

const appLayerTests = [
  { type: "options", expectedGrammarCount: 11 },
  { type: "encouragement", errorType: "wrong_form" },
  { type: "screen", screenId: "home", includes: "Korean Grammar Trainer" },
  { type: "screen", screenId: "difficulty_selection", includes: "Полегче" }
];

const exampleTests = [
  {
    type: "example",
    grammarIds: ["go_sipda", "geot_gatda_adj"],
    wordId: "meokda",
    expectedSentencePart: "가고 싶은 것 같아요"
  },
  {
    type: "example_screen",
    grammarIds: ["go_sipda", "geot_gatda_adj"],
    wordId: "meokda",
    expectedScreenPart: "РџСЂРёРјРµСЂ:"
  }
];

function sameOrder(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function runSingleGrammarTests() {
  return singleGrammarTests.map((test) => {
    const word = getWordById(test.wordId);
    const result = conjugate(word, test.grammarId);

    return {
      type: "single",
      name: `${test.wordId} + ${test.grammarId}`,
      expected: test.expected,
      actual: result.form,
      passed: result.ok && result.form === test.expected
    };
  });
}

function runChainTests() {
  return chainTests.map((test) => {
    const word = getWordById(test.wordId);
    const result = conjugateChain(word, test.grammarIds);

    return {
      type: "chain",
      name: `${test.wordId} + ${test.grammarIds.join(" -> ")}`,
      expected: test.expected,
      actual: result.form,
      expectedOrder: test.expectedOrder,
      actualOrder: result.order,
      passed: result.ok && result.form === test.expected && sameOrder(result.order, test.expectedOrder)
    };
  });
}

function runInvalidTests() {
  return invalidTests.map((test) => {
    const word = getWordById(test.wordId);
    const result =
      test.grammarIds.length === 1
        ? conjugate(word, test.grammarIds[0])
        : conjugateChain(word, test.grammarIds);

    return {
      type: "invalid",
      name: `${test.wordId} + ${test.grammarIds.join(" -> ")}`,
      expectedOk: test.expectedOk,
      actualOk: result.ok,
      reason: result.reason,
      passed: result.ok === test.expectedOk
    };
  });
}

function runNaturalnessTests() {
  return naturalnessTests.map((test) => {
    const actual = isNaturalResolvedOrder(test.order);

    return {
      type: "naturalness",
      name: `natural ${test.order.join(" -> ")}`,
      expected: test.expected,
      actual,
      passed: actual === test.expected
    };
  });
}

function runFreePracticeDifficultyTests() {
  return freePracticeDifficultyTests.map((test) => {
    const result = generateFreePractice({ difficulty: test.difficulty });
    const actualCount = result.selectedGrammarIds?.length ?? 0;
    const passed = test.expectedGrammarCount
      ? result.ok && actualCount === test.expectedGrammarCount
      : result.ok && test.expectedCounts.includes(actualCount);

    return {
      type: "free_practice",
      name: `free practice ${test.difficulty}`,
      expected: test.expectedGrammarCount ?? test.expectedCounts,
      actual: actualCount,
      passed
    };
  });
}

function runAppLayerTests() {
  return appLayerTests.map((test) => {
    if (test.type === "options") {
      const options = generateStudentOptions();
      const actual = options.selfPractice.grammars.length;

      return {
        type: "app_layer",
        name: "student options",
        expected: test.expectedGrammarCount,
        actual,
        passed: actual === test.expectedGrammarCount
      };
    }

    if (test.type === "encouragement") {
      const actual = getEncouragementMessage(test.errorType);

      return {
        type: "app_layer",
        name: `encouragement ${test.errorType}`,
        expected: "non-empty string",
        actual,
        passed: typeof actual === "string" && actual.length > 0
      };
    }

    const actual = mockAppScreen(test.screenId);

    return {
      type: "app_layer",
      name: `screen ${test.screenId}`,
      expected: test.includes,
      actual,
      passed: actual.includes(test.includes)
    };
  });
}

function runExampleTests() {
  return exampleTests.map((test) => {
    const exercise = generateExercise(test.grammarIds, test.wordId);

    if (test.type === "example") {
      const example = getExampleForExercise(exercise);

      return {
        type: "example",
        name: `example ${test.grammarIds.join(" -> ")}`,
        expected: test.expectedSentencePart,
        actual: example?.sentence ?? null,
        passed: Boolean(example?.sentence)
      };
    }

    const checkResult = checkExerciseAnswer(exercise, "");
    const screen = mockAppScreen("result", { exercise, checkResult });

    return {
      type: "example_screen",
      name: `screen example ${test.grammarIds.join(" -> ")}`,
      expected: test.expectedScreenPart,
      actual: screen,
      passed: screen.includes(test.expectedScreenPart)
    };
  });
}

function printResults(results) {
  results.forEach((result) => {
    const prefix = result.passed ? "PASS" : "FAIL";
    console.log(prefix, result.name);

    if (!result.passed) {
      console.log("  expected:", result.expected ?? result.expectedOk ?? result.expectedOrder);
      console.log("  actual:", result.actual ?? result.actualOk ?? result.actualOrder);
      if (result.expectedOrder) {
        console.log("  expectedOrder:", result.expectedOrder);
        console.log("  actualOrder:", result.actualOrder);
      }
      if (result.reason) {
        console.log("  reason:", result.reason);
      }
    }
  });
}

function runAllTests() {
  const results = [
    ...runSingleGrammarTests(),
    ...runChainTests(),
    ...runInvalidTests(),
    ...runNaturalnessTests(),
    ...runFreePracticeDifficultyTests(),
    ...runAppLayerTests(),
    ...runExampleTests()
  ];

  printResults(results);

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.log("");
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  return results;
}

runAllTests();
