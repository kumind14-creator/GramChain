const speakingState = {
  language: "ru",
  participantCode: "",
  stage: "pre",
  sessionId: null,
  startedAt: null,
  tasksByStage: { pre: [], post: [] },
  tasks: [],
  currentTaskIndex: -1,
  showInstructions: false,
  isPracticeRecording: false,
  mediaStream: null,
  mediaRecorder: null,
  audioContext: null,
  analyser: null,
  analyserData: null,
  meterAnimationFrameId: null,
  chunks: [],
  recordingStartedAt: null,
  recordingStoppedAt: null,
  timerId: null,
  elapsedMs: 0,
  isUploading: false,
  completedUploads: []
};

const speakingRoot = document.getElementById("speakingApp");

const speakingText = {
  ru: {
    loading: "Загрузка...",
    title: "Подготовка к записи",
    intro: "Введите код участника, выберите этап и разрешите доступ к микрофону. Когда откроется задание, запись начнется автоматически.",
    participantCode: "Код участника",
    participantPlaceholder: "Например: 101",
    stage: "Этап",
    pre: "Pre-test",
    post: "Post-test",
    preDescription: "Запись до обучения",
    postDescription: "Запись после обучения",
    continue: "Продолжить",
    microphoneTitle: "Проверка микрофона",
    microphoneIntro: "Нажмите кнопку ниже и разрешите доступ к микрофону. Пока идет запись, участник не сможет случайно остановить ее внутри страницы.",
    enableMicrophone: "Разрешить микрофон",
    microphoneReady: "Микрофон подключен. Можно начинать.",
    microphoneMissing: "Сначала нужно разрешить доступ к микрофону.",
    beginSession: "Начать задания",
    instructionTitle: "Инструкция",
    instructionText: "Прочитайте предложение и выразите его содержание по-корейски одним связным высказыванием. Соедините две или более грамматические формы в одном предикативном комплексе. Не обязательно переводить предложение дословно, но необходимо сохранить его основной смысл.",
    practiceTitle: "Пробное задание",
    practiceText: "Если станет холодно, я надену теплую одежду.",
    practiceAnswerLabel: "Возможный ответ",
    practiceAnswer: "추워지면 따뜻한 옷을 입을 거예요.",
    practiceNote: "Пробная запись нужна только для проверки инструкции и микрофона. Она не сохраняется и не включается в результаты.",
    startPractice: "Начать пробную запись",
    finishPractice: "Закончить пробную запись и начать тест",
    task: "Задание",
    stageBadge: "Этап",
    participantBadge: "Участник",
    recording: "Идет запись",
    finishRecording: "Закончить запись и сохранить",
    saveAndNext: "Сохранить и перейти к следующему заданию",
    uploading: "Сохраняем аудио...",
    nextTask: "Следующее задание",
    finishSession: "Последнее задание этого этапа",
    warning: "Не закрывайте страницу, пока запись не сохранится.",
    summaryTitle: "Этап завершен",
    summaryText: "Ниже показано, куда сохранилась каждая запись.",
    backToStart: "Начать новый этап",
    fileLabel: "Файл",
    storageLabel: "Хранение",
    savedToGoogleDrive: "Сохранено на Google Drive",
    savedLocallyOnly: "Сохранено только в локальном fallback",
    driveWarning: "Google Drive не подтвердил сохранение. Нужно обновить deployment Apps Script или webhook URL.",
    timerLabel: "Прошло времени",
    requestError: "Что-то пошло не так. Попробуйте еще раз.",
    noTasks: "Для этого этапа пока нет заданий.",
    missingCode: "Введите код участника."
  },
  en: {
    loading: "Loading...",
    title: "Recording setup",
    intro: "Enter the participant code, choose the stage, and allow microphone access. Recording starts automatically when a task opens.",
    participantCode: "Participant code",
    participantPlaceholder: "For example: 101",
    stage: "Stage",
    pre: "Pre-test",
    post: "Post-test",
    preDescription: "Recording before training",
    postDescription: "Recording after training",
    continue: "Continue",
    microphoneTitle: "Microphone check",
    microphoneIntro: "Click the button below and allow microphone access. While recording is active, the participant cannot accidentally stop it inside the page.",
    enableMicrophone: "Allow microphone",
    microphoneReady: "Microphone is connected. You can begin.",
    microphoneMissing: "Microphone access is required first.",
    beginSession: "Begin tasks",
    instructionTitle: "Instructions",
    instructionText: "Read the sentence and express its meaning in Korean as one connected utterance. Combine two or more grammar forms in one predicate complex. You do not need to translate the sentence word for word, but you must preserve its main meaning.",
    practiceTitle: "Practice task",
    practiceText: "If it gets cold, I will wear warm clothes.",
    practiceAnswerLabel: "Possible answer",
    practiceAnswer: "추워지면 따뜻한 옷을 입을 거예요.",
    practiceNote: "The practice recording is only for checking the instructions and microphone. It is not saved or included in the results.",
    startPractice: "Start practice recording",
    finishPractice: "Finish practice recording and start the test",
    task: "Task",
    stageBadge: "Stage",
    participantBadge: "Participant",
    recording: "Recording in progress",
    finishRecording: "Finish recording and save",
    saveAndNext: "Save and go to the next task",
    uploading: "Saving audio...",
    nextTask: "Next task",
    finishSession: "Last task of this stage",
    warning: "Do not close the page until the recording is saved.",
    summaryTitle: "Stage completed",
    summaryText: "The recordings for this stage are listed below.",
    backToStart: "Start a new stage",
    fileLabel: "File",
    storageLabel: "Storage",
    savedToGoogleDrive: "Saved to Google Drive",
    savedLocallyOnly: "Saved only to fallback storage",
    driveWarning: "Google Drive did not confirm the upload. Update the Apps Script deployment or webhook URL.",
    timerLabel: "Elapsed time",
    requestError: "Something went wrong. Please try again.",
    noTasks: "There are no tasks for this stage yet.",
    missingCode: "Enter the participant code."
  }
};

