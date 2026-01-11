# Runi

Runi is an open-source macOS/Linux API tool for vibe coding complex workflows—AI-assisted request chaining, visualization, auth, testing, and security probing—with human oversight, serving as both a daily driver and a clear demo of vibe coding's real outputs and limits.

## Tech Stack

- **Frontend**: Svelte 5.46.0 with SvelteKit 2.49.4
- **Backend**: Rust with Tauri 2.9.5
- **Styling**: Tailwind CSS v4 with shadcn-svelte 1.1.0
- **Target Platforms**: macOS and Linux

## Architecture

The project follows clean architecture principles:

### Rust Backend (`src-tauri/`)
- **Domain Layer** (`src/domain/`): Core business logic and models
- **Application Layer** (`src/application/`): Services and use cases
- **Infrastructure Layer** (`src/infrastructure/`): External interfaces (Tauri commands, networking)

### Svelte Frontend (`src/`)
- **Routes** (`src/routes/`): Pages and routing
- **Components** (`src/lib/components/`): Reusable UI components
- **Stores** (`src/lib/stores/`): State management using Svelte runes
- **Utils** (`src/lib/utils/`): Helper functions

## Prerequisites

- Node.js 18+ and npm
- Rust toolchain (install from [rustup.rs](https://rustup.rs/))

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run tauri dev
```

This will:
1. Start the SvelteKit dev server on `http://localhost:5173`
2. Build and launch the Tauri application

### Build for Production

```bash
npm run build
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Testing

### Rust Tests

```bash
cd src-tauri
cargo test
```

### Frontend Tests

```bash
npm test
```

## Project Setup Notes

- **shadcn-svelte**: To complete the shadcn-svelte setup, run:
  ```bash
  npx shadcn-svelte@1.1.0 init
  ```
  This will interactively configure Tailwind CSS v4 and create the necessary configuration files.

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Paul Breuler
