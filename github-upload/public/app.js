const state = {
  options: null,
  minGrammarSelection: 2,
  exercisesPerSet: 5,
  participantCode: "",
  researchSessionId: null,
  currentMode: null,
  currentDifficulty: null,
  selectedGrammarIds: [],
  currentSession: null,
  currentExerciseIndex: 0,
  currentResult: null,
  showHint: false,
  showWhy: false,
  lastSubmittedAnswer: "",
  draftAnswer: "",
  attemptCounts: {},
  exerciseOutcomes: {},
  mistakeHistory: [],
  pendingSkip: false,
  exerciseStartedAt: null,
  exerciseLogKey: null,
  taskTimes: {},
  completedTasks: {},
  pendingTaskEvaluation: null,
  taskDifficultyRatings: {},
  currentLanguage: "ru",
  currentView: "participant_start"
};

const appRoot = document.getElementById("app");

const uiText = {
  ru: {
    langLabel: "EN",
    participantCode: "Код участника",
    participantIntro: "Перед началом тренировки введите код участника.",
    codeLabel: "Код",
    codePlaceholder: "Например: 101",
    start: "Начать",
    chooseTraining: "Как будем тренироваться?",
    selfPath: "Своя траектория",
    selfPractice: "Своя тренировка",
    selfPracticeIntro: "Выберите грамматики, которые хотите потренировать.",
    open: "Открыть",
    quickStart: "Быстрый старт",
    freePractice: "Свободная тренировка",
    freePracticeIntro: "Выберите, хотите потренировать цепочки из 2 или из 3 грамматик.",
    chooseGrammars: "Выберите грамматики для тренировки.",
    selectedNow: "Сейчас выбрано: {count}",
    backHome: "На главную",
    startTraining: "Начать тренировку",
    chooseDifficulty: "Выберите уровень сложности, и приложение само подберет цепочку грамматик.",
    startShort: "Начать",
    chooseShort: "Выбрать",
    hardDescription: "3-4 грамматики.",
    easyDescription: "2 грамматики.",
    notConnectable: "Эти грамматики не соединяются.",
    chooseOtherGrammars: "Выбрать другие грамматики",
    tryConnect: "Попробуйте соединить выбранные грамматики с этим словом и впишите ответ в нужной форме.",
    exercise: "Упражнение",
    ofTotal: "{current} из {total}",
    word: "Слово",
    answerPlaceholder: "Введите свой ответ",
    hideHint: "Скрыть подсказку",
    hint: "Подсказка",
    skipWord: "Пропустить слово",
    check: "Проверить",
    result: "Результат",
    correct: "Верно",
    yourAnswer: "Ваш ответ:",
    correctAnswer: "Правильный ответ:",
    tryAgainHelper: "Попробуйте еще раз. Если захотите, можно открыть подсказку или пропустить это слово.",
    hideWhy: "Скрыть объяснение",
    whySo: "Почему так?",
    example: "Пример",
    tryAgain: "Попробовать еще раз",
    next: "Дальше",
    finishChain: "Завершить цепочку",
    newExercise: "Новое упражнение",
    enterParticipantCode: "Введите код участника.",
    minGrammarAlert: "Пожалуйста, выберите минимум {count} грамматики.",
    chainCompleted: "Цепочка завершена",
    summaryGoodJob: "Хорошая работа. Можно перейти к следующей цепочке или повторить эту же еще раз.",
    chain: "Цепочка",
    totalWords: "Всего слов",
    skipped: "Пропущено",
    repeatChain: "Повторить эту цепочку",
    chooseAnotherChain: "Выбрать другую цепочку",
    mistakesTitle: "Мои ошибки",
    mistakesIntro: "Здесь собираются последние ответы, которые стоит повторить еще раз.",
    mistakesEmpty: "Пока здесь пусто. Когда в тренировке появятся ошибки, они отобразятся на этом экране.",
    reviewKicker: "Повторение",
    mistakesCardText: "Откройте список ответов, к которым хотите вернуться позже.",
    taskDifficultyTitle: "Оценка задания",
    taskDifficultyQuestion: "Насколько сложным было это задание?",
    taskLabel: "Задание:",
    difficultyHelper: "Выберите число от 1 до 7, где 1 = очень легко, а 7 = очень сложно.",
    difficultyEasy: "1 = очень легко",
    difficultyHard: "7 = очень сложно",
    taskDifficultyAria: "Оценка сложности задания",
    incorrectRetry: "Порядок верный, но сама форма собрана с ошибкой.",
    requestError: "Ошибка запроса.",
    retryError: "Произошла ошибка. Попробуйте еще раз."
  },
  en: {
    langLabel: "RU",
    participantCode: "Participant code",
    participantIntro: "Enter the participant code before starting the practice session.",
    codeLabel: "Code",
    codePlaceholder: "For example: 101",
    easyLevel: "Easier",
    hardLevel: "More challenging",
    start: "Start",
    chooseTraining: "How would you like to practice?",
    selfPath: "Custom path",
    selfPractice: "Custom practice",
    selfPracticeIntro: "Choose the grammar patterns you want to practice.",
    open: "Open",
    quickStart: "Quick start",
    freePractice: "Free practice",
    freePracticeIntro: "Choose whether you want to practice chains of 2 or 3 grammar patterns.",
    chooseGrammars: "Choose the grammar patterns for practice.",
    selectedNow: "Selected now: {count}",
    backHome: "Back to home",
    startTraining: "Start practice",
    chooseDifficulty: "Choose the difficulty level and the app will prepare a grammar chain for you.",
    startShort: "Start",
    chooseShort: "Choose",
    hardDescription: "3-4 grammar patterns.",
    easyDescription: "2 grammar patterns.",
    notConnectable: "These grammar patterns do not connect.",
    chooseOtherGrammars: "Choose other grammar patterns",
    tryConnect: "Try to connect the selected grammar patterns with this word and enter the answer in the correct form.",
    exercise: "Exercise",
    ofTotal: "{current} of {total}",
    word: "Word",
    answerPlaceholder: "Enter your answer",
    hideHint: "Hide hint",
    hint: "Hint",
    skipWord: "Skip word",
    check: "Check",
    result: "Result",
    correct: "Correct",
    yourAnswer: "Your answer:",
    correctAnswer: "Correct answer:",
    tryAgainHelper: "Try again. If you want, you can open the hint or skip this word.",
    hideWhy: "Hide explanation",
    whySo: "Why?",
    example: "Example",
    tryAgain: "Try again",
    next: "Next",
    finishChain: "Finish chain",
    newExercise: "New exercise",
    enterParticipantCode: "Enter the participant code.",
    minGrammarAlert: "Please choose at least {count} grammar patterns.",
    chainCompleted: "Chain completed",
    summaryGoodJob: "Good job. You can move to the next chain or repeat this one again.",
    chain: "Chain",
    totalWords: "Total words",
    skipped: "Skipped",
    repeatChain: "Repeat this chain",
    chooseAnotherChain: "Choose another chain",
    mistakesTitle: "My mistakes",
    mistakesIntro: "This screen keeps the latest answers that are worth reviewing again.",
    mistakesEmpty: "Nothing is here yet. When mistakes appear during practice, they will show up on this screen.",
    reviewKicker: "Review",
    mistakesCardText: "Open the list of answers you may want to revisit later.",
    taskDifficultyTitle: "Task rating",
    taskDifficultyQuestion: "How difficult was this task?",
    taskLabel: "Task:",
    difficultyHelper: "Choose a number from 1 to 7, where 1 = very easy and 7 = very difficult.",
    difficultyEasy: "1 = very easy",
    difficultyHard: "7 = very difficult",
    taskDifficultyAria: "Task difficulty rating",
    incorrectRetry: "The order is correct, but the form itself is built incorrectly.",
    requestError: "Request failed.",
    retryError: "Something went wrong. Please try again."
  }
};

