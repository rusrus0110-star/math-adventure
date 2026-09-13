# Architecture and persistence

## Layers

React pages compose feature components and Zustand stores. Domain modules own question generation, scoring, seven-star mastery, coins, weekly activity, and reward eligibility. Application use cases validate sessions and depend on repository ports. Infrastructure implements IndexedDB transactions. The app dependency module connects these layers.

One authoritative implementation lives under each canonical src folder. Duplicate application code formerly nested in src/application and src/assets was reconciled; newer accessory, wish, weekly-goal, and result features were retained.

## Session lifecycle

The domain creates the complete shuffled 5-addition/5-subtraction question list before play. Operands follow the level range and carry/tens rules. Subtraction uses a zero lower result bound because addition-specific minimum sums do not apply to differences. Questions are unique within an operation whenever at least five valid combinations exist.

The game store records each attempt's operation and freezes the completion timestamp/local date before saving. Delayed answers and save results verify their session ID before updating state. Failed saves retain the same completion input for retry. Leaving an unfinished game cancels its pending UI updates.

Completion reads the existing session, progress, and activity inside one read/write transaction. Existing session IDs return their original reward without writing again. The transaction atomically saves attempts, session, cumulative progress, and the first activity record for that day.

New sessions save `masteryVersion: "successful-rounds-v1"`, a previous-mastery snapshot, and the newly unlocked level ID, if any. Session `stars` is now a delta of zero or one, not an accuracy rating. A completed 10-question round with at least eight correct increments that level's persisted `progress.levelStars`, capped at seven. The first success independently unlocks the next level. Failures retain mastery. Retries return the original feedback without adding another star. Older records omit current-model feedback. Mastery awards no extra coins. Results animate only the newly earned star using CSS, respecting reduced-motion preferences.

## Database version 7

Upgrades from versions 1 and 2 preserve the existing players, progress, sessions, attempts, and motivation stores. The migration adds:

- motivation if upgrading from version 1;
- activity, keyed by [playerId, localDate], with the first completed session ID;
- claims, keyed by [playerId, rewardKey], with claim time and reward-name snapshot.

Historical sessions gain seven-star results and a local date. Existing coin amounts and totals remain unchanged; historical activity earns no retroactive bonuses. Full historical 10-question sessions backfill distinct active dates. Historical attempts default to addition.

Version 4 introduced mixed-curriculum separation. New completion still validates exactly five additions and five subtractions and persists `questionSetVersion: "mixed-v1"`. Version 6 additionally requires the cumulative mastery marker; neither addition-only history nor old mixed accuracy ratings grant cumulative mastery. Compatibility never comes from dates or level IDs.

Existing level IDs remain stable to preserve routes, history references, and unlocks. Upgrades from versions 1–5 reset only current levels' `progress.levelStars` to zero, with no history-based reconstruction. Coins, score, counters, unlocks, profiles, history, equipment, activity, claims, and any existing learning bank remain intact. Version-3-and-later history is not rewritten. Reopening version 6 does not repeat the reset. The upgrade adds a `learning` store keyed by player ID if absent; new accounts initialize lazily. Weekly targets from versions 1–2 are normalized to 3–7 days.

Old records have UTC timestamps without their original timezone. The migration deterministically derives their calendar dates using the device timezone at upgrade. New sessions persist the local date at completion, so later timezone changes do not rewrite their history.

## Rewards and activity

Weekly rewards are configured separately in `realRewards.ts` (`WEEKLY_REWARD_OPTIONS`): Eis essen, Spielplatz, Filmabend, Lieblingsessen. `superPrizes.ts` contains only Shopping (500 coins), Ausflug (800), and Ja-Tag (1500). A regression test prevents duplicate IDs across the catalogs. Custom weekly rewards are no longer selectable.

The version-5 migration step replaces invalid weekly selections with Eis essen and clears their obsolete custom title. Valid weekly settings and other rewards remain unchanged. Historical claims retain their original names, including rewards no longer in an active catalog. Upgrading to version 6 also performs the separate cumulative-mastery reset.

