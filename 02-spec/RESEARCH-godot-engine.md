# Godot 4.x for the Acoustic Guitar-Lesson App — Research Verdict

**Prepared for:** Heidi (non-technical owner)
**Question:** Is Godot 4.x the right engine for a sold ($12/mo) acoustic guitar-lesson app with a "story world" (walkable village / corner guitarist) where lessons trigger as scenes? Is there a better FREE alternative?

---

## Verdict (plain English)

Godot 4.x is the **right pick and stays the pick**. Its license (MIT) is genuinely free for commercial use with **no subscription, no royalty, and no per-seat fee** — I confirmed this directly from Godot's official GitHub license file, not a blog. It exports to iOS, Android, and Web, and a simple narrative walkable world with lessons-as-scenes is exactly the kind of small/medium project Godot is built for. Every "free" rival either charges later (Unreal's 5% royalty, Unity's paid subscription) or is too narrow (Ren'Py is visual-novel-only, Ink is story-text-only, Defold is 2D-only), so none beats Godot on the combination of free + commercial-clean + capable.

---

## Engine comparison

| Engine | Capability fit for a walkable story-world + lessons-as-scenes | License | Commercial-safe? (no sub / royalty / per-seat) | Free? |
|---|---|---|---|---|
| **Godot 4.7** | **Excellent.** Full 2D + 3D, scene/node system maps perfectly to "lessons as scenes," easy trigger zones, built-in audio for guitar. Overkill-capable, not under-powered. | **MIT** (verified on official GitHub) | **Yes** — MIT allows sell/redistribute, zero fees | **Yes** |
| Unity | Strong, but overkill and you'd pay. | Proprietary | **No** — paid Pro/Enterprise subscription (~$2,310/seat/yr in 2026); runtime fee axed but subscription remains | No (paid tiers above revenue cap) |
| Unreal Engine | Very strong 3D, but heavy for this app. | Proprietary (EULA) | **No** — 5% royalty once a title passes **$1M lifetime gross** | Free upfront, then royalty |
| Defold | Good for 2D, weak for any 3D story-world. | **MIT** | Yes | Yes |
| Ren'Py | Poor — visual-novel engine only (text + images + choices), no spatial walkable world. | MIT | Yes | Yes |
| Ink / inkjs | Not an engine — story-logic scripting only. Must be embedded in another engine. (Note: inkjs is **alive**, zero-dependency, runs in all browsers — the "dead JS port" assumption is wrong.) | MIT | Yes (as a library) | Yes |

---

## Recommendation

**KEEP Godot 4.7.** It is the only option that is simultaneously free, commercial-clean (MIT, no subscription/royalty/per-seat), exports to all three target platforms (iOS/Android/Web), and is fully capable of a non-AAA narrative walkable world. No free alternative beats it on that combination.

Optional bonus: you can use **Ink/inkjs** *alongside* Godot for the branching lesson dialogue — it's free (MIT) and the web port works fine — but it complements Godot rather than replaces it.

---

## Honest limits of Godot vs heavier engines

- **3D polish:** Godot's 3D is solid but not Unreal-level (no Nanite/Lumen-style mega-features). For a stylized village this is irrelevant.
- **Web export:** Works (WebGL/WebGPU) but the official docs note native iOS/Android builds "perform better by a significant margin" — expect a wasm download and minor mobile-browser quirks on the Web build.
- **Ecosystem:** Smaller asset store and fewer enterprise support options than Unity/Unreal. Fine for an indie solo/ small-team app.
- **Maturity:** Occasional editor rough edges; community-driven. Acceptable for this scope.

---

## Sources actually read

- **Godot official GitHub LICENSE.txt** — `https://raw.githubusercontent.com/godotengine/godot/master/LICENSE.txt` (MIT text confirmed directly)
- **Godot latest release (GitHub API)** — `https://api.github.com/repos/godotengine/godot/releases/latest` (tag `4.7.1-stable`, published 2026-07-14)
- **Godot Docs — Exporting for iOS** — `https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html`
- **Godot Docs — Exporting for the Web** — `https://docs.godotengine.org/en/4.6/tutorials/export/exporting_for_web.html` (notes native iOS/Android outperform Web)
- **Godot Docs license page** — `https://godotengine.org/license/`
- **Unity Plans & Pricing** — `https://unity.com/products`
- **Unity Runtime Fee explainer** — `https://rocketbrush.com/blog/unity-runtime-fee-what-it-means-for-developers-and-games` + `https://tech-insider.org/unity-vs-unreal-vs-godot-2026/` (Unity Pro ~$2,310/seat/yr; runtime fee removed, subscription remains)
- **Unreal Engine license** — `https://www.unrealengine.com/license` + `https://practicetestgeeks.com/unreal/is-unreal-engine-free` (5% royalty after $1M gross)
- **Defold (MIT, 2D-focused)** — Defold engine open-sourced under MIT by King; forum/source references `https://forum.defold.com/` (MIT confirmed in search results)
- **Ren'Py license** — `https://www.renpy.org/doc/html/license.html` (MIT; free to sell, no fees)
- **Ink / inkjs** — `https://www.inklestudios.com/ink/`, `https://github.com/y-lohse/inkjs` (inkjs: zero-dependency, works in all browsers — maintained)
- **2026 game-engine license comparison** — `https://tech-insider.org/unity-vs-unreal-vs-godot-2026/`, `https://www.gamineai.com/blog/the-2026-game-engine-license-shake-up-unity-unreal-godot-compared`

*(Note: the DuckDuckGo-based `duckduckgo_search` library returned no results; research was completed using the maintained `ddgs` library and direct GitHub/curl fetches — no paid search service was used.)*
