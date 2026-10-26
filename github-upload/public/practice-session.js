(function (root) {
  "use strict";
  const STORAGE_KEY = "gramchain_practice_session_v2";
  const IDLE_LIMIT_MS = 15 * 60 * 1000;

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
          completionReason: r.completionReason || "", trackingVersion: 2
        }
      };
      try { return Promise.resolve(this.send(body, urgent)).catch(() => {}); } catch (_) { return Promise.resolve(); }
    }

    start(session, visible = true) {
      const now = this.now();
      this.record = {
        sessionId: session.sessionId, participantCode: session.participantCode,
        startedAt: session.startedAt || new Date(now).toISOString(),
        activeMs: 0, lastSeenAtMs: now, completed: false
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
      if (saved.completed) {
        // Retry a final cumulative checkpoint, including after an offline exit.
        void this.emit("practice_session_completed");
        return null;
      }
      if (this.now() - saved.lastSeenAtMs >= IDLE_LIMIT_MS) {
        void this.finish("timeout");
        return null;
      }
      if (visible) this.activeSince = this.now();
      return saved;
    }

    accrue() {
      if (!this.record || this.record.completed || this.activeSince === null) return;
      const now = this.now();
      this.record.activeMs += Math.max(0, now - this.activeSince);
      this.record.lastSeenAtMs = now;
      this.activeSince = now;
    }

    checkpoint(urgent = false) {
      if (!this.record || this.record.completed) return Promise.resolve();
      this.accrue();
      this.persist();
      return this.emit("practice_session_progress", urgent);
    }

    pause() {
      this.accrue();
      this.activeSince = null;
      return this.checkpoint(true);
    }

    resume() {
      if (!this.record || this.record.completed) return false;
      if (this.activeSince !== null) return true;
      if (this.now() - this.record.lastSeenAtMs >= IDLE_LIMIT_MS) {
        void this.finish("timeout");
        return false;
      }
      this.activeSince = this.now();
      void this.checkpoint();
      return true;
    }

    tick() {
      if (!this.record || this.record.completed) return false;
      if (this.activeSince === null && this.now() - this.record.lastSeenAtMs >= IDLE_LIMIT_MS) {
        void this.finish("timeout");
        return false;
      }
      if (this.activeSince !== null) void this.checkpoint();
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

  if (typeof module !== "undefined" && module.exports) module.exports = { PracticeSessionTracker, STORAGE_KEY, IDLE_LIMIT_MS };
  else root.PracticeSessionTracker = PracticeSessionTracker;
})(typeof window !== "undefined" ? window : globalThis);
