// feedback.js — local, server-free, account-free feedback store.
// Ban 5: zero network calls. Everything persists to localStorage on the device.
// Usable via: <script src="lib/feedback.js"></script> -> window.GuitarFeedback
// (No ESM export so it also works as a plain script under file:// and serve.mjs.)
// Dependency-free.

const KEY = 'guitarapp.feedback';

function addFeedback(rec) {
  const a = JSON.parse(localStorage.getItem(KEY) || '[]');
  a.push(Object.assign({ ts: Date.now() }, rec));
  localStorage.setItem(KEY, JSON.stringify(a));
  return a.length;
}

function allFeedback() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

// Expose on window for classic <script> usage (no-op under Node where window is undefined).
if (typeof window !== 'undefined') {
  window.GuitarFeedback = { addFeedback, allFeedback };
}