function st(key) {
  return speakingText[speakingState.language][key] || key;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || st("requestError"));
  }

  return payload;
}

function formatTimer(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildWaveBarsHtml(count = 20) {
  return Array.from({ length: count }, (_, index) => (
    `<span class="speaking-wave-bar" data-wave-bar="${index}"></span>`
  )).join("");
}

function getCurrentTask() {
  if (speakingState.isPracticeRecording) {
    return {
      id: "practice",
      promptRu: speakingText.ru.practiceText,
      promptEn: speakingText.en.practiceText
    };
  }

  return speakingState.tasks[speakingState.currentTaskIndex] || null;
}

function getTaskPrompt(task) {
  return speakingState.language === "en"
    ? (task.promptEn || task.promptRu || "")
    : (task.promptRu || task.promptEn || "");
}

function setLanguage(nextLanguage) {
  speakingState.language = nextLanguage === "en" ? "en" : "ru";
  window.localStorage?.setItem("gramchain_speaking_lang", speakingState.language);
  renderSpeakingScreen();
}

function renderLanguageButtons() {
  return `
    <div class="speaking-actions">
      <button class="speaking-ghost-button" data-action="language-ru">RU</button>
      <button class="speaking-ghost-button" data-action="language-en">EN</button>
    </div>
  `;
}

function renderStartScreen() {
  speakingRoot.innerHTML = `
    <section class="speaking-screen">
      ${renderLanguageButtons()}
      <div class="speaking-section">
        <h2>${st("title")}</h2>
        <p>${st("intro")}</p>
      </div>

      <div class="speaking-form">
        <div class="speaking-field">
          <label for="participantCode">${st("participantCode")}</label>
          <input id="participantCode" type="text" value="${escapeHtml(speakingState.participantCode)}" placeholder="${escapeHtml(st("participantPlaceholder"))}" maxlength="64" />
        </div>

        <div class="speaking-field">
          <div class="speaking-group-label">${st("stage")}</div>
          <div class="speaking-stage-grid">
            <button class="speaking-stage-option ${speakingState.stage === "pre" ? "active" : ""}" data-action="stage-pre">
              <strong>${st("pre")}</strong>
              <span>${st("preDescription")}</span>
            </button>
            <button class="speaking-stage-option ${speakingState.stage === "post" ? "active" : ""}" data-action="stage-post">
              <strong>${st("post")}</strong>
              <span>${st("postDescription")}</span>
            </button>
          </div>
        </div>

        <div class="speaking-actions">
          <a class="speaking-secondary-button speaking-link-button" href="/">Main app</a>
          <button class="speaking-button" data-action="start-setup">${st("continue")}</button>
        </div>
      </div>
    </section>
  `;
}

function renderMicrophoneScreen() {
  speakingRoot.innerHTML = `
    <section class="speaking-screen">
      ${renderLanguageButtons()}
      <div class="speaking-section">
        <h2>${st("microphoneTitle")}</h2>
        <p>${st("microphoneIntro")}</p>
      </div>

      <div class="speaking-permission">
        ${speakingState.mediaStream ? st("microphoneReady") : st("microphoneMissing")}
      </div>

      <div class="speaking-actions">
        <button class="speaking-secondary-button" data-action="enable-microphone">${st("enableMicrophone")}</button>
        <button class="speaking-button" data-action="begin-speaking-session" ${speakingState.mediaStream ? "" : "disabled"}>${st("beginSession")}</button>
      </div>
    </section>
  `;
}

function renderInstructionScreen() {
  speakingRoot.innerHTML = `
    <section class="speaking-screen">
      ${renderLanguageButtons()}
      <div class="speaking-section">
        <h2>${st("instructionTitle")}</h2>
        <p>${st("instructionText")}</p>
      </div>

      <article class="speaking-task-card">
        <h2>${st("practiceTitle")}</h2>
        <div class="speaking-prompt">${escapeHtml(st("practiceText"))}</div>
        <p><strong>${st("practiceAnswerLabel")}:</strong> ${escapeHtml(st("practiceAnswer"))}</p>
        <p class="speaking-warning">${st("practiceNote")}</p>
        <div class="speaking-task-actions">
          <button class="speaking-button" data-action="start-practice-recording">${st("startPractice")}</button>
        </div>
      </article>
    </section>
  `;
}

function renderTaskScreen() {
  const task = getCurrentTask();
  if (!task) {
    speakingRoot.innerHTML = `<div class="speaking-empty">${escapeHtml(st("noTasks"))}</div>`;
    return;
  }

  const isRecording = Boolean(speakingState.mediaRecorder && speakingState.mediaRecorder.state === "recording");
  const isPracticeTask = speakingState.isPracticeRecording;
  const isLastTask = !isPracticeTask && speakingState.currentTaskIndex === speakingState.tasks.length - 1;
  const actionLabel = isPracticeTask
    ? st("finishPractice")
    : (isLastTask ? st("finishRecording") : st("saveAndNext"));
  const statusLabel = speakingState.isUploading ? st("uploading") : st("recording");

  speakingRoot.innerHTML = `
    <section class="speaking-screen">
      ${renderLanguageButtons()}
      <article class="speaking-task-card">
        <div class="speaking-badge-row">
          <span class="speaking-badge">${st("participantBadge")}: ${escapeHtml(speakingState.participantCode)}</span>
          <span class="speaking-badge">${st("stageBadge")}: ${escapeHtml(speakingState.stage)}</span>
          <span class="speaking-badge">${isPracticeTask ? st("practiceTitle") : `${st("task")} ${task.order}/${speakingState.tasks.length}`}</span>
        </div>

        <div>
          <h2>${isPracticeTask ? st("practiceTitle") : `${st("task")} ${task.order}`}</h2>
          <p class="speaking-progress">${isPracticeTask ? st("practiceNote") : (isLastTask ? st("finishSession") : st("nextTask"))}</p>
        </div>

        <div class="speaking-prompt">${escapeHtml(getTaskPrompt(task))}</div>

        <div class="speaking-recording-panel">
          <div class="speaking-status ${speakingState.isUploading ? "uploading" : "recording"}">${statusLabel}</div>
          <div class="speaking-waveform ${isRecording ? "active" : ""}" aria-hidden="true">
            ${buildWaveBarsHtml()}
          </div>
          <div class="speaking-timer">${st("timerLabel")}: <span id="speakingTimer">${formatTimer(speakingState.elapsedMs)}</span></div>
          <div class="speaking-warning">${st("warning")}</div>
        </div>

        <div class="speaking-task-actions">
          <button class="speaking-button" data-action="finish-current-recording" ${(isRecording && !speakingState.isUploading) ? "" : "disabled"}>${actionLabel}</button>
        </div>
      </article>
    </section>
  `;
}

function renderSummaryScreen() {
  const items = speakingState.completedUploads.map((item) => `
    <div class="speaking-summary-item">
      <strong>${escapeHtml(item.taskId)}</strong><br />
      ${escapeHtml(st("fileLabel"))}: ${escapeHtml(item.fileName)}<br />
      ${escapeHtml(st("storageLabel"))}: ${escapeHtml(item.storageLabel)}
      ${item.driveFileUrl ? `<br /><a href="${escapeHtml(item.driveFileUrl)}" target="_blank" rel="noreferrer">Google Drive</a>` : ""}
      ${item.warning ? `<br /><span class="speaking-warning">${escapeHtml(item.warning)}</span>` : ""}
    </div>
  `).join("");

  speakingRoot.innerHTML = `
    <section class="speaking-screen">
      ${renderLanguageButtons()}
      <div class="speaking-section">
        <h2>${st("summaryTitle")}</h2>
        <p>${st("summaryText")}</p>
      </div>

      <div class="speaking-summary-list">${items}</div>

      <div class="speaking-summary-actions">
        <button class="speaking-button" data-action="restart-speaking">${st("backToStart")}</button>
      </div>
    </section>
  `;
}

function renderSpeakingScreen() {
  if (!speakingState.sessionId) {
    if (speakingState.mediaStream) {
      renderMicrophoneScreen();
      return;
    }

    renderStartScreen();
    return;
  }

  if (speakingState.showInstructions) {
    renderInstructionScreen();
    return;
  }

  if (speakingState.currentTaskIndex >= speakingState.tasks.length) {
    renderSummaryScreen();
    return;
  }

  renderTaskScreen();
}

async function loadSpeakingConfig() {
  const payload = await api("/api/speaking/config");
  speakingState.tasksByStage = payload.stages || speakingState.tasksByStage;
}

async function requestMicrophone() {
  if (speakingState.mediaStream) {
    return speakingState.mediaStream;
  }

  speakingState.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return speakingState.mediaStream;
}

function stopTimer() {
  if (speakingState.timerId) {
    window.clearInterval(speakingState.timerId);
    speakingState.timerId = null;
  }
}

function startTimer() {
  stopTimer();
  speakingState.timerId = window.setInterval(() => {
    if (!speakingState.recordingStartedAt) {
      return;
    }

    speakingState.elapsedMs = Date.now() - speakingState.recordingStartedAt.getTime();
    const timerNode = document.getElementById("speakingTimer");
    if (timerNode) {
      timerNode.textContent = formatTimer(speakingState.elapsedMs);
    }
  }, 250);
}

function stopAudioMeter() {
  if (speakingState.meterAnimationFrameId) {
    window.cancelAnimationFrame(speakingState.meterAnimationFrameId);
    speakingState.meterAnimationFrameId = null;
  }

  document.querySelectorAll("[data-wave-bar]").forEach((bar) => {
    bar.style.setProperty("--level", "0.14");
  });
}

async function ensureAudioAnalyser() {
  if (speakingState.analyser) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !speakingState.mediaStream) {
    return;
  }

  speakingState.audioContext = speakingState.audioContext || new AudioContextClass();
  if (speakingState.audioContext.state === "suspended") {
    await speakingState.audioContext.resume();
  }

  const source = speakingState.audioContext.createMediaStreamSource(speakingState.mediaStream);
  speakingState.analyser = speakingState.audioContext.createAnalyser();
  speakingState.analyser.fftSize = 64;
  speakingState.analyser.smoothingTimeConstant = 0.82;
  source.connect(speakingState.analyser);
  speakingState.analyserData = new Uint8Array(speakingState.analyser.frequencyBinCount);
}

