// lesson-runner.js
// Reusable lesson runner for Emerald Hollow lesson JSON.
// Contract target: lesson + exercises -> normalized model + HTML render.

(function (global) {
  "use strict";

  function asArray(value) {
    return Array.isArray(value) ? value : [];
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
  function normalizeLesson(raw, lessonIndex) {
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
    const avatarCopy =
      raw && typeof raw.avatar_coaching_copy === "object" && raw.avatar_coaching_copy !== null
        ? raw.avatar_coaching_copy
        : {};
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
    ].join("");
  }

  /**
   * Creates a lesson runner instance that manages lesson lifecycle.
   * @param {Object} opts - Configuration options
   * @param {Array} opts.lessons - Array of raw lesson data objects
   * @param {Function} opts.render - Callback when lesson is opened
   * @param {boolean} opts.strict - If true, throw on validation errors (default: true)
   * @returns {Object} Runner with methods to open and fetch lessons
   */
  function createLessonRunner(opts) {
    const options = opts || {};
    const lessons = asArray(options.lessons);
    const openIndex = { value: null };
    const strict = options.strict !== false; // Default to strict mode

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

    function openLesson(index) {
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

      const model = normalizeLesson(raw, index);
      const html = renderLessonHTML(model, manifestState.data);

      if (typeof options.render === "function") {
        options.render({ model, html });
      }

      openIndex.value = index;

      // Audio manifest may still be in flight (T0.5). Re-render once it
      // resolves so audio elements appear without forcing a synchronous
      // fetch on every lesson open. A missing/failed manifest resolves to
      // {} and simply renders no audio elements - the lesson stays usable.
      if (!manifestState.data) {
        loadAudioManifest().then((data) => {
          if (openIndex.value !== index || typeof options.render !== "function") return;
          const updatedHtml = renderLessonHTML(model, data);
          options.render({ model, html: updatedHtml });
        });
      }

      return model;
    }

    function currentLesson() {
      if (openIndex.value == null) return null;
      return normalizeLesson(lessons[openIndex.value], openIndex.value);
    }

    return { openLesson, currentLesson, normalizeLesson, validateLesson };
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
  };
})(typeof window !== "undefined" ? window : this);