function t(key, params = {}) {
  const pack = uiText[state.currentLanguage] || uiText.ru;
  const template = pack[key] ?? uiText.ru[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, token) => {
    return params[token] == null ? "" : String(params[token]);
  });
}

function renderLanguageToggle() {
  return `<button class="ghost-btn language-toggle" data-action="toggle-language">${t("langLabel")}</button>`;
}

function setView(view) {
  state.currentView = view;
}

function refreshCurrentView() {
  window.localStorage?.setItem("gramchain_lang", state.currentLanguage);

  if (state.pendingTaskEvaluation) {
    renderTaskDifficultyPrompt();
    return;
  }

  switch (state.currentView) {
    case "participant_start":
      renderParticipantStart();
      return;
    case "home":
      renderHome();
      return;
    case "self_selection":
      renderSelfSelection();
      return;
    case "free_selection":
      renderFreeSelection();
      return;
    case "exercise":
      renderExercise();
      return;
    case "result":
      renderResult();
      return;
    case "summary":
      renderCompletionSummary();
      return;
    case "mistakes":
      renderMistakesScreen();
      return;
    default:
      renderParticipantStart();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTypoHighlightHtml(submittedAnswer, correctAnswer) {
  const submittedChars = Array.from(String(submittedAnswer ?? ""));
  const correctChars = Array.from(String(correctAnswer ?? ""));
  const maxLength = Math.max(submittedChars.length, correctChars.length);
  let html = "";

  for (let index = 0; index < maxLength; index += 1) {
    const submittedChar = submittedChars[index] ?? "";
    const correctChar = correctChars[index] ?? "";

    if (!submittedChar) {
      continue;
    }

    if (submittedChar === correctChar) {
      html += escapeHtml(submittedChar);
      continue;
    }

    html += `<span class="typo-char">${escapeHtml(submittedChar)}</span>`;
  }

  return html;
}

function getCurrentExercise() {
  return state.currentSession?.exercises?.[state.currentExerciseIndex] ?? null;
}

function getExerciseKey(exercise = getCurrentExercise(), index = state.currentExerciseIndex) {
  if (!exercise) {
    return `${index}:missing`;
  }

  return `${index}:${exercise.word?.id || "word"}:${(exercise.resolvedOrder || []).join("__")}`;
}

function getCurrentAttemptCount() {
  return state.attemptCounts[getExerciseKey()] || 0;
}

function getCurrentOutcome() {
  return state.exerciseOutcomes[getExerciseKey()] || null;
}

function setCurrentOutcome(outcome) {
  state.exerciseOutcomes[getExerciseKey()] = outcome;
}

function getSessionSummary() {
  const outcomes = Object.values(state.exerciseOutcomes);

  return {
    total: state.currentSession?.exercises?.length || 0,
    correctFirstTry: outcomes.filter((item) => item?.status === "correct_first_try").length,
    solvedAfterRetry: outcomes.filter((item) => item?.status === "correct_after_retry").length,
    skipped: outcomes.filter((item) => item?.status === "skipped").length
  };
}

function getGrammarLabel(grammarId) {
  const grammar = state.options?.selfPractice?.grammars?.find((item) => item.id === grammarId);
  return grammar?.label || grammarId;
}

function getParticipantBadgeHtml() {
  if (!state.participantCode) {
    return "";
  }

  return `<div class="participant-badge">${t("participantCode")}: ${escapeHtml(state.participantCode)}</div>`;
}

function getResultMessage(result, submittedAnswer = "") {
  if (!result || result.ok === true) {
    return "";
  }

  if (!String(submittedAnswer).trim()) {
    return "";
  }

  if (result.errorType === "not_connectable") {
    return t("notConnectable");
  }

  if (result.errorType === "wrong_order") {
    return state.currentLanguage === "en"
      ? "These grammar patterns can connect, but the order should be different."
      : "Грамматики соединяются, но порядок должен быть другим.";
  }

  if (result.errorType === "wrong_form") {
    return t("incorrectRetry");
  }

  return "";
}

function getHintHtml(exercise) {
  if (!exercise?.resolvedOrder?.length) {
    return "";
  }

  const orderText = exercise.resolvedOrder.map(getGrammarLabel).join(" -> ");

  return `
    <div class="hint-card">
      <div><strong>${state.currentLanguage === "en" ? "Order" : "Порядок"}:</strong> ${escapeHtml(orderText)}</div>
    </div>
  `;
}

function getPoliteInstruction(exercise) {
  if (!exercise?.correctAnswer) {
    return "";
  }

  if (exercise.correctAnswer.endsWith("요")) {
    return "Введите ответ в форме 아요/어요.";
  }

  return "";
}

function resetExerciseTiming() {
  state.exerciseStartedAt = null;
  state.exerciseLogKey = null;
}

function resetSessionUiState() {
  state.currentResult = null;
  state.currentExerciseIndex = 0;
  state.showHint = false;
  state.showWhy = false;
  state.lastSubmittedAnswer = "";
  state.draftAnswer = "";
  state.attemptCounts = {};
  state.exerciseOutcomes = {};
  state.pendingSkip = false;
  state.pendingTaskEvaluation = null;
  resetExerciseTiming();
}

function getExerciseLogPayload(exercise) {
  return {
    mode: state.currentMode,
    exerciseIndex: state.currentExerciseIndex + 1,
    totalExercises: state.currentSession?.totalExercises || state.currentSession?.exercises?.length || 0,
    wordId: exercise?.word?.id || null,
    wordLemma: exercise?.word?.lemma || null,
    selectedGrammarIds: exercise?.selectedGrammarIds || [],
    resolvedOrder: exercise?.resolvedOrder || []
  };
}

async function api(path, method = "GET", body) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || t("requestError"));
  }

  return payload;
}

