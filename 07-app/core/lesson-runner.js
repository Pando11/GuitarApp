// lesson-runner.js
// Reusable lesson runner for Emerald Hollow lesson JSON.
// Contract target: lesson + exercises -> normalized model + HTML render.

(function (global) {
  "use strict";

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  // --- T1.4: copyVariants selection by learner profile -----------------
  //
  // Lessons L01-L05 carry a `copyVariants` object (keys: 'kid',
  // 'adult-beginner', 'returning') alongside the legacy `avatar_coaching_copy`
  // (see docs/plans/TIER-1-make-ai-real.md T1.3). Lessons 06-25 have no
  // `copyVariants` yet. This picks the right variant for a learner profile
  // (07-app/core/learnerProfile.js's PROFILE_SCHEMA: ageBand, experience, ...),
  // defaulting to 'adult-beginner' whenever the profile is absent, the lesson
  // has no copyVariants, or the mapped key isn't present in that lesson's
  // copyVariants object.
  //
  // Mapping chosen (not specified by the tier doc, documented here):
  //   - ageBand 'under-13' or '13-17'      -> 'kid'      (checked first: a
  //     young learner's register matters more than experience level)
  //   - experience 'returning-player'      -> 'returning'
  //   - everything else (including no profile at all, or an adult with
  //     'never-held-one'/'tried-and-quit') -> 'adult-beginner'
  function mapProfileToVariant(profile) {
    if (!profile || typeof profile !== "object") return "adult-beginner";
    if (profile.ageBand === "under-13" || profile.ageBand === "13-17") return "kid";
    if (profile.experience === "returning-player") return "returning";
    return "adult-beginner";
  }

  // Resolves the avatar-coaching copy object for a lesson + learner profile.
  // Returns { copy, variantKey } where `copy` is always a usable object
  // (falls back to the lesson's legacy avatar_coaching_copy, then {}), and
  // `variantKey` is the copyVariants key actually used, or null when none of
  // copyVariants applied (no copyVariants on this lesson, or empty).
  function resolveAvatarCopy(raw, profile) {
    const legacy =
      raw && typeof raw.avatar_coaching_copy === "object" && raw.avatar_coaching_copy !== null
        ? raw.avatar_coaching_copy
        : {};
    const variants =
      raw && typeof raw.copyVariants === "object" && raw.copyVariants !== null
        ? raw.copyVariants
        : null;
    if (!variants) return { copy: legacy, variantKey: null };

    const wanted = mapProfileToVariant(profile);
    if (variants[wanted] && typeof variants[wanted] === "object") {
      return { copy: variants[wanted], variantKey: wanted };
    }
    // Mapped variant missing on this lesson -> default to adult-beginner.
    if (variants["adult-beginner"] && typeof variants["adult-beginner"] === "object") {
      return { copy: variants["adult-beginner"], variantKey: "adult-beginner" };
    }
    // No usable variant at all -> legacy copy.
    return { copy: legacy, variantKey: null };
  }

  /**
   * Validates lesson data structure and types.
   * @param {*} raw - Raw lesson data to validate
   * @param {number} lessonIndex - Index of the lesson (for error context)
   * @returns {{valid: boolean, errors: string[]}} Validation result with error messages
   */
  function validateLesson(raw, lessonIndex) {
    const errors = [];
    const contextLabel = lessonIndex !== undefined ? ` (Lesson ${lessonIndex})` : "";

    // Check if raw exists
    if (!raw || typeof raw !== "object") {
      return {
        valid: false,
        errors: [`Expected lesson object${contextLabel}, got ${raw === null ? "null" : typeof raw}`],
      };
    }

    const lesson = raw.lesson;
    const exercises = raw.exercises;

    // Validate lesson object
    if (lesson !== undefined && (typeof lesson !== "object" || lesson === null)) {
      errors.push(`lesson.lesson must be an object${contextLabel}, got ${typeof lesson}`);
    }

    const lessonObj = lesson || {};

    // Validate lesson.id if present
    if (lessonObj.id !== undefined && typeof lessonObj.id !== "string") {
      errors.push(`lesson.id must be a string${contextLabel}, got ${typeof lessonObj.id}`);
    }

    // Validate lesson.title if present
    if (lessonObj.title !== undefined && typeof lessonObj.title !== "string") {
      errors.push(
        `lesson.title must be a string${contextLabel}, got ${typeof lessonObj.title}`
      );
    }

    // Validate lesson.estimated_minutes if present
    if (lessonObj.estimated_minutes !== undefined) {
      const num = Number(lessonObj.estimated_minutes);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        errors.push(
          `lesson.estimated_minutes must be a non-negative number${contextLabel}, got "${lessonObj.estimated_minutes}"`
        );
      }
    }

    // Validate lesson.one_line_promise if present
    if (lessonObj.one_line_promise !== undefined && typeof lessonObj.one_line_promise !== "string") {
      errors.push(
        `lesson.one_line_promise must be a string${contextLabel}, got ${typeof lessonObj.one_line_promise}`
      );
    }

    // Validate lesson.objectives if present
    if (lessonObj.objectives !== undefined) {
      if (!Array.isArray(lessonObj.objectives)) {
        errors.push(
          `lesson.objectives must be an array${contextLabel}, got ${typeof lessonObj.objectives}`
        );
      } else {
        lessonObj.objectives.forEach((obj, i) => {
          if (typeof obj !== "string" && obj !== null && obj !== undefined) {
            errors.push(
              `lesson.objectives[${i}] must be a string${contextLabel}, got ${typeof obj}`
            );
          }
        });
      }
    }

    // Validate lesson.app_feature_mapping if present
    if (lessonObj.app_feature_mapping !== undefined) {
      if (typeof lessonObj.app_feature_mapping !== "object" || lessonObj.app_feature_mapping === null) {
        errors.push(
          `lesson.app_feature_mapping must be an object${contextLabel}, got ${typeof lessonObj.app_feature_mapping}`
        );
      }
    }

    // Validate exercises array
    if (exercises !== undefined) {
      if (!Array.isArray(exercises)) {
        errors.push(
          `exercises must be an array${contextLabel}, got ${typeof exercises}`
        );
      } else {
        exercises.forEach((exercise, i) => {
          // Allow null/undefined as empty step
          if (exercise !== null && exercise !== undefined) {
            if (typeof exercise !== "object") {
              errors.push(
                `exercises[${i}] must be an object${contextLabel}, got ${typeof exercise}`
              );
            } else {
              // Type-check individual exercise fields
              if (exercise.id !== undefined && typeof exercise.id !== "string") {
                errors.push(
                  `exercises[${i}].id must be a string${contextLabel}, got ${typeof exercise.id}`
                );
              }
              if (exercise.name !== undefined && typeof exercise.name !== "string") {
                errors.push(
                  `exercises[${i}].name must be a string${contextLabel}, got ${typeof exercise.name}`
                );
              }
              if (exercise.purpose !== undefined && typeof exercise.purpose !== "string") {
                errors.push(
                  `exercises[${i}].purpose must be a string${contextLabel}, got ${typeof exercise.purpose}`
                );
              }
              if (exercise.coaching !== undefined && typeof exercise.coaching !== "string") {
                errors.push(
                  `exercises[${i}].coaching must be a string${contextLabel}, got ${typeof exercise.coaching}`
                );
              }
              if (exercise.params !== undefined && (typeof exercise.params !== "object" || exercise.params === null)) {
                errors.push(
                  `exercises[${i}].params must be an object${contextLabel}, got ${typeof exercise.params}`
                );
              }
            }
          }
        });
      }
    }

    // Validate avatar_coaching_copy if present
    if (raw.avatar_coaching_copy !== undefined) {
      if (typeof raw.avatar_coaching_copy !== "object" || raw.avatar_coaching_copy === null) {
        errors.push(
          `avatar_coaching_copy must be an object${contextLabel}, got ${typeof raw.avatar_coaching_copy}`
        );
      }
    }

    // Validate chords if present
    if (raw.chords !== undefined) {
      if (typeof raw.chords !== "object" || raw.chords === null) {
        errors.push(
          `chords must be an object${contextLabel}, got ${typeof raw.chords}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalizes raw lesson data into a typed model for rendering.
   * Validates data before processing to prevent XSS and type errors.
   * @param {*} raw - Raw lesson data from JSON
   * @param {number} lessonIndex - Index position of lesson
   * @returns {Object} Normalized lesson model
   * @throws {Error} If validation fails and strict mode enabled
   */
  function normalizeLesson(raw, lessonIndex, learnerProfile) {
    // Validate before processing
    const validation = validateLesson(raw, lessonIndex);
    if (!validation.valid) {
      throw new Error(
        `Invalid lesson data at index ${lessonIndex}:\n${validation.errors.join("\n")}`
      );
    }

    const lesson = (raw && raw.lesson) || {};
    const exercises = asArray(raw && raw.exercises);

    // Type-safe property extraction with defaults
    const lessonId = typeof lesson.id === "string" ? lesson.id : "";
    const title =
      typeof lesson.title === "string"
        ? lesson.title
        : `Lesson ${String(lessonIndex + 1).padStart(2, "0")}`;
    const estimatedMinutes = (() => {
      const val = Number(lesson.estimated_minutes || 10);
      return isFinite(val) && val >= 0 ? val : 10;
    })();
    const oneLinePromise =
      typeof lesson.one_line_promise === "string" ? lesson.one_line_promise : "";

    // Safe array conversion with type checking
    const objectives = Array.isArray(lesson.objectives)
      ? lesson.objectives.filter((x) => typeof x === "string").map(String)
      : [];

    // Type-safe object extraction
    const appFeatureMapping =
      lesson && typeof lesson.app_feature_mapping === "object" && lesson.app_feature_mapping !== null
        ? lesson.app_feature_mapping
        : {};
    const resolvedCopy = resolveAvatarCopy(raw, learnerProfile);
    const avatarCopy = resolvedCopy.copy;
    const chords =
      raw && typeof raw.chords === "object" && raw.chords !== null
        ? raw.chords
        : {};

    // Safe exercise normalization
    const steps = exercises
      .map((exercise, i) => {
        // Handle null/undefined exercises
        if (!exercise || typeof exercise !== "object") {
          return {
            id: `step-${i + 1}`,
            name: `Step ${i + 1}`,
            purpose: "",
            coaching: "",
            params: {},
          };
        }

        return {
          id: typeof exercise.id === "string" ? exercise.id : `step-${i + 1}`,
          name: typeof exercise.name === "string" ? exercise.name : `Step ${i + 1}`,
          purpose: typeof exercise.purpose === "string" ? exercise.purpose : "",
          coaching: typeof exercise.coaching === "string" ? exercise.coaching : "",
          params:
            exercise && typeof exercise.params === "object" && exercise.params !== null
              ? exercise.params
              : {},
        };
      });

    const model = {
      lessonIndex,
      lessonNumber: lessonIndex + 1,
      lessonId,
      title,
      estimatedMinutes,
      oneLinePromise,
      objectives,
      appFeatureMapping,
      avatarCopy,
      copyVariantKey: resolvedCopy.variantKey,
      steps,
      chords,
    };

    return model;
  }

  function esc(value) {
    const node = document.createElement("span");
    node.textContent = String(value == null ? "" : value);
    return node.innerHTML;
  }

  // --- W6.2: 'Ask your coach' entry point, reachable from inside a lesson
  // (not only from the practice/drill screen — see drillRunner.js's
  // askCoachAbout, which this mirrors). Generic, data-derived encouragement
  // only — never a musical diagnosis (Rule 5) — same fallback voice already
  // used on the practice screen (see index.html's askCoach()).
  const DEFAULT_COACH_FALLBACK = "Keep practicing — steady progress beats a rush.";

  function escAttr(value) {
    return esc(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // --- Lesson audio manifest (T0.5) -----------------------------------
  // Manifest shape: { lessonId: { clipId: relativePathFromAudioDir } }
  // lessonId here is the lowercase "lNN" form (e.g. "l01"), independent of
  // the human-readable lesson.id field in the lesson JSON.
  const AUDIO_MANIFEST_URL = "./audio/manifest.json";
  const manifestState = { data: null, promise: null };

  function loadAudioManifest() {
    if (manifestState.promise) return manifestState.promise;
    if (typeof fetch !== "function") {
      manifestState.data = {};
      manifestState.promise = Promise.resolve(manifestState.data);
      return manifestState.promise;
    }
    manifestState.promise = fetch(AUDIO_MANIFEST_URL)
      .then((r) => (r && r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((data) => {
        manifestState.data = data && typeof data === "object" ? data : {};
        return manifestState.data;
      });
    return manifestState.promise;
  }

  function lessonManifestId(lessonNumber) {
    return "l" + String(lessonNumber).padStart(2, "0");
  }

  // Clip naming convention produced by the TTS pipeline (T0.2):
  //   lNN-0N-exN_intro   -> spoken lead-in for step N (1-indexed)
  //   lNN-0(N+1)-exN      -> the step's own coaching audio
  function findStepClips(lessonClips, lid, stepIndex) {
    if (!lessonClips || typeof lessonClips !== "object") return null;
    const n = stepIndex + 1;
    const introKey = `${lid}-0${n}-ex${n}_intro`;
    const mainKey = `${lid}-0${n + 1}-ex${n}`;
    const altMainKey = `${lid}-0${n}-ex${n}`;
    const intro = typeof lessonClips[introKey] === "string" ? lessonClips[introKey] : null;
    const main =
      typeof lessonClips[mainKey] === "string"
        ? lessonClips[mainKey]
        : typeof lessonClips[altMainKey] === "string"
          ? lessonClips[altMainKey]
          : null;
    if (!intro && !main) return null;
    return { introKey, introPath: intro, mainKey, mainPath: main };
  }

  function findNamedClip(lessonClips, lid, suffix) {
    if (!lessonClips || typeof lessonClips !== "object") return null;
    const matchKey = Object.keys(lessonClips).find((key) => key.indexOf(`-${suffix}`) !== -1);
    if (!matchKey) return null;
    const path = lessonClips[matchKey];
    return typeof path === "string" ? { key: matchKey, path } : null;
  }

  function audioElementHTML(path, label) {
    if (!path) return "";
    const src = `./audio/${path}`;
    return `<audio controls preload="none" src="${escAttr(src)}" aria-label="${escAttr(label)}">Your browser does not support audio playback.</audio>`;
  }

  function renderLessonHTML(model, manifestData) {
    const lid = lessonManifestId(model.lessonNumber);
    const lessonClips = manifestData && typeof manifestData === "object" ? manifestData[lid] : null;
    const introClip = findNamedClip(lessonClips, lid, "00-intro");
    const wrapClip = findNamedClip(lessonClips, lid, "99-wrap");

    return [
      `<div class="lesson-intro">`,
      `<div class="eyebrow">Lesson ${String(model.lessonNumber).padStart(2, "0")}</div>`,
      `<h1 id="lesson-title">${esc(model.title)}</h1>`,
      `<p>${esc(model.oneLinePromise)}</p>`,
      introClip
        ? `<div class="lesson-audio">${audioElementHTML(introClip.path, `Play lesson introduction: ${model.title}`)}</div>`
        : "",
      `<h3>By the end</h3>`,
      `<ul class="objectives">${model.objectives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`,
      `</div>`,
      `<div class="steps">${model.steps
        .map((step, i) => {
          const clips = findStepClips(lessonClips, lid, i);
          const introAudio = clips && clips.introPath
            ? `<div class="step-audio"><span class="lesson-number">Listen first</span>${audioElementHTML(
                clips.introPath,
                `Play intro audio for step: ${step.name}`
              )}</div>`
            : "";
          const mainAudio = clips && clips.mainPath
            ? `<div class="step-audio">${audioElementHTML(
                clips.mainPath,
                `Play coaching audio for step: ${step.name}`
              )}</div>`
            : "";
          return `<section class="step"><span class="lesson-number">Step ${i + 1}</span><h3>${esc(step.name)}</h3><p>${esc(
            step.coaching || step.purpose
          )}</p>${introAudio}${mainAudio}</section>`;
        })
        .join("")}</div>`,
      wrapClip
        ? `<div class="lesson-audio">${audioElementHTML(wrapClip.path, `Play lesson wrap-up: ${model.title}`)}</div>`
        : "",
      // Coaching entry point for this lesson (wired up by openLesson, below,
      // immediately after this HTML is inserted into the DOM). Two ways in:
      // type a question, or ask for an unprompted read on how it's going.
      // The transcript is filled by script, never by this string — student
      // text and model prose both go in through textContent.
      `<section class="step lesson-coach" id="lesson-coach">`,
      `<span class="lesson-number">Ask Sage</span>`,
      `<h3>Stuck on something? Ask.</h3>`,
      `<div class="chat-log" id="lesson-chat-log" role="log" aria-live="polite" aria-label="Your conversation with Sage"></div>`,
      `<form class="chat-form" id="lesson-chat-form">`,
      `<label class="sr-only" for="lesson-chat-input">Your question for Sage</label>`,
      `<input class="chat-input" id="lesson-chat-input" type="text" maxlength="300" autocomplete="off" placeholder="Why does my chord buzz?">`,
      `<button class="primary" id="lesson-chat-send" type="submit">Ask</button>`,
      `</form>`,
      `<button class="secondary" id="lesson-ask-coach" type="button">Just tell me how I'm doing</button>`,
      `<p class="meta" id="lesson-coach-text" aria-live="polite"></p>`,
      `</section>`,
    ].join("");
  }

  /**
   * Creates a lesson runner instance that manages lesson lifecycle.
   * @param {Object} opts - Configuration options
   * @param {Array} opts.lessons - Array of raw lesson data objects
   * @param {Function} opts.render - Callback when lesson is opened
   * @param {Object} opts.audioManifest - Audio manifest data (optional; loaded separately if not provided)
   * @param {boolean} opts.strict - If true, throw on validation errors (default: true)
   * @returns {Object} Runner with methods to open and fetch lessons
   */
  function createLessonRunner(opts) {
    const options = opts || {};
    const lessons = asArray(options.lessons);
    const openIndex = { value: null };
    const strict = options.strict !== false; // Default to strict mode
    // Use passed audioManifest, or fall back to manifestState.data if loaded
    const passedAudioManifest = options.audioManifest;

    // Validate all lessons on initialization
    const validationResults = lessons.map((lesson, i) => ({
      index: i,
      validation: validateLesson(lesson, i),
    }));

    const invalidLessons = validationResults.filter((r) => !r.validation.valid);
    if (invalidLessons.length > 0 && strict) {
      const errorMessages = invalidLessons
        .map(
          (r) =>
            `Lesson ${r.index}:\n  ${r.validation.errors.join("\n  ")}`
        )
        .join("\n\n");
      throw new Error(
        `Validation failed for ${invalidLessons.length} lesson(s):\n\n${errorMessages}`
      );
    }

    // askCoachAbout(opts) -> Promise<{text, source}>
    //
    // Mirrors drillRunner.js's askCoachAbout({...}) -> coachSurface.js's
    // buildCoachEnvelope()/getCoachMessage() contract exactly (coachSurface.js
    // and chatEngine.js are untouched by this file). Loaded via dynamic
    // import() rather than a static import so this file can stay a plain
    // classic <script> (same convention planNext(), above^, already uses for
    // adaptivePlan.js) — resolved relative to lesson-runner.js's own URL by
    // the platform, same directory as coachSurface.js.
    //
    // Rule 5: this only ever passes through values the caller already has on
    // hand — a learner profile, the open lesson's lessonId, and whatever real
    // mastery/justHappened/recentHistory numbers a caller with a
    // practiceStore connection chooses to supply. lesson-runner.js itself has
    // no practiceStore of its own, so those default to empty/null (never
    // invented) exactly like buildCoachEnvelope's own documented degrade path.
    //
    // opts: { index (defaults to the currently open lesson), learnerProfile
    //   (defaults to options.learnerProfile), mastery, justHappened,
    //   recentHistory, localTemplate }
    // opts.question: free text the student typed. Passed straight through to
    // buildCoachEnvelope, which trims and length-checks it; never parsed or
    // reworded here.
    async function askCoachAbout(opts) {
      const o = opts || {};
      const idx = Number.isInteger(o.index) ? o.index : openIndex.value;
      let lessonId = null;
      // The chord shapes this lesson actually teaches, read off the lesson's
      // own verified `chords` block (its keys are the chord names; `_schema`
      // is the documentation entry, not a chord). Sent so the coaching
      // service will let Sage name the chord the student is looking at even
      // before they have practiced it, and so Sage quotes the lesson's real
      // fingering rather than inventing one — see server/src/guardrail.js
      // and server/src/modelClient.js.
      let lessonChords = [];
      if (Number.isInteger(idx) && idx >= 0 && idx < lessons.length) {
        const profileForModel = o.learnerProfile !== undefined ? o.learnerProfile : options.learnerProfile;
        const model = normalizeLesson(lessons[idx], idx, profileForModel);
        lessonId = model.lessonId || null;
        const raw = lessons[idx] && lessons[idx].chords;
        if (raw && typeof raw === "object") {
          lessonChords = Object.keys(raw)
            .filter(function(k){ return k !== "_schema" && raw[k] && typeof raw[k] === "object"; })
            .map(function(k){
              return { chord: k, frets: raw[k].frets, fingers: raw[k].fingers };
            });
        }
      }

      const localTemplate = o.localTemplate || DEFAULT_COACH_FALLBACK;

      let coachSurface;
      try {
        coachSurface = await import("./coachSurface.js");
      } catch (e) {
        // coachSurface.js unreachable (e.g. a non-module environment) —
        // never throw, never guess a message; just hand back the caller's
        // own fallback text, the same fail-safe posture coachSurface.js
        // itself documents for malformed/missing input.
        return { text: localTemplate, source: "unavailable" };
      }

      const learnerProfile = o.learnerProfile !== undefined ? o.learnerProfile : options.learnerProfile;

      // anonId: prefer an explicit override (tests), otherwise the stable
      // per-device id options.telemetry (telemetry.js) already mints — never
      // generated here (see coachSurface.js's buildCoachEnvelope for the
      // "never invent" contract).
      let anonId = typeof o.anonId === "string" ? o.anonId : undefined;
      if (anonId === undefined && options.telemetry && typeof options.telemetry.getAnonId === "function") {
        try { anonId = options.telemetry.getAnonId(); } catch (e) { anonId = undefined; }
      }

      // Mastery: the caller's own list wins; otherwise ask the shell for the
      // stored one. This file keeps no practiceStore of its own (see the note
      // above), so without options.getMastery it sends [] and the coach can
      // only answer in generalities — which is what shipped before this was
      // wired up. Never invented here either way: an empty list stays empty.
      let mastery = Array.isArray(o.mastery) ? o.mastery : null;
      if (mastery === null && typeof options.getMastery === "function") {
        try {
          const supplied = await options.getMastery();
          mastery = Array.isArray(supplied) ? supplied : [];
        } catch (e) {
          mastery = [];
        }
      }

      const envelope = coachSurface.buildCoachEnvelope({
        anonId,
        learnerProfile,
        lessonId,
        lessonChords,
        mastery: Array.isArray(mastery) ? mastery : [],
        justHappened: o.justHappened || null,
        recentHistory: Array.isArray(o.recentHistory) ? o.recentHistory : [],
        question: typeof o.question === "string" ? o.question : undefined,
      });

      return coachSurface.getCoachMessage(envelope, localTemplate);
    }

    // Wires the "Ask your coach" button rendered into the lesson HTML (see
    // renderLessonHTML, above) to askCoachAbout(). Called after every DOM
    // insertion of the lesson HTML (the initial render and the later
    // audio-manifest re-render both replace the button element, so both call
    // this again) rather than once, so a stale/missing listener never
    // silently ships.
    // The transcript for the lesson currently on screen. Held here rather than
    // read back out of the DOM because renderLessonHTML runs twice per open
    // (once immediately, once when the audio manifest resolves) and the second
    // pass replaces the whole subtree — anything living only in the DOM would
    // vanish mid-conversation. Reset by openLesson when the lesson changes.
    const transcript = { index: null, turns: [] };

    function resetTranscript(index) {
      transcript.index = index;
      transcript.turns = [];
    }

    function paintTranscript() {
      if (typeof document === "undefined") return;
      const log = document.getElementById("lesson-chat-log");
      if (!log) return;
      log.textContent = "";
      for (const turn of transcript.turns) {
        const row = document.createElement("div");
        row.className = "chat-turn chat-turn-" + turn.who;
        const who = document.createElement("span");
        who.className = "chat-who";
        who.textContent = turn.who === "student" ? "You" : "Sage";
        const body = document.createElement("p");
        body.className = "chat-text";
        // textContent, never innerHTML: `turn.text` is student input on one
        // side and model output on the other, and neither is trusted markup.
        body.textContent = turn.text;
        row.appendChild(who);
        row.appendChild(body);
        log.appendChild(row);
      }
      log.scrollTop = log.scrollHeight;
    }

    // Wires the coaching UI rendered into the lesson HTML (see
    // renderLessonHTML, above) — the question form and the "how am I doing"
    // button both land in askCoachAbout(). Called after every DOM insertion of
    // the lesson HTML (the initial render and the later audio-manifest
    // re-render both replace these elements, so both call this again) rather
    // than once, so a stale/missing listener never silently ships.
    function wireCoachButton(index, profile) {
      if (typeof document === "undefined") return;

      if (transcript.index !== index) resetTranscript(index);
      paintTranscript();

      const btn = document.getElementById("lesson-ask-coach");
      const textEl = document.getElementById("lesson-coach-text");
      const form = document.getElementById("lesson-chat-form");
      const input = document.getElementById("lesson-chat-input");
      const sendBtn = document.getElementById("lesson-chat-send");

      if (btn) {
        btn.onclick = async function () {
          btn.disabled = true;
          if (textEl) textEl.textContent = "Thinking…";
          try {
            const result = await askCoachAbout({ index: index, learnerProfile: profile });
            if (textEl) textEl.textContent = (result && result.text) || DEFAULT_COACH_FALLBACK;
          } catch (e) {
            if (textEl) textEl.textContent = "Your coach is unavailable right now.";
          } finally {
            btn.disabled = false;
          }
        };
      }

      if (form && input) {
        form.onsubmit = async function (event) {
          event.preventDefault();
          const question = input.value.trim();
          if (!question) return;

          transcript.turns.push({ who: "student", text: question });
          transcript.turns.push({ who: "sage", text: "Thinking…" });
          const pending = transcript.turns[transcript.turns.length - 1];
          input.value = "";
          paintTranscript();

          input.disabled = true;
          if (sendBtn) sendBtn.disabled = true;
          try {
            const result = await askCoachAbout({ index: index, learnerProfile: profile, question: question });
            pending.text = (result && result.text) || DEFAULT_COACH_FALLBACK;
          } catch (e) {
            pending.text = "Your coach is unavailable right now.";
          } finally {
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            paintTranscript();
            // Focus back in the box so a follow-up question needs no clicking.
            if (typeof input.focus === "function") input.focus();
          }
        };
      }
    }

    function openLesson(index, learnerProfile) {
      if (!Number.isInteger(index) || index < 0 || index >= lessons.length) {
        throw new Error(`Lesson index out of range: ${index} (total: ${lessons.length})`);
      }

      const raw = lessons[index];

      // Validate before normalizing
      const validation = validateLesson(raw, index);
      if (!validation.valid) {
        const errorList = validation.errors.join("\n  - ");
        throw new Error(
          `Cannot open lesson ${index} - validation failed:\n  - ${errorList}`
        );
      }

      const profile = learnerProfile !== undefined ? learnerProfile : options.learnerProfile;
      const model = normalizeLesson(raw, index, profile);
      // Prefer passed audioManifest; fall back to manifestState.data if available
      const audioData = passedAudioManifest || manifestState.data;
      const html = renderLessonHTML(model, audioData);

      if (typeof options.render === "function") {
        options.render({ model, html });
      }
      wireCoachButton(index, profile);

      openIndex.value = index;

      // Audio manifest may still be in flight (T0.5). Re-render once it
      // resolves so audio elements appear without forcing a synchronous
      // fetch on every lesson open. A missing/failed manifest resolves to
      // {} and simply renders no audio elements - the lesson stays usable.
      // Skip this if we already have audio data (either passed or loaded).
      if (!audioData) {
        loadAudioManifest().then((data) => {
          if (openIndex.value !== index || typeof options.render !== "function") return;
          const updatedHtml = renderLessonHTML(model, data);
          options.render({ model, html: updatedHtml });
          // The re-render above replaced #lesson-ask-coach with a fresh,
          // unwired element (options.render does root.innerHTML = ...) — wire
          // it again so the coaching entry point survives the manifest swap.
          wireCoachButton(index, profile);
        });
      }

      return model;
    }

    function currentLesson() {
      if (openIndex.value == null) return null;
      return normalizeLesson(lessons[openIndex.value], openIndex.value, options.learnerProfile);
    }

    // --- T1.4: ask adaptivePlan for the next unit, instead of the caller
    // naively incrementing `openIndex`. Pure with respect to this runner's
    // own state (it only reads `lessons`); the planning decision itself
    // comes entirely from 07-app/core/adaptivePlan.js's planNextUnit(),
    // which is the single source of truth for "what's next" (Rule 5: this
    // runner never decides a musical/pedagogical fact itself).
    //
    // `progress` carries whatever real state the caller has:
    //   { learnerProfile, mastery, gateHistory, recentHistory, justHappened,
    //     isReinforcementLesson, unprovenLessonId }
    // All fields are optional — see the KNOWN GAP note below for which of
    // these nothing in the current app actually populates yet.
    //
    // Returns { plan, index } where `plan` is planNextUnit's raw result and
    // `index` is the resolved lesson-array index for `plan.lessonId` (or the
    // first id of `plan.lessonIds` for a 'chain' action), or null if that
    // lesson id isn't found in `lessons` (e.g. plan said 'hold'/'drill' and
    // stayed on the current lesson, or asked for a lesson past the catalog).
    async function planNext(currentIndex, progress) {
      const p = progress || {};
      const normalized = lessons.map((raw, i) => normalizeLesson(raw, i, p.learnerProfile || options.learnerProfile));
      const current = Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < normalized.length
        ? normalized[currentIndex]
        : null;
      const next = current ? normalized[currentIndex + 1] || null : null;
      const afterNext = current ? normalized[currentIndex + 2] || null : null;

      let planNextUnit;
      try {
        ({ planNextUnit } = await import("./adaptivePlan.js"));
      } catch (e) {
        // adaptivePlan.js unreachable (e.g. non-module environment) — hold
        // rather than guess a lesson id ourselves.
        return { plan: null, index: null };
      }

      const plan = planNextUnit({
        learnerProfile: p.learnerProfile || options.learnerProfile || {},
        currentLessonId: current ? current.lessonId : null,
        mastery: p.mastery || [],
        gateHistory: p.gateHistory || [],
        recentHistory: p.recentHistory || [],
        justHappened: p.justHappened || null,
        nextLessonId: next ? next.lessonId : null,
        isReinforcementLesson: !!p.isReinforcementLesson,
        lessonAfterNextId: afterNext ? afterNext.lessonId : null,
        unprovenLessonId: p.unprovenLessonId || null,
      });

      const targetId = plan.action === "chain" && Array.isArray(plan.lessonIds)
        ? plan.lessonIds[0]
        : plan.lessonId;
      const index = targetId != null
        ? normalized.findIndex((m) => m.lessonId === targetId)
        : -1;

      return { plan, index: index >= 0 ? index : null };
    }

    return { openLesson, currentLesson, normalizeLesson, validateLesson, planNext, askCoachAbout };
  }

  // Kick the manifest fetch off as early as possible so it has resolved by
  // the time a user opens a lesson (catalog load + a click take a while).
  if (typeof fetch === "function") {
    loadAudioManifest();
  }

  global.GuitarApp = global.GuitarApp || {};
  global.GuitarApp.LessonRunner = {
    createLessonRunner,
    normalizeLesson,
    validateLesson,
    renderLessonHTML,
    loadAudioManifest,
    mapProfileToVariant,
    resolveAvatarCopy,
  };
})(typeof window !== "undefined" ? window : this);
