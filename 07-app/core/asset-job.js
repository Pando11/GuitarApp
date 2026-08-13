// asset-job.js — AMENDMENT-07 enforcement.
// Reverse-engineered Flux (schnell, Apache-2.0) is the ONLY legal image generator
// in the paid GuitarApp. This validator is a hard ship gate: any AssetJob that
// references a non-commercial Flux variant (dev/kontext/fill/redux/krea) or runs
// on-device is rejected. Mirrors teacher.js: license + invariant enforcement, not prose.

// Allowlist = Apache-2.0 only (verified from cloned model_cards/).
// FLUX.1 [dev], kontext-dev, krea-dev, flux-dev-fill, redux = NON-COMMERCIAL => BLOCKED.
export const ALLOWED_IMAGE_MODELS = ['flux.1-schnell', 'qwen-image'];

// AMENDMENT-09: VIDEO MOTION allowlist. Verified via GitHub/HF API this session:
//   Wan2.1-I2V = Apache-2.0 (Wan-Video/Wan2.1 GitHub license API: "Apache License 2.0";
//                Wan-AI/Wan2.1-I2V-14B-480P HF cardData license = apache-2.0). Commercial-clean.
//   SVD (Stable Video Diffusion) = license:other (OpenRAIL-M-class) => BLOCKED, same as FLUX dev.
//   LTX-Video / HunyuanVideo / CogVideoX = license "other" => UNVERIFIED, blocked until LICENSE read.
export const ALLOWED_VIDEO_MODELS = ['wan2.1-i2v'];

// AMENDMENT-08: vendors that are contractually/legally non-adoptable in a paid app.
// midjourney = closed-source + ToS forbids RE/competitive research + no embed license.
// Any AssetJob.model referencing a blocked vendor is rejected (mirrors FLUX gate).
export const BLOCKED_VENDORS = ['midjourney'];

// AMENDMENT-09: STORY-ENGINE backbone (the "game-like" layer, whole app, not teacher-only).
// Godot (MIT, v4.7.1-stable, exports iOS/Android/Web) is the chosen shell.
// Ink (MIT) considered but dropped: story-logic only, needs a separate renderer; its JS
// runtime (inkjs) is stale (last push 2022) — a dead embed dependency.
export const STORY_ENGINE = 'godot';
export const STORY_ENGINE_LICENSE = 'MIT';


// Reuse the teacher hard invariant: a teacher/asset file must NEVER carry lesson content.
export const FORBIDDEN_TEACHER_KEYS = ['chords', 'chord', 'exercises', 'lesson', 'frets', 'fingers', 'scenes', 'caption', 'captions', 'tempoBpm', 'beats', 'qa_block'];

function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function scanForbidden(node, trail, errors) {
  if (Array.isArray(node)) { node.forEach(function (v, i) { scanForbidden(v, trail + '[' + i + ']', errors); }); return; }
  if (!isObj(node)) return;
  Object.keys(node).forEach(function (k) {
    // Mirror teacher.js: persona_lines holds SCENE-KIND labels (intro/chord/exercise/wrap)
    // which are cosmetic speaker lines, NOT lesson-content chords. Skip that subtree.
    if (trail === 'teacher' && k === 'persona_lines') return;
    if (FORBIDDEN_TEACHER_KEYS.indexOf(k) !== -1) errors.push('AssetJob references lesson-content key "' + k + '" at ' + trail + '.' + k);
    scanForbidden(node[k], trail + '.' + k, errors);
  });
}

