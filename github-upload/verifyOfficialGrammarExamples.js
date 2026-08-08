const { getKrdictApiKey } = require("./env");
const { getOfficialExampleForGrammar } = require("./officialExampleSource");

async function main() {
  const apiKey = getKrdictApiKey();
  const grammarIds = ["neuryeogo_hada", "jiman", "ji_anta"];

  for (const grammarId of grammarIds) {
    const example = await getOfficialExampleForGrammar(grammarId, { apiKey });
    console.log("");
    console.log("=".repeat(50));
    console.log(grammarId);
    console.log("=".repeat(50));
    console.log(JSON.stringify(example, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
