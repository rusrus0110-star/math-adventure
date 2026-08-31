# Mathe-Abenteuer v0.1

Mobile-first React/PWA prototype for short arithmetic sessions.

## Requirements

- Node.js 20.19+ (Node 22 LTS is also fine)
- npm

## Start

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run test
npm run lint
npm run build
```

## Architecture

- `domain/` contains pure game rules and entities.
- `application/` contains use cases.
- `infrastructure/` contains adapters such as IndexedDB repositories.
- `features/` contains UI state and feature components.
- `pages/` composes screens.

The domain layer does not depend on IndexedDB or React. A future API/PostgreSQL implementation can replace the repository adapters without rewriting the game engine.

## v0.1 scope

- German UI
- local player profiles
- 5 addition levels
- 10-question sessions
- answer speed bonus
- streak bonus
- stars and coins
- IndexedDB persistence
- basic progress page
- PWA setup

The placeholder character is intentionally temporary and can be replaced later by the child's drawings.
