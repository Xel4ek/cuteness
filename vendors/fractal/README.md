# Fractal WASM

Rust implementation of the Mandelbrot renderer, published as the `@cuteness/fractal` npm package.

This crate is a member of the repository's Cargo and Nx workspaces. Run commands from the repository root:

```sh
bun nx build rust-fractal
bun nx test rust-fractal
bun nx lint rust-fractal
```

The build writes the npm package to `vendors/fractal/pkg`. Dependency versions and the Cargo lockfile are maintained at the repository root. See the [workspace README](../../README.md) for setup.
