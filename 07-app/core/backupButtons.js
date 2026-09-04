// backupButtons.js — BI-8 always-visible self-report UI (ADR-0005 second data source)
//
// The mic ("student-heard") is the PRIMARY signal. These two on-screen buttons give
// memory a SECOND, always-available data source ("student-said") so a student is
// NEVER hard-blocked by a missing/failed microphone. Clicking "Got it" / "Not yet"
// emits a report; persistence can be added later (ADR-0005).
//
// Two surfaces:
//   classifyReport(report)   -> { source:'student-said', value:'got'|'not-yet' }
//                               PURE, node-testable, no DOM.  (BI-8 unit test target)
//   mountBackupButtons(rootEl, { onReport })
//                               Browser-only, guarded. Injects two always-visible
//                               buttons. Returns a cleanup() fn. Never throws if the
//                               root is missing / we're running under node.
//
// File:// safe: no bare ES-module imports; this is a dependency-free IIFE that
// attaches to global.GuitarApp.BackupButtons (matching app.js's non-module style).

(function (global) {
  "use strict";

  // ── Pure classifier (BI-8 unit test target) ───────────────────────────────

  function classifyReport(report) {
    const r = String(report == null ? "" : report).trim().toLowerCase();
    let value;
    if (r === "got" || r === "yes" || r === "1" || r === "true" || r === "got-it" || r === "gotit") {
      value = "got";
    } else {
      // "not-yet" | "no" | "0" | "false" | unknown/empty -> treat as not-yet.
      // Defaulting to not-yet keeps the student unblocked rather than falsely
      // reporting mastery they never claimed.
      value = "not-yet";
    }
    return { source: "student-said", value: value };
  }

  // ── Browser mount (guarded, never throws) ──────────────────────────────────

  function mountBackupButtons(rootEl, opts) {
    opts = opts || {};
    const onReport = typeof opts.onReport === "function" ? opts.onReport : function () {};

    // Browser-only: under node `document` is undefined -> safe no-op cleanup.
    if (typeof document === "undefined" || !rootEl || typeof rootEl.appendChild !== "function") {
      return function noopCleanup() {};
    }

    // Idempotent: don't double-mount into the same root.
    if (rootEl.querySelector("[data-backup-buttons]")) {
      return function noopCleanup() {};
    }

    const wrap = document.createElement("div");
    wrap.setAttribute("data-backup-buttons", "");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Did you get this?");
    wrap.style.position = "fixed";
    wrap.style.left = "0";
    wrap.style.right = "0";
    wrap.style.bottom = "0";
    wrap.style.zIndex = "2147483647"; // always on top
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.padding = "10px";
    wrap.style.background = "rgba(32,32,32,0.92)";
    wrap.style.backdropFilter = "blur(4px)";

    function makeBtn(label, reportValue) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.flex = "1";
      btn.style.padding = "14px 10px";
      btn.style.fontSize = "16px";
      btn.style.fontWeight = "600";
      btn.style.border = "0";
      btn.style.borderRadius = "10px";
      btn.style.cursor = "pointer";
      btn.style.color = "#fff";
      btn.style.background = reportValue === "got" ? "#2e7d32" : "#b3541e";
      btn.addEventListener("click", function () {
        // Emit the raw report; persistence layer (later) consumes it.
        try { onReport(reportValue); } catch (e) { /* never hard-block */ }
      });
      return btn;
    }

    wrap.appendChild(makeBtn("Got it", "got"));
    wrap.appendChild(makeBtn("Not yet", "not-yet"));
    rootEl.appendChild(wrap);

    return function cleanup() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  const api = { classifyReport: classifyReport, mountBackupButtons: mountBackupButtons };

  global.GuitarApp = global.GuitarApp || {};
  global.GuitarApp.BackupButtons = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  // ── Self-test (run `node backupButtons.js`) ────────────────────────────────
  // jsdom-free: exercises only the pure classifier. Prints PASS / FAIL and exits
  // non-zero on failure so it can gate CI.

  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    let failures = 0;
    function check(name, got, want) {
      const ok = JSON.stringify(got) === JSON.stringify(want);
      if (!ok) {
        failures++;
        console.error("FAIL " + name + " -> got " + JSON.stringify(got) + " want " + JSON.stringify(want));
      } else {
        console.log("ok   " + name);
      }
    }

    check("got", classifyReport("got"), { source: "student-said", value: "got" });
    check("yes", classifyReport("yes"), { source: "student-said", value: "got" });
    check("1", classifyReport("1"), { source: "student-said", value: "got" });
    check("not-yet", classifyReport("not-yet"), { source: "student-said", value: "not-yet" });
    check("No — raw not-yet", classifyReport("no"), { source: "student-said", value: "not-yet" });
    check("empty -> not-yet (unblocked)", classifyReport(""), { source: "student-said", value: "not-yet" });
    check("garbage -> not-yet (unblocked)", classifyReport("???"), { source: "student-said", value: "not-yet" });

    // mountBackupButtons emits the CANONICAL 'got' | 'not-yet' to onReport (never a
    // human label), so the classifier must round-trip those exactly.
    check("canonical got round-trips", classifyReport("got").value, "got");
    check("canonical not-yet round-trips", classifyReport("not-yet").value, "not-yet");

    if (failures === 0) {
      console.log("PASS");
      process.exit(0);
    } else {
      console.error(failures + " FAILURE(S)");
      process.exit(1);
    }
  }
})(typeof window !== "undefined" ? window : this);