async function logResearchEvent(eventType, payload = {}) {
  if (!state.researchSessionId || !state.participantCode) {
    return;
  }

  try {
    await api("/api/research/event", "POST", {
      sessionId: state.researchSessionId,
      participantCode: state.participantCode,
      eventType,
      payload
    });
  } catch (error) {
    console.error("Research log error:", error);
  }
}

function startTask(taskId, label, extra = {}) {
  if (state.taskTimes[taskId] || state.completedTasks[taskId]) {
    return;
  }

  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();
  state.taskTimes[taskId] = startedAtMs;

  void logResearchEvent("task_started", {
    taskId,
    label,
    status: "started",
    startedAt: startedAtIso,
    ...extra
  });
}

function completeTask(taskId, label, extra = {}) {
  if (state.completedTasks[taskId]) {
    return;
  }

  const startedAt = state.taskTimes[taskId];
  const durationMs = startedAt ? Date.now() - startedAt : null;
  const completedAtIso = new Date().toISOString();
  state.completedTasks[taskId] = true;

  void logResearchEvent("task_completed", {
    taskId,
    label,
    durationMs,
    status: "completed",
    startedAt: startedAt ? new Date(startedAt).toISOString() : "",
    completedAt: completedAtIso,
    ...extra
  });
}

function queueTaskDifficultyPrompt(taskId, label, nextScreen = "result") {
  if (!taskId || state.taskDifficultyRatings[taskId] != null) {
    return false;
  }

  state.pendingTaskEvaluation = {
    taskId,
    label,
    nextScreen
  };
  return true;
}

function renderTaskDifficultyPrompt() {
  setView("task_difficulty");
  const pendingTask = state.pendingTaskEvaluation;
  if (!pendingTask) {
    renderResult();
    return;
  }

  const scaleButtons = Array.from({ length: 7 }, (_, index) => {
    const value = index + 1;
    return `<button class="ghost-btn difficulty-btn" data-action="rate-task-difficulty" data-rating="${value}"><span class="difficulty-number">${value}</span></button>`;
  }).join("");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("taskDifficultyTitle")}</h2>
        <p>${t("taskDifficultyQuestion")}</p>
      </div>

      <div class="result-box">
        <div class="result-meta"><strong>${t("taskLabel")}</strong> ${escapeHtml(pendingTask.label)}</div>
        <div class="helper">${t("difficultyHelper")}</div>
        <div class="difficulty-scale" role="group" aria-label="${t("taskDifficultyAria")}">
          ${scaleButtons}
        </div>
        <div class="difficulty-legend">
          <span>${t("difficultyEasy")}</span>
          <span>${t("difficultyHard")}</span>
        </div>
      </div>
    </section>
  `;
}

async function saveTaskDifficultyRating(rating) {
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 7 || !state.pendingTaskEvaluation) {
    return;
  }

  const pendingTask = state.pendingTaskEvaluation;
  state.taskDifficultyRatings[pendingTask.taskId] = value;

  await logResearchEvent("task_difficulty_rated", {
    taskId: pendingTask.taskId,
    label: pendingTask.label,
    difficultyRating: value,
    difficultyScaleMin: 1,
    difficultyScaleMax: 7
  });

  state.pendingTaskEvaluation = null;

  if (pendingTask.nextScreen === "home") {
    renderHome();
    return;
  }

  if (pendingTask.nextScreen === "summary") {
    renderCompletionSummary();
    return;
  }

  renderResult();
}

function ensureExerciseShownLogged(exercise) {
  if (!exercise?.word?.id) {
    return;
  }

  const key = `${state.currentExerciseIndex}:${exercise.word.id}:${(exercise.resolvedOrder || []).join("__")}`;
  if (state.exerciseLogKey === key) {
    return;
  }

  state.exerciseStartedAt = Date.now();
  state.exerciseLogKey = key;
  void logResearchEvent("exercise_shown", getExerciseLogPayload(exercise));
}

function renderParticipantStart() {
  setView("participant_start");
  startTask("task_1", "Enter the access code and start the assigned learning session.");

  appRoot.innerHTML = `
    <section class="screen participant-card">
      <div class="screen-header">
        ${renderLanguageToggle()}
        <h2>${t("participantCode")}</h2>
        <p>${t("participantIntro")}</p>
      </div>

      <div class="exercise-box participant-form">
        <label class="field-label" for="participantCode">${t("codeLabel")}</label>
        <input
          id="participantCode"
          class="code-input"
          type="text"
          maxlength="64"
          placeholder="${t("codePlaceholder")}"
          autocomplete="off"
        />
        <div class="button-row">
          <button class="primary-btn" data-action="start-participant-session">${t("start")}</button>
          <a class="secondary-btn button-link button-link-strong" href="/speaking-test">Speaking test</a>
        </div>
        <p class="subtle-inline-note">
          ${state.currentLanguage === "ru"
            ? "Если нужна отдельная страница для записи аудио, откройте speaking test."
            : "If you need the separate audio-recording page, open the speaking test."}
        </p>
      </div>
    </section>
  `;
}

function renderHome() {
  setView("home");
  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("chooseTraining")}</h2>
      </div>

      <div class="mode-grid">
        <article class="choice-card">
          <div class="card-kicker">${t("selfPath")}</div>
          <h3>${t("selfPractice")}</h3>
          <p>${t("selfPracticeIntro")}</p>
          <button class="primary-btn" data-action="open-self">${t("open")}</button>
        </article>

        <article class="choice-card">
          <div class="card-kicker">${t("quickStart")}</div>
          <h3>${t("freePractice")}</h3>
          <p>${t("freePracticeIntro")}</p>
          <button class="primary-btn" data-action="open-free">${t("open")}</button>
        </article>
      </div>
    </section>
  `;
}

