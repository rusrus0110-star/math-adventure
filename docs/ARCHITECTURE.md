# Architecture decisions

## 1. Domain isolation

The arithmetic engine, score rules and progression rules live under `src/domain` and do not import React, Zustand, IndexedDB or browser routing.

## 2. Persistence through ports

Application use cases depend on repository interfaces under `src/application/ports`.

Current adapter:

`IndexedDB -> IndexedDb*Repository`

Future adapter:

`REST/GraphQL API -> Api*Repository -> Node.js -> PostgreSQL`

This keeps local-first v0.1 replaceable without coupling the game engine to a particular database.

## 3. Local player profiles

Every persisted record that belongs to a child contains `playerId`. Multiple profiles can therefore share one device without authentication.

## 4. UI language

UI strings are accessed through the `t()` helper. German is the only language in v0.1, but components are not hard-coded to German strings.

## 5. Config-driven levels

Game levels are data in `LEVELS`, not branches inside React components. Later subtraction, multiplication and custom learning tracks can be added by extending the domain model and generators.

## 6. Mobile packaging

The project starts as a PWA. If the product is successful, the React application can be wrapped with Capacitor for Android distribution while retaining domain/application code and most UI code.
