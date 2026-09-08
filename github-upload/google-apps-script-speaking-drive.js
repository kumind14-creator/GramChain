// Paste this entire file into Code.gs in Google Apps Script.
// It handles:
// 1. task_logs updates
// 2. answer_logs, learning_exercises, learning_summary, and grammar_exposure updates
// 3. speaking_logs updates
// 4. saving speaking audio files to Google Drive /GramChain_speaking

function ensureTaskHeaders_(sheet) {
  const headers = [
    "participantCode",
    "sessionId",
    "taskId",
    "task",
    "status",
    "startedAt",
    "completedAt",
    "durationMs",
    "difficultyRating"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureSpeakingHeaders_(sheet) {
  const headers = [
    "loggedAt",
    "participantCode",
    "sessionId",
    "stage",
    "eventType",
    "taskId",
    "fileName",
    "storage",
    "driveFileId",
    "driveFileUrl",
    "recordingStartedAt",
    "recordingStoppedAt",
    "uploadedAt",
    "bytes",
    "taskPrompt"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensurePracticeHeaders_(sheet) {
  const headers = [
    "participantCode",
    "sessionId",
    "status",
    "startedAt",
    "completedAt",
    "practiceDurationMs"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureLearningExerciseHeaders_(sheet) {
  const headers = [
    "participantCode",
    "sessionId",
    "practiceSetId",
    "exerciseKey",
    "mode",
    "grammarFormCount",
    "selectedGrammarIdsJson",
    "firstSubmittedAt"
  ];

  const oldHeaders = [
    "participantCode",
    "sessionId",
    "practiceSetId",
    "exerciseKey",
    "mode",
    "grammarFormCount",
    "firstSubmittedAt"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const currentOld = sheet.getRange(1, 1, 1, oldHeaders.length).getValues()[0];
  const isOldLayout = oldHeaders.every((header, index) => String(currentOld[index] || "").trim() === header);
  if (isOldLayout) {
    // Preserve the original timestamp column while adding grammar IDs before it.
    sheet.insertColumnAfter(6);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureGrammarExposureHeaders_(sheet) {
  const headers = [
    "Код участника",
    "Грамматическая конструкция",
    "Количество упражнений",
    "Обновлено"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureAnswerLogHeaders_(sheet) {
  const headers = [
    "loggedAt",
    "participantCode",
    "sessionId",
    "practiceSetId",
    "exerciseKey",
    "mode",
    "exerciseIndex",
    "wordId",
    "wordLemma",
    "selectedGrammarIds",
    "resolvedOrder",
    "answer",
    "correctAnswer",
    "isCorrect",
    "errorType",
    "attemptNumber",
    "skipped",
    "durationMs"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getGrammarLabel_(grammarId) {
  const labels = {
    past_tense: "-았/었-",
    go_sipda: "-고 싶다",
    neuryeogo_hada: "-(으)려고 하다",
    aseo_eoseo: "-아서/어서",
    jiman: "-지만",
    eul_ttae: "-(으)ㄹ 때",
    ji_anta: "-지 않다",
    geot_gatda_adj: "-(으)ㄴ 것 같다",
    geot_gatda_verb_present: "-는 것 같다",
    ajida_eojida: "-아지다/어지다",
    myeon_eumyeon: "-면/으면"
  };

  return labels[String(grammarId || "")] || String(grammarId || "");
}

function ensureLearningSummaryHeaders_(sheet) {
  const headers = [
    "Код участника",
    "Всего выполненных заданий",
    "Задания на 2 формы",
    "Задания на 3 формы",
    "Своя практика",
    "Свободная практика",
    "Общее время (мин.)",
    "Сессий",
    "Дней активности",
    "Обновлено"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((header, index) => String(current[index] || "").trim() === header);

  if (!same) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function doGet() {
  return ContentService
    .createTextOutput("GramChain webhook is live.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function isTaskEvent_(body) {
  return body && (
    body.type === "task_started" ||
    body.type === "task_completed" ||
    body.type === "task_difficulty_rated"
  );
}

function isPracticeEvent_(body) {
  return body && (
    body.type === "practice_session_started" ||
    body.type === "practice_session_completed"
  );
}

function isLearningExerciseEvent_(body) {
  const payload = body && body.payload ? body.payload : {};
  return body && body.type === "answer_submitted" && (
    payload.mode === "self" || payload.mode === "free"
  );
}

function isSpeakingEvent_(body) {
  return body && String(body.type || "").indexOf("speaking_") === 0;
}

function getOrCreateDriveFolder_(folderName) {
  const normalizedName = String(folderName || "GramChain_speaking").trim() || "GramChain_speaking";
  const existing = DriveApp.getFoldersByName(normalizedName);

  if (existing.hasNext()) {
    return existing.next();
  }

  return DriveApp.createFolder(normalizedName);
}

function getOrCreateChildDriveFolder_(parentFolder, folderName) {
  const normalizedName = String(folderName || "unclassified").trim() || "unclassified";
  const existing = parentFolder.getFoldersByName(normalizedName);

  if (existing.hasNext()) {
    return existing.next();
  }

  return parentFolder.createFolder(normalizedName);
}

function saveSpeakingAudioToDrive_(body) {
  const payload = body.payload || {};
  const fileName = payload.fileName || "speaking_recording.webm";
  const mimeType = payload.mimeType || "audio/webm";
  const stage = payload.stage === "post" ? "post" : "pre";
  const speakingFolder = getOrCreateDriveFolder_("GramChain_speaking");
  const folder = getOrCreateChildDriveFolder_(speakingFolder, stage);
  const bytes = Utilities.base64Decode(payload.audioBase64 || "");
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);

  return {
    driveFileId: file.getId(),
    driveFileUrl: file.getUrl(),
    driveFolderUrl: folder.getUrl(),
    storage: "google-drive"
  };
}

function getCanonicalTaskLabel_(taskId) {
  const labels = {
    task_1: "Task 1: Enter the access code and start the assigned learning session.",
    task_2: "Task 2: Start a Custom practice set by selecting at least two grammar patterns.",
    task_3: "Task 3: Complete one exercise and review the feedback.",
    task_4: "Task 4: Review your mistakes.",
    task_5: "Task 5: Choose either mode in Free practice."
  };

  return labels[String(taskId || "").trim()] || "";
}

function buildTaskRecord_(body) {
  const payload = body.payload || {};
  const loggedAt = body.loggedAt || new Date().toISOString();
  const isStarted = body.type === "task_started";
  const isCompleted = body.type === "task_completed";
  const isRated = body.type === "task_difficulty_rated";

  return {
    participantCode: body.participantCode || "",
    sessionId: body.sessionId || "",
    taskId: payload.taskId || "",
    task: getCanonicalTaskLabel_(payload.taskId) || payload.label || "",
    status: isCompleted ? (payload.status || "completed") : (isStarted ? "started" : ""),
    startedAt: isStarted ? (payload.startedAt || loggedAt) : "",
    completedAt: isCompleted ? (payload.completedAt || loggedAt) : "",
    durationMs: isCompleted ? (payload.durationMs ?? "") : "",
    difficultyRating: isRated ? (payload.difficultyRating ?? "") : ""
  };
}

function findTaskRow_(sheet, record) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const row = values[index];
    if (
      String(row[0] || "") === String(record.participantCode || "") &&
      String(row[1] || "") === String(record.sessionId || "") &&
      String(row[2] || "") === String(record.taskId || "")
    ) {
      return index + 2;
    }
  }

  return -1;
}

function upsertTaskRow_(sheet, record) {
  const rowIndex = findTaskRow_(sheet, record);

  if (rowIndex === -1) {
    sheet.appendRow([
      record.participantCode,
      record.sessionId,
      record.taskId,
      record.task,
      record.status,
      record.startedAt,
      record.completedAt,
      record.durationMs,
      record.difficultyRating
    ]);
    return;
  }

  const existing = sheet.getRange(rowIndex, 1, 1, 9).getValues()[0];
  sheet.getRange(rowIndex, 1, 1, 9).setValues([[
    record.participantCode || existing[0],
    record.sessionId || existing[1],
    record.taskId || existing[2],
    record.task || existing[3],
    record.status || existing[4],
    record.startedAt || existing[5],
    record.completedAt || existing[6],
    record.durationMs !== "" ? record.durationMs : existing[7],
    record.difficultyRating !== "" ? record.difficultyRating : existing[8]
  ]]);
}

function buildPracticeRecord_(body) {
  const payload = body.payload || {};
  const isCompleted = body.type === "practice_session_completed";

  return {
    participantCode: body.participantCode || "",
    sessionId: body.sessionId || "",
    status: isCompleted ? "completed" : "started",
    startedAt: payload.startedAt || body.loggedAt || new Date().toISOString(),
    completedAt: isCompleted ? (payload.completedAt || body.loggedAt || new Date().toISOString()) : "",
    practiceDurationMs: isCompleted ? (payload.practiceDurationMs ?? "") : ""
  };
}

function findPracticeRow_(sheet, record) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const row = values[index];
    if (
      String(row[0] || "") === String(record.participantCode || "") &&
      String(row[1] || "") === String(record.sessionId || "")
    ) {
      return index + 2;
    }
  }

  return -1;
}

function upsertPracticeRow_(sheet, record) {
  const rowIndex = findPracticeRow_(sheet, record);
  const values = [
    record.participantCode,
    record.sessionId,
    record.status,
    record.startedAt,
    record.completedAt,
    record.practiceDurationMs
  ];

  if (rowIndex === -1) {
    sheet.appendRow(values);
    return;
  }

  const existing = sheet.getRange(rowIndex, 1, 1, values.length).getValues()[0];
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values.map((value, index) => {
    return value !== "" ? value : existing[index];
  })]);
}

function buildLearningExerciseRecord_(body) {
  const payload = body.payload || {};
  const grammarIds = Array.isArray(payload.selectedGrammarIds) ? payload.selectedGrammarIds : [];

  return {
    participantCode: body.participantCode || "",
    sessionId: body.sessionId || "",
    practiceSetId: payload.practiceSetId || "",
    exerciseKey: payload.exerciseKey || `${payload.exerciseIndex || ""}:${payload.wordId || ""}`,
    mode: payload.mode || "",
    grammarFormCount: grammarIds.length,
    selectedGrammarIdsJson: JSON.stringify(grammarIds),
    firstSubmittedAt: body.loggedAt || new Date().toISOString()
  };
}

function appendAnswerLogRow_(sheet, body) {
  const payload = body.payload || {};
  sheet.appendRow([
    body.loggedAt || new Date().toISOString(),
    body.participantCode || "",
    body.sessionId || "",
    payload.practiceSetId || "",
    payload.exerciseKey || `${payload.exerciseIndex || ""}:${payload.wordId || ""}`,
    payload.mode || "",
    payload.exerciseIndex ?? "",
    payload.wordId || "",
    payload.wordLemma || "",
    JSON.stringify(Array.isArray(payload.selectedGrammarIds) ? payload.selectedGrammarIds : []),
    JSON.stringify(Array.isArray(payload.resolvedOrder) ? payload.resolvedOrder : []),
    payload.answer ?? "",
    payload.correctAnswer ?? "",
    payload.ok === true ? "true" : (payload.ok === false ? "false" : ""),
    payload.errorType ?? "",
    payload.attemptNumber ?? "",
    payload.skipped === true ? "true" : "false",
    payload.durationMs ?? ""
  ]);
}

function findLearningExerciseRow_(sheet, record) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const row = values[index];
    if (
      String(row[0] || "") === String(record.participantCode || "") &&
      String(row[1] || "") === String(record.sessionId || "") &&
      String(row[2] || "") === String(record.practiceSetId || "") &&
      String(row[3] || "") === String(record.exerciseKey || "")
    ) {
      return index + 2;
    }
  }

  return -1;
}

function appendLearningExerciseIfNew_(sheet, record) {
  if (findLearningExerciseRow_(sheet, record) !== -1) {
    return;
  }

  sheet.appendRow([
    record.participantCode,
    record.sessionId,
    record.practiceSetId,
    record.exerciseKey,
    record.mode,
    record.grammarFormCount,
    record.selectedGrammarIdsJson,
    record.firstSubmittedAt
  ]);
}

function rebuildLearningSummary_(spreadsheet, participantCode) {
  const exerciseSheet = spreadsheet.getSheetByName("learning_exercises") || spreadsheet.insertSheet("learning_exercises");
  const durationSheet = spreadsheet.getSheetByName("session_durations") || spreadsheet.insertSheet("session_durations");
  const summarySheet = spreadsheet.getSheetByName("learning_summary") || spreadsheet.insertSheet("learning_summary");
  ensureLearningExerciseHeaders_(exerciseSheet);
  ensurePracticeHeaders_(durationSheet);
  ensureLearningSummaryHeaders_(summarySheet);

  const code = String(participantCode || "");
  const exerciseRows = exerciseSheet.getLastRow() < 2
    ? []
    : exerciseSheet.getRange(2, 1, exerciseSheet.getLastRow() - 1, 8).getValues()
      .filter((row) => String(row[0] || "") === code);
  const durationRows = durationSheet.getLastRow() < 2
    ? []
    : durationSheet.getRange(2, 1, durationSheet.getLastRow() - 1, 6).getValues()
      .filter((row) => String(row[0] || "") === code);

  const twoFormExercises = exerciseRows.filter((row) => Number(row[5]) === 2).length;
  const threeFormExercises = exerciseRows.filter((row) => Number(row[5]) === 3).length;
  const customPracticeExercises = exerciseRows.filter((row) => String(row[4]) === "self").length;
  const freePracticeExercises = exerciseRows.filter((row) => String(row[4]) === "free").length;
  const totalDurationMs = durationRows.reduce((total, row) => total + (Number(row[5]) || 0), 0);
  const sessionIds = {};
  const activeDays = {};

  durationRows.forEach((row) => {
    if (row[1]) {
      sessionIds[String(row[1])] = true;
    }
    if (row[3]) {
      activeDays[String(row[3]).slice(0, 10)] = true;
    }
  });
  exerciseRows.forEach((row) => {
    if (row[1]) {
      sessionIds[String(row[1])] = true;
    }
    if (row[7]) {
      activeDays[String(row[7]).slice(0, 10)] = true;
    }
  });

  const record = [
    code,
    exerciseRows.length,
    twoFormExercises,
    threeFormExercises,
    customPracticeExercises,
    freePracticeExercises,
    Math.round((totalDurationMs / 60000) * 10) / 10,
    Object.keys(sessionIds).length,
    Object.keys(activeDays).length,
    new Date().toISOString()
  ];

  const lastRow = summarySheet.getLastRow();
  let rowIndex = -1;
  if (lastRow >= 2) {
    const codes = summarySheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let index = codes.length - 1; index >= 0; index -= 1) {
      if (String(codes[index][0] || "") === code) {
        rowIndex = index + 2;
        break;
      }
    }
  }

  if (rowIndex === -1) {
    summarySheet.appendRow(record);
  } else {
    summarySheet.getRange(rowIndex, 1, 1, record.length).setValues([record]);
  }

  rebuildGrammarExposure_(spreadsheet, code, exerciseRows);
}

function rebuildGrammarExposure_(spreadsheet, participantCode, exerciseRows) {
  const exposureSheet = spreadsheet.getSheetByName("grammar_exposure") || spreadsheet.insertSheet("grammar_exposure");
  ensureGrammarExposureHeaders_(exposureSheet);

  const counts = {};
  exerciseRows.forEach((row) => {
    let grammarIds = [];
    try {
      grammarIds = JSON.parse(String(row[6] || "[]"));
    } catch (error) {
      grammarIds = [];
    }

    if (!Array.isArray(grammarIds)) {
      return;
    }

    grammarIds.forEach((grammarId) => {
      const id = String(grammarId || "").trim();
      if (id) {
        counts[id] = (counts[id] || 0) + 1;
      }
    });
  });

  const lastRow = exposureSheet.getLastRow();
  const existingRows = lastRow < 2
    ? []
    : exposureSheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const existingIndexByGrammar = {};
  existingRows.forEach((row, index) => {
    if (String(row[0] || "") === participantCode) {
      existingIndexByGrammar[String(row[1] || "")] = index + 2;
    }
  });

  Object.keys(counts).forEach((grammarId) => {
    const grammarLabel = getGrammarLabel_(grammarId);
    const record = [participantCode, grammarLabel, counts[grammarId], new Date().toISOString()];
    const rowIndex = existingIndexByGrammar[grammarLabel];
    if (rowIndex) {
      exposureSheet.getRange(rowIndex, 1, 1, record.length).setValues([record]);
    } else {
      exposureSheet.appendRow(record);
    }
  });
}

function appendSpeakingRow_(sheet, body) {
  const payload = body.payload || {};
  sheet.appendRow([
    body.loggedAt || new Date().toISOString(),
    body.participantCode || "",
    body.sessionId || "",
    payload.stage || "",
    body.type || "",
    payload.taskId || "",
    payload.fileName || "",
    payload.storage || "",
    payload.driveFileId || "",
    payload.driveFileUrl || "",
    payload.recordingStartedAt || "",
    payload.recordingStoppedAt || "",
    payload.uploadedAt || "",
    payload.bytes ?? "",
    payload.taskPrompt || ""
  ]);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (isTaskEvent_(body)) {
      const taskSheet = spreadsheet.getSheetByName("task_logs") || spreadsheet.insertSheet("task_logs");

      ensureTaskHeaders_(taskSheet);
      upsertTaskRow_(taskSheet, buildTaskRecord_(body));

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, target: "task_logs" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (isPracticeEvent_(body)) {
      const practiceSheet = spreadsheet.getSheetByName("session_durations") || spreadsheet.insertSheet("session_durations");

      ensurePracticeHeaders_(practiceSheet);
      upsertPracticeRow_(practiceSheet, buildPracticeRecord_(body));
      rebuildLearningSummary_(spreadsheet, body.participantCode || "");

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, target: "session_durations", summaryTarget: "learning_summary" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (isLearningExerciseEvent_(body)) {
      const answerSheet = spreadsheet.getSheetByName("answer_logs") || spreadsheet.insertSheet("answer_logs");
      const exerciseSheet = spreadsheet.getSheetByName("learning_exercises") || spreadsheet.insertSheet("learning_exercises");

      ensureAnswerLogHeaders_(answerSheet);
      ensureLearningExerciseHeaders_(exerciseSheet);
      appendAnswerLogRow_(answerSheet, body);
      appendLearningExerciseIfNew_(exerciseSheet, buildLearningExerciseRecord_(body));
      rebuildLearningSummary_(spreadsheet, body.participantCode || "");

      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          target: "answer_logs",
          exerciseTarget: "learning_exercises",
          summaryTarget: "learning_summary"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (isSpeakingEvent_(body)) {
      const speakingSheet = spreadsheet.getSheetByName("speaking_logs") || spreadsheet.insertSheet("speaking_logs");
      let speakingBody = body;

      if (body.type === "speaking_recording_uploaded") {
        const driveMeta = saveSpeakingAudioToDrive_(body);
        speakingBody = {
          ...body,
          payload: {
            ...(body.payload || {}),
            ...driveMeta
          }
        };
      }

      ensureSpeakingHeaders_(speakingSheet);
      appendSpeakingRow_(speakingSheet, speakingBody);

      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          target: "speaking_logs",
          driveFileId: speakingBody.payload && speakingBody.payload.driveFileId ? speakingBody.payload.driveFileId : null,
          driveFileUrl: speakingBody.payload && speakingBody.payload.driveFileUrl ? speakingBody.payload.driveFileUrl : null
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ignored: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
