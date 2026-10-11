# Cuteness

An Angular/Nx playground for fractals, graph algorithms, a solar-system simulation, and browser APIs.

## Workspace

- `apps/cuteness` — Angular application.
- `libs/travelling-salesman-problem` — TypeScript graph algorithms.
- `vendors` — Rust crates compiled to WebAssembly.

## Setup

The current workspace has been checked with Node.js 24 and Bun 1.4.

The three `file:vendors/*/pkg` dependencies must exist before installing dependencies. Build them with Rust and `wasm-pack` from the repository root:

```sh
wasm-pack build vendors/fractal --target bundler
wasm-pack build vendors/graph-algorithms --target bundler
wasm-pack build vendors/solar-system --target bundler
bun install --frozen-lockfile
```

Generated `pkg` and `target` directories are ignored by Git and Prettier.

## Development server

```sh
bun start
```

Open http://localhost:4200/. The app reloads when source files change.

## Checks

```sh
bun run test                   # Vitest runtime tests and TypeScript checks
bun lint                       # ESLint for both Nx projects
bun run format:check           # Prettier, without rewriting files
bun nx build cuteness          # Production build, base URL /cuteness/
bun nx build cuteness -c development
```

Vitest targets are inferred by `@nx/vitest` from each project's `vitest.config.mts`. The root config collects both projects for direct `bunx vitest run` execution. The algorithm library currently has no test files and explicitly allows an empty suite.

Use `bun nx graph` to inspect workspace dependencies.

## Deployment

`bun run deploy` invokes the existing GitHub Pages target and depends on the production build.
