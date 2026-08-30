'use strict';
/*
 * revenuecatStub.js — Step 7 external boundary (F12, Money).
 *
 * IN PRODUCTION this module calls the RevenueCat SDK (iOS StoreKit / Android
 * BillingClient) against the App Store / Play Store SANDBOX environments, then
 * writes the resulting entitlement onto the EntitlementStore. That requires
 * RevenueCat API keys + app-store sandbox credentials — NOT available in this
 * prototype. The owner must supply them at integration time.
 *
 * Prototype discipline (identical to Step 6 F6 SEND / F4 LLM): PROVE THE LOGIC,
 * STUB THE NETWORK. The stub returns a deterministic sandbox receipt and mutates
 * the EntitlementStore exactly the way a real adapter would, so the entitlement
 * math is fully verifiable browser-free. This file may make network calls when
 * wired for real; it is kept OUT of the Ban-5 scan that covers entitlementStore.js.
 *
 * DONE BAR integration point (from the plan): "a sandbox purchase grants full
 * access on both platforms; cancellation / re-subscribe paths work."
 */
const { EntitlementStore } = require('./entitlementStore.js');

function sandboxPurchase(store, platform = 'ios') {
  store.activateSandboxPurchase(platform);
  return { ok: true, sandbox: true, platform, receipt: 'sandbox_rcpt_' + platform + '_' + Date.now() };
}

function purchase(store, platform = 'ios', sandbox = false) {
  if (sandbox) return sandboxPurchase(store, platform);
  store.activatePurchase(platform);
  return { ok: true, sandbox: false, platform, receipt: 'rcpt_' + platform + '_' + Date.now() };
}

function cancel(store) {
  store.cancel();
  return { ok: true, state: 'free' };
}

function resubscribe(store, platform = 'ios') {
  store.resubscribe(platform);
  return { ok: true, state: 'premium' };
}

// A real restore queries the OS for an existing receipt and re-applies it.
// The stub has no OS receipt cache, so it reports the entitlement's current
// premium state (the only truth the prototype can assert). Integration wiring
// replaces this with a StoreKit/BillingClient restore call.
function restore(store) {
  const premium = store.isPremium();
  return { ok: true, premium };
}

module.exports = { sandboxPurchase, purchase, cancel, resubscribe, restore, EntitlementStore };