function startAudioMeter() {
  if (!speakingState.analyser || !speakingState.analyserData) {
    return;
  }

  stopAudioMeter();

  const tick = () => {
    if (!speakingState.analyser || !speakingState.analyserData) {
      return;
    }

    const bars = Array.from(document.querySelectorAll("[data-wave-bar]"));
    speakingState.analyser.getByteFrequencyData(speakingState.analyserData);

    for (let index = 0; index < bars.length; index += 1) {
      const sampleIndex = Math.min(
        speakingState.analyserData.length - 1,
        Math.floor(index * (speakingState.analyserData.length / bars.length))
      );
      const raw = speakingState.analyserData[sampleIndex] / 255;
      const level = Math.max(0.12, Math.min(1, raw * 1.35));
      bars[index].style.setProperty("--level", String(level));
    }

    speakingState.meterAnimationFrameId = window.requestAnimationFrame(tick);
  };

  speakingState.meterAnimationFrameId = window.requestAnimationFrame(tick);
}

async function logSpeakingEvent(eventType, payload = {}) {
  if (!speakingState.sessionId || !speakingState.participantCode) {
    return;
  }

  await api("/api/speaking/event", "POST", {
    sessionId: speakingState.sessionId,
    participantCode: speakingState.participantCode,
    stage: speakingState.stage,
    eventType,
    payload
  });
}

