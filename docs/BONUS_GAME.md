# Bonus-Spiel: Mias Sonnenpfad

## Play

Open `/bonus-game` using saved Bonuszeit, or unlock `/parents` and choose a normal or parent-test launch. Normal play requires a positive bank. Parent tests offer 5, 10 or 20 virtual minutes, clearly label the HUD, and never persist time, scores or progression. Authorization is a one-use, player-bound in-memory launch capability; URL flags cannot enable it. Reloading requires the PIN again.

Move with left/right arrows or A/D. Jump with Space, W or up arrow; releasing early shortens the jump. Large pointer buttons support simultaneous movement and jumping. Pause and Beenden are always available. Only game controls suppress touch scrolling. Landscape is recommended, but portrait remains usable.

## Architecture

- `features/bonusGame/domain`: pure world updates, logical AABB collision, physics, camera clamp and active-play clock.
- `features/bonusGame/levels/level1.ts`: one authored 26,000-unit world split into six themed sections, with 30 gaps, moving ferries/lifts, crumbling upper bridges, coin trails, one rare coin, seven gifts, 20 patrolling enemies, five checkpoint flags and a finish house. Permanent lower stepping stones provide an alternative to harder upper paths. Target duration is about 3–5 minutes including exploration.
- `features/bonusGame/engine`: asset loading, shared input, Canvas drawing and requestAnimationFrame scheduling. React only connects Canvas, lifecycle and HUD.
- `application/bonusGame/BonusSession`: serializes elapsed-time checkpoints through `BonusGameRepository`; parent tests bypass persistence entirely.
- `infrastructure/persistence/indexedDb`: transactions and versioned storage; no localStorage, game-engine package or backend.

The logical viewport is 960 × 540. Canvas backing resolution follows its displayed size and devicePixelRatio (capped at 2). Simulation uses delta time subdivided into steps of at most 1/120 second; large frame stalls are clamped. Horizontal speed is 190 units/second with gravity, variable jump height, a 120 ms jump buffer, forgiving ground detection, and one-way floating platforms. The camera follows Mia at 38% of the view, clamped to world bounds.

Blue platforms carry Mia horizontally or vertically; arrows and dotted travel rails distinguish them without relying on color alone. Orange cracked platforms warn for 1.1 seconds after landing, disappear for three seconds, and return. A shrinking bar communicates collapse without flashing. Motion and collapse advance only with the same world simulation, so pausing also pauses the platforms. These functional movements remain enabled with reduced motion. Runtime platform state belongs to each world, never to the shared level configuration. Respawn points are recorded only on stable ground away from edges/enemies, never on moving or crumbling platforms. Section names, German hints and a route-progress ribbon make the journey easier to follow.

## Artwork and collision

`assets/bonusGameAssets.ts` maps existing Mia idle artwork and all seven supplied Bonus-Spiel PNGs. No image files are regenerated. Ground and platforms are Canvas shapes. Transparent image padding is cropped for drawing only, never used for collision. Missing assets become colored fallback shapes and a visible warning instead of a blank screen.

Logical colliders: Mia 32 × 48; enemies 36 × 46; ordinary coins 28 × 28; rare coin 32 × 32; gifts 44 × 44; finish trigger 70 × 84. Visual Mia is 78 × 86 and the house is 230 × 270. Trees/clouds do not collide. Dimensions and positions are independent of PNG resolution. Optional point effects respect reduced motion; no audio is included.

Enemy patrols reverse at configured bounds. A falling top contact defeats the enemy, adds 25 points and bounces Mia. Side contact removes one of three hearts, followed by 1.2 seconds of protection. Zero hearts or falling below the world respawns with three hearts at a checkpoint/recent safe grounded position. Collected items and points remain. Ordinary coins add 1, the rare coin 100 and gifts 50 points, once each. These never alter Math Adventure coins, score, mastery, rewards or activity.

## Time and storage

The existing learning account remains the sole Bonuszeit bank: 15 active learning minutes earn 5 minutes, capped at 20. A normal run is limited to `min(bank, 20 minutes)`, without an upfront deduction. Only running, visible, focused play advances its clock. Manual pause, hidden/unfocused windows, loading, save waits and results do not spend time. Long stalls contribute at most 250 ms rather than charging frozen browser time.

Every two active seconds, and on pause, visibility changes, finish and explicit exit, a transaction saves absolute elapsed play time. Duplicate checkpoints charge only the previously unrecorded delta. Physics waits for save acknowledgement; failures pause with a retry action. Component cleanup/pagehide also attempt a flush, but browser shutdown cannot guarantee asynchronous IndexedDB completion. Sudden termination can leave roughly two active seconds uncharged; no full-bank deduction is used.

Database version 8 only adds `bonusGames` and `settings` to version 7. `learning.bonusTimeMs` keeps the unused balance. `bonusGames[playerId]` contains `bestBonusGameScore` and a run lease/checkpoint; best score only increases, including partial normal runs. Concurrent normal starts are rejected while the run lease is fresh. After an unexpected shutdown, retry after ten seconds. Replaced run IDs cannot write or charge again. World position is not saved; replay starts the level anew.

`settings['parent-pin']` stores a random 16-byte salt, PBKDF2-SHA256 derived hash and 210,000 iterations. The PIN itself is never stored. Creating/changing it validates 4–6 digits and confirmation; changes also require the current PIN. Unlock is memory-only. This is a local family access gate, not protection against an attacker controlling browser storage. There is no online PIN recovery or cross-device synchronization. Clearing site data also deletes progress and is not a recommended PIN reset workflow.

## Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` and `git diff --check`. Automated tests cover time boundaries, world interactions, independent economies, persistence/retry/session replacement, migrations and parent authorization.

Browser QA should include a complete run, optional rare-coin climb, damage/respawn, background pause, early exit, no spending after finish, parent test at zero bank, and reload/query-parameter denial. Check touch multitouch and portrait/landscape on an actual phone/tablet, and cold/offline launch of an installed PWA. Automated mobile emulation does not replace physical-device testing. Production hosting must use HTTPS for Web Crypto and service workers (localhost is allowed for development).

Initial V1 implementation QA used an isolated Edge profile, not existing child data. The original level was completed with 479 points, 104 ordinary coins and the rare coin; the finish checkpoint persisted that best score, stopped charging, and left math coins/score at zero. Keyboard movement, jumps, platform landing, stomp, side damage, gift collection, fall respawn and the midpoint checkpoint were exercised. Mobile emulation at 844 × 390 and 390 × 844 verified simultaneous touch movement/jump with no document overflow. The production service worker activated and served the parent gate and playable test level offline, while direct `?test=true` remained denied without real Bonuszeit. Physical installed-PWA/device testing remains a release check.

The obstacle revision adds regression tests for moving-platform carry/jump-off, timed collapse/recovery, per-run isolation, buffered landing jumps, safe respawns, pause/completion, valid patrol ranges and lower-route reachability. A complete lower-route simulation uses the real physics with no teleporting. No persistence schema, Bonuszeit rules, math data or parent authorization changed in this revision; existing platformer records are retained.

The revised routed level was also completed in isolated Edge with keyboard input (262 points, 137 ordinary coins, no fall respawns). Separate browser checks confirmed that Mia rides the blue lift, an orange platform warns and disappears beneath her, returns afterwards, and does not collapse while manually paused. This is not a substitute for testing the difficulty with the child or replaying on a physical touch device.
