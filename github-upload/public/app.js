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
  completedTasks: {}
};

const appRoot = document.getElementById("app");

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

  return `<div class="participant-badge">Код участника: ${escapeHtml(state.participantCode)}</div>`;
}

function getResultMessage(result, submittedAnswer = "") {
  if (!result || result.ok === true) {
    return "";
  }

  if (!String(submittedAnswer).trim()) {
    return "";
  }

  if (result.errorType === "not_connectable") {
    return "Эти грамматики не соединяются.";
  }

  if (result.errorType === "wrong_order") {
    return "Грамматики соединяются, но порядок должен быть другим.";
  }

  if (result.errorType === "wrong_form") {
    return "Порядок верный, но сама форма собрана с ошибкой.";
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
      <div><strong>Порядок:</strong> ${escapeHtml(orderText)}</div>
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
    throw new Error(payload.message || "Ошибка запроса.");
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
  startTask("task_1", "Enter the access code and start the assigned learning session.");

  appRoot.innerHTML = `
    <section class="screen participant-card">
      <div class="screen-header">
        <h2>Код участника</h2>
        <p>Перед началом тренировки введите код участника.</p>
      </div>

      <div class="exercise-box participant-form">
        <label class="field-label" for="participantCode">Код</label>
        <input
          id="participantCode"
          class="code-input"
          type="text"
          maxlength="64"
          placeholder="Например: 101"
          autocomplete="off"
        />
        <div class="button-row">
          <button class="primary-btn" data-action="start-participant-session">Начать</button>
        </div>
      </div>
    </section>
  `;
}

function renderHome() {
  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>Как будем тренироваться?</h2>
      </div>

      <div class="mode-grid">
        <article class="choice-card">
          <div class="card-kicker">Своя траектория</div>
          <h3>Своя тренировка</h3>
          <p>Выберите грамматики, которые хотите потренировать.</p>
          <button class="primary-btn" data-action="open-self">Открыть</button>
        </article>

        <article class="choice-card">
          <div class="card-kicker">Быстрый старт</div>
          <h3>Свободная тренировка</h3>
          <p>Выберите, хотите потренировать цепочки из 2 или из 3 грамматик.</p>
          <button class="primary-btn" data-action="open-free">Открыть</button>
        </article>
      </div>
    </section>
  `;
}

function renderSelfSelection() {
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
        <h2>Своя тренировка</h2>
        <p>Выберите грамматики для тренировки.</p>
      </div>

      <div class="grammar-grid">${grammars}</div>

      <div class="helper">Сейчас выбрано: ${state.selectedGrammarIds.length}</div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
        <button class="primary-btn" data-action="start-self">Начать тренировку</button>
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
  const cards = state.options.freePractice.difficultyOptions
    .map((item) => {
      const descriptionText = item.id === "hard" ? "3 грамматики." : "2 грамматики.";

      return `
        <article class="choice-card">
          <h3>${escapeHtml(item.label)}</h3>
          <p>${escapeHtml(descriptionText)}</p>
          <button class="primary-btn" data-difficulty="${item.id}">Начать</button>
        </article>
      `;
    })
    .join("");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>Свободная тренировка</h2>
        <p>Выберите, хотите потренировать цепочки из 2 или из 3 грамматик.</p>
      </div>

      <div class="difficulty-grid">${cards}</div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
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
    alert("Введите код участника.");
    return;
  }

  const payload = await api("/api/research/session/start", "POST", {
    participantCode
  });

  state.participantCode = payload.participantCode;
  state.researchSessionId = payload.sessionId;
  void completeTask("task_1", "Enter the access code and start the assigned learning session.", {
    participantCode: payload.participantCode
  });
  renderHome();
}

async function startSelfExercise() {
  if (state.selectedGrammarIds.length < state.minGrammarSelection) {
    alert(`Пожалуйста, выберите минимум ${state.minGrammarSelection} грамматики.`);
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
  const exercise = getCurrentExercise();
  const selectedGrammarIds = exercise?.selectedGrammarIds || state.selectedGrammarIds || [];
  const summary = getSessionSummary();
  const orderText = selectedGrammarIds.map(getGrammarLabel).join(" -> ");

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>Цепочка завершена</h2>
        <p>Хорошая работа. Можно перейти к следующей цепочке или повторить эту же еще раз.</p>
      </div>

      <div class="result-box">
        <div class="result-meta"><strong>Цепочка:</strong> ${escapeHtml(orderText)}</div>
        <div class="result-meta"><strong>Всего слов:</strong> ${summary.total}</div>
        <div class="result-meta"><strong>Пропущено:</strong> ${summary.skipped}</div>
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
        <button class="ghost-btn" data-action="retry-mode">Выбрать другие грамматики</button>
        <button class="secondary-btn" data-action="repeat-chain">Повторить эту цепочку</button>
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
  const totalExercises = session.totalExercises || session.exercises.length;
  const progress = `${state.currentExerciseIndex + 1} из ${totalExercises}`;
  const progressPercent = Math.round(((state.currentExerciseIndex + 1) / totalExercises) * 100);
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
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
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
        <button class="ghost-btn" data-action="skip-exercise">Пропустить слово</button>
        <button class="primary-btn" data-action="check-answer">Проверить</button>
      </div>
    </section>
  `;
}

function renderResultEnhanced() {
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
        <h2>Результат</h2>
      </div>

      <div class="result-box">
        ${result?.ok === true ? '<div class="status-ok">Верно</div>' : ""}
        ${result?.ok === false && resultMessage ? `<div class="status-error">${escapeHtml(resultMessage)}</div>` : ""}
        ${
          submittedAnswer
            ? `<div><strong>Ваш ответ:</strong> <span class="${submittedAnswerClass}">${escapeHtml(submittedAnswer)}</span></div>`
            : ""
        }
        <div><strong>Правильный ответ:</strong> <span class="system-answer">${escapeHtml(result?.correctAnswer || exercise?.correctAnswer || "")}</span></div>
        ${
          !revealAnswer
            ? '<div class="helper">Попробуйте еще раз. Если захотите, можно открыть подсказку или пропустить это слово.</div>'
            : ""
        }
        ${
          canShowWhy
            ? `<button class="ghost-btn inline-action" data-action="toggle-why">${state.showWhy ? "Скрыть объяснение" : "Почему так?"}</button>`
            : ""
        }
        ${
          canShowWhy && state.showWhy
            ? `<div class="hint-card"><div>${escapeHtml(result.explanation.why)}</div></div>`
            : ""
        }
        ${
          revealAnswer && example?.sentence
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
        ${
          firstWrongAttempt
            ? '<button class="ghost-btn" data-action="retry-current">Попробовать еще раз</button><button class="secondary-btn" data-action="skip-exercise">Пропустить слово</button>'
            : hasNext
              ? '<button class="primary-btn" data-action="next-exercise">Дальше</button>'
              : '<button class="primary-btn" data-action="finish-set">Завершить цепочку</button>'
        }
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

  if (isCorrect) {
    setCurrentOutcome({
      status: state.attemptCounts[exerciseKey] === 1 ? "correct_first_try" : "correct_after_retry"
    });
  } else if (state.pendingSkip || isEmptyAnswer) {
    setCurrentOutcome({ status: "skipped" });
  }

  if (state.currentMode === "self" && state.currentExerciseIndex === 0 && revealAnswer) {
    void completeTask("task_2", "Select at least two grammar patterns and complete the grammar chaining task.", {
      answerCorrect: isCorrect
    });
  }

  if (state.currentMode === "self" && state.currentExerciseIndex === 1 && revealAnswer) {
    void completeTask(
      "task_3",
      "Review the corrective feedback and the example sentence, then complete the next grammar chaining task.",
      {
        answerCorrect: isCorrect
      }
    );
  }

  if (
    state.currentMode === "self" &&
    state.currentExerciseIndex === (state.currentSession?.exercises?.length ?? 1) - 1 &&
    revealAnswer
  ) {
    void completeTask("task_4", "Complete the assigned learning session.", {
      totalExercises: state.currentSession?.totalExercises || 0
    });
  }

  state.pendingSkip = false;
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
    alert(`Пожалуйста, выберите минимум ${state.minGrammarSelection} грамматики.`);
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
  retryButton.textContent = "Выбрать другую цепочку";

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
    .find((node) => node.textContent?.includes("Ваш ответ"));
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
  const itemsHtml = state.mistakeHistory.length
    ? state.mistakeHistory
      .map((item) => `
        <article class="result-box">
          <div class="result-meta"><strong>Слово:</strong> ${escapeHtml(item.wordLemma)} (${escapeHtml(item.wordMeaningRu)})</div>
          <div class="result-meta"><strong>Цепочка:</strong> ${escapeHtml(item.grammarLabels.join(" -> "))}</div>
          <div><strong>Ваш ответ:</strong> <span class="submitted-answer submitted-answer-wrong">${escapeHtml(item.userAnswer)}</span></div>
          <div><strong>Правильный ответ:</strong> <span class="system-answer">${escapeHtml(item.correctAnswer)}</span></div>
        </article>
      `)
      .join("")
    : `
      <div class="result-box">
        <div class="result-meta">Пока здесь пусто. Когда в тренировке появятся ошибки, они отобразятся на этом экране.</div>
      </div>
    `;

  appRoot.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        ${getParticipantBadgeHtml()}
        <h2>Мои ошибки</h2>
        <p>Здесь собираются последние ответы, которые стоит повторить еще раз.</p>
      </div>

      <div class="stack-block">
        ${itemsHtml}
      </div>

      <div class="button-row">
        <button class="ghost-btn" data-action="back-home">На главную</button>
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
    <div class="card-kicker">Повторение</div>
    <h3>Мои ошибки</h3>
    <p>Откройте список ответов, к которым хотите вернуться позже.</p>
    <button class="primary-btn" data-action="open-mistakes">Открыть</button>
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
      alert(error.message || "Произошла ошибка. Попробуйте еще раз.");
    }
  });
}

async function bootstrap() {
  bindGlobalActions();
  const payload = await api("/api/options");
  state.options = payload.options;
  state.minGrammarSelection = payload.constraints.minGrammarSelection;
  state.exercisesPerSet = payload.constraints.exercisesPerSet;
  renderParticipantStart();
}

bootstrap().catch((error) => {
  appRoot.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
