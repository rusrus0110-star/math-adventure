# Next development steps

## Milestone 2 — visual/game feel

1. Replace placeholder character with original child artwork.
2. Add character states: idle, happy, thinking, celebrate.
3. Add answer-button success/error animation.
4. Add short sound effects with a global mute setting.
5. Implement real reward inventory.

## Milestone 3 — learning engine

1. Build an error-pattern model from `QuestionAttempt` history.
2. Add weighted question selection.
3. Reserve the last 2–3 questions of a session for weak combinations.
4. Add parent-facing weak-combination statistics.

## Milestone 4 — backend-ready sync

1. Add `ApiPlayerRepository`, `ApiProgressRepository`, etc.
2. Add Node.js API.
3. Add PostgreSQL migrations.
4. Introduce parent account + child profiles.
5. Add conflict-safe sync between local IndexedDB and server state.

## Milestone 5 — Android

1. Add Capacitor.
2. Validate touch targets, safe areas and back navigation.
3. Generate production icons/splash assets.
4. Add privacy policy and store metadata.
5. Build/sign Android App Bundle for Google Play.
