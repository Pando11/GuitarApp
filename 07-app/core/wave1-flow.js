// wave1-flow.js
// Wave runtime glue:
// - W1-E3 Sage coaching panel + speak wiring
// - W1-E4 Porch performance (Path B loop/wait, Em <-> easyC) with local save
// - W2-E4 Performance Level 2 hook inside the locked L10-L12 band (chosen: L12)

(function (global) {
  "use strict";

  const DEFAULT_CYCLE = ["Em", "easyC"];
  const PERFORMANCE_LADDER = {
    1: {
      level: 1,
      lessonNumber: 5,
      storageKey: "guitarapp.wave1.pathb",
      heading: "First porch performance: E minor to easy C",
      summary: "Basic Path B behavior: the band follows when you hit the expected chord, and waits when you miss.",
      buttonLabels: { Em: "I played Em", easyC: "I played easy C" },
      targetLoops: 1,
      tempoBpm: 72,
      songId: "em-easyc-first-song",
      worldId: "emerald-hollow",
      duetPath: "path-b"
    },
    2: {
      level: 2,
      lessonNumber: 12,
      storageKey: "guitarapp.wave2.pathb.level2",
      heading: "Second porch performance: the same song, steadier and stronger",
      summary: "Same Em-to-easy-C song, but Sage pushes the pace a little. Path B still loops and waits so the band never runs away from you.",
      buttonLabels: { Em: "I played Em", easyC: "I played easy C" },
      targetLoops: 3,
      tempoBpm: 84,
      songId: "em-easyc-first-song",
      worldId: "emerald-hollow",
      duetPath: "path-b"
    }
  };

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function clone(obj) {
    return safeParse(JSON.stringify(obj), obj);
  }

  function normalizePerformanceConfig(config) {
    const input = config || {};
    const level = Number(input.level) === 2 ? 2 : 1;
    const base = PERFORMANCE_LADDER[level];
    const cycle = Array.isArray(input.cycle) && input.cycle.length ? input.cycle.slice() : DEFAULT_CYCLE.slice();
    return {
      level,
      lessonNumber: Number.isInteger(input.lessonNumber) ? input.lessonNumber : base.lessonNumber,
      storageKey: typeof input.storageKey === "string" && input.storageKey ? input.storageKey : base.storageKey,
      heading: typeof input.heading === "string" && input.heading ? input.heading : base.heading,
      summary: typeof input.summary === "string" && input.summary ? input.summary : base.summary,
      buttonLabels: Object.assign({}, base.buttonLabels, input.buttonLabels || {}),
      targetLoops: Number.isFinite(input.targetLoops) ? Math.max(1, Math.floor(input.targetLoops)) : base.targetLoops,
      tempoBpm: Number.isFinite(input.tempoBpm) ? Math.max(40, Math.floor(input.tempoBpm)) : base.tempoBpm,
      songId: typeof input.songId === "string" && input.songId ? input.songId : base.songId,
      worldId: typeof input.worldId === "string" && input.worldId ? input.worldId : base.worldId,
      duetPath: typeof input.duetPath === "string" && input.duetPath ? input.duetPath : base.duetPath,
      cycle,
      domSlug: "l" + level,
    };
  }

  function configFromModel(model) {
    const mapping = model && model.appFeatureMapping ? model.appFeatureMapping : {};
    if (mapping && mapping.performance_ladder) {
      return normalizePerformanceConfig(mapping.performance_ladder);
    }
    if (model && model.lessonNumber === 5) {
      return normalizePerformanceConfig({ level: 1 });
    }
    return null;
  }

  function makePathBSession(storage, config) {
    const sessionConfig = normalizePerformanceConfig(config || {});
    const store = storage || global.localStorage;
    const cycle = sessionConfig.cycle.slice();

    function defaultState() {
      return {
        expectedIndex: 0,
        loopsCompleted: 0,
        lastChord: null,
        lastAction: "wait",
        level: sessionConfig.level,
        tempoBpm: sessionConfig.tempoBpm,
        songId: sessionConfig.songId,
      };
    }

    function load() {
      const raw = store.getItem(sessionConfig.storageKey);
      const parsed = raw ? safeParse(raw, null) : null;
      if (!parsed || typeof parsed !== "object") return defaultState();
      return {
        expectedIndex: Number.isInteger(parsed.expectedIndex) ? parsed.expectedIndex % cycle.length : 0,
        loopsCompleted: Number.isFinite(parsed.loopsCompleted) ? Math.max(0, Math.floor(parsed.loopsCompleted)) : 0,
        lastChord: parsed.lastChord || null,
        lastAction: parsed.lastAction || "wait",
        level: Number.isFinite(parsed.level) ? parsed.level : sessionConfig.level,
        tempoBpm: Number.isFinite(parsed.tempoBpm) ? parsed.tempoBpm : sessionConfig.tempoBpm,
        songId: parsed.songId || sessionConfig.songId,
      };
    }

    function save(state) {
      store.setItem(sessionConfig.storageKey, JSON.stringify(state));
      return state;
    }

    function expectedChord(state) {
      return cycle[state.expectedIndex];
    }

    function play(chordName) {
      const state = load();
      const chord = String(chordName || "");
      const expected = expectedChord(state);

      if (chord === expected) {
        state.expectedIndex = (state.expectedIndex + 1) % cycle.length;
        if (state.expectedIndex === 0) state.loopsCompleted += 1;
        state.lastAction = "follow";
      } else {
        state.lastAction = "wait";
      }

      state.lastChord = chord || null;
      save(state);

      return {
        action: state.lastAction,
        expectedNow: expectedChord(state),
        loopsCompleted: state.loopsCompleted,
        lastChord: state.lastChord,
        targetLoops: sessionConfig.targetLoops,
        level: sessionConfig.level,
      };
    }

    function reset() {
      const state = defaultState();
      save(state);
      return state;
    }

    return {
      load,
      save,
      play,
      reset,
      expectedChord,
      key: sessionConfig.storageKey,
      cycle: cycle.slice(),
      config: sessionConfig,
    };
  }

  function deriveSageLine(model, phase, stepIndex) {
    const copy = (model && model.avatarCopy) || {};
    if (phase === "intro") return copy.intro || "Sage is with you. Start calm and steady.";
    if (phase === "results") return copy.results || "Sage logged today’s work.";
    if (phase === "wrap") return copy.wrap || "Sage will see you in the next lesson.";
    if (phase === "step") {
      const steps = (model && model.steps) || [];
      const s = steps[stepIndex] || {};
      return s.coaching || s.purpose || "Take the next step slowly.";
    }
    return "";
  }

  function renderSagePanel(model) {
    return [
      '<section class="step" id="sage-panel">',
      '<span class="lesson-number">Sage</span>',
      `<h3>${escapeHtml(deriveSageLine(model, "intro"))}</h3>`,
      '<p id="sage-phase-line"></p>',
      '<div style="display:flex;gap:8px;flex-wrap:wrap">',
      '<button class="secondary" type="button" id="sage-speak-intro">Hear intro</button>',
      '<button class="secondary" type="button" id="sage-speak-results">Hear encouragement</button>',
      '<button class="secondary" type="button" id="sage-speak-wrap">Hear transition</button>',
      '</div>',
      '</section>',
    ].join("");
  }

  function renderPorchPerformance(config) {
    const slug = config.domSlug;
    const cycle = config.cycle;

    const nextLesson = config.level === 1
      ? 'Lesson 12'
      : 'Lesson 25';
    const nextLessonLabel = config.level === 1
      ? 'Level 2'
      : 'Level 3 (coming later)';

    return [
      `<section class="step" id="porch-performance-${slug}" data-performance-level="${config.level}">`,
      `<span class="lesson-number">Porch performance — Level ${config.level}</span>`,
      `<h3>${escapeHtml(config.heading)}</h3>`,
      `<p>${escapeHtml(config.summary)}</p>`,
      `<p class="meta">Song: ${escapeHtml(config.songId)} | Target loops: ${config.targetLoops} | Tempo target: ${config.tempoBpm} bpm</p>`,

      `<div id="pathb-${slug}-invite" style="margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:rgba(34,48,39,.55)">`,
      `<div class="lesson-number" style="margin-bottom:6px">Before you start</div>`,
      `<p style="margin:0">Tap the buttons to play along. The band follows when you hit the expected chord, and waits when you miss.</p>`,
      `</div>`,

      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">',
      `<button class="primary" type="button" id="pathb-${slug}-play-a">${escapeHtml(config.buttonLabels[cycle[0]] || ('I played ' + cycle[0]))}</button>`,
      `<button class="primary" type="button" id="pathb-${slug}-play-b">${escapeHtml(config.buttonLabels[cycle[1]] || ('I played ' + cycle[1]))}</button>`,
      `<button class="secondary" type="button" id="pathb-${slug}-reset">Reset loop</button>`,
      '</div>',

      `<p class="meta" id="pathb-${slug}-status"></p>`,
      `<p class="meta" id="pathb-${slug}-progress"></p>`,

      `<div id="pathb-${slug}-complete" hidden style="margin-top:12px;padding:12px;border:1px solid var(--moss);border-radius:14px;background:rgba(159,181,108,.12)">`,
      `<div class="lesson-number" style="margin-bottom:6px">Level complete</div>`,
      `<p style="margin:0">Nice work. You’ve hit the target loops for ${escapeHtml(nextLessonLabel)}.</p>`,
      `<p style="margin:8px 0 0" class="meta">Next up: ${escapeHtml(nextLesson)}.</p>`,
      `<button class="primary" type="button" id="pathb-${slug}-next">Continue when you’re ready</button>`,
      `</div>`,

      '</section>',
    ].join("");
  }

  function bindSageSpeak(model) {
    const phaseNode = global.document.getElementById("sage-phase-line");
    function speakPhase(phase) {
      const line = deriveSageLine(model, phase);
      if (phaseNode) phaseNode.textContent = line;
      if (global.GuitarApp && typeof global.GuitarApp.speak === "function") {
        global.GuitarApp.speak(line);
      }
    }

    const introBtn = global.document.getElementById("sage-speak-intro");
    const resultsBtn = global.document.getElementById("sage-speak-results");
    const wrapBtn = global.document.getElementById("sage-speak-wrap");

    if (introBtn) introBtn.addEventListener("click", function () { speakPhase("intro"); });
    if (resultsBtn) resultsBtn.addEventListener("click", function () { speakPhase("results"); });
    if (wrapBtn) wrapBtn.addEventListener("click", function () { speakPhase("wrap"); });

    speakPhase("intro");
  }

  function bindPorchPerformance(config) {
    const performance = normalizePerformanceConfig(config);
    const session = makePathBSession(null, performance);
    const slug = performance.domSlug;
    const statusNode = global.document.getElementById("pathb-" + slug + "-status");
    const inviteNode = global.document.getElementById("pathb-" + slug + "-invite");
    const progressNode = global.document.getElementById("pathb-" + slug + "-progress");
    const completeNode = global.document.getElementById("pathb-" + slug + "-complete");

    function paint() {
      const s = session.load();
      const expected = session.expectedChord(s);
      const isComplete = s.loopsCompleted >= performance.targetLoops;

      if (statusNode) {
        statusNode.textContent =
          `Band state: ${s.lastAction.toUpperCase()} | next expected: ${expected} | loops completed: ${s.loopsCompleted}/${performance.targetLoops} | tempo target: ${performance.tempoBpm} bpm`;
      }

      if (inviteNode) inviteNode.hidden = isComplete;
      if (completeNode) completeNode.hidden = !isComplete;

      if (progressNode) {
        progressNode.textContent = isComplete
          ? `Level ${performance.level} complete — you can keep moving when you’re ready.`
          : `Keep going — ${s.loopsCompleted}/${performance.targetLoops} loops. Next expected: ${expected}.`;
      }
    }

    function play(chord) {
      session.play(chord);
      paint();
    }

    const aBtn = global.document.getElementById("pathb-" + slug + "-play-a");
    const bBtn = global.document.getElementById("pathb-" + slug + "-play-b");
    const resetBtn = global.document.getElementById("pathb-" + slug + "-reset");

    if (aBtn) aBtn.addEventListener("click", function () { play(performance.cycle[0]); });
    if (bBtn) bBtn.addEventListener("click", function () { play(performance.cycle[1]); });
    if (resetBtn) resetBtn.addEventListener("click", function () { session.reset(); paint(); });

    paint();
  }

  function mountEnhancements(model, lessonContentRoot) {
    if (!lessonContentRoot || !model) return;

    lessonContentRoot.insertAdjacentHTML("afterbegin", renderSagePanel(model));
    bindSageSpeak(model);

    const performance = configFromModel(model);
    if (performance) {
      lessonContentRoot.insertAdjacentHTML("beforeend", renderPorchPerformance(performance));
      bindPorchPerformance(performance);
    }
  }

  function escapeHtml(value) {
    const node = global.document.createElement("span");
    node.textContent = String(value == null ? "" : value);
    return node.innerHTML;
  }

  global.GuitarApp = global.GuitarApp || {};
  global.GuitarApp.Wave1Flow = {
    deriveSageLine,
    makePathBSession,
    mountEnhancements,
    configFromModel,
    normalizePerformanceConfig,
    performanceConfigs: clone(PERFORMANCE_LADDER),
    storageKey: PERFORMANCE_LADDER[1].storageKey,
    cycle: DEFAULT_CYCLE.slice(),
  };
})(typeof window !== "undefined" ? window : this);
