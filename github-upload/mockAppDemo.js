const {
  generateExercise,
  checkExerciseAnswer,
  generateFreePractice,
  generateStudentOptions,
  getEncouragementMessage,
  mockAppScreen
} = require("./grammarEngine");

function printSection(title) {
  console.log("");
  console.log("=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

printSection("Student Options");
console.log(JSON.stringify(generateStudentOptions(), null, 2));

printSection("Home Screen");
console.log(mockAppScreen("home"));

printSection("Grammar Selection Screen");
console.log(mockAppScreen("grammar_selection"));

printSection("Difficulty Selection Screen");
console.log(mockAppScreen("difficulty_selection"));

const selfExercise = generateExercise(["go_sipda", "geot_gatda_adj"], "meokda");
printSection("Exercise Screen");
console.log(mockAppScreen("exercise", { exercise: selfExercise }));

const wrongAnswerResult = checkExerciseAnswer(selfExercise, "먹고 싶는 것 같다");
printSection("Result Screen");
console.log(mockAppScreen("result", { exercise: selfExercise, checkResult: wrongAnswerResult }));

printSection("Encouragement Samples");
console.log("wrong_form:", getEncouragementMessage("wrong_form"));
console.log("wrong_order:", getEncouragementMessage("wrong_order"));
console.log("not_connectable:", getEncouragementMessage("not_connectable"));

printSection("Free Practice Example");
console.log(JSON.stringify(generateFreePractice({ difficulty: "hard" }), null, 2));
