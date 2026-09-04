# WAVE3-B — performance shell deepen pass proof

## Code changes
- `07-app/core/wave1-flow.js`
  - Enhanced the Level-1/Level-2 porch performance panel with:
    - a **Before you start** invitation block
    - a **Level complete** completion block
    - a progress line (`#pathb-<level>-progress`)
  - Kept required existing selectors and status text format intact:
    - `#pathb-l<level>-status` still includes:
      - `next expected: <Chord>`
      - `loops completed: <n>/<target>`
    - play buttons:
      - `#pathb-l1-play-a`, `#pathb-l1-play-b`, and `#pathb-l1-reset`
      - `#pathb-l2-play-a`, `#pathb-l2-play-b`, and `#pathb-l2-reset`

## Gates re-run (real)
- `node 07-app/test/app-smoke.mjs` => **28 passed / 0 failed**
- `.scratch/guitarapp-software-factory/wave1_full_verify.mjs` => **GREEN (0 failures)**
- Chord / curriculum / song gates:
  - `bash 07-app/test/chord-check.sh` => PASS
  - `bash 07-app/test/curriculum-order.sh` => OK
  - `bash 07-app/test/song-progressions.sh` => PASS

**Script final line:** (from app smoke) `APP SMOKE: 28 passed, 0 failed`
