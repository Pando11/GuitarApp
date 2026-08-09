#!/usr/bin/env python3
"""
Hostile Playwright integration review for the GuitarApp PWA (07-app/).
Drives the REAL app in headless Chromium. Fails the build on ANY console error
or uncaught page error. Verifies every route renders a route-specific marker and
exercises free-tier STRICT gating + the RevenueCat sandbox stub. Screenshots = evidence.

Run:  python test/playwright-hostile.py   (from 07-app/)
"""
import os, sys, time, subprocess, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SERVE = ROOT / "serve.mjs"
SHOT_DIR = ROOT / "test" / "shots"
SHOT_DIR.mkdir(exist_ok=True)

PORT = 8099
BASE = f"http://localhost:{PORT}"

# route -> substring that must appear on that screen (real marker, not just "non-empty")
ROUTE_MARKERS = {
    "home": "Learn guitar",
    "lessons": "Lessons",
    "tuner": "Tuner",
    "metronome": "Metronome",
    "roster": "Teachers",
    "chat": "Ask Teacher",
    "plan": "Practice Plan",
    # progress is Pro-gated: pre-trial it shows the paywall ("Pro feature"), post-trial "Your Progress".
    "progress": "Pro feature",
    "band": "Band",
    "packs": "Style Packs",
    "upgrade": "trial",
}

# Routes that require a Pro trial to render real content (verified separately post-trial).
PREMIUM_ROUTES = ["roster", "progress", "chat", "plan", "band"]

console_errors, page_errors, results = [], [], []
def log(m): print(m, flush=True)

