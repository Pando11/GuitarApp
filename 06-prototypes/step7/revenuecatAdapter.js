'use strict';
/*
 * revenuecatAdapter.js — the ONE place F12 talks to RevenueCat.
 *
 * Selects live vs stub from the credential preflight, so the app code calls the
 * same five methods regardless. When keys are absent it degrades to the proven
 * stub instead of crashing or pretending a purchase happened.
 *
 * purchase / restore / cancel / resubscribe / startTrial all end by writing the
 * entitlement onto the EntitlementStore — that store stays pure (Hard Ban 5).
 *
 * The live path is deliberately thin: it maps a RevenueCat CustomerInfo payload
 * onto the store. On mobile the SDK supplies that payload; the HTTP fallback
 * here is the REST v1 subscriber endpoint, used for server-side verification.
 */

const stub = require('./revenuecatStub.js');
const { EntitlementStore } = require('./entitlementStore.js');
const { preflight, redact } = require('./revenuecatConfig.js');

const REST_BASE = 'https://api.revenuecat.com/v1';

/**
 * Map a RevenueCat CustomerInfo-shaped object onto the entitlement store.
 * Pure function of its inputs — this is the part that must be right, and it is
 * fully testable without any credential.
 */
function applyCustomerInfo(store, customerInfo, entitlementId, now = Date.now()) {
  const ents = (customerInfo && (customerInfo.entitlements || {})) || {};
  const active = ents.active || {};
  const ent = active[entitlementId];
  if (!ent) {
    store.cancel();
    return { premium: false, reason: 'entitlement "' + entitlementId + '" not active' };
  }
  const expiresMs = ent.expires_date ? Date.parse(ent.expires_date) : null;
  if (expiresMs !== null && !Number.isNaN(expiresMs) && expiresMs <= now) {
    store.cancel();
    return { premium: false, reason: 'entitlement expired' };
  }
  const platform = /play_store|google/i.test(ent.store || '') ? 'android' : 'ios';
  const isTrial = ent.period_type === 'trial' || ent.period_type === 'TRIAL';
  if (isTrial) {
    store.trialActive = true;
    store.subscriptionActive = false;
    store.trialExpiry = expiresMs || (now + 7 * 86400000);
    store.platform = platform;
  } else {
    store.activatePurchase(platform);
  }
  store.sandbox = !!ent.is_sandbox;
  return { premium: store.isPremium(now), platform, trial: isTrial, expiresMs };
}

class RevenueCatAdapter {
  constructor(opts) {
    const o = opts || {};
    this.pre = o.preflight || preflight(o.env);
    this.store = o.store || new EntitlementStore();
    this.entitlementId = this.pre.config.entitlementId;
    this.fetchImpl = o.fetch || (typeof fetch === 'function' ? fetch : null);
  }

  get mode() { return this.pre.live && this.fetchImpl ? 'live' : 'stub'; }

  status() {
    return {
      mode: this.mode,
      rcEnv: this.pre.config.rcEnv,
      entitlementId: this.entitlementId,
      problems: this.pre.problems,
      iosKey: redact(this.pre.config.iosKey),
      androidKey: redact(this.pre.config.androidKey),
    };
  }

  /** Live: fetch subscriber from REST and apply. Stub: deterministic sandbox receipt. */
  async purchase(platform = 'ios', appUserId = null) {
    if (this.mode === 'stub') {
      return Object.assign(stub.sandboxPurchase(this.store, platform), { mode: 'stub' });
    }
    const info = await this._getSubscriber(appUserId, platform);
    const applied = applyCustomerInfo(this.store, info, this.entitlementId);
    return { ok: applied.premium, mode: 'live', platform, applied };
  }

  async restore(appUserId = null, platform = 'ios') {
    if (this.mode === 'stub') return Object.assign(stub.restore(this.store), { mode: 'stub' });
    const info = await this._getSubscriber(appUserId, platform);
    const applied = applyCustomerInfo(this.store, info, this.entitlementId);
    return { ok: true, mode: 'live', premium: applied.premium, applied };
  }

  cancel() { return Object.assign(stub.cancel(this.store), { mode: this.mode }); }
  resubscribe(platform = 'ios') { return Object.assign(stub.resubscribe(this.store, platform), { mode: this.mode }); }
  startTrial(days = 7) { this.store.startTrial(days); return { ok: true, mode: this.mode, trial: true }; }

  async _getSubscriber(appUserId, platform) {
    const key = platform === 'android' ? this.pre.config.androidKey : this.pre.config.iosKey;
    const id = encodeURIComponent(appUserId || 'anonymous');
    const res = await this.fetchImpl(REST_BASE + '/subscribers/' + id, {
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('RevenueCat REST ' + res.status);
    const body = await res.json();
    return body.subscriber || body;
  }
}

module.exports = { RevenueCatAdapter, applyCustomerInfo, REST_BASE };
