// storage.js — local persistence for the practice store + entitlement + settings.
// Ban 5: everything stays on-device (localStorage). No network. Drop-in RevenueCat
// later writes only to the EntitlementStore (external boundary, stubbed here).

import { PracticeStore } from '../core/practiceStore.js';
import { EntitlementStore } from '../core/entitlementStore.js';

const KEY = 'guitarapp.v1';

export class AppState {
  constructor() {
    this.store = new PracticeStore();
    this.entitlement = new EntitlementStore();
    this.settings = { currentTeacherId: 'T1', lastBpm: 80 };
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.store) this.store = PracticeStore.fromJSON(data.store);
      if (data.entitlement) this.entitlement = EntitlementStore.fromJSON(data.entitlement);
      if (data.settings) this.settings = Object.assign(this.settings, data.settings);
      if (data.store && data.store.currentTeacherId) this.store.setTeacher(data.store.currentTeacherId);
    } catch (e) { console.warn('state load failed', e); }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        store: this.store.toJSON(),
        entitlement: this.entitlement.toJSON(),
        settings: this.settings
      }));
    } catch (e) { console.warn('state save failed', e); }
  }

  // ---- RevenueCat drop-in hook (owner-blocked on keys) ----
  // When keys exist, the RC adapter calls these instead of the sandbox stubs.
  attachRevenueCatAdapter(adapter) {
    this._rc = adapter;
  }
  async purchase() {
    if (this._rc) { const r = await this._rc.purchase(); if (r.ok) this.entitlement.activatePurchase(r.platform); }
    else { this.entitlement.activateSandboxPurchase('ios'); } // sandbox stub until keys
    this.save();
    return this.entitlement.isPremium();
  }
  startFreeTrial(days = 7) { this.entitlement.startTrial(days); this.save(); return this.entitlement.isPremium(); }
  cancel() { this.entitlement.cancel(); this.save(); }
}
