# Mathe-Abenteuer

Mobile-first React/TypeScript PWA with German UI, local child profiles, and IndexedDB persistence.

## Development

Node.js 20.19+ and npm are required.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

On PowerShell systems that block npm.ps1, use npm.cmd. Tests use Vitest and fake-indexeddb; runtime persistence uses native IndexedDB through idb.

## Game and rewards

- Each round contains 10 shuffled questions: 5 addition and 5 subtraction. Subtraction never produces negative results.
- Each completed round with at least 8/10 correct adds one mastery star to that level, up to seven. Failed rounds never remove stars; even 10/10 earns at most one.
- The first successful round unlocks the next level independently of mastery. Speed and streaks affect score only.
- Session coins: correct answers + 3 completion coins + accuracy bonus (2 at 80%, 4 at 90%, 6 at 100%).
- The first completed round each local calendar day adds 5 activity coins. Subsequent rounds do not repeat this bonus.
- Accessories and super prizes unlock against cumulative coins; coins are never spent. Parents explicitly confirm real-world reward claims.
- A local calendar day counts toward the weekly goal after 5 completed 10-question rounds OR 20 minutes of active mathematics, regardless of accuracy. Partial round/time goals are not added together. Weekly goals require 3–7 qualifying days, Monday through Sunday.
- The child-facing daily path shows Mia collecting learning time and a separate row of completed rounds. Each new local day starts a fresh goal; previous days remain saved. The first-session coin bonus is unchanged and separate from qualifying a training day.
- Every 15 minutes of active mathematics earns 5 minutes of saved Bonuszeit, capped at 20 minutes. Home and game show a five-segment Mia-to-gamepad path without a numeric countdown. The parent dashboard shows exact totals.
- Only visible, focused question-solving time counts, with a 30-second interaction timeout. Bonus-Spiel never earns learning time.
- `/bonus-game` is Mias Sonnenpfad: one Canvas platformer level with keyboard/touch controls, collectibles, enemies, checkpoints and a finish house. Only active foreground play spends saved Bonuszeit; unused time remains available. Platformer points never change math coins or score.
- `/parents` requires a locally created 4–6-digit PIN. Parents can start normal play or grant an isolated 5/10/20-minute test without spending Bonuszeit or saving scores. See [Bonus-Spiel controls, storage and verification](docs/BONUS_GAME.md).

## Screens

Profiles, home, levels, game, results, child progress, rewards (Accessoires / Wochenziel / Superpreise), and the parent dashboard at /parents.

## Architecture and storage

Canonical source folders are src/app, src/domain, src/application, src/infrastructure, src/features, src/pages, and src/shared. Assets contain artwork only. See [architecture and migration details](docs/ARCHITECTURE.md).

Data is stored on this browser/device, not on a server. Closing or reinstalling the PWA on the same browser origin retains data while that origin's storage remains. Clearing site data, removing the browser profile, or uninstalling with data deletion removes it; no local-only app can guarantee recovery after that. There is no cloud backup or server authentication. The parent PIN is a local access gate, not protection against someone controlling the browser or its storage.

The parent dashboard can request persistent browser storage to reduce automatic eviction. This does not prevent deliberate site-data deletion.
