// dogfood.js — LOCAL, labeled free-unlock flag. Never touches the production
// entitlement engine (core/entitlementStore.js). Opt in with ?dogfood=1.
const KEY = 'guitarapp.dogfood';

export function isDogfood() {
  try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
}
export function setDogfood(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
}
export function toggleDogfood() {
  const n = !isDogfood();
  setDogfood(n);
  return n;
}
