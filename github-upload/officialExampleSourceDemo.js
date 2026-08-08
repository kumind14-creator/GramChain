const { generateExercise, getBestExampleForExercise } = require("./grammarEngine");
const {
  getOfficialExampleForExercise,
  getOfficialExampleForGrammar
} = require("./officialExampleSource");
const { getKrdictApiKey } = require("./env");

async function main() {
  const exercise = generateExercise(["go_sipda", "geot_gatda_adj"], "meokda");
  console.log("Exercise:");
  console.log(JSON.stringify(exercise, null, 2));

  const apiKey = getKrdictApiKey();

  if (!apiKey) {
    console.log("");
    console.log("KRDICT_API_KEY is not set.");
    console.log("Set it and run again to fetch an official example from KRDICT Open API.");
    return;
  }

  const officialExample = await getOfficialExampleForExercise(exercise, {
    apiKey
  });

  console.log("");
  console.log("Official Chain Example:");
  console.log(JSON.stringify(officialExample, null, 2));

  const officialSingleExample = await getOfficialExampleForGrammar("go_sipda", {
    apiKey
  });

  console.log("");
  console.log("Official Single-Grammar Example:");
  console.log(JSON.stringify(officialSingleExample, null, 2));

  const bestExample = await getBestExampleForExercise(exercise, {
    apiKey
  });

  console.log("");
  console.log("Best Example With Fallback:");
  console.log(JSON.stringify(bestExample, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
