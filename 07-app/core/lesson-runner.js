// lesson-runner.js
// Reusable lesson runner for Emerald Hollow lesson JSON.
// Contract target: lesson + exercises -> normalized model + HTML render.

(function (global) {
  "use strict";

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeLesson(raw, lessonIndex) {
    const lesson = (raw && raw.lesson) || {};
    const exercises = asArray(raw && raw.exercises);

    const model = {
      lessonIndex,
      lessonNumber: lessonIndex + 1,
      lessonId: lesson.id || "",
      title: lesson.title || `Lesson ${String(lessonIndex + 1).padStart(2, "0")}`,
      estimatedMinutes: Number(lesson.estimated_minutes || 10),
      oneLinePromise: lesson.one_line_promise || "",
      objectives: asArray(lesson.objectives).map(String),
      appFeatureMapping: (lesson && lesson.app_feature_mapping) || {},
      avatarCopy: (raw && raw.avatar_coaching_copy) || {},
      steps: exercises.map((exercise, i) => ({
        id: exercise && exercise.id ? exercise.id : `step-${i + 1}`,
        name: exercise && exercise.name ? exercise.name : `Step ${i + 1}`,
        purpose: exercise && exercise.purpose ? exercise.purpose : "",
        coaching: exercise && exercise.coaching ? exercise.coaching : "",
        params: (exercise && exercise.params) || {},
      })),
      chords: (raw && raw.chords) || {},
    };

    return model;
  }

  function esc(value) {
    const node = document.createElement("span");
    node.textContent = String(value == null ? "" : value);
    return node.innerHTML;
  }

  function renderLessonHTML(model) {
    return [
      `<div class="lesson-intro">`,
      `<div class="eyebrow">Lesson ${String(model.lessonNumber).padStart(2, "0")}</div>`,
      `<h1 id="lesson-title">${esc(model.title)}</h1>`,
      `<p>${esc(model.oneLinePromise)}</p>`,
      `<h3>By the end</h3>`,
      `<ul class="objectives">${model.objectives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`,
      `</div>`,
      `<div class="steps">${model.steps
        .map(
          (step, i) =>
            `<section class="step"><span class="lesson-number">Step ${i + 1}</span><h3>${esc(step.name)}</h3><p>${esc(
              step.coaching || step.purpose
            )}</p></section>`
        )
        .join("")}</div>`,
    ].join("");
  }

  function createLessonRunner(opts) {
    const options = opts || {};
    const lessons = asArray(options.lessons);
    const openIndex = { value: null };

    function openLesson(index) {
      if (!Number.isInteger(index) || index < 0 || index >= lessons.length) {
        throw new Error(`Lesson index out of range: ${index}`);
      }

      const raw = lessons[index];
      const model = normalizeLesson(raw, index);
      const html = renderLessonHTML(model);

      if (typeof options.render === "function") {
        options.render({ model, html });
      }

      openIndex.value = index;
      return model;
    }

    function currentLesson() {
      if (openIndex.value == null) return null;
      return normalizeLesson(lessons[openIndex.value], openIndex.value);
    }

    return { openLesson, currentLesson, normalizeLesson };
  }

  global.GuitarApp = global.GuitarApp || {};
  global.GuitarApp.LessonRunner = {
    createLessonRunner,
    normalizeLesson,
    renderLessonHTML,
  };
})(typeof window !== "undefined" ? window : this);
