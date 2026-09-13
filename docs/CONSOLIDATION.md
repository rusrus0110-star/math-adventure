# Source consolidation record

The pre-existing working tree contained 15 tracked deletions and 11 untracked files. Those deletions were left in place. The untracked motivation domain, store, repository port/adapter, parent page, and reward tests were retained in canonical locations and extended for this task.

Before removal, each of the 16 source/style files under src/assets/{features,infrastructure,pages,shared} was compared with its corresponding src/application copy. They were identical after normalizing line endings. Each of the 23 src/application/{domain,features,infrastructure,pages,shared} copies was then compared with the canonical src path.

## Preserved differences

| Area | Preserved functionality / canonical location |
| --- | --- |
| Coin calculation | Newer completion/correctness contract in src/domain/game/services/calculateRewards.ts |
| Motivation rules and configuration | src/domain/motivation/ |
| Motivation store and repository | src/features/motivation/ and src/infrastructure/persistence/indexedDb/ |
| Character overlays | accessoryIcon and overlay CSS in src/features/character/ |
| Database | Version-2 motivation store carried into the version-3 migration |
| Home | Wish card, coin progress, weekly goal, parent navigation |
| Game | Coin feedback, equipped accessories, motivation refresh |
| Results | Coin totals, newly unlocked wishes, weekly completion feedback |
| Parent | Configurable weekly days, real rewards, custom reward names |
| Rewards | Visible locked accessories, selecting wishes, equipping rewards, weekly rewards; now shared cards/tabs |
| Translations | Missing score label and motivation keys in src/shared/i18n/de.ts |

The 39 redundant source/style copies were removed only after these differences were preserved. Obsolete progress/rewards CSS was replaced by shared dashboard styles; the unused price-based Reward type was superseded by cumulative accessory and super-prize definitions. Character PNGs and PWA icons were retained unchanged.
