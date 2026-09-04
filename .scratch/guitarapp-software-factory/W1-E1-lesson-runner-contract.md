# W1-E1 lesson-runner contract (Wave 1)

Date: 2026-09-02

## Scope
Reusable runner for World 1 lesson payloads (lessons 1–5 now, scalable later).

## Input contract (raw lesson JSON)
Required top-level keys:
- `lesson` (object)
- `exercises` (array)

Allowed optional keys used by runner:
- `avatar_coaching_copy` (object)
- `chords` (object)

Required `lesson` fields:
- `id` (string)
- `title` (string)
- `estimated_minutes` (number)
- `one_line_promise` (string)
- `objectives` (string[])

Required `exercises[]` fields per step:
- `id` (string)
- `name` (string)
- `coaching` OR `purpose` (string)
- `params` (object)

## Normalized model emitted by runner
```json
{
  "lessonIndex": 0,
  "lessonNumber": 1,
  "lessonId": "L01-welcome-anatomy-tuning",
  "title": "Welcome, Anatomy & Tuning",
  "estimatedMinutes": 10,
  "oneLinePromise": "...",
  "objectives": ["..."],
  "avatarCopy": {},
  "steps": [
    {"id":"EX1-anatomy","name":"Meet the guitar","purpose":"...","coaching":"...","params":{}}
  ],
  "chords": {}
}
```

## Runner API
- `createLessonRunner({ lessons, render })`
- `openLesson(index) -> normalizedModel`
- `currentLesson() -> normalizedModel | null`
- `normalizeLesson(raw, lessonIndex)`
- `renderLessonHTML(normalizedModel) -> string`

## Wave-1 behavior
- First 5 lessons unlocked (`LESSON_UNLOCK_COUNT = 5`)
- Lessons 6+ stay disabled
- Any unlocked card opens via `openLesson(index)` (no hand-wired Lesson 1 path)

## Verified blocker discovered in W1-E1 discovery
`07-app/godot/` currently has no editable Godot source files (`project.godot`, `*.gd`, `*.tscn` were not found). Only imported cache files and one video clip were found.

Current bridge therefore runs through web shell (`07-app/index.html` + `07-app/core/lesson-runner.js`) until Godot source files are restored.