export function validateAssetJob(job, teacherRef) {
  const errors = [];
  if (!isObj(job)) return { valid: false, errors: ['AssetJob is not an object'] };
  if (typeof job.id !== 'string' || !job.id.length) errors.push('AssetJob.id missing');
  if (typeof job.teacherId !== 'string' || !job.teacherId.length) errors.push('AssetJob.teacherId missing (must link to a cosmetic teacher)');

  // AMENDMENT-09: a job is a VIDEO job iff its purpose is a motion purpose.
  const VIDEO_PURPOSES = ['lesson_scene', 'promo_clip', 'ambient_loop'];
  const isVideo = VIDEO_PURPOSES.indexOf(job.purpose) !== -1;

  const IMAGE_PURPOSES = ['teacher_still', 'lesson_thumb', 'promo'];
  if (!isVideo && IMAGE_PURPOSES.indexOf(job.purpose) === -1)
    errors.push('AssetJob.purpose must be teacher_still|lesson_thumb|promo (image) or lesson_scene|promo_clip|ambient_loop (video)');

  // LICENSE GATE — image vs video allowlist (COPYRIGHT LAW, survives AMENDMENT-06)
  if (isVideo) {
    if (ALLOWED_VIDEO_MODELS.indexOf(job.model) === -1)
      errors.push('AssetJob.model "' + job.model + '" not on the Apache-2.0 video allowlist (SVD=LICENSE:other blocked; LTX/Hunyuan/CogVideoX=other UNVERIFIED)');
  } else {
    if (ALLOWED_IMAGE_MODELS.indexOf(job.model) === -1)
      errors.push('AssetJob.model "' + job.model + '" is NOT on the Apache-2.0 allowlist (dev/kontext/fill/redux/krea are non-commercial => illegal in paid app)');
  }

  // AMENDMENT-08 vendor gate: closed-source / ToS-forbidden / no embed license (e.g. midjourney)
  const blocked = BLOCKED_VENDORS.filter(function (v) { return String(job.model).toLowerCase().indexOf(v) !== -1; });
  if (blocked.length)
    errors.push('AssetJob.model "' + job.model + '" references BLOCKED vendor [' + blocked.join(',') + '] (closed-source / ToS forbids RE+competitive research / no commercial-embed license)');
  if (job.fallbackModel && ALLOWED_IMAGE_MODELS.indexOf(job.fallbackModel) === -1)
    errors.push('AssetJob.fallbackModel "' + job.fallbackModel + '" not on image allowlist');

  // schnell config bounds (image jobs only; from reverse-engineered architecture)
  if (!isVideo) {
    if (typeof job.steps !== 'number' || job.steps < 1 || job.steps > 4)
      errors.push('AssetJob.steps must be 1-4 for flux.1-schnell (guidance-distilled LADD)');
    if (job.shift !== false) errors.push('AssetJob.shift must be false for flux.1-schnell');
    if (typeof job.guidance !== 'number' || job.guidance !== 0.0) errors.push('AssetJob.guidance must be 0.0 for flux.1-schnell');
    if (job.t5MaxLength !== 256) errors.push('AssetJob.t5MaxLength must be 256 for flux.1-schnell (dev=512, fill=128)');
  }

  // NEVER on-device: heavy models > GTX 970 4GB. Video = 14B Wan2.1 on cloud GPU worker.
  if (job.run !== 'cloud-gpu-worker') errors.push('AssetJob.run must be "cloud-gpu-worker" (never on-device)');

  // AMENDMENT-09: VIDEO MOTION job-specific bounds
  if (isVideo) {
    if (typeof job.fps !== 'number' || job.fps < 8 || job.fps > 30) errors.push('Video AssetJob.fps must be 8-30');
  }

  if (!isObj(job.conditioning)) errors.push('AssetJob.conditioning missing (structured char JSON, not free text)');
  else {
    if (typeof job.conditioning.characterJsonRef !== 'string') errors.push('AssetJob.conditioning.characterJsonRef missing');
    if (typeof job.conditioning.styleAnchor !== 'string') errors.push('AssetJob.conditioning.styleAnchor missing (keeps teacher art consistent)');
  }
  if (typeof job.output !== 'string' || !job.output.length) errors.push('AssetJob.output missing (flux still -> TalkingHead/RPM source)');

  // Enforce teacher.js invariant on the referenced teacher file
  if (teacherRef) scanForbidden(teacherRef, 'teacher', errors);

  return { valid: errors.length === 0, errors };
}

// Tally of the reverse-engineered Flux arch (for documentation / future tuning), not enforced:
export const FLUX_ARCH = {
  inChannels: 64, doubleBlocks: 19, singleBlocks: 38, heads: 24,
  headDim: 128, innerDim: 3072, jointAttnDim: 4096, pooledProjDim: 768,
  axesDimsRope: [16, 56, 56], guidanceEmbeds: false
};
