const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const {
  generateStudentOptions,
  generateExerciseBatch,
  generateFreePractice,
  checkExerciseAnswer,
  getExampleForExercise
} = require("./grammarEngine");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const LOG_DIR = path.join(__dirname, "outputs", "research-logs");
const LOG_FILE = path.join(LOG_DIR, "research-log.jsonl");
const MIN_GRAMMAR_SELECTION = 2;
const EXERCISES_PER_SET = 5;
const GOOGLE_SHEETS_WEBHOOK_URL = String(process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim();

const loggingStatus = {
  backend: "file",
  googleSheetsEnabled: Boolean(GOOGLE_SHEETS_WEBHOOK_URL),
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  lastMode: null
};

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function isGoogleSheetsLoggingEnabled() {
  return Boolean(GOOGLE_SHEETS_WEBHOOK_URL);
}

function ensureFileLogStorage() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "", "utf8");
  }
}

function appendLogToFile(entry) {
  ensureFileLogStorage();
  fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

async function appendLogToGoogleSheets(entry) {
  const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(entry)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google Sheets webhook returned ${response.status}${text ? `: ${text}` : ""}`);
  }

  return { ok: true, mode: "google-sheets" };
}

async function appendLog(entry) {
  const normalizedEntry = {
    ...entry,
    loggedAt: entry.loggedAt || new Date().toISOString()
  };

  loggingStatus.lastAttemptAt = normalizedEntry.loggedAt;

  if (isGoogleSheetsLoggingEnabled()) {
    try {
      const result = await appendLogToGoogleSheets(normalizedEntry);
      loggingStatus.backend = "google-sheets";
      loggingStatus.lastSuccessAt = normalizedEntry.loggedAt;
      loggingStatus.lastError = null;
      loggingStatus.lastMode = "google-sheets";
      return result;
    } catch (error) {
      loggingStatus.lastError = error.message || String(error);
      console.error("Failed to write log entry to Google Sheets, falling back to file:", error);
    }
  }

  appendLogToFile(normalizedEntry);
  loggingStatus.backend = "file";
  loggingStatus.lastSuccessAt = normalizedEntry.loggedAt;
  loggingStatus.lastMode = "file";
  return { ok: true, mode: "file" };
}

function getLoggingStatusPayload() {
  return {
    ok: true,
    backend: loggingStatus.backend,
    googleSheetsEnabled: loggingStatus.googleSheetsEnabled,
    lastAttemptAt: loggingStatus.lastAttemptAt,
    lastSuccessAt: loggingStatus.lastSuccessAt,
    lastError: loggingStatus.lastError,
    lastMode: loggingStatus.lastMode,
    webhookUrlPreview: GOOGLE_SHEETS_WEBHOOK_URL
      ? `${GOOGLE_SHEETS_WEBHOOK_URL.slice(0, 60)}...`
      : null
  };
}



function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendNotFound(response) {
  sendJson(response, 404, { ok: false, message: "Не найдено." });
}

function sendMethodNotAllowed(response) {
  sendJson(response, 405, { ok: false, message: "Метод не поддерживается." });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Слишком большой запрос."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Не удалось прочитать JSON."));
      }
    });

    request.on("error", reject);
  });
}

function sanitizeParticipantCode(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 64);
}

function getSafeExample(exercise) {
  const example = getExampleForExercise(exercise);
  if (example?.sentence) {
    return example;
  }

  return {
    sentence: exercise?.correctAnswer || "",
    meaningRu: "Для этой цепочки мы показываем только проверенные примеры. Этот пример еще готовится.",
    sourceType: "local",
    sourceLabel: "Verified example bank"
  };
}

function buildExerciseSetResponse(result, meta = {}) {
  if (!result?.ok) {
    return {
      ok: false,
      errorType: result?.errorType || "not_connectable",
      message: result?.message || "Эти грамматики не соединяются.",
      mode: meta.mode || null
    };
  }

  const exercises = Array.isArray(result.exercises) ? result.exercises : [result];

  return {
    ok: true,
    mode: meta.mode || null,
    difficulty: meta.difficulty || null,
    exercises,
    totalExercises: exercises.length,
    selectedGrammarIds: result.selectedGrammarIds || exercises[0]?.selectedGrammarIds || [],
    resolvedOrder: result.resolvedOrder || exercises[0]?.resolvedOrder || []
  };
}

function serveStaticFile(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(PUBLIC_DIR, normalizedPath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(path.resolve(PUBLIC_DIR))) {
    sendNotFound(response);
    return;
  }

  if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
    sendNotFound(response);
    return;
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(resolvedPath).pipe(response);
}

async function handleOptions(response) {
  const options = generateStudentOptions();

  sendJson(response, 200, {
    ok: true,
    options,
    constraints: {
      minGrammarSelection: MIN_GRAMMAR_SELECTION,
      exercisesPerSet: EXERCISES_PER_SET
    }
  });
}

async function handleResearchSessionStart(request, response) {
  const body = await readRequestBody(request);
  const participantCode = sanitizeParticipantCode(body.participantCode);

  if (!participantCode) {
    sendJson(response, 400, {
      ok: false,
      message: "Введите код участника."
    });
    return;
  }

  const session = {
    ok: true,
    sessionId: randomUUID(),
    participantCode,
    startedAt: new Date().toISOString()
  };

  await appendLog({
    type: "session_started",
    sessionId: session.sessionId,
    participantCode: session.participantCode,
    payload: {
      startedAt: session.startedAt
    }
  });

  sendJson(response, 200, session);
}

async function handleResearchEvent(request, response) {
  const body = await readRequestBody(request);
  const participantCode = sanitizeParticipantCode(body.participantCode);
  const eventType = String(body.eventType || "").trim();

  if (!body.sessionId || !participantCode || !eventType) {
    sendJson(response, 400, {
      ok: false,
      message: "Не хватает данных для логирования."
    });
    return;
  }

  await appendLog({
    type: eventType,
    sessionId: body.sessionId,
    participantCode,
    payload: body.payload || {}
  });

  sendJson(response, 200, { ok: true });
}

async function handleSelfExercise(request, response) {
  const body = await readRequestBody(request);
  const grammarIds = Array.isArray(body.grammarIds) ? body.grammarIds : [];

  if (grammarIds.length < MIN_GRAMMAR_SELECTION) {
    sendJson(response, 400, {
      ok: false,
      message: `Выберите минимум ${MIN_GRAMMAR_SELECTION} грамматики.`
    });
    return;
  }

  const result = generateExerciseBatch(grammarIds, {
    count: EXERCISES_PER_SET
  });

  sendJson(response, 200, buildExerciseSetResponse(result, { mode: "self" }));
}

async function handleFreeExercise(request, response) {
  const body = await readRequestBody(request);
  const difficulty = body.difficulty === "hard" ? "hard" : "easy";
  const exercises = [];
  const usedKeys = new Set();
  const maxAttempts = 120;
  let attempts = 0;

  while (exercises.length < EXERCISES_PER_SET && attempts < maxAttempts) {
    attempts += 1;

    const result = generateFreePractice({
      difficulty
    });

    if (!result?.ok) {
      continue;
    }

    const key = `${result.word?.id || "word"}::${(result.resolvedOrder || []).join("__")}`;
    if (usedKeys.has(key)) {
      continue;
    }

    usedKeys.add(key);
    exercises.push(result);
  }

  if (exercises.length === 0) {
    sendJson(response, 200, {
      ok: false,
      mode: "free",
      difficulty,
      errorType: "not_connectable",
      message: "Эти грамматики не соединяются."
    });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    mode: "free",
    difficulty,
    exercises,
    totalExercises: exercises.length,
    selectedGrammarIds: exercises[0].selectedGrammarIds,
    resolvedOrder: exercises[0].resolvedOrder
  });
}

async function handleCheck(request, response) {
  const body = await readRequestBody(request);
  const exercise = body.exercise;
  const answer = String(body.answer ?? "");

  if (!exercise?.correctAnswer) {
    sendJson(response, 400, {
      ok: false,
      message: "Некорректное упражнение."
    });
    return;
  }

  const checkResult = checkExerciseAnswer(exercise, answer);
  const example = getSafeExample(exercise);

  sendJson(response, 200, {
    ok: true,
    checkResult,
    example
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const { pathname } = requestUrl;

    if (pathname === "/api/options") {
      if (request.method !== "GET") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleOptions(response);
      return;
    }

    if (pathname === "/api/research/session/start") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleResearchSessionStart(request, response);
      return;
    }

    if (pathname === "/api/research/event") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleResearchEvent(request, response);
      return;
    }

    if (pathname === "/api/research/logging-status") {
      if (request.method !== "GET") {
        sendMethodNotAllowed(response);
        return;
      }

      sendJson(response, 200, getLoggingStatusPayload());
      return;
    }

    if (pathname === "/api/exercise/self") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleSelfExercise(request, response);
      return;
    }

    if (pathname === "/api/exercise/free") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleFreeExercise(request, response);
      return;
    }

    if (pathname === "/api/check") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleCheck(request, response);
      return;
    }

    serveStaticFile(pathname, response);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error.message || "Внутренняя ошибка сервера."
    });
  }
});

async function startServer() {
  ensureFileLogStorage();
  loggingStatus.backend = isGoogleSheetsLoggingEnabled() ? "google-sheets" : "file";
  console.log(`Research logging backend: ${isGoogleSheetsLoggingEnabled() ? "google-sheets" : "file"}`);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
