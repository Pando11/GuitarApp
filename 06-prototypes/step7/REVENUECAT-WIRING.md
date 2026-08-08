# RevenueCat live wiring — everything is built EXCEPT the keys

**Status 2026-08-08:** `STEP-10-RC-BOUNDARY-OK` — 43/43 checks, run twice.
Gate: `cd 06-prototypes/step7 && node verify-step10-revenuecat.js`

## Why there is still a gap

Live RevenueCat requires keys only the account owner can mint. No key can be
fabricated here — a made-up key fails on the first call and would make the gate
lie. So the boundary was built and proven instead: **every line up to the key is
done and tested; the key is read from the environment at runtime.**

With no keys the app runs in `stub` mode (the proven Step 7 behaviour). It never
pretends a purchase succeeded.

## What was built

| File | Role |
|---|---|
| `revenuecatConfig.js` | Reads keys from `process.env`, validates their shape, decides live vs stub. No secrets in repo. |
| `revenuecatAdapter.js` | The only file that touches the network. Maps RevenueCat CustomerInfo → EntitlementStore. |
| `verify-step10-revenuecat.js` | 43-check DONE BAR. Live path proven with an injected fake `fetch`. |

`entitlementStore.js` was **not modified** — Hard Ban 5 (zero network in core) is
re-asserted by the gate.

## The 3 things you have to do

1. **RevenueCat dashboard** → create the project, add an iOS app and an Android app.
   Copy the two **public SDK keys** (`appl_…` and `goog_…`). *Not* the secret `sk_` key —
   the gate rejects a secret key on purpose, since shipping one in a client is a breach.
2. **App Store Connect**: create the $12/mo auto-renewing subscription + a Sandbox
   tester account. **Play Console**: create the matching subscription + a licence tester.
   Link both stores into RevenueCat.
3. **Entitlement**: name it `premium` (the default). Attach both store products to it.

## Then wiring is this

```bash
export RC_IOS_PUBLIC_KEY=appl_xxxxxxxxxxxxxxxxxxxx
export RC_ANDROID_PUBLIC_KEY=goog_xxxxxxxxxxxxxxxxxxxx
export RC_ENV=sandbox          # flip to production at launch
node verify-step10-revenuecat.js
```

Adapter switches itself to `live`. No code change.

```js
const { RevenueCatAdapter } = require('./revenuecatAdapter.js');
const rc = new RevenueCatAdapter();     // reads env, picks live or stub
await rc.purchase('ios', userId);
rc.store.isPremium();                   // drives every paywall decision
```

## What the gate proves without a key

- Junk / short / wrong-prefix / **secret** keys are all rejected.
- No keys → `stub`, and it says exactly which keys are missing.
- Expired entitlement → user drops to strict free (**L01 only**), not premium.
- Trial grants access **without** being counted as a paid sub (protects revenue maths).
- Sandbox receipts are flagged so test purchases never count as real revenue.
- A *different* entitlement id does not unlock premium.
- iOS restore uses the iOS key; Android restore uses the Android key.
- A rejected credential (401) **throws** — it never silently grants premium.
- Redaction: a key is never printed in full to logs.

## What it cannot prove

That Apple and Google actually grant the entitlement end-to-end. That needs a real
sandbox purchase on a device with your keys. It is the only remaining unknown, and
it is one command away once step 1–3 above are done.
