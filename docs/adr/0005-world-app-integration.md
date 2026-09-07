# ADR-0005 — World-App Integration Strategy

**Status:** Decided (2026-09-07)  
**Decision:** Option C — Keep separate; ship web app first

---

## The Question

The repo now has two parallel front-ends:

- **The web app** (`07-app/`) — all 25 lessons, practice drills, tuner, adaptive coaching. Runs in a browser. All tests passing, ready to ship.
- **The Godot world** (`07-app/godot/`) — Emerald Hollow, Sage, video cutscenes. Runs locally in Godot. Story-shell for the app per ADR-0004.

They do not yet talk to each other. Three integration strategies are possible:

| Option | Approach | Cost | Risk | Timeline |
|--------|----------|------|------|----------|
| **A** | Godot wraps everything | Very high | High | 2-3 months |
| **B** | Web app stays; world exports to HTML5, cold open as front door, then hand off | Medium | Medium | 1 month |
| **C** | Keep both separate; ship web app publicly; world is local development focus | Low | Low | 1-2 weeks |

## Decision: Option C

**Ship the web app first. The world stays local and in development.**

### Why

1. **Tier 0 exit check blocks everything downstream.** It requires 5 real users. A deployed web app is the only thing that will get you those users. Unifying runtimes first burns time on a problem that isn't the blocker.

2. **Zero users → zero feedback.** You have 0 of 5 test users. Spending 2–3 months on Option A (Godot wraps all) without any user data is high risk.

3. **Option B stays available.** Nothing in Wave 5 forecloses Option B — the world branch isn't harmed, Godot's export pipeline is still buildable, and the handoff point (cold open → web app) is already clear.

4. **Unblock Wave 5.** Deploy the web app to GitHub Pages immediately. Get it in front of people. Collect feedback.

### Consequences

- The app and the world ship as two separate experiences for now.
- A user who finishes the web app's lessons does not immediately see Emerald Hollow.
- The Godot world is the thing the team works on *between* product cycles, not the live product students see today.
- If user feedback says "we want the world," pivot to Option B (world as front door) once you have real demand signal.

### When to Revisit

Revisit this decision when:
- The web app has 50+ active users and retention data shows where they drop off
- The Godot world MVP (W3.2 onward) is functional and you've validated the story resonates
- You're planning the launch of Tier 2 (accounts, payments)

---

## Next Steps

1. ✅ Wave 4 decided → Option C
2. → Wave 5.1: Deploy to GitHub Pages (O.3 must be done first)
3. → Wave 5.2: Remove duplicate assets
4. → Wave 5.3: Get 5 test users on the live URL
5. → Then Tier 2 (accounts, payments) once Tier 0 is shipped
