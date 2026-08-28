function ensureHeaders_(sheet) {
  const headers = [
    "loggedAt",
    "sessionId",
    "participantCode",
    "eventType",
    "mode",
    "taskId",
    "label",
    "status",
    "durationMs",
    "exerciseIndex",
    "totalExercises",
    "selectedGrammarIds",
    "resolvedOrder",
    "wordId",
    "wordLemma",
    "answer",
    "attemptNumber",
    "startedAt",
    "payloadJson"
  ];

  const lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    sheet.appendRow(headers);
    return;
  }

  const headerValues = sheet
    .getRange(1, 1, 1, headers.length)
    .getValues()[0]
    .map((value) => String(value || "").trim());

  const hasExpectedHeaders = headers.every((header, index) => headerValues[index] === header);

  if (!hasExpectedHeaders) {
    sheet.insertRows(1, 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function doGet() {
  return ContentService
    .createTextOutput("GramChain logging webhook is live.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function formatList_(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function buildRow_(body) {
  const payload = body.payload || {};

  return [
    body.loggedAt || new Date().toISOString(),
    body.sessionId || "",
    body.participantCode || "",
    body.type || "",
    payload.mode || "",
    payload.taskId || "",
    payload.label || "",
    payload.status || "",
    payload.durationMs ?? "",
    payload.exerciseIndex ?? "",
    payload.totalExercises ?? "",
    formatList_(payload.selectedGrammarIds),
    formatList_(payload.resolvedOrder),
    payload.wordId || "",
    payload.wordLemma || "",
    payload.answer || "",
    payload.attemptNumber ?? "",
    payload.startedAt || "",
    JSON.stringify(payload)
  ];
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("logs") || spreadsheet.insertSheet("logs");

    ensureHeaders_(sheet);
    sheet.appendRow(buildRow_(body));

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
