// asset-job.test.mjs — proves the license gates for Flux (Amdt-07),
// Midjourney (Amdt-08) and video motion (Amdt-09) all enforce in code.
// Run: node test/asset-job.test.mjs
import { validateAssetJob, ALLOWED_IMAGE_MODELS, ALLOWED_VIDEO_MODELS } from '../core/asset-job.js';
import { readFileSync } from 'fs';

const T1 = JSON.parse(readFileSync(new URL('../content/teachers/T1.json', import.meta.url)));
const legal = JSON.parse(readFileSync(new URL('../content/teachers/T1.assetjob.json', import.meta.url)));

function clone(o) { return JSON.parse(JSON.stringify(o)); }

// 1) legal FLUX.1[schnell] image job passes
const r1 = validateAssetJob(legal, T1);
console.log('[1] legal schnell image job valid:', r1.valid, r1.errors);

// 2) ILLEGAL: dev model rejected (non-commercial, paid app)
const dev = clone(legal); dev.model = 'flux.1-dev';
const r2 = validateAssetJob(dev, T1);
console.log('[2] dev-model job rejected:', !r2.valid, '->', (r2.errors.find(e => /allowlist/.test(e)) || r2.errors));

// 3) ILLEGAL: on-device run rejected (12B > GTX 970 4GB)
const ondev = clone(legal); ondev.run = 'on-device';
const r3 = validateAssetJob(ondev, T1);
console.log('[3] on-device run rejected:', !r3.valid);

// 4) ILLEGAL: steps out of schnell bounds
const badsteps = clone(legal); badsteps.steps = 50;
const r4 = validateAssetJob(badsteps, T1);
console.log('[4] 50-step job rejected:', !r4.valid);

// 5) AMENDMENT-08: Midjourney (closed-source / ToS-forbids-RE) rejected
const mj = clone(legal); mj.model = 'midjourney-v7';
const r5 = validateAssetJob(mj, T1);
const mjRejected = !r5.valid && r5.errors.some(e => /BLOCKED vendor/.test(e));
console.log('[5] midjourney job rejected by vendor gate:', mjRejected, '->', (r5.errors.find(e => /BLOCKED vendor/.test(e)) || r5.errors));

// 6) AMENDMENT-09: legal Wan2.1-I2V video job passes
const vid = clone(legal);
vid.purpose = 'lesson_scene'; vid.model = 'wan2.1-i2v'; vid.fps = 24;
const r6 = validateAssetJob(vid, T1);
console.log('[6] legal wan2.1-i2v video job valid:', r6.valid, r6.errors);

// 7) AMENDMENT-09: SVD (LICENSE:other, non-commercial) video job rejected
const svd = clone(vid); svd.model = 'svd';
const r7 = validateAssetJob(svd, T1);
const svdRejected = !r7.valid && r7.errors.some(e => /video allowlist/.test(e));
console.log('[7] svd (LICENSE:other) video job rejected:', svdRejected, '->', (r7.errors.find(e => /video allowlist/.test(e)) || r7.errors));

// 8) regression guard: a legal video job does NOT trip the image allowlist (no false reject)
const notImageLeak = r6.valid && ALLOWED_IMAGE_MODELS.indexOf('wan2.1-i2v') === -1;
console.log('[8] video model not accidentally caught by image allowlist (no false reject):', notImageLeak);

const pass =
  r1.valid && !r2.valid && !r3.valid && !r4.valid &&
  mjRejected && r6.valid && svdRejected && notImageLeak;

console.log('\nRESULT:', pass ? 'PASS — all license gates enforced (Flux + Midjourney + video)' : 'FAIL');
console.log('  ALLOWED_IMAGE_MODELS =', JSON.stringify(ALLOWED_IMAGE_MODELS));
console.log('  ALLOWED_VIDEO_MODELS =', JSON.stringify(ALLOWED_VIDEO_MODELS));
process.exit(pass ? 0 : 1);