Weekly activity is derived from qualifying persistent `dailyActivity` records; no duplicate weekly counters are stored. A day qualifies after five full rounds OR twenty active minutes. The original `activity` store remains the first-session coin-bonus ledger, independent of day qualification. Accessory thresholds and super-prize milestones live in domain configuration. Coins are cumulative earnings, not a spendable balance.

Equipment is a separate nullable `motivation.equippedVirtualRewardId`. “Ausziehen” saves `null`, then updates Zustand immediately without waiting for unrelated dashboard reads. Mia renders no overlay for null. No coins or reward eligibility change, and reloading reads the same null from IndexedDB.

A weekly claim is unique per player and week; a super-prize claim is unique per player and configured prize ID. Parent confirmation validates eligibility and inserts the claim in one transaction. Claims retain the reward name even if configuration later changes. Changing a weekly target applies to the current week and never creates a second claim for that week.

## Active learning and Bonuszeit

The learning domain owns the 15-minute learning cycle, 5-minute grant, 20-minute bank cap, and normalized five-segment projection. `LearningPath` only renders this projection: each completed fifth fills a segment, Mia moves continuously toward the gamepad, and reduced-motion preferences disable transitions. Children see qualitative text, not minutes or a countdown. Parents can read numeric totals.

`LearningTracker` connects the actual `/game/:levelId` question state to the application clock. Home, rewards, parents, results, feedback, saving, and non-game routes are ineligible. Page Visibility and window focus exclude background time. Trusted pointer/keyboard interaction renews a 30-second idle window. Samples run every second; gaps above five seconds are discarded rather than crediting suspended/offline time. Cleanup flushes the final eligible interval. There is no component-owned timer or separate visual clock.

One IndexedDB transaction updates `learningProgressMs`, `bonusTimeMs`, `totalActiveMs`, and the deduplication timestamp `lastCreditedAt`. Overlapping/retried intervals cannot earn twice. The store queues failed writes for retry and rejects stale player loads. A grant presents a completed path, then subsequent learning displays the persisted next-cycle remainder. At capacity the path stays full and additional learning cannot bank future overflow. Spending decreases only Bonuszeit; learning and coins are unaffected. The repository exposes spending, but this checkout has no playable Bonus-Spiel route yet.

## Daily training goal

Version 7 adds `dailyActivity`, keyed by `[playerId, localDate]`, with `completedSessions` and `activeLearningMs`. Migration counts historical completed 10-question sessions using their saved local date. It does not infer active time from session duration or assign undated accumulated learning to any day. Historical days qualify only if the evidence meets the new rule. The migration leaves existing history, coin bonuses, claimed rewards, unlocks, mastery and the Bonuszeit bank untouched; version-6 mastery is not reset again.

Session completion increments its day's round counter in the existing atomic completion transaction. Learning persistence splits the same credited intervals at local midnight and updates the daily time together with the bonus account in one transaction. Concurrent saves and retries cannot lose or duplicate counters. Active time continues counting toward the daily goal even when the bonus bank is full.

`DailyLearningPath` displays a five-segment time path (one fifth of twenty minutes per segment) and five round markers as separate alternatives. Either complete path qualifies the day; partial paths are never added. It shares the Mia/path presentation with the bonus indicator, but neither owns a timer. Parent UI shows exact daily totals. The application tracker reloads the selected local day at midnight and on return from suspension; yesterday stays in storage and Bonuszeit carries over. Weekly displays and parent claims use the same qualification function.

## Local persistence limits

Data survives reloads and PWA reopening/reinstallation while browser origin storage remains. Deleting site data or the browser profile cannot be recovered without a backup. No backend or authentication is introduced.

## Validation

Vitest covers cumulative mastery and cap boundaries, mixed generation, rewards, activity, upgrades from versions 1–5, transaction rollback/concurrency, idempotency, claims, stale game/player state, active/idle/background learning, visual mapping, and persistent player-specific Bonuszeit. Build includes TypeScript checks and PWA generation. Browser layout and real-device storage behavior also need interactive verification.
