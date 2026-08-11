const { auditExampleQuality } = require("./grammarEngine");

const result = auditExampleQuality();
console.log(JSON.stringify(result, null, 2));
if (!result.ok) {
  process.exitCode = 1;
}
