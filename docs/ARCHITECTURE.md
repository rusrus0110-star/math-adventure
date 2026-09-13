# Architecture and persistence

## Layers

React pages compose feature components and Zustand stores. Domain modules own question generation, scoring, seven-star mastery, coins, weekly activity, and reward eligibility. Application use cases validate sessions and depend on repository ports. Infrastructure implements IndexedDB transactions. The app dependency module connects these layers.

One authoritative implementation lives under each canonical src folder. Duplicate application code formerly nested in src/application and src/assets was reconciled; newer accessory, wish, weekly-goal, and result features were retained.

## Session lifecycle

The domain creates the complete shuffled 5-addition/5-subtraction question list before play. Operands follow the level range and carry/tens rules. Subtraction uses a zero lower result bound because addition-specific minimum sums do not apply to differences. Questions are unique within an operation whenever at least five valid combinations exist.

The game store records each attempt's operation and freezes the completion timestamp/local date before saving. Delayed answers and save results verify their session ID before updating state. Failed saves retain the same completion input for retry. Leaving an unfinished game cancels its pending UI updates.

Completion reads the existing session, progress, and activity inside one read/write transaction. Existing session IDs return their original reward without writing again. The transaction atomically saves attempts, session, cumulative progress, and the first activity record for that day.

New sessions also save a minimal mastery snapshot: the previous best stars and the newly unlocked level ID, if any. The domain derives the new best and newly earned star positions from that snapshot and the session stars. Retries return the original feedback even after later games improve progress. This optional session field needs no new store or schema version; older records omit improvement/unlock feedback rather than inventing historical events. Personal bests award no extra coins. Results animate only newly earned stars using CSS, respecting reduced-motion preferences.

## Database version 5

Upgrades from versions 1 and 2 preserve the existing players, progress, sessions, attempts, and motivation stores. The migration adds:

- motivation if upgrading from version 1;
- activity, keyed by [playerId, localDate], with the first completed session ID;
- claims, keyed by [playerId, rewardKey], with claim time and reward-name snapshot.

Historical sessions gain seven-star results and a local date. Existing coin amounts and totals remain unchanged; historical activity earns no retroactive bonuses. Full historical 10-question sessions backfill distinct active dates. Historical attempts default to addition.

Version 4 removes the old star-floor conversion. Current level mastery starts at zero and only explicitly marked `questionSetVersion: "mixed-v1"` sessions contribute. Unmarked sessions, including addition-only 10/10 history and any earlier unversioned mixed games, remain historical records and do not grant mixed mastery. New completion validates exactly five additions and five subtractions before saving the marker. Compatibility never comes from dates or level IDs.

Existing level IDs remain stable to preserve routes, attempt/session references, and unlocked levels. Upgrades from versions 1–3 reset only the current levels' `progress.levelStars`, rebuilding from explicitly compatible sessions if present. Coins, score, counters, unlocks, profiles, history, equipment, activity, and claims are not reset. Version-3 history is not rewritten. Reopening version 4 does not repeat migration or erase new mixed mastery. Weekly targets from versions 1–2 are normalized to 3–7 days.

Old records have UTC timestamps without their original timezone. The migration deterministically derives their calendar dates using the device timezone at upgrade. New sessions persist the local date at completion, so later timezone changes do not rewrite their history.

## Rewards and activity

Weekly rewards are configured separately in `realRewards.ts` (`WEEKLY_REWARD_OPTIONS`): Eis essen, Spielplatz, Filmabend, Lieblingsessen. `superPrizes.ts` contains only Shopping (500 coins), Ausflug (800), and Ja-Tag (1500). A regression test prevents duplicate IDs across the catalogs. Custom weekly rewards are no longer selectable.

Version 5 replaces invalid weekly selections with Eis essen and clears their obsolete custom title. Valid weekly settings and all progress, coins, equipment, activity, sessions, and claim records remain unchanged. Upgrading from version 4 does not rerun the mastery reset. Historical claims retain their original names, including rewards no longer in an active catalog.

Weekly activity is derived from persistent day records; no duplicate weekly counters are stored. Accessory thresholds and super-prize milestones live in domain configuration. Coins are cumulative earnings, not a spendable balance.

Equipment is a separate nullable `motivation.equippedVirtualRewardId`. “Ausziehen” saves `null`, then updates Zustand immediately without waiting for unrelated dashboard reads. Mia renders no overlay for null. No coins or reward eligibility change, and reloading reads the same null from IndexedDB.

A weekly claim is unique per player and week; a super-prize claim is unique per player and configured prize ID. Parent confirmation validates eligibility and inserts the claim in one transaction. Claims retain the reward name even if configuration later changes. Changing a weekly target applies to the current week and never creates a second claim for that week.

## Local persistence limits

Data survives reloads and PWA reopening/reinstallation while browser origin storage remains. Deleting site data or the browser profile cannot be recovered without a backup. No backend or authentication is introduced.

## Validation

Vitest covers mixed generation, reward boundaries, activity, migrations from versions 1 and 2, transaction rollback/concurrency, idempotency, explicit claims, and stale game/player state. Build includes TypeScript checks and PWA generation. Browser layout and real-device storage behavior also need interactive verification.
