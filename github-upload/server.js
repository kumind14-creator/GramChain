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
const {
  generateAiExampleForExercise,
  isAiExampleGenerationEnabled,
  getAiExampleGenerationStatus
} = require("./aiExampleService");
const { getSpeakingTasks } = require("./speakingTasks");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const LOG_DIR = path.join(__dirname, "outputs", "research-logs");
const LOG_FILE = path.join(LOG_DIR, "research-log.jsonl");
const SPEAKING_OUTPUT_DIR = path.join(__dirname, "outputs", "GramChain_speaking");
const MIN_GRAMMAR_SELECTION = 2;
const MAX_GRAMMAR_SELECTION = 4;
const EXERCISES_PER_SET = 5;
const GOOGLE_SHEETS_WEBHOOK_URL = String(process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim();
const DEFAULT_BODY_LIMIT = 1_000_000;
const AUDIO_BODY_LIMIT = 40_000_000;

const loggingStatus = {
  backend: "file",
  googleSheetsEnabled: Boolean(GOOGLE_SHEETS_WEBHOOK_URL),
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  lastMode: null
};

let cachedOptions = null;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
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

function ensureSpeakingStorage() {
  fs.mkdirSync(SPEAKING_OUTPUT_DIR, { recursive: true });
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

async function uploadSpeakingAudioToGoogleDrive(entry) {
  const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(entry)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google Drive webhook returned ${response.status}${text ? `: ${text}` : ""}`);
  }

  const payload = await response.json().catch(() => ({ ok: true }));
  if (payload.ok === false) {
    throw new Error(payload.error || "Google Drive webhook failed.");
  }

  const confirmedGoogleDriveSave = (
    payload.storage === "google-drive"
    || Boolean(payload.driveFileId)
    || Boolean(payload.driveFileUrl)
  );

  if (!confirmedGoogleDriveSave) {
    const payloadPreview = JSON.stringify(payload).slice(0, 240);
    throw new Error(
      `Webhook responded but did not confirm Google Drive save. `
      + `Most likely the old Apps Script deployment URL is still being used. `
      + `Response: ${payloadPreview}`
    );
  }

  return payload;
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

function readRequestBody(request, options = {}) {
  const maxBytes = Number(options.maxBytes) > 0 ? Number(options.maxBytes) : DEFAULT_BODY_LIMIT;

  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw, "utf8") > maxBytes) {
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
    .replace(/[^\w-]/g, "")
    .slice(0, 64);
}

function sanitizeSpeakingStage(value) {
  return value === "post" ? "post" : "pre";
}

function sanitizeTaskId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^\w-]/g, "")
    .slice(0, 64);
}

function getAudioExtension(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();

  if (normalized.includes("webm")) {
    return "webm";
  }

  if (normalized.includes("ogg")) {
    return "ogg";
  }

  if (normalized.includes("mp4") || normalized.includes("mpeg") || normalized.includes("aac")) {
    return "m4a";
  }

  return "webm";
}

function exampleUsesExactAnswer(example, exercise) {
  const sentence = String(example?.sentence || "").replace(/\s+/g, "");
  const answer = String(exercise?.correctAnswer || "").replace(/\s+/g, "");
  return Boolean(sentence && answer && sentence.includes(answer));
}

const LOCAL_WORD_MEANINGS_EN = {
  gada: "go home", oda: "come early", meokda: "eat spicy food", masida: "drink coffee",
  hada: "do homework", gongbuhada: "study Korean", ilhada: "work at the office",
  mannada: "meet a friend", boda: "watch that film", deutda: "listen to favourite music",
  ikda: "read a Korean book", sseuda: "write in a diary", sada: "buy new clothes",
  undonghada: "exercise at the gym", swida: "rest for a while", tada: "take the bus",
  yeolda: "open the window", gidarida: "wait for a friend", nolda: "spend time with friends",
  mandeulda: "prepare presentation materials", jada: "sleep a little longer",
  ireonada: "get up early", salda: "live there"
};

function addEnglishLocalFallback(example, exercise) {
  if (example?.meaningEn) {
    return example;
  }

  const grammarIds = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder : [];
  const action = LOCAL_WORD_MEANINGS_EN[exercise?.word?.id] || "do that";
  let targetEn = `to ${action}`;
  let meaningEn = `This sentence is about ${targetEn}.`;

  if (grammarIds.includes("go_sipda") && grammarIds.includes("ji_anta") && grammarIds.includes("past_tense")) {
    targetEn = `did not want to ${action}`;
    meaningEn = `Yesterday I ${targetEn}.`;
  } else if (grammarIds.includes("go_sipda") && grammarIds.includes("past_tense")) {
    targetEn = `wanted to ${action}`;
    meaningEn = `Yesterday I ${targetEn}.`;
  } else if (grammarIds.includes("go_sipda") && grammarIds.includes("ji_anta")) {
    targetEn = `do not want to ${action}`;
    meaningEn = `Today I ${targetEn}.`;
  } else if (grammarIds.includes("go_sipda")) {
    targetEn = `want to ${action}`;
    meaningEn = `Today I ${targetEn}.`;
  } else if (grammarIds.includes("neuryeogo_hada") && grammarIds.includes("past_tense")) {
    targetEn = `was planning to ${action}`;
    meaningEn = `Yesterday I ${targetEn}.`;
  } else if (grammarIds.includes("neuryeogo_hada")) {
    targetEn = `am planning to ${action}`;
    meaningEn = `Today I ${targetEn}.`;
  } else if (grammarIds.includes("past_tense")) {
    targetEn = `did ${action}`;
    meaningEn = `Yesterday I ${targetEn}.`;
  }

  return {
    ...example,
    meaningEn,
    targetEn,
    // A full local translation can always be highlighted safely.
    targetRu: example.meaningRu || ""
  };
}

const CURATED_PAST_WISH_EXAMPLES = {
  gada: ["어제는 너무 피곤해서 집에 일찍 가고 싶었어요.", "Вчера я очень устал(а), поэтому захотелось пораньше пойти домой.", "захотелось пораньше пойти домой", "I was very tired yesterday, so I wanted to go home early.", "wanted to go home early"],
  oda: ["친구와 약속이 있어서 일찍 오고 싶었어요.", "У меня была встреча с другом, поэтому хотелось прийти пораньше.", "хотелось прийти пораньше", "I had plans with a friend, so I wanted to arrive early.", "wanted to arrive early"],
  meokda: ["점심을 못 먹어서 매운 음식을 먹고 싶었어요.", "Я пропустил(а) обед, поэтому захотелось острой еды.", "захотелось острой еды", "I missed lunch, so I wanted to eat spicy food.", "wanted to eat spicy food"],
  masida: ["잠이 와서 커피를 마시고 싶었어요.", "Мне хотелось спать, поэтому захотелось выпить кофе.", "захотелось выпить кофе", "I was sleepy, so I wanted to drink coffee.", "wanted to drink coffee"],
  hada: ["숙제가 남아서 숙제를 하고 싶었어요.", "Осталось домашнее задание, поэтому я хотел(а) его сделать.", "хотел(а) его сделать", "I still had homework left, so I wanted to do it.", "wanted to do it"],
  gongbuhada: ["한국 드라마를 보고 나서 한국어를 더 공부하고 싶었어요.", "После корейской дорамы мне захотелось больше заниматься корейским.", "захотелось больше заниматься корейским", "After watching a Korean drama, I wanted to study Korean more.", "wanted to study Korean more"],
  ilhada: ["새 프로젝트가 시작돼서 회사에서 더 일하고 싶었어요.", "Начался новый проект, поэтому мне хотелось больше поработать в офисе.", "хотелось больше поработать в офисе", "A new project had started, so I wanted to work more at the office.", "wanted to work more at the office"],
  jada: ["밤에 잠을 잘 못 자서 좀 더 자고 싶었어요.", "Ночью я плохо спал(а), поэтому хотелось поспать подольше.", "хотелось поспать подольше", "I did not sleep well at night, so I wanted to sleep a little longer.", "wanted to sleep a little longer"],
  ireonada: ["약속에 늦을까 봐 일찍 일어나고 싶었어요.", "Я боялся(ась) опоздать на встречу, поэтому хотел(а) встать пораньше.", "хотел(а) встать пораньше", "I was worried about being late for an appointment, so I wanted to get up early.", "wanted to get up early"],
  mannada: ["오랜만에 친구가 생각나서 만나고 싶었어요.", "Я давно не видел(а) друга и захотел(а) с ним встретиться.", "захотел(а) с ним встретиться", "I had not seen my friend for a long time, so I wanted to meet them.", "wanted to meet them"],
  boda: ["예고편이 재미있어서 그 영화를 보고 싶었어요.", "Трейлер показался интересным, поэтому захотелось посмотреть этот фильм.", "захотелось посмотреть этот фильм", "The trailer looked interesting, so I wanted to watch that film.", "wanted to watch that film"],
  deutda: ["기분이 우울해서 좋아하는 음악을 듣고 싶었어요.", "Мне было грустно, поэтому захотелось послушать любимую музыку.", "захотелось послушать любимую музыку", "I was feeling down, so I wanted to listen to my favourite music.", "wanted to listen to my favourite music"],
  ikda: ["한국 여행을 준비해서 한국어 책을 읽고 싶었어요.", "Я готовился(ась) к поездке в Корею, поэтому хотел(а) почитать книгу на корейском.", "хотел(а) почитать книгу на корейском", "I was preparing for a trip to Korea, so I wanted to read a Korean book.", "wanted to read a Korean book"],
  sseuda: ["친구에게 전하고 싶은 말이 있어서 편지를 쓰고 싶었어요.", "Я хотел(а) кое-что сказать другу, поэтому захотелось написать письмо.", "захотелось написать письмо", "I had something I wanted to tell a friend, so I wanted to write a letter.", "wanted to write a letter"],
  sada: ["세일 중이라 새 옷을 사고 싶었어요.", "Шла распродажа, поэтому захотелось купить новую одежду.", "захотелось купить новую одежду", "There was a sale, so I wanted to buy new clothes.", "wanted to buy new clothes"],
  salda: ["바다를 좋아해서 바닷가에서 살고 싶었어요.", "Мне нравится море, поэтому я хотел(а) жить у моря.", "хотел(а) жить у моря", "I love the sea, so I wanted to live by the coast.", "wanted to live by the coast"],
  undonghada: ["건강을 위해 헬스장에서 운동하고 싶었어요.", "Я хотел(а) заботиться о здоровье, поэтому захотелось заниматься спортом в зале.", "захотелось заниматься спортом в зале", "I wanted to take care of my health, so I wanted to exercise at the gym.", "wanted to exercise at the gym"],
  swida: ["너무 피곤해서 잠깐 쉬고 싶었어요.", "Я очень устал(а), поэтому захотелось немного отдохнуть.", "захотелось немного отдохнуть", "I was very tired, so I wanted to rest for a while.", "wanted to rest for a while"],
  tada: ["비가 너무 와서 버스를 타고 싶었어요.", "Шёл сильный дождь, поэтому хотелось поехать на автобусе.", "хотелось поехать на автобусе", "It was raining heavily, so I wanted to take the bus.", "wanted to take the bus"],
  yeolda: ["방 안이 답답해서 창문을 열고 싶었어요.", "В комнате было душно, поэтому захотелось открыть окно.", "захотелось открыть окно", "The room felt stuffy, so I wanted to open the window.", "wanted to open the window"],
  gidarida: ["할 말이 있어서 친구를 기다리고 싶었어요.", "Мне нужно было поговорить с другом, поэтому я хотел(а) его дождаться.", "хотел(а) его дождаться", "I needed to talk to my friend, so I wanted to wait for them.", "wanted to wait for them"],
  nolda: ["오랜만에 쉬는 날이라 친구하고 놀고 싶었어요.", "У меня давно не было выходного, поэтому захотелось провести время с друзьями.", "захотелось провести время с друзьями", "It was my first day off in a long time, so I wanted to spend time with friends.", "wanted to spend time with friends"],
  mandeulda: ["다음 날 발표가 있어서 발표 자료를 만들고 싶었어요.", "На следующий день была презентация, поэтому я хотел(а) подготовить материалы.", "хотел(а) подготовить материалы", "I had a presentation the next day, so I wanted to prepare the materials.", "wanted to prepare the materials"]
};

function getCuratedWordExample(exercise) {
  const chainKey = Array.isArray(exercise?.resolvedOrder) ? exercise.resolvedOrder.join("__") : "";
  const entry = chainKey === "go_sipda__past_tense" ? CURATED_PAST_WISH_EXAMPLES[exercise?.word?.id] : null;

  if (!entry || !String(entry[0]).includes(exercise.correctAnswer)) {
    return null;
  }

  return {
    sentence: entry[0], meaningRu: entry[1], targetRu: entry[2],
    meaningEn: entry[3], targetEn: entry[4],
    sourceType: "curated", sourceLabel: "Curated word-and-chain example"
  };
}

function getSafeExample(exercise) {
  const wordSpecificExample = getCuratedWordExample(exercise);
  if (wordSpecificExample) {
    return wordSpecificExample;
  }
  const example = getExampleForExercise(exercise);
  if (example?.sourceType === "curated" && exampleUsesExactAnswer(example, exercise)) {
    return addEnglishLocalFallback(example, exercise);
  }

  // Word-matched templates can be grammatically correct yet semantically odd.
  // They must never replace a validated AI or manually curated example.
  return null;
}

async function getBestExampleResponse(exercise) {
  // Exercise situations are AI-generated only. Local templates are never
  // displayed because a formally correct form can still sound unnatural.
  return generateAiExampleForExercise(exercise);
}

function getNotConnectableExplanationEn(grammarIds) {
  const selected = Array.isArray(grammarIds) ? grammarIds : [];

  if (selected.includes("go_sipda") && selected.includes("neuryeogo_hada")) {
    const includesPast = selected.includes("past_tense");
    return includesPast
      ? "Both -고 싶다 and -(으)려고 하다 express desire or intention, so they are not normally combined in one predicate. Use either -고 싶다 -> -았/었- or -(으)려고 하다 -> -았/었-."
      : "Both -고 싶다 and -(으)려고 하다 express desire or intention, so they are not normally combined in one predicate. Choose one of them for this chain.";
  }

  return "These grammar patterns cannot all be combined into one natural predicate. Try removing one pattern or choosing a shorter compatible chain.";
}

function buildExerciseSetResponse(result, meta = {}) {
  if (!result?.ok) {
    return {
      ok: false,
      errorType: result?.errorType || "not_connectable",
      message: result?.message || "Эти грамматики не соединяются.",
      messageEn: getNotConnectableExplanationEn(meta.selectedGrammarIds),
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
  let normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  if (normalizedPath === "/speaking-test") {
    normalizedPath = "/speaking-test.html";
  }
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
  if (!cachedOptions) {
    cachedOptions = generateStudentOptions();
  }

  sendJson(response, 200, {
    ok: true,
    options: cachedOptions,
    constraints: {
      minGrammarSelection: MIN_GRAMMAR_SELECTION,
      maxGrammarSelection: MAX_GRAMMAR_SELECTION,
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

async function handleSpeakingConfig(response) {
  sendJson(response, 200, {
    ok: true,
    stages: {
      pre: getSpeakingTasks("pre"),
      post: getSpeakingTasks("post")
    },
    storage: {
      folderName: "GramChain_speaking"
    }
  });
}

async function handleSpeakingSessionStart(request, response) {
  const body = await readRequestBody(request);
  const participantCode = sanitizeParticipantCode(body.participantCode);
  const stage = sanitizeSpeakingStage(body.stage);

  if (!participantCode) {
    sendJson(response, 400, {
      ok: false,
      message: "Введите код участника."
    });
    return;
  }

  const tasks = getSpeakingTasks(stage);
  const session = {
    ok: true,
    sessionId: randomUUID(),
    participantCode,
    stage,
    startedAt: new Date().toISOString(),
    tasks
  };

  await appendLog({
    type: "speaking_session_started",
    sessionId: session.sessionId,
    participantCode,
    payload: {
      stage,
      taskCount: tasks.length,
      startedAt: session.startedAt
    }
  });

  sendJson(response, 200, session);
}

async function handleSpeakingEvent(request, response) {
  const body = await readRequestBody(request);
  const participantCode = sanitizeParticipantCode(body.participantCode);
  const stage = sanitizeSpeakingStage(body.stage);
  const eventType = String(body.eventType || "").trim();

  if (!body.sessionId || !participantCode || !eventType) {
    sendJson(response, 400, {
      ok: false,
      message: "Не хватает данных speaking-лога."
    });
    return;
  }

  await appendLog({
    type: `speaking_${eventType}`,
    sessionId: body.sessionId,
    participantCode,
    payload: {
      stage,
      ...(body.payload || {})
    }
  });

  sendJson(response, 200, { ok: true });
}

async function handleSpeakingUpload(request, response) {
  const body = await readRequestBody(request, { maxBytes: AUDIO_BODY_LIMIT });
  const participantCode = sanitizeParticipantCode(body.participantCode);
  const stage = sanitizeSpeakingStage(body.stage);
  const taskId = sanitizeTaskId(body.taskId);
  const audioBase64 = String(body.audioBase64 || "").trim();
  const mimeType = String(body.mimeType || "audio/webm");

  if (!body.sessionId || !participantCode || !taskId || !audioBase64) {
    sendJson(response, 400, {
      ok: false,
      message: "Не хватает данных для сохранения аудио."
    });
    return;
  }

  const extension = getAudioExtension(mimeType);
  const fileName = `${participantCode}_${stage}_${taskId}.${extension}`;
  const audioBuffer = Buffer.from(audioBase64, "base64");
  const uploadedAt = new Date().toISOString();

  if (isGoogleSheetsLoggingEnabled()) {
    try {
      const uploadResult = await uploadSpeakingAudioToGoogleDrive({
        type: "speaking_recording_uploaded",
        sessionId: body.sessionId,
        participantCode,
        loggedAt: uploadedAt,
        payload: {
          stage,
          taskId,
          fileName,
          mimeType,
          bytes: audioBuffer.length,
          taskPrompt: body.taskPrompt || "",
          recordingStartedAt: body.recordingStartedAt || null,
          recordingStoppedAt: body.recordingStoppedAt || uploadedAt,
          uploadedAt,
          audioBase64
        }
      });

      loggingStatus.backend = "google-sheets";
      loggingStatus.lastAttemptAt = uploadedAt;
      loggingStatus.lastSuccessAt = uploadedAt;
      loggingStatus.lastError = null;
      loggingStatus.lastMode = "google-drive";

      sendJson(response, 200, {
        ok: true,
        fileName,
        storage: "google-drive",
        driveFileId: uploadResult.driveFileId || null,
        driveFileUrl: uploadResult.driveFileUrl || null
      });
      return;
    } catch (error) {
      loggingStatus.lastAttemptAt = uploadedAt;
      loggingStatus.lastError = error.message || String(error);
      console.error("Failed to upload speaking audio to Google Drive, falling back to local file:", error);
    }
  }

  ensureSpeakingStorage();
  const filePath = path.join(SPEAKING_OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, audioBuffer);

  await appendLog({
    type: "speaking_recording_uploaded",
    sessionId: body.sessionId,
    participantCode,
    payload: {
      stage,
      taskId,
      fileName,
      mimeType,
      bytes: audioBuffer.length,
      taskPrompt: body.taskPrompt || "",
      recordingStartedAt: body.recordingStartedAt || null,
      recordingStoppedAt: body.recordingStoppedAt || new Date().toISOString(),
      uploadedAt,
      storage: "file"
    }
  });

  sendJson(response, 200, {
    ok: true,
    fileName,
    storage: "file",
    relativePath: path.join("outputs", "GramChain_speaking", fileName),
    warning: "Google Drive upload was not confirmed. The file was saved only to local fallback storage."
  });
}

async function handleSelfExercise(request, response) {
  const body = await readRequestBody(request);
  const grammarIds = Array.isArray(body.grammarIds) ? body.grammarIds : [];

  if (grammarIds.length < MIN_GRAMMAR_SELECTION || grammarIds.length > MAX_GRAMMAR_SELECTION) {
    sendJson(response, 400, {
      ok: false,
      message: `Выберите от ${MIN_GRAMMAR_SELECTION} до ${MAX_GRAMMAR_SELECTION} грамматик.`
    });
    return;
  }

  const result = generateExerciseBatch(grammarIds, {
    count: EXERCISES_PER_SET
  });

  sendJson(response, 200, buildExerciseSetResponse(result, {
    mode: "self",
    selectedGrammarIds: grammarIds
  }));
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
      message: "Эти грамматики не соединяются.",
      messageEn: getNotConnectableExplanationEn([])
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
  const example = await getBestExampleResponse(exercise);

  sendJson(response, 200, {
    ok: true,
    checkResult,
    example
  });
}

async function handleExerciseContext(request, response) {
  const body = await readRequestBody(request);
  const exercise = body.exercise;

  if (!exercise?.correctAnswer) {
    sendJson(response, 400, {
      ok: false,
      message: "Некорректное упражнение."
    });
    return;
  }

  const example = await getBestExampleResponse(exercise);

  // The learner sees the Russian situation before answering, not the Korean
  // sentence that contains the completed target form.
  sendJson(response, 200, {
    ok: true,
    // Return the full object once so the later feedback uses this exact same
    // Korean example, rather than generating a second potentially different one.
    example: example || null,
    situationRu: example?.meaningRu || null,
    situationTargetRu: example?.targetRu || null,
    situationEn: example?.meaningEn || null,
    situationTargetEn: example?.targetEn || null
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

    if (pathname === "/api/examples/status") {
      if (request.method !== "GET") {
        sendMethodNotAllowed(response);
        return;
      }

      sendJson(response, 200, {
        ok: true,
        ...getAiExampleGenerationStatus()
      });
      return;
    }

    if (pathname === "/api/speaking/config") {
      if (request.method !== "GET") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleSpeakingConfig(response);
      return;
    }

    if (pathname === "/api/speaking/session/start") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleSpeakingSessionStart(request, response);
      return;
    }

    if (pathname === "/api/speaking/event") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleSpeakingEvent(request, response);
      return;
    }

    if (pathname === "/api/speaking/recording/upload") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleSpeakingUpload(request, response);
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

    if (pathname === "/api/exercise/context") {
      if (request.method !== "POST") {
        sendMethodNotAllowed(response);
        return;
      }

      await handleExerciseContext(request, response);
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
  ensureSpeakingStorage();
  loggingStatus.backend = isGoogleSheetsLoggingEnabled() ? "google-sheets" : "file";
  console.log(`Research logging backend: ${isGoogleSheetsLoggingEnabled() ? "google-sheets" : "file"}`);
  console.log(`AI examples: ${isAiExampleGenerationEnabled() ? "enabled" : "disabled"}`);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  getSafeExample,
  getCuratedWordExample
};
