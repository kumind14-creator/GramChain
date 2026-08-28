const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = value;
  }
}

function loadLocalEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env"));
  loadEnvFile(path.join(cwd, ".env.local"));
}

function getKrdictApiKey() {
  loadLocalEnv();
  return process.env.KRDICT_API_KEY ?? "";
}

function getOpenAiApiKey() {
  loadLocalEnv();
  return process.env.OPENAI_API_KEY ?? "";
}

function getOpenAiModel() {
  loadLocalEnv();
  return process.env.OPENAI_MODEL ?? "";
}

module.exports = {
  loadLocalEnv,
  getKrdictApiKey,
  getOpenAiApiKey,
  getOpenAiModel
};
