(function (root) {
  "use strict";
  const STORAGE_KEY = "gramchain_practice_session_v2";
  const IDLE_LIMIT_MS = 15 * 60 * 1000;
  const READING_GRACE_MS = 3 * 60 * 1000;

  function moscowDay(ms) {
    return new Date(ms + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  class PracticeSessionTracker {
    constructor(options = {}) {
      this.now = options.now || Date.now;
      this.storage = options.storage;
      this.send = options.send || (() => Promise.resolve());
      this.getContext = options.getContext || (() => ({}));
      this.record = null;
      this.activeSince = null;
    }

    persist() {
      if (!this.record) return;
      this.record.context = this.getContext();
      try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.record)); } catch (_) { /* Storage may be unavailable. */ }
    }

    emit(type, urgent = false) {
      if (!this.record) return Promise.resolve();
      const r = this.record;
      const body = {
        sessionId: r.sessionId, participantCode: r.participantCode, eventType: type,
        payload: {
          startedAt: r.startedAt, completedAt: r.completedAt || "",
          practiceDurationMs: r.activeMs, lastSeenAt: new Date(r.lastSeenAtMs).toISOString(),
          status: r.completed ? "completed" : (this.activeSince === null ? "paused" : "active"),
          completionReason: r.completionReason || "", trackingVersion: 2,
          dailyActiveMs: r.dailyActiveMs || {}, autoEndAt: new Date(r.autoEndAtMs).toISOString()
        }
      };
      try { return Promise.resolve(this.send(body, urgent)).catch(() => {}); } catch (_) { return Promise.resolve(); }
    }

    start(session, visible = true) {
      const now = this.now();
      this.record = {
        sessionId: session.sessionId, participantCode: session.participantCode,
        startedAt: session.startedAt || new Date(now).toISOString(),
        activeMs: 0, dailyActiveMs: {}, lastSeenAtMs: now,
        lastActivityAtMs: now, autoEndAtMs: now + IDLE_LIMIT_MS, completed: false
      };
      this.activeSince = visible ? now : null;
      this.persist();
      return this.emit("practice_session_started");
    }

    restore(visible = true) {
      let saved;
      try { saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) || "null"); } catch (_) { return null; }
      if (!saved?.sessionId || !saved.participantCode || !Number.isFinite(saved.lastSeenAtMs) ||
          !Number.isFinite(saved.activeMs) || saved.activeMs < 0) return null;
      this.record = saved;
      this.activeSince = null;
      saved.dailyActiveMs ||= {};
      saved.lastActivityAtMs ??= saved.lastSeenAtMs;
      saved.autoEndAtMs ??= saved.lastSeenAtMs + IDLE_LIMIT_MS;
      if (saved.completed) {
        // Retry a final cumulative checkpoint, including after an offline exit.
        void this.emit("practice_session_completed");
        return null;
      }
      if (this.now() >= saved.autoEndAtMs) {
        void this.finish("timeout");
        return null;
      }
      if (visible) {
        this.activeSince = this.now();
        saved.lastActivityAtMs = this.now();
        saved.autoEndAtMs = this.now() + IDLE_LIMIT_MS;
      }
      return saved;
    }

    accrue() {
      if (!this.record || this.record.completed || this.activeSince === null) return;
      const now = this.now();
      const until = Math.min(now, this.record.lastActivityAtMs + READING_GRACE_MS);
      let from = this.activeSince;
      if (until > from) {
        this.record.activeMs += until - from;
        while (from < until) {
          const day = moscowDay(from);
          const nextMidnight = Date.parse(day + "T00:00:00+03:00") + 86400000;
          const end = Math.min(until, nextMidnight);
          this.record.dailyActiveMs[day] = (this.record.dailyActiveMs[day] || 0) + end - from;
          from = end;
        }
        this.record.lastSeenAtMs = until;
      }
      this.activeSince = now >= this.record.lastActivityAtMs + READING_GRACE_MS ? null : now;
    }

    checkpoint(urgent = false) {
      if (!this.record || this.record.completed) return Promise.resolve();
      this.accrue();
      this.persist();
      return this.emit("practice_session_progress", urgent);
    }

    pause() {
      const wasActive = this.activeSince !== null;
      this.accrue();
      this.activeSince = null;
      if (this.record && !this.record.completed && wasActive &&
          this.now() < this.record.lastActivityAtMs + READING_GRACE_MS) this.record.autoEndAtMs = this.now() + IDLE_LIMIT_MS;
      return this.checkpoint(true);
    }

    resume() {
      if (!this.record || this.record.completed) return false;
      if (this.activeSince !== null) return true;
      if (this.now() >= this.record.autoEndAtMs) {
        void this.finish("timeout");
        return false;
      }
      this.activeSince = this.now();
      this.record.lastActivityAtMs = this.now();
      this.record.lastSeenAtMs = this.now();
      this.record.autoEndAtMs = this.now() + IDLE_LIMIT_MS;
      void this.checkpoint();
      return true;
    }

    tick() {
      if (!this.record || this.record.completed) return false;
      if (this.now() >= this.record.autoEndAtMs) {
        void this.finish("timeout");
        return false;
      }
      if (this.activeSince !== null) void this.checkpoint();
      return true;
    }

    activity(visible = true) {
      if (!this.record || this.record.completed) return false;
      if (this.now() >= this.record.autoEndAtMs) {
        void this.finish("timeout");
        return false;
      }
      const wasPaused = this.activeSince === null;
      this.accrue();
      this.record.lastActivityAtMs = this.now();
      this.record.lastSeenAtMs = this.now();
      this.record.autoEndAtMs = this.now() + IDLE_LIMIT_MS;
      if (visible) this.activeSince = this.now();
      this.persist();
      if (wasPaused && visible) void this.checkpoint();
      return true;
    }

    finish(reason = "manual") {
      if (!this.record) return Promise.resolve();
      if (!this.record.completed) {
        this.accrue();
        this.activeSince = null;
        this.record.completed = true;
        this.record.completionReason = reason;
        this.record.completedAt = new Date(this.record.lastSeenAtMs).toISOString();
        this.persist();
      }
      return this.emit("practice_session_completed", true);
    }
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { PracticeSessionTracker, STORAGE_KEY, IDLE_LIMIT_MS, READING_GRACE_MS, moscowDay };
  else root.PracticeSessionTracker = PracticeSessionTracker;
})(typeof window !== "undefined" ? window : globalThis);