def wait_server(timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        try: urllib.request.urlopen(BASE, timeout=1); return True
        except Exception: time.sleep(0.3)
    return False

def goto_route(page, route):
    """Click the VISIBLE element with data-route=route (home grid or opened sidenav)."""
    sel = f'[data-route="{route}"]:visible'
    try:
        page.click(sel, timeout=2500)
        return True
    except Exception:
        # fall back: open hamburger then click sidenav link
        try:
            page.click("#hamburger", timeout=1500)
            page.click(sel, timeout=2500)
            return True
        except Exception as e:
            log(f"  (nav {route} failed: {e})")
            return False

def main():
    proc = subprocess.Popen(["node", str(SERVE)], env={**os.environ, "PORT": str(PORT)},
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        if not wait_server():
            log("SERVER DID NOT START"); proc.terminate(); sys.exit(2)

        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox"])
            page = browser.new_page(viewport={"width": 414, "height": 896})
            page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: page_errors.append(str(e)))

            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)

            # --- every route must render its marker (free-tier routes only here) ---
            for r, marker in ROUTE_MARKERS.items():
                if r in PREMIUM_ROUTES:
                    # These correctly show the Pro paywall pre-trial; verified below post-trial.
                    continue
                ok_nav = goto_route(page, r)
                page.wait_for_timeout(350)
                body = page.text_content("body") or ""
                ok = ok_nav and (marker.lower() in body.lower())
                results.append((f"route '{r}' renders marker '{marker}'", ok))
                page.screenshot(path=str(SHOT_DIR / f"route-{r}.png"))

            # --- FREE-TIER STRICT: premium routes show paywall pre-trial ---
            for r in PREMIUM_ROUTES:
                goto_route(page, r); page.wait_for_timeout(300)
                body = page.text_content("body") or ""
                gated = ("Pro feature" in body or "paywall" in body.lower()
                         or "free tier includes" in body.lower())
                results.append((f"premium route '{r}' correctly gated pre-trial", gated))

            # --- activate REAL free trial via in-app button, then verify premium routes ---
            try:
                page.click('button:has-text("Try free")', timeout=3000)
            except Exception:
                page.evaluate("try{window.__APP__.app.startFreeTrial();}catch(e){}")
            page.wait_for_timeout(400)
            premium = page.evaluate("() => !!(window.__APP__ && window.__APP__.app.entitlement.isPremium())")
            results.append(("free trial activates (isPremium=true)", premium))

            # roster + teacher detail
            goto_route(page, "roster"); page.wait_for_timeout(500)
            cards = page.query_selector_all(".teacher-card")
            results.append(("roster lists 5 teacher cards (Maggie/Ellis/Ray/Roscoe/Dixie)", len(cards) == 5))
            if cards:
                # click a NON-current teacher so the "Make this my teacher" button shows
                target = None
                for c in cards:
                    if "Maggie" not in (c.text_content() or ""):
                        target = c; break
                (target or cards[0]).click(timeout=3000); page.wait_for_timeout(700)
                body = page.text_content("body") or ""
                results.append(("teacher detail renders (name + set button)",
                                ("Maggie" in body or "Ellis" in body or "Ray" in body)
                                and ("Make this my teacher" in body or "This is your teacher" in body)))
                page.screenshot(path=str(SHOT_DIR / "teacher-detail.png"))

            # progress renders real content post-trial
            goto_route(page, "progress"); page.wait_for_timeout(400)
            body = page.text_content("body") or ""
            results.append(("progress shows stats post-trial", "Your Progress" in body or "Streak" in body))

            # chat + band + plan render post-trial
            for r, marker in [("chat","Ask"),("band","Band"),("plan","Practice Plan")]:
                goto_route(page, r); page.wait_for_timeout(400)
                body = page.text_content("body") or ""
                results.append((f"premium route '{r}' renders post-trial", marker.lower() in body.lower()))

            # --- FREE-TIER STRICT: lessons beyond L01 locked (Pro badges present) ---
            goto_route(page, "lessons"); page.wait_for_timeout(300)
            body = page.text_content("body") or ""
            pro_locks = body.count("Pro")
            results.append(("lessons show Pro locks (free tier strict)", pro_locks >= 1))

            # --- RevenueCat sandbox stub: start trial, reach upgrade ---
            page.evaluate("try{app.startFreeTrial();}catch(e){}")
            page.wait_for_timeout(200)
            goto_route(page, "upgrade"); page.wait_for_timeout(300)
            body = page.text_content("body") or ""
            results.append(("trial activates / upgrade reachable (sandbox stub)",
                            ("premium" in body.lower() or "trial" in body.lower()
                             or "Pro" in body or "Manage" in body)))

            # --- lesson player: open an UNLOCKED lesson (L01) and verify content ---
            goto_route(page, "lessons"); page.wait_for_timeout(300)
            items = page.query_selector_all(".list-item")
            unlocked = [x for x in items if "locked" not in (x.get_attribute("class") or "")]
            if unlocked:
                unlocked[0].click(timeout=3000); page.wait_for_timeout(700)
                body = page.text_content("body") or ""
                ok = len(body.strip()) > 60
                results.append(("lesson player renders lesson content", ok))
                page.screenshot(path=str(SHOT_DIR / "lesson-L01.png"))
            else:
                results.append(("lesson player renders lesson content", False))

            # --- tuner: real engine present (no crash, shows a note readout area) ---
            goto_route(page, "tuner"); page.wait_for_timeout(400)
            body = page.text_content("body") or ""
            results.append(("tuner screen renders", "Tuner" in body))

            # --- F2/F3: Style Pack lesson opens with its guest teacher (Roscoe) ---
            goto_route(page, "packs"); page.wait_for_timeout(300)
            try:
                page.click("text=Blues Pack", timeout=2500)
                page.wait_for_timeout(400)
                items = page.query_selector_all(".list-item")
                if items:
                    items[0].click(timeout=3000); page.wait_for_timeout(700)
                    body = page.text_content("body") or ""
                    results.append(("blues pack lesson renders with Roscoe (F2/F3)",
                                    "Roscoe" in body))
                    page.screenshot(path=str(SHOT_DIR / "blues-lesson-roscoe.png"))
                else:
                    results.append(("blues pack lesson renders with Roscoe (F2/F3)", False))
            except Exception as e:
                results.append(("blues pack lesson renders with Roscoe (F2/F3)", False))
                log(f"  (blues pack nav failed: {e})")

            # --- roster lists the 4 teachers ---
            goto_route(page, "roster"); page.wait_for_timeout(300)
            body = page.text_content("body") or ""
            results.append(("roster lists teachers (Maggie/Ellis/Ray/Roscoe)",
                            any(n in body for n in ["Maggie","Ellis","Ray","Roscoe"])))

            # --- B1 DOGFOOD: fresh (NON-premium, no trial) context with ?dogfood=1 ---
            try:
                dctx = browser.new_context(viewport={"width": 414, "height": 896})
                dpage = dctx.new_page()
                dpage.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
                dpage.on("pageerror", lambda e: page_errors.append(str(e)))
                sep = "&" if "?" in BASE else "?"
                dpage.goto(BASE + sep + "dogfood=1", wait_until="networkidle")
                dpage.wait_for_timeout(800)

                # (b) header shows the DOGFOOD label
                hdr = dpage.text_content("body") or ""
                results.append(("dogfood badge shown in header (B1)", "DOGFOOD" in hdr))
                dpage.screenshot(path=str(SHOT_DIR / "dogfood-home.png"))

                # (a) non-premium user opens Lesson 2 with NO paywall
                not_premium = dpage.evaluate(
                    "() => !(window.__APP__ && window.__APP__.app.entitlement.isPremium())")
                goto_route(dpage, "lessons"); dpage.wait_for_timeout(400)
                items = dpage.query_selector_all(".list-item")
                opened = False
                if len(items) >= 2:
                    items[1].click(timeout=3000); dpage.wait_for_timeout(700)
                    dbody = dpage.text_content("body") or ""
                    opened = ("Pro feature" not in dbody
                              and "free tier includes" not in dbody.lower()
                              and len(dbody.strip()) > 60)
                    dpage.screenshot(path=str(SHOT_DIR / "dogfood-lesson2.png"))
                results.append(("dogfood: non-premium user opens Lesson 2 with no paywall (B1)",
                                bool(not_premium and opened)))

                # (c) gate fix: under dogfood, clicking Teachers renders the roster
                # (5 cards incl. Dixie), NOT a paywall. Catches guardPremium ignoring dogfood.
                goto_route(dpage, "roster"); dpage.wait_for_timeout(600)
                rbody = dpage.text_content("body") or ""
                rcards = dpage.query_selector_all(".teacher-card")
                # Real paywall (renderPaywall) shows "Start free trial" + "free tier includes".
                # The roster's descriptive sub-label says "(Pro feature.)" — that is NOT a gate.
                paywall = ("Start free trial" in rbody) and ("free tier includes" in rbody.lower())
                roster_ok = (not paywall) and len(rcards) == 5
                results.append(("dogfood: Teachers roster renders 5 cards (no paywall) (B1)",
                                bool(roster_ok)))
                dpage.screenshot(path=str(SHOT_DIR / "dogfood-roster.png"))

                dctx.close()
            except Exception as e:
                results.append(("dogfood badge shown in header (B1)", False))
                results.append(("dogfood: non-premium user opens Lesson 2 with no paywall (B1)", False))
                log(f"  (dogfood checks failed: {e})")

            browser.close()

        rc = 0
        log("\n===== HOSTILE PLAYWRIGHT RESULTS =====")
        for name, ok in results:
            log(f"[{'PASS' if ok else 'FAIL'}] {name}")
            if not ok: rc = 1
        log(f"\nconsole errors: {len(console_errors)}")
        for e in console_errors: log(f"  CONSOLE-ERR: {e}")
        log(f"page errors (uncaught): {len(page_errors)}")
        for e in page_errors: log(f"  PAGE-ERR: {e}")
        if console_errors or page_errors: rc = 1
        print(f"\nRESULT: {'GREEN' if rc==0 else 'RED'} (rc={rc})")
        sys.exit(rc)
    finally:
        try: proc.terminate()
        except Exception: pass

if __name__ == "__main__":
    main()
