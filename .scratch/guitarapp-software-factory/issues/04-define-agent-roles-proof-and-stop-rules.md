Type: grilling
Status: resolved
Blocked by: 03-lock-the-first-shippable-factory-slice

## Question

What exact roles, proof rules, approval boundaries, and stop conditions should Hermes use while building GuitarApp so autonomy stays useful and safe?

## Answer

Resolved with owner answers on 2026-09-02:
- Hermes should **stop only** for: money spend, legal risk, real-device human testing, or a major student-facing design fork.
- Hermes should **keep moving on everything else** inside the existing guardrails.
- **Every task requires a separate verifier pass**, even simple work.
- For student-facing work, the proof bundle must always include **all three**:
  1. gate output,
  2. visible walkthrough proof,
  3. reopen/save proof.