function buildMediaRecorder() {
  const supportedMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  const mimeType = supportedMimeTypes.find((value) => window.MediaRecorder && MediaRecorder.isTypeSupported(value));
  return new MediaRecorder(speakingState.mediaStream, mimeType ? { mimeType } : undefined);
}

async function startCurrentTaskRecording() {
  const task = getCurrentTask();
  if (!task) {
    return;
  }

  speakingState.chunks = [];
  speakingState.recordingStartedAt = new Date();
  speakingState.recordingStoppedAt = null;
  speakingState.elapsedMs = 0;
  await ensureAudioAnalyser();
  speakingState.mediaRecorder = buildMediaRecorder();

  speakingState.mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      speakingState.chunks.push(event.data);
    }
  };

  speakingState.mediaRecorder.start();
  startTimer();

  await logSpeakingEvent("task_opened", {
    taskId: task.id,
    taskOrder: task.order,
    taskPrompt: getTaskPrompt(task),
    recordingStartedAt: speakingState.recordingStartedAt.toISOString()
  });

  renderTaskScreen();
  startAudioMeter();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function finishCurrentRecording() {
  const task = getCurrentTask();
  const recorder = speakingState.mediaRecorder;
  if (!task || !recorder || recorder.state !== "recording" || speakingState.isUploading) {
    return;
  }

  speakingState.isUploading = true;
  stopAudioMeter();
  renderTaskScreen();

  const audioBlob = await new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(speakingState.chunks, { type: recorder.mimeType || "audio/webm" }));
    };
    recorder.stop();
  });

  stopTimer();
  speakingState.recordingStoppedAt = new Date();
  speakingState.elapsedMs = speakingState.recordingStartedAt
    ? speakingState.recordingStoppedAt.getTime() - speakingState.recordingStartedAt.getTime()
    : 0;

  if (speakingState.isPracticeRecording) {
    await logSpeakingEvent("practice_task_completed", {
      recordingStartedAt: speakingState.recordingStartedAt?.toISOString() || null,
      recordingStoppedAt: speakingState.recordingStoppedAt?.toISOString() || null,
      durationMs: speakingState.elapsedMs
    });

    // The practice audio is intentionally discarded and never uploaded.
    speakingState.mediaRecorder = null;
    speakingState.chunks = [];
    speakingState.isUploading = false;
    speakingState.isPracticeRecording = false;
    await startCurrentTaskRecording();
    return;
  }

  const base64 = await blobToBase64(audioBlob);
  const uploaded = await api("/api/speaking/recording/upload", "POST", {
    sessionId: speakingState.sessionId,
    participantCode: speakingState.participantCode,
    stage: speakingState.stage,
    taskId: task.id,
    taskPrompt: getTaskPrompt(task),
    mimeType: audioBlob.type || "audio/webm",
    audioBase64: base64,
    recordingStartedAt: speakingState.recordingStartedAt?.toISOString() || null,
    recordingStoppedAt: speakingState.recordingStoppedAt?.toISOString() || null
  });

  speakingState.completedUploads.push({
    taskId: task.id,
    fileName: uploaded.fileName,
    storage: uploaded.storage || "unknown",
    storageLabel: uploaded.storage === "google-drive"
      ? st("savedToGoogleDrive")
      : st("savedLocallyOnly"),
    driveFileUrl: uploaded.driveFileUrl || "",
    warning: uploaded.storage === "google-drive"
      ? ""
      : (uploaded.warning || st("driveWarning"))
  });

  await logSpeakingEvent("task_saved", {
    taskId: task.id,
    fileName: uploaded.fileName,
    recordingStartedAt: speakingState.recordingStartedAt?.toISOString() || null,
    recordingStoppedAt: speakingState.recordingStoppedAt?.toISOString() || null
  });

  speakingState.mediaRecorder = null;
  speakingState.chunks = [];
  speakingState.isUploading = false;
  speakingState.currentTaskIndex += 1;

  if (speakingState.currentTaskIndex < speakingState.tasks.length) {
    await startCurrentTaskRecording();
    return;
  }

  await logSpeakingEvent("stage_completed", {
    completedAt: new Date().toISOString(),
    uploadedFiles: speakingState.completedUploads.map((item) => item.fileName)
  });

  renderSummaryScreen();
}

