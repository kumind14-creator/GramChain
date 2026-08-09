const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "outputs", "research-logs", "research-log.jsonl");
const outputDir = path.join(__dirname, "outputs", "research-logs");
const csvFile = path.join(outputDir, "research-summary.csv");
const fallbackCsvFile = path.join(outputDir, "research-summary-seconds.csv");

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) {
    return [];
  }

  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function summarize(entries) {
  const participants = new Map();

  for (const entry of entries) {
    const participantCode = entry.participantCode || "unknown";

    if (!participants.has(participantCode)) {
      participants.set(participantCode, {
        participantCode,
        sessionIds: new Set(),
        tasks: {}
      });
    }

    const participant = participants.get(participantCode);

    if (entry.sessionId) {
      participant.sessionIds.add(entry.sessionId);
    }

    if (entry.type === "task_completed" && entry.payload?.taskId) {
      participant.tasks[entry.payload.taskId] = {
        label: entry.payload.label,
        status: entry.payload.status || "completed",
        durationMs: entry.payload.durationMs ?? null,
        completedAt: entry.loggedAt
      };
    }
  }

  return Array.from(participants.values()).map((participant) => ({
    participantCode: participant.participantCode,
    sessionCount: participant.sessionIds.size,
    task1Status: participant.tasks.task_1?.status || "not_completed",
    task1TimeMinutesSeconds: participant.tasks.task_1?.durationMs != null
      ? formatMinutesSeconds(participant.tasks.task_1.durationMs)
      : null,
    task2Status: participant.tasks.task_2?.status || "not_completed",
    task2TimeMinutesSeconds: participant.tasks.task_2?.durationMs != null
      ? formatMinutesSeconds(participant.tasks.task_2.durationMs)
      : null,
    task3Status: participant.tasks.task_3?.status || "not_completed",
    task3TimeMinutesSeconds: participant.tasks.task_3?.durationMs != null
      ? formatMinutesSeconds(participant.tasks.task_3.durationMs)
      : null,
    task4Status: participant.tasks.task_4?.status || "not_completed",
    task4TimeMinutesSeconds: participant.tasks.task_4?.durationMs != null
      ? formatMinutesSeconds(participant.tasks.task_4.durationMs)
      : null
  }));
}

function formatMinutesSeconds(durationMs) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [
      "participantCode,sessionCount,task1Status,task1TimeMinutesSeconds,task2Status,task2TimeMinutesSeconds,task3Status,task3TimeMinutesSeconds,task4Status,task4TimeMinutesSeconds"
    ].join("\n");
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","))
  ];

  return lines.join("\n");
}

const entries = readJsonLines(logFile);
const summary = summarize(entries);
const csv = toCsv(summary);

fs.mkdirSync(outputDir, { recursive: true });
let savedCsvPath = csvFile;

try {
  fs.writeFileSync(csvFile, csv, "utf8");
} catch (error) {
  if (error.code === "EBUSY" || error.code === "EPERM") {
    fs.writeFileSync(fallbackCsvFile, csv, "utf8");
    savedCsvPath = fallbackCsvFile;
  } else {
    throw error;
  }
}

console.log(JSON.stringify(summary, null, 2));
console.log(`\nCSV saved to: ${savedCsvPath}`);
