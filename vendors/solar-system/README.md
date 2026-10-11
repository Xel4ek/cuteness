# Solar System WASM

Experimental Rust/WebGPU module, published as the `@cuteness/solar-system` npm package. Rendering is still unfinished.

This crate is a member of the repository's Cargo and Nx workspaces. Run commands from the repository root:

```sh
bun nx build rust-solar-system
bun nx test rust-solar-system
bun nx lint rust-solar-system
```

The build writes the npm package to `vendors/solar-system/pkg`. Dependency versions and the Cargo lockfile are maintained at the repository root. See the [workspace README](../../README.md) for setup.
