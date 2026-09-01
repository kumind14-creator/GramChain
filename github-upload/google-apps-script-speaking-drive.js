// Paste this entire file into Code.gs in Google Apps Script.
// It handles:
// 1. task_logs updates
// 2. speaking_logs updates
// 3. saving speaking audio files to Google Drive /GramChain_speaking

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

function saveSpeakingAudioToDrive_(body) {
  const payload = body.payload || {};
  const fileName = payload.fileName || "speaking_recording.webm";
  const mimeType = payload.mimeType || "audio/webm";
  const folder = getOrCreateDriveFolder_("GramChain_speaking");
  const bytes = Utilities.base64Decode(payload.audioBase64 || "");
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);

  return {
    driveFileId: file.getId(),
    driveFileUrl: file.getUrl(),
    storage: "google-drive"
  };
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
    task: payload.label || "",
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