function renderSelfSelection() {
  setView("self_selection");
  const grammars = state.options.selfPractice.grammars
    .map((grammar) => {
      const checked = state.selectedGrammarIds.includes(grammar.id) ? "checked" : "";

      return `
        <article class="grammar-card">
          <label>
            <input type="checkbox" value="${grammar.id}" ${checked} />
            <div>
              <p class="grammar-title">${escapeHtml(grammar.label)}</p>
              <div class="grammar-meta">${escapeHtml(grammar.pattern)}</div>
              <div class="grammar-meta">${escapeHtml(grammar.meaning)}</div>
            </div>
          </label>
        </article>
      `;
    })
    .join("");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("selfPractice")}</h2>
        <p>${t("chooseGrammars")}</p>
      </div>

      <div class="grammar-grid">${grammars}</div>

      <div class="helper">${t("selectedNow", { count: state.selectedGrammarIds.length })}</div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
        <button class="primary-btn" data-action="start-self">${t("startTraining")}</button>
      </div>
    </section>
  `;

  appRoot.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const grammarId = event.target.value;

      if (event.target.checked) {
        state.selectedGrammarIds = [...state.selectedGrammarIds, grammarId];
      } else {
        state.selectedGrammarIds = state.selectedGrammarIds.filter((id) => id !== grammarId);
      }

      renderSelfSelection();
    });
  });
}

function renderFreeSelection() {
  const cards = state.options.freePractice.difficultyOptions
    .map((item) => {
      const descriptionText = item.id === "hard" ? "3-4 грамматики." : "2 грамматики.";

      return `
        <article class="choice-card">
          <h3>${escapeHtml(item.label)}</h3>
          <p>${escapeHtml(descriptionText)}</p>
          <button class="primary-btn" data-difficulty="${item.id}">Выбрать</button>
        </article>
      `;
    })
    .join("");

  return `
    <section class="screen-card">
      ${renderParticipantBadge()}
      <h2>Свободная тренировка</h2>
      <p>Выбери уровень сложности, и приложение само подберет цепочку грамматик.</p>
      <div class="choice-grid">${cards}</div>
      <button class="secondary-btn" data-route="home">На главную</button>
    </section>
  `;
}

renderFreeSelection = function renderFreeSelectionClean() {
  setView("free_selection");
  const cards = state.options.freePractice.difficultyOptions
    .map((item) => {
      const descriptionText = item.id === "hard" ? t("hardDescription") : t("easyDescription");

      const title = state.currentLanguage === "en"
        ? (item.id === "hard" ? t("hardLevel") : t("easyLevel"))
        : item.label;

      return `
        <article class="choice-card">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(descriptionText)}</p>
          <button class="primary-btn" data-difficulty="${item.id}">${t("startShort")}</button>
        </article>
      `;
    })
    .join("");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("freePractice")}</h2>
        <p>${t("freePracticeIntro")}</p>
      </div>

      <div class="difficulty-grid">${cards}</div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
      </div>
    </section>
  `;

  appRoot.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => startFreeExercise(button.dataset.difficulty));
  });
};

function renderExercise() {
  const session = state.currentSession;
  const exercise = getCurrentExercise();

  if (!session?.ok) {
    const connectMessage = session?.message && session.message !== "Эти грамматики не соединяются."
      ? `<p>${escapeHtml(session.message)}</p>`
      : "";

    appRoot.innerHTML = `
      <section class="screen">
        <div class="screen-header">
          ${getParticipantBadgeHtml()}
          <h2>Эти грамматики не соединяются.</h2>
          ${connectMessage}
        </div>
        <div class="button-row">
          <button class="ghost-btn" data-action="back-home">На главную</button>
          <button class="secondary-btn" data-action="retry-mode">Выбрать другие грамматики</button>
        </div>
      </section>
    `;
    return;
  }

  ensureExerciseShownLogged(exercise);

  const modeLabel = state.currentMode === "free" ? "Свободная тренировка" : "Своя тренировка";
  const progress = `${state.currentExerciseIndex + 1} из ${session.totalExercises || session.exercises.length}`;
  const politeInstruction = getPoliteInstruction(exercise);

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>${modeLabel}</h2>
        <p>Попробуйте соединить выбранные грамматики с этим словом и впишите ответ в нужной форме.</p>
      </div>

      <div class="exercise-box">
        <div class="result-meta"><strong>Упражнение:</strong> ${progress}</div>
        <div class="result-meta"><strong>Слово:</strong> ${escapeHtml(exercise.word.lemma)} (${escapeHtml(exercise.word.meaningRu)})</div>
        <div class="pill-row">
          ${exercise.selectedGrammarIds.map((id) => `<span class="pill">${escapeHtml(getGrammarLabel(id))}</span>`).join("")}
        </div>
        ${politeInstruction ? `<div class="helper">${escapeHtml(politeInstruction)}</div>` : ""}
        <textarea id="answerBox" class="answer-box" placeholder="Введите свой ответ">${escapeHtml(state.draftAnswer)}</textarea>
        ${state.showHint ? getHintHtml(exercise) : ""}
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
        <button class="ghost-btn" data-action="toggle-hint">${state.showHint ? "Скрыть подсказку" : "Подсказка"}</button>
        <button class="primary-btn" data-action="check-answer">Проверить</button>
      </div>
    </section>
  `;
}

function renderResult() {
  const exercise = getCurrentExercise();
  const payload = state.currentResult;
  const result = payload?.checkResult;
  const example = payload?.example;
  const hasNext = state.currentExerciseIndex < (state.currentSession?.exercises?.length ?? 0) - 1;
  const submittedAnswer = state.lastSubmittedAnswer.trim();
  const resultMessage = getResultMessage(result, submittedAnswer);
  const submittedAnswerClass = result?.ok === true
    ? "submitted-answer submitted-answer-correct"
    : "submitted-answer submitted-answer-wrong";

  if (state.currentMode === "self" && state.currentExerciseIndex === 0 && !state.taskTimes.task_3) {
    void startTask(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task."
    );
  }

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>Результат</h2>
      </div>

      <div class="result-box">
        ${result?.ok === true ? '<div class="status-ok">Правильно</div>' : ""}
        ${result?.ok === false && resultMessage ? `<div class="status-error">${escapeHtml(resultMessage)}</div>` : ""}
        ${
          submittedAnswer
            ? `<div><strong>Ваш ответ:</strong> <span class="${submittedAnswerClass}">${escapeHtml(submittedAnswer)}</span></div>`
            : ""
        }
        <div><strong>Правильный ответ:</strong> <span class="system-answer">${escapeHtml(result?.correctAnswer || exercise?.correctAnswer || "")}</span></div>

        ${
          example?.sentence
            ? `
              <div class="example-card">
                <strong>Пример</strong>
                <div>${escapeHtml(example.sentence)}</div>
                ${example.meaningRu ? `<div class="result-meta">${escapeHtml(example.meaningRu)}</div>` : ""}
              </div>
            `
            : ""
        }
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
        ${hasNext ? '<button class="primary-btn" data-action="next-exercise">Дальше</button>' : '<button class="secondary-btn" data-action="retry-mode">Новое упражнение</button>'}
      </div>
    </section>
  `;
}

