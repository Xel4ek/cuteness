# Cuteness

An Angular/Nx playground for fractals, graph algorithms, a solar-system simulation, and browser APIs.

## Workspace

- `apps/cuteness` — Angular application.
- `libs/travelling-salesman-problem` — TypeScript graph algorithms.
- `vendors` — three Rust crates in one Cargo workspace, each compiled to its own WebAssembly/npm package.

## Setup

The current workspace has been checked with Node.js 24, Bun 1.4, Rust 1.99, and wasm-pack 0.15.

Install Rust with the `wasm32-unknown-unknown` target and `wasm-pack`. The root `Cargo.toml` shares dependency versions; the root `Cargo.lock` pins the resolved dependency graph for all three crates.

The three `file:vendors/*/pkg` dependencies must exist before installing dependencies. Build them with Rust and `wasm-pack` from the repository root:

```sh
wasm-pack build vendors/fractal --target bundler --scope cuteness -- --locked
wasm-pack build vendors/graph-algorithms --target bundler --scope cuteness -- --locked
wasm-pack build vendors/solar-system --target bundler --scope cuteness -- --locked
bun install --frozen-lockfile
```

Generated `pkg` directories and Cargo's root `target` directory are ignored by Git and Prettier. The three npm packages are `@cuteness/fractal`, `@cuteness/graph-algorithms-wasm`, and `@cuteness/solar-system`; wasm-pack applies the scope during the build. Their imports use the same names as their package manifests.

Open the repository root in your IDE. Member `Cargo.toml` files describe the separate packages; dependency versions, build profiles, and the only `Cargo.lock` live at the root. There are no member-specific Cargo target overrides: native Cargo checks run on the host, and wasm-pack selects the WASM target for package builds.

Rust artifact ignores are maintained in the root `.gitignore`, `.prettierignore`, and ESLint config. Nx shares Rust cache inputs through `rustInputs` in `nx.json`, including sources, tests, manifests, package documentation, and licenses. Dependabot's Cargo configuration lives in the root `.github` directory and targets the shared workspace.

## Development server

```sh
bun start
```

Open http://localhost:4200/. The app reloads when source files change.

On the fractal screen, use the mouse wheel to zoom in or out around the cursor, drag to pan, and Shift-drag a rectangle to zoom into an area. The middle mouse button also pans. Right-click or double-click resets the view. On touch screens, pinch to zoom in or out, drag with one finger to pan, and double-tap to reset. A click or single tap keeps the current zoom. Wheel and pinch zoom-out stop at 0.5× the initial scale.

## Checks

```sh
bun run test                   # Vitest/TypeScript checks and native Rust tests
bun lint                       # ESLint and Rust Clippy across all Nx projects
bun run format:check           # Prettier, without rewriting files
bun nx build cuteness          # Production build, base URL /cuteness/
bun nx build cuteness -c development
```

Vitest targets are inferred by `@nx/vitest` from each TypeScript project's `vitest.config.mts`. The root config collects both TypeScript projects for direct `bunx vitest run` execution. Little is checked against exhaustive search on small deterministic graphs.

The `rust-fractal`, `rust-graph-algorithms`, and `rust-solar-system` Nx projects expose `build` (wasm-pack), `test` (Cargo), and `lint` (Clippy). The application's build and serve targets prepare all three WASM packages first. Local imports resolve to the generated `vendors/*/pkg` directories, so rebuilding a crate updates the app without reinstalling a copied `file:` dependency.

```sh
bun nx build rust-graph-algorithms  # Rebuild just Little's npm/WASM package
bun nx test rust-graph-algorithms   # Native Rust regression tests
cargo test --workspace --locked    # Native tests for all three crates
cargo fmt --all -- --check         # Rust formatting
```

Use `bun nx graph` to inspect workspace dependencies.

## Deployment

`bun run deploy` invokes the existing GitHub Pages target and depends on the production build.