async function startSpeakingSession() {
  if (!speakingState.participantCode) {
    alert(st("missingCode"));
    return;
  }

  const payload = await api("/api/speaking/session/start", "POST", {
    participantCode: speakingState.participantCode,
    stage: speakingState.stage
  });

  speakingState.sessionId = payload.sessionId;
  speakingState.startedAt = payload.startedAt;
  speakingState.tasks = payload.tasks || [];
  speakingState.currentTaskIndex = 0;
  speakingState.completedUploads = [];
  speakingState.showInstructions = true;
  renderInstructionScreen();
}

async function startPracticeRecording() {
  speakingState.showInstructions = false;
  speakingState.isPracticeRecording = true;
  await startCurrentTaskRecording();
}

function resetSpeakingFlow() {
  stopTimer();
  stopAudioMeter();

  if (speakingState.mediaRecorder && speakingState.mediaRecorder.state === "recording") {
    speakingState.mediaRecorder.stop();
  }

  speakingState.sessionId = null;
  speakingState.startedAt = null;
  speakingState.tasks = [];
  speakingState.currentTaskIndex = -1;
  speakingState.showInstructions = false;
  speakingState.isPracticeRecording = false;
  speakingState.chunks = [];
  speakingState.recordingStartedAt = null;
  speakingState.recordingStoppedAt = null;
  speakingState.isUploading = false;
  speakingState.completedUploads = [];
  renderStartScreen();
}

function bindSpeakingActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    try {
      if (action === "language-ru") {
        setLanguage("ru");
        return;
      }

      if (action === "language-en") {
        setLanguage("en");
        return;
      }

      if (action === "stage-pre") {
        speakingState.stage = "pre";
        renderStartScreen();
        return;
      }

      if (action === "stage-post") {
        speakingState.stage = "post";
        renderStartScreen();
        return;
      }

      if (action === "start-setup") {
        const codeInput = document.getElementById("participantCode");
        speakingState.participantCode = String(codeInput?.value || "").trim();
        if (!speakingState.participantCode) {
          alert(st("missingCode"));
          return;
        }
        renderMicrophoneScreen();
        return;
      }

      if (action === "enable-microphone") {
        await requestMicrophone();
        renderMicrophoneScreen();
        return;
      }

      if (action === "begin-speaking-session") {
        await startSpeakingSession();
        return;
      }

      if (action === "start-practice-recording") {
        await startPracticeRecording();
        return;
      }

      if (action === "finish-current-recording") {
        await finishCurrentRecording();
        return;
      }

      if (action === "restart-speaking") {
        resetSpeakingFlow();
      }
    } catch (error) {
      console.error(error);
      alert(error.message || st("requestError"));
      speakingState.isUploading = false;
      renderSpeakingScreen();
    }
  });
}

window.addEventListener("beforeunload", (event) => {
  const isRecording = speakingState.mediaRecorder && speakingState.mediaRecorder.state === "recording";
  if (!isRecording && !speakingState.isUploading) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

async function bootstrapSpeaking() {
  const savedLanguage = window.localStorage?.getItem("gramchain_speaking_lang");
  if (savedLanguage === "ru" || savedLanguage === "en") {
    speakingState.language = savedLanguage;
  }

  bindSpeakingActions();
  await loadSpeakingConfig();
  renderStartScreen();
}

bootstrapSpeaking().catch((error) => {
  speakingRoot.innerHTML = `<div class="speaking-empty">${escapeHtml(error.message)}</div>`;
});
