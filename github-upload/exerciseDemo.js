const {
  generateExercise,
  checkExerciseAnswer
} = require("./grammarEngine");

function printSection(title) {
  console.log("");
  console.log("=".repeat(50));
  console.log(title);
  console.log("=".repeat(50));
}

function showExercise(exercise) {
  if (!exercise.ok) {
    console.log("Не удалось создать упражнение.");
    console.log(exercise.message || exercise.reason);
    return;
  }

  console.log(`Слово: ${exercise.word.lemma} (${exercise.word.meaningRu})`);
  console.log(`Выбранные грамматики: ${exercise.selectedGrammarIds.join(", ")}`);
  console.log(`Правильный порядок: ${exercise.resolvedOrder.join(" -> ")}`);
  console.log(`Задание: ${exercise.prompt}`);
  console.log(`Правильный ответ: ${exercise.correctAnswer}`);

  if (exercise.explanation?.flow) {
    console.log(`Схема: ${exercise.explanation.flow}`);
  }

  if (exercise.explanation?.why) {
    console.log(`Почему: ${exercise.explanation.why}`);
  }
}

function showCheckResult(label, result) {
  console.log("");
  console.log(`Проверка: ${label}`);
  console.log(`ok: ${result.ok}`);
  console.log(`message: ${result.message}`);

  if (result.resolvedOrder) {
    console.log(`resolvedOrder: ${result.resolvedOrder.join(" -> ")}`);
  }

  if (result.correctAnswer) {
    console.log(`correctAnswer: ${result.correctAnswer}`);
  }

  if (result.explanation?.flow) {
    console.log(`flow: ${result.explanation.flow}`);
  }

  if (result.explanation?.why) {
    console.log(`why: ${result.explanation.why}`);
  }
}

printSection("Demo 1: -고 싶다 + -(으)ㄴ 것 같다");
const exercise1 = generateExercise(["geot_gatda_adj", "go_sipda"], "meokda");
showExercise(exercise1);
showCheckResult("правильный ответ", checkExerciseAnswer(exercise1, "먹고 싶은 것 같다"));
showCheckResult("неправильная форма", checkExerciseAnswer(exercise1, "먹고 싶는 것 같다"));

printSection("Demo 2: -고 싶다 + -는 것 같다");
const exercise2 = generateExercise(["go_sipda", "geot_gatda_verb_present"], "meokda");
showExercise(exercise2);

printSection("Demo 3: -아지다/어지다 + -고 싶다");
const exercise3 = generateExercise(["go_sipda", "ajida_eojida"], "yeppeuda");
showExercise(exercise3);
showCheckResult("ошибка в форме", checkExerciseAnswer(exercise3, "예쁘지고 싶다"));