async function startParticipantSession() {
  const input = document.getElementById("participantCode");
  const participantCode = input?.value?.trim() || "";

  if (!participantCode) {
    alert(t("enterParticipantCode"));
    return;
  }

  const payload = await api("/api/research/session/start", "POST", {
    participantCode
  });

  state.participantCode = payload.participantCode;
  state.researchSessionId = payload.sessionId;
  completeTask("task_1", "Enter the access code and start the assigned learning session.", {
    participantCode: payload.participantCode
  });

  if (queueTaskDifficultyPrompt("task_1", "Enter the access code and start the assigned learning session.", "home")) {
    renderTaskDifficultyPrompt();
    return;
  }

  renderHome();
}

async function startSelfExercise() {
  if (state.selectedGrammarIds.length < state.minGrammarSelection) {
    alert(t("minGrammarAlert", { count: state.minGrammarSelection }));
    return;
  }

  state.currentMode = "self";
  state.currentResult = null;
  state.currentExerciseIndex = 0;
  state.showHint = false;
  state.lastSubmittedAnswer = "";
  state.draftAnswer = "";
  resetExerciseTiming();

  state.currentSession = await api("/api/exercise/self", "POST", {
    grammarIds: state.selectedGrammarIds
  });

  void startTask("task_2", "Select at least two grammar patterns and complete the grammar chaining task.", {
    selectedGrammarIds: state.selectedGrammarIds
  });
  void startTask("task_4", "Complete the assigned learning session.", {
    selectedGrammarIds: state.selectedGrammarIds,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  void logResearchEvent("exercise_set_started", {
    mode: "self",
    selectedGrammarIds: state.selectedGrammarIds,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  renderExercise();
}

async function startFreeExercise(difficulty) {
  state.currentMode = "free";
  state.currentResult = null;
  state.currentExerciseIndex = 0;
  state.showHint = false;
  state.lastSubmittedAnswer = "";
  state.draftAnswer = "";
  resetExerciseTiming();

  state.currentSession = await api("/api/exercise/free", "POST", { difficulty });

  void logResearchEvent("exercise_set_started", {
    mode: "free",
    difficulty,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  renderExercise();
}

async function checkCurrentAnswer(answer) {
  const exercise = getCurrentExercise();
  const durationMs = state.exerciseStartedAt ? Date.now() - state.exerciseStartedAt : null;

  state.lastSubmittedAnswer = answer;
  state.draftAnswer = answer;
  state.currentResult = await api("/api/check", "POST", {
    exercise,
    answer
  });

  addMistakeRecord(exercise, answer, state.currentResult?.checkResult);

  void logResearchEvent("answer_submitted", {
    ...getExerciseLogPayload(exercise),
    answer,
    correctAnswer: state.currentResult?.checkResult?.correctAnswer || exercise?.correctAnswer || "",
    ok: state.currentResult?.checkResult?.ok === true,
    errorType: state.currentResult?.checkResult?.errorType || null,
    durationMs
  });

  if (state.currentMode === "self" && state.currentExerciseIndex === 0) {
    void completeTask("task_2", "Select at least two grammar patterns and complete the grammar chaining task.", {
      answerCorrect: state.currentResult?.checkResult?.ok === true
    });
  }

  if (state.currentMode === "self" && state.currentExerciseIndex === 1) {
    void completeTask(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task.",
      {
        answerCorrect: state.currentResult?.checkResult?.ok === true
      }
    );
  }

  if (
    state.currentMode === "self" &&
    state.currentExerciseIndex === (state.currentSession?.exercises?.length ?? 1) - 1
  ) {
    void completeTask("task_4", "Complete the assigned learning session.", {
      totalExercises: state.currentSession?.totalExercises || 0
    });
  }

  renderResult();
}

function goToNextExercise() {
  if (!state.currentSession?.exercises?.length) {
    return;
  }

  if (state.currentExerciseIndex >= state.currentSession.exercises.length - 1) {
    return;
  }

  state.currentExerciseIndex += 1;
  state.currentResult = null;
  state.showHint = false;
  state.lastSubmittedAnswer = "";
  state.draftAnswer = "";
  resetExerciseTiming();
  renderExercise();
}

function shouldRevealAnswer(result, answer) {
  if (!result) {
    return false;
  }

  if (state.pendingSkip) {
    return true;
  }

  if (result.ok === true) {
    return true;
  }

  if (!String(answer ?? "").trim()) {
    return true;
  }

  return getCurrentAttemptCount() >= 2;
}

function renderCompletionSummary() {
  setView("summary");
  const exercise = getCurrentExercise();
  const selectedGrammarIds = exercise?.selectedGrammarIds || state.selectedGrammarIds || [];
  const summary = getSessionSummary();
  const orderText = selectedGrammarIds.map(getGrammarLabel).join(" -> ");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("chainCompleted")}</h2>
        <p>${t("summaryGoodJob")}</p>
      </div>

      <div class="result-box">
        <div class="result-meta"><strong>${t("chain")}:</strong> ${escapeHtml(orderText)}</div>
        <div class="result-meta"><strong>${t("totalWords")}:</strong> ${summary.total}</div>
        <div class="result-meta"><strong>${t("skipped")}:</strong> ${summary.skipped}</div>
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
        <button class="ghost-btn" data-action="retry-mode">${t("chooseOtherGrammars")}</button>
        <button class="secondary-btn" data-action="repeat-chain">${t("repeatChain")}</button>
      </div>
    </section>
  `;
}

async function startSpecificChain(grammarIds) {
  state.currentMode = "self";
  state.currentDifficulty = null;
  resetSessionUiState();

  state.currentSession = await api("/api/exercise/self", "POST", {
    grammarIds
  });

  void logResearchEvent("exercise_set_started", {
    mode: "repeat_chain",
    selectedGrammarIds: grammarIds,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  renderExercise();
}

async function repeatCurrentChain() {
  const exercise = getCurrentExercise();
  const grammarIds = exercise?.selectedGrammarIds || state.currentSession?.selectedGrammarIds || [];

  if (!grammarIds.length) {
    return;
  }

  void logResearchEvent("repeat_chain_clicked", {
    selectedGrammarIds: grammarIds
  });

  await startSpecificChain(grammarIds);
}

async function skipCurrentExercise() {
  state.pendingSkip = true;
  void logResearchEvent("exercise_skipped", getExerciseLogPayload(getCurrentExercise()));
  await checkCurrentAnswer("");
}

function renderExerciseEnhanced() {
  setView("exercise");
  const session = state.currentSession;
  const exercise = getCurrentExercise();

  if (!session?.ok) {
    const connectMessage = session?.message && session.message !== "Эти грамматики не соединяются."
      ? `<p>${escapeHtml(session.message)}</p>`
      : "";

    appRoot.innerHTML = `
      <section class="screen">
        <div class="screen-header">
          ${getParticipantBadgeHtml()}
          ${renderLanguageToggle()}
          <h2>${t("notConnectable")}</h2>
          ${connectMessage}
        </div>
        <div class="button-row">
          <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
          <button class="secondary-btn" data-action="retry-mode">${t("chooseOtherGrammars")}</button>
        </div>
      </section>
    `;
    return;
  }

  ensureExerciseShownLogged(exercise);

  const modeLabel = state.currentMode === "free" ? t("freePractice") : t("selfPractice");
  const totalExercises = session.totalExercises || session.exercises.length;
  const progress = t("ofTotal", { current: state.currentExerciseIndex + 1, total: totalExercises });
  const progressPercent = Math.round(((state.currentExerciseIndex + 1) / totalExercises) * 100);
  const politeInstruction = getPoliteInstruction(exercise);

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${modeLabel}</h2>
        <p>${t("tryConnect")}</p>
      </div>

      <div class="exercise-box">
        <div class="result-meta"><strong>${t("exercise")}:</strong> ${progress}</div>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
        <div class="result-meta"><strong>${t("word")}:</strong> ${escapeHtml(exercise.word.lemma)} (${escapeHtml(exercise.word.meaningRu)})</div>
        <div class="pill-row">
          ${exercise.selectedGrammarIds.map((id) => `<span class="pill">${escapeHtml(getGrammarLabel(id))}</span>`).join("")}
        </div>
        ${politeInstruction ? `<div class="helper">${escapeHtml(politeInstruction)}</div>` : ""}
        <textarea id="answerBox" class="answer-box" placeholder="${t("answerPlaceholder")}">${escapeHtml(state.draftAnswer)}</textarea>
        ${state.showHint ? getHintHtml(exercise) : ""}
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
        <button class="ghost-btn" data-action="toggle-hint">${state.showHint ? t("hideHint") : t("hint")}</button>
        <button class="ghost-btn" data-action="skip-exercise">${t("skipWord")}</button>
        <button class="primary-btn" data-action="check-answer">${t("check")}</button>
      </div>
    </section>
  `;
}

function renderResultEnhanced() {
  setView("result");
  const exercise = getCurrentExercise();
  const payload = state.currentResult;
  const result = payload?.checkResult;
  const example = payload?.example;
  const hasNext = state.currentExerciseIndex < (state.currentSession?.exercises?.length ?? 0) - 1;
  const submittedAnswer = state.lastSubmittedAnswer.trim();
  const resultMessage = getResultMessage(result, submittedAnswer);
  const submittedAnswerClass = result?.ok === true
    ? "submitted-answer submitted-answer-correct"
    : "submitted-answer submitted-answer-wrong";
  const revealAnswer = shouldRevealAnswer(result, submittedAnswer);
  const canShowWhy = revealAnswer && !!result?.explanation?.why;
  const firstWrongAttempt = !revealAnswer && result?.ok === false;

  if (state.currentMode === "self" && state.currentExerciseIndex === 0 && !state.taskTimes.task_3) {
    void startTask(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task."
    );
  }

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("result")}</h2>
      </div>

      <div class="result-box">
        ${result?.ok === true ? `<div class="status-ok">${t("correct")}</div>` : ""}
        ${result?.ok === false && resultMessage ? `<div class="status-error">${escapeHtml(resultMessage)}</div>` : ""}
        ${submittedAnswer ? `<div><strong>${t("yourAnswer")}</strong> <span class="${submittedAnswerClass}">${escapeHtml(submittedAnswer)}</span></div>` : ""}
        <div><strong>${t("correctAnswer")}</strong> <span class="system-answer">${escapeHtml(result?.correctAnswer || exercise?.correctAnswer || "")}</span></div>
        ${!revealAnswer ? `<div class="helper">${t("tryAgainHelper")}</div>` : ""}
        ${canShowWhy ? `<button class="ghost-btn inline-action" data-action="toggle-why">${state.showWhy ? t("hideWhy") : t("whySo")}</button>` : ""}
        ${canShowWhy && state.showWhy ? `<div class="hint-card"><div>${escapeHtml(result.explanation.why)}</div></div>` : ""}
        ${revealAnswer && example?.sentence ? `
              <div class="example-card">
                <strong>${t("example")}</strong>
                <div>${escapeHtml(example.sentence)}</div>
                ${example.meaningRu ? `<div class="result-meta">${escapeHtml(example.meaningRu)}</div>` : ""}
              </div>
            ` : ""}
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
        ${firstWrongAttempt
            ? `<button class="ghost-btn" data-action="retry-current">${t("tryAgain")}</button><button class="secondary-btn" data-action="skip-exercise">${t("skipWord")}</button>`
            : hasNext
              ? `<button class="primary-btn" data-action="next-exercise">${t("next")}</button>`
              : `<button class="primary-btn" data-action="finish-set">${t("finishChain")}</button>`}
      </div>
    </section>
  `;
}

async function checkCurrentAnswerEnhanced(answer) {
  const exercise = getCurrentExercise();
  const durationMs = state.exerciseStartedAt ? Date.now() - state.exerciseStartedAt : null;
  const exerciseKey = getExerciseKey(exercise);
  const isEmptyAnswer = !String(answer ?? "").trim();

  state.lastSubmittedAnswer = answer;
  state.draftAnswer = answer;
  state.attemptCounts[exerciseKey] = (state.attemptCounts[exerciseKey] || 0) + 1;
  state.showWhy = false;
  state.currentResult = await api("/api/check", "POST", {
    exercise,
    answer
  });

  addMistakeRecord(exercise, answer, state.currentResult?.checkResult);

  void logResearchEvent("answer_submitted", {
    ...getExerciseLogPayload(exercise),
    answer,
    attemptNumber: state.attemptCounts[exerciseKey],
    skipped: state.pendingSkip === true || isEmptyAnswer,
    correctAnswer: state.currentResult?.checkResult?.correctAnswer || exercise?.correctAnswer || "",
    ok: state.currentResult?.checkResult?.ok === true,
    errorType: state.currentResult?.checkResult?.errorType || null,
    durationMs
  });

  const isCorrect = state.currentResult?.checkResult?.ok === true;
  const revealAnswer = shouldRevealAnswer(state.currentResult?.checkResult, answer);
  let shouldAskTaskDifficulty = false;

  if (isCorrect) {
    setCurrentOutcome({
      status: state.attemptCounts[exerciseKey] === 1 ? "correct_first_try" : "correct_after_retry"
    });
  } else if (state.pendingSkip || isEmptyAnswer) {
    setCurrentOutcome({ status: "skipped" });
  }

  if (state.currentMode === "self" && state.currentExerciseIndex === 0 && revealAnswer) {
    completeTask("task_2", "Select at least two grammar patterns and complete the grammar chaining task.", {
      answerCorrect: isCorrect
    });
    shouldAskTaskDifficulty = queueTaskDifficultyPrompt(
      "task_2",
      "Select at least two grammar patterns and complete the grammar chaining task.",
      "result"
    ) || shouldAskTaskDifficulty;
  }

  if (state.currentMode === "self" && state.currentExerciseIndex === 1 && revealAnswer) {
    completeTask(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task.",
      {
        answerCorrect: isCorrect
      }
    );
    shouldAskTaskDifficulty = queueTaskDifficultyPrompt(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task.",
      "result"
    ) || shouldAskTaskDifficulty;
  }

  if (
    state.currentMode === "self" &&
    state.currentExerciseIndex === (state.currentSession?.exercises?.length ?? 1) - 1 &&
    revealAnswer
  ) {
    completeTask("task_4", "Complete the assigned learning session.", {
      totalExercises: state.currentSession?.totalExercises || 0
    });
    shouldAskTaskDifficulty = queueTaskDifficultyPrompt(
      "task_4",
      "Complete the assigned learning session.",
      "result"
    ) || shouldAskTaskDifficulty;
  }

  state.pendingSkip = false;

  if (shouldAskTaskDifficulty) {
    renderTaskDifficultyPrompt();
    return;
  }

  renderResult();
}

function goToNextExerciseEnhanced() {
  if (!state.currentSession?.exercises?.length) {
    return;
  }

  if (state.currentExerciseIndex >= state.currentSession.exercises.length - 1) {
    renderCompletionSummary();
    return;
  }

  state.currentExerciseIndex += 1;
  state.currentResult = null;
  state.showHint = false;
  state.showWhy = false;
  state.lastSubmittedAnswer = "";
  state.draftAnswer = "";
  state.pendingSkip = false;
  resetExerciseTiming();
  renderExercise();
}

renderExercise = renderExerciseEnhanced;
renderResult = renderResultEnhanced;
checkCurrentAnswer = checkCurrentAnswerEnhanced;
goToNextExercise = goToNextExerciseEnhanced;

async function startSelfExerciseEnhanced() {
  if (state.selectedGrammarIds.length < state.minGrammarSelection) {
    alert(t("minGrammarAlert", { count: state.minGrammarSelection }));
    return;
  }

  state.currentMode = "self";
  state.currentDifficulty = null;
  resetSessionUiState();

  state.currentSession = await api("/api/exercise/self", "POST", {
    grammarIds: state.selectedGrammarIds
  });

  void startTask("task_2", "Select at least two grammar patterns and complete the grammar chaining task.", {
    selectedGrammarIds: state.selectedGrammarIds
  });
  void startTask("task_4", "Complete the assigned learning session.", {
    selectedGrammarIds: state.selectedGrammarIds,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  void logResearchEvent("exercise_set_started", {
    mode: "self",
    selectedGrammarIds: state.selectedGrammarIds,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  renderExercise();
}

async function startFreeExerciseEnhanced(difficulty) {
  state.currentMode = "free";
  state.currentDifficulty = difficulty;
  resetSessionUiState();

  state.currentSession = await api("/api/exercise/free", "POST", { difficulty });

  void logResearchEvent("exercise_set_started", {
    mode: "free",
    difficulty,
    totalExercises: state.currentSession?.totalExercises || 0
  });

  renderExercise();
}

startSelfExercise = startSelfExerciseEnhanced;
startFreeExercise = startFreeExerciseEnhanced;

const renderExerciseWithChainSwitch = renderExercise;

renderExercise = function renderExerciseWithExtraChainButton() {
  renderExerciseWithChainSwitch();

  const buttonRow = appRoot.querySelector(".button-row");
  if (!buttonRow || buttonRow.querySelector('[data-action="retry-mode"]')) {
    return;
  }

  const backHomeButton = buttonRow.querySelector('[data-action="back-home"]');
  const retryButton = document.createElement("button");
  retryButton.className = "ghost-btn";
  retryButton.dataset.action = "retry-mode";
  retryButton.textContent = t("chooseAnotherChain");

  if (backHomeButton?.nextSibling) {
    buttonRow.insertBefore(retryButton, backHomeButton.nextSibling);
  } else {
    buttonRow.appendChild(retryButton);
  }
};

const renderExerciseWithChainButtonBase = renderExercise;

renderExercise = function renderExerciseWithAnswerGuard() {
  renderExerciseWithChainButtonBase();

  const answerBox = document.getElementById("answerBox");
  const checkButton = appRoot.querySelector('[data-action="check-answer"]');

  if (!answerBox || !checkButton) {
    return;
  }

  const syncCheckButton = () => {
    checkButton.disabled = !String(answerBox.value ?? "").trim();
  };

  syncCheckButton();
  answerBox.addEventListener("input", () => {
    state.draftAnswer = answerBox.value;
    syncCheckButton();
  });
};

const renderResultWithTypoHighlightBase = renderResult;

renderResult = function renderResultWithTypoHighlight() {
  renderResultWithTypoHighlightBase();

  const payload = state.currentResult;
  const result = payload?.checkResult;
  const submittedAnswer = state.lastSubmittedAnswer.trim();
  const correctAnswer = result?.correctAnswer || getCurrentExercise()?.correctAnswer || "";

  if (!submittedAnswer || result?.ok === true) {
    return;
  }

  const userAnswerLabel = Array.from(appRoot.querySelectorAll(".result-box strong"))
    .find((node) => node.textContent?.includes(t("yourAnswer").replace(":", "")));
  const submittedAnswerNode = userAnswerLabel?.parentElement?.querySelector(".submitted-answer");

  if (!submittedAnswerNode) {
    return;
  }

  submittedAnswerNode.innerHTML = buildTypoHighlightHtml(submittedAnswer, correctAnswer);
};

function addMistakeRecord(exercise, answer, result) {
  if (!exercise || !result || result.ok === true) {
    return;
  }

  const trimmedAnswer = String(answer ?? "").trim();
  if (!trimmedAnswer) {
    return;
  }

  state.mistakeHistory.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    wordLemma: exercise.word?.lemma || "",
    wordMeaningRu: exercise.word?.meaningRu || "",
    grammarLabels: (exercise.selectedGrammarIds || []).map(getGrammarLabel),
    userAnswer: trimmedAnswer,
    correctAnswer: result.correctAnswer || exercise.correctAnswer || "",
    errorType: result.errorType || "wrong_form"
  });

  state.mistakeHistory = state.mistakeHistory.slice(0, 30);
}

function renderMistakesScreen() {
  setView("mistakes");
  const itemsHtml = state.mistakeHistory.length
    ? state.mistakeHistory
      .map((item) => `
        <article class="result-box">
          <div class="result-meta"><strong>${t("word")}:</strong> ${escapeHtml(item.wordLemma)} (${escapeHtml(item.wordMeaningRu)})</div>
          <div class="result-meta"><strong>${t("chain")}:</strong> ${escapeHtml(item.grammarLabels.join(" -> "))}</div>
          <div><strong>${t("yourAnswer")}</strong> <span class="submitted-answer submitted-answer-wrong">${escapeHtml(item.userAnswer)}</span></div>
          <div><strong>${t("correctAnswer")}</strong> <span class="system-answer">${escapeHtml(item.correctAnswer)}</span></div>
        </article>
      `)
      .join("")
    : `
      <div class="result-box">
        <div class="result-meta">${t("mistakesEmpty")}</div>
      </div>
    `;

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        ${renderLanguageToggle()}
        <h2>${t("mistakesTitle")}</h2>
        <p>${t("mistakesIntro")}</p>
      </div>

      <div class="stack-block">
        ${itemsHtml}
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">${t("backHome")}</button>
      </div>
    </section>
  `;
}

const renderHomeBase = renderHome;

renderHome = function renderHomeWithMistakesButton() {
  renderHomeBase();

  const modeGrid = appRoot.querySelector(".mode-grid");
  if (!modeGrid) {
    return;
  }

  const card = document.createElement("article");
  card.className = "choice-card";
  card.innerHTML = `
    <div class="card-kicker">${t("reviewKicker")}</div>
    <h3>${t("mistakesTitle")}</h3>
    <p>${t("mistakesCardText")}</p>
    <button class="primary-btn" data-action="open-mistakes">${t("open")}</button>
  `;

  modeGrid.appendChild(card);
};

function bindGlobalActions() {
  appRoot.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    if (!action) {
      return;
    }

    try {
      if (action === "start-participant-session") {
        await startParticipantSession();
        return;
      }

      if (action === "open-self") {
        void logResearchEvent("opened_self_selection");
        renderSelfSelection();
        return;
      }

      if (action === "open-free") {
        void logResearchEvent("opened_free_selection");
        renderFreeSelection();
        return;
      }

      if (action === "open-mistakes") {
        renderMistakesScreen();
        return;
      }

      if (action === "rate-task-difficulty") {
        await saveTaskDifficultyRating(event.target.dataset.rating);
        return;
      }

      if (action === "toggle-language") {
        state.currentLanguage = state.currentLanguage === "ru" ? "en" : "ru";
        refreshCurrentView();
        return;
      }

      if (action === "back-home") {
        renderHome();
        return;
      }

      if (action === "start-self") {
        await startSelfExercise();
        return;
      }

      if (action === "retry-mode") {
        state.currentResult = null;
        state.currentExerciseIndex = 0;
        state.showHint = false;
        state.showWhy = false;
        state.lastSubmittedAnswer = "";
        state.draftAnswer = "";
        state.pendingSkip = false;
        resetExerciseTiming();

        if (state.currentMode === "free") {
          renderFreeSelection();
        } else {
          renderSelfSelection();
        }
        return;
      }

      if (action === "toggle-hint") {
        state.draftAnswer = document.getElementById("answerBox")?.value || state.draftAnswer;
        state.showHint = !state.showHint;
        if (state.showHint) {
          void logResearchEvent("hint_opened", getExerciseLogPayload(getCurrentExercise()));
        }
        renderExercise();
        return;
      }

      if (action === "check-answer") {
        const answer = document.getElementById("answerBox")?.value || "";
        await checkCurrentAnswer(answer);
        return;
      }

      if (action === "skip-exercise") {
        await skipCurrentExercise();
        return;
      }

      if (action === "retry-current") {
        state.currentResult = null;
        state.showWhy = false;
        state.pendingSkip = false;
        void logResearchEvent("retry_requested", getExerciseLogPayload(getCurrentExercise()));
        renderExercise();
        return;
      }

      if (action === "toggle-why") {
        state.showWhy = !state.showWhy;
        if (state.showWhy) {
          void logResearchEvent("why_opened", getExerciseLogPayload(getCurrentExercise()));
        }
        renderResult();
        return;
      }

      if (action === "next-exercise") {
        goToNextExercise();
        return;
      }

      if (action === "finish-set") {
        void logResearchEvent("exercise_set_completed", {
          mode: state.currentMode,
          summary: getSessionSummary()
        });
        renderCompletionSummary();
        return;
      }

      if (action === "repeat-chain") {
        await repeatCurrentChain();
      }
    } catch (error) {
      console.error(error);
      alert(error.message || t("retryError"));
    }
  });
}

async function bootstrap() {
  bindGlobalActions();
  const payload = await api("/api/options");
  state.options = payload.options;
  state.minGrammarSelection = payload.constraints.minGrammarSelection;
  state.exercisesPerSet = payload.constraints.exercisesPerSet;
  const savedLanguage = window.localStorage?.getItem("gramchain_lang");
  if (savedLanguage === "en" || savedLanguage === "ru") {
    state.currentLanguage = savedLanguage;
  }
  renderParticipantStart();
}

bootstrap().catch((error) => {
  appRoot.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
