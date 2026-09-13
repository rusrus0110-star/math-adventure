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
- Accuracy determines seven-star mastery: 0–2 correct → 0; 3–4 → 1; 5 → 2; 6 → 3; 7 → 4; 8 → 5; 9 → 6; 10 → 7.
- The next level unlocks at 80% accuracy. Speed and streaks affect score only.
- Session coins: correct answers + 3 completion coins + accuracy bonus (2 at 80%, 4 at 90%, 6 at 100%).
- The first completed round each local calendar day adds 5 activity coins. Subsequent rounds do not repeat this bonus.
- Accessories and super prizes unlock against cumulative coins; coins are never spent. Parents explicitly confirm real-world reward claims.
- Weekly goals require 3–7 distinct active days, Monday through Sunday.

## Screens

Profiles, home, levels, game, results, child progress, rewards (Accessoires / Wochenziel / Superpreise), and the parent dashboard at /parents.

## Architecture and storage

Canonical source folders are src/app, src/domain, src/application, src/infrastructure, src/features, src/pages, and src/shared. Assets contain artwork only. See [architecture and migration details](docs/ARCHITECTURE.md).

Data is stored on this browser/device, not on a server. Closing or reinstalling the PWA on the same browser origin retains data while that origin's storage remains. Clearing site data, removing the browser profile, or uninstalling with data deletion removes it; no local-only app can guarantee recovery after that. There is no cloud backup or authentication.

The parent dashboard can request persistent browser storage to reduce automatic eviction. This does not prevent deliberate site-data deletion.
