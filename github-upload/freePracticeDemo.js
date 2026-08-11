const { generateFreePractice } = require("./grammarEngine");

function printExercise(index, exercise) {
  console.log("");
  console.log("=".repeat(60));
  console.log(`Free Practice ${index}`);
  console.log("=".repeat(60));

  if (!exercise.ok) {
    console.log("Не удалось создать упражнение.");
    console.log(exercise.message || exercise.reason);
    return;
  }

  console.log(`Слово: ${exercise.word.lemma} (${exercise.word.meaningRu})`);
  console.log(`Выбранные грамматики: ${exercise.selectedGrammarIds.join(", ")}`);
  console.log(`Правильный порядок: ${exercise.resolvedOrder.join(" -> ")}`);
  console.log(`Правильный ответ: ${exercise.correctAnswer}`);

  if (exercise.explanation?.flow) {
    console.log(`Схема: ${exercise.explanation.flow}`);
  }

  if (exercise.explanation?.why) {
    console.log(`Почему: ${exercise.explanation.why}`);
  }
}

const difficulties = ["easy", "hard"];

for (const difficulty of difficulties) {
  for (let i = 1; i <= 3; i += 1) {
    const exercise = generateFreePractice({ difficulty });
    printExercise(`${difficulty}.${i}`, exercise);
  }
}
