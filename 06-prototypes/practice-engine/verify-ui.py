import asyncio, json
from playwright.async_api import async_playwright

HTML = r"C:\Users\The Yoda Trader\Desktop\GuitarApp\06-prototypes\practice-engine\practice-ui.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto("file:///" + HTML)
        await page.wait_for_timeout(400)

        # 1) lessons populated
        lessons = await page.eval_on_selector_all("#lessonSel option", "els => els.map(e=>e.textContent)")
        assert len(lessons) == 20, f"expected 20 lessons, got {len(lessons)}"
        print("OK lessons populated:", len(lessons))

        # 2) pairs for lesson 5 (Em,easyC) populate
        await page.select_option("#lessonSel", "practice-05")
        await page.wait_for_timeout(100)
        pairs = await page.eval_on_selector_all("#pairSel option", "els => els.map(e=>e.textContent)")
        assert "Em ↔ easyC" in pairs, f"Em<->easyC pair missing: {pairs}"
        print("OK pairs for L05:", pairs)

        # 3) run a 60s drill (accelerated 10x -> ~6s real). Wait for completion.
        await page.select_option("#pairSel", "Em::easyC")
        await page.click("#startBtn")
        # poll until start button re-enabled (drill finished)
        for _ in range(120):
            await page.wait_for_timeout(100)
            disabled = await page.eval_on_selector("#startBtn", "el => el.disabled")
            if not disabled:
                break
        count = int(await page.eval_on_selector("#count", "el => el.textContent"))
        rate = float(await page.eval_on_selector("#rate", "el => el.textContent"))
        pill = await page.eval_on_selector("#statusPill", "el => el.textContent")
        print(f"OK drill finished: count={count} rate={rate}/min pill='{pill}'")
        assert count > 0, "counter did not advance"
        assert rate > 0, "rate not computed"

        # 4) weak-pair review list rendered with meters
        rows = await page.eval_on_selector_all("#reviewList li", "els => els.length")
        assert rows >= 3, f"review list empty: {rows}"
        print(f"OK weak-pair review rows: {rows}")

        # 5) run review session button works
        await page.click("#reviewBtn")
        log = await page.eval_on_selector("#log", "el => el.textContent")
        assert "Review session" in log, "review session not logged"
        print("OK review session button works")

        # 6) no console/page errors
        assert not errors, f"browser errors: {errors}"
        print("OK no browser console/page errors")

        await browser.close()
        print("\nALL UI CHECKS PASSED")

asyncio.run(main())
