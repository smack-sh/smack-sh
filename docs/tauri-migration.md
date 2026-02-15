# Tauri Migration Guide

This project now includes a Tauri desktop runtime scaffold in `src-tauri/`.

## Goal

Move desktop delivery from Electron-first to Tauri-first while keeping Electron scripts temporarily available during transition.

## What was added

- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/build.rs`
- `src-tauri/src/main.rs`
- `package.json` scripts:
  - `tauri:dev`
  - `tauri:build`

## Development

1. Install Node dependencies.
2. Install Rust toolchain.
3. Run:

```bash
pnpm tauri:dev
```

## Build

```bash
pnpm tauri:build
```

## Security posture

- Tauri commands are explicitly registered in `src-tauri/src/main.rs`.
- Keep command surface minimal and gate privileged operations.
- Validate all payloads from the webview boundary before executing native actions.

