function ensureTaskHeaders_(sheet) {
  const headers = [
    "participantCode",
    "sessionId",
    "taskId",
    "task",
    "status",
    "startedAt",
    "completedAt",
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

function doGet() {
  return ContentService
    .createTextOutput("GramChain task logging webhook is live.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function isTaskEvent_(body) {
  return body && (body.type === "task_started" || body.type === "task_completed");
}

function buildTaskRecord_(body) {
  const payload = body.payload || {};
  const loggedAt = body.loggedAt || new Date().toISOString();
  const isCompleted = body.type === "task_completed";

  return {
    participantCode: body.participantCode || "",
    sessionId: body.sessionId || "",
    taskId: payload.taskId || "",
    task: payload.label || "",
    status: isCompleted ? (payload.status || "completed") : "started",
    startedAt: payload.startedAt || (isCompleted ? "" : loggedAt),
    completedAt: isCompleted ? (payload.completedAt || loggedAt) : "",
    durationMs: isCompleted ? (payload.durationMs ?? "") : ""
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
      record.durationMs
    ]);
    return;
  }

  const existing = sheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
  sheet.getRange(rowIndex, 1, 1, 8).setValues([[
    record.participantCode || existing[0],
    record.sessionId || existing[1],
    record.taskId || existing[2],
    record.task || existing[3],
    record.status || existing[4],
    record.startedAt || existing[5],
    record.completedAt || existing[6],
    record.durationMs !== "" ? record.durationMs : existing[7]
  ]]);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (!isTaskEvent_(body)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, ignored: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("task_logs") || spreadsheet.insertSheet("task_logs");

    ensureTaskHeaders_(sheet);
    upsertTaskRow_(sheet, buildTaskRecord_(body));

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
