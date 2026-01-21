<p align="center">
  <img src=".github/assets/runi.svg" alt="runi" width="120" />
</p>

<h1 align="center">runi</h1>

<p align="center">
  <strong>See the truth about your APIs</strong>
</p>

<p align="center">
  An open-source API client that verifies what AI generates.<br/>
  Local-first. Git-friendly. No account required. Ever.
</p>

<p align="center">
  <a href="https://github.com/paulbreuler/runi/releases"><img src="https://img.shields.io/github/v/release/paulbreuler/runi?style=flat-square" alt="Release" /></a>
  <a href="https://github.com/paulbreuler/runi/actions/workflows/release.yml"><img src="https://github.com/paulbreuler/runi/actions/workflows/release.yml/badge.svg" alt="Release Workflow Status" /></a>
  <a href="https://github.com/paulbreuler/runi/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
  <a href="https://github.com/paulbreuler/runi/stargazers"><img src="https://img.shields.io/github/stars/paulbreuler/runi?style=flat-square" alt="Stars" /></a>
  <a href="https://discord.gg/MHzmdpw4TR"><img src="https://img.shields.io/discord/000000000?style=flat-square&logo=discord&logoColor=white&label=Discord" alt="Discord" /></a>
</p>

<p align="center">
  <img src=".github/assets/runi-demo.gif" alt="runi demo showing HTTP client interface, network history, and timing waterfall" width="800" />
</p>

<p align="center">
  <sub>Demo: HTTP client interface, network history panel, and timing waterfall visualization</sub>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#why-runi">Why runi?</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

---

> **Pre-alpha.** runi is under active development. The vision is solidifying, the foundations are being laid. Expect rough edges — and rapid evolution. Star the repo to follow along.

---

## The Problem

You're using AI to write API integration code. So is everyone else — [84% of developers now use AI tools](https://survey.stackoverflow.co/2025/ai), with [89% using generative AI in their workflow](https://www.postman.com/state-of-api/2025/).

But here's what nobody talks about: **[46% of developers don't trust the accuracy of AI output](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/)** — up from 31% last year. The biggest frustration? [66% cite "solutions that are almost right, but not quite."](https://survey.stackoverflow.co/2025/ai)

The tools generating code are getting better. The tools verifying that code? They don't exist.

Meanwhile, your HTTP client wants you to create an account, sync to their cloud, and hope your credentials don't leak. When you refuse, half the features disappear.

**runi is different.**

---

## Why runi?

| What You're Used To                  | What runi Does                                            |
| ------------------------------------ | --------------------------------------------------------- |
| Create account to use                | No account. Ever.                                         |
| Data synced to cloud                 | Local-first. Your data stays yours.                       |
| Collections in proprietary format    | YAML files. Git-friendly. Diff them.                      |
| AI generates code, you hope it works | AI generates code, **runi verifies it against your spec** |
| Spec changes break things silently   | Drift detection catches it before production              |
| "What changed?" = archaeology        | Temporal awareness shows spec evolution                   |

---

## Features

### HTTP Client (The Familiar Door)

Everything you expect, nothing you don't:

- Full REST control — methods, headers, body, params, auth
- Response viewer with syntax highlighting & timing
- **Network history panel** — see all requests with filtering and search
- **Timing waterfall visualization** — DNS, Connect, TLS, Wait, Download breakdown
- Environment variables with `{{substitution}}`
- **Collections as YAML** — version control your API workflows
- Import from Postman, Bruno, Insomnia, OpenAPI
- Export to cURL, JavaScript, Python

```yaml
# Your collections are just files
# .runi/collections/stripe.yaml
name: Stripe API
requests:
  - name: List Customers
    method: GET
    url: '{{base_url}}/v1/customers'
    headers:
      Authorization: 'Bearer {{stripe_key}}'
```

### Spec Intelligence (The Unexpected Room)

This is why you'll stay:

**Drift Detection**

[75% of production APIs don't match their published specs.](https://apicontext.com/resources/api-drift-white-paper/) runi catches this before you ship.

- Bind requests to your OpenAPI spec
- Real-time validation as you work
- Yellow badge = your request doesn't match the spec anymore
- One-click: "Show me what changed"

**AI Verification**

When [46% of developers don't trust AI output](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/), you need a second opinion. runi is that opinion.

- Paste AI-generated code → runi validates against bound spec
- Catches hallucinated endpoints before you waste an hour debugging
- Flags deprecated fields the AI didn't know about
- **Purple (`#a855f7`) until verified. Green (`#22c55e`) when safe.**

> **Signal System:** runi uses consistent visual signals to communicate intelligence. Green = verified/safe, Amber = drift detected, Red = breaking change, Purple = AI-generated (suspect until verified), Blue = suggestion available. See [CLAUDE.md](./CLAUDE.md#signal-system) for the complete signal reference.

**Temporal Awareness**

- See how your API evolved over time
- Diff between spec versions
- "When did this field become required?"

**Semantic Links**

- `Stripe:Customer` ↔ `YourAPI:User` — see the relationship
- Cross-API mapping for complex integrations
- Finally understand how systems connect

### Spatial Canvas

APIs as territory, not lists:

- Endpoints as visual nodes
- Drag, arrange, zoom, pan
- See data flow between requests
- Non-technical teammates can finally understand the integration

---

## Installation

### Build from Source

```bash
git clone https://github.com/paulbreuler/runi.git
cd runi
just install
just build
```

**Requirements:** Rust 1.80+, Node.js 20+, pnpm, [just](https://github.com/casey/just) (task runner)

> **Note:** All commands use `just` for consistency between local development and CI. See `justfile` for the complete command list.

---

## Quick Start

```bash
# 1. Start development server
just dev

# 2. Send your first request
#    Just paste a URL and hit Enter

# 3. Import your OpenAPI spec
#    File → Import Spec → Select your openapi.yaml

# 4. Bind a request to the spec
#    Right-click request → Bind to Spec → Select operation

# 5. Watch drift detection work
#    Change your spec. See the yellow badge appear.
```

> **The Adoption Ladder:** runi reveals features progressively as you use it. Start with the HTTP client and network history, discover drift detection when you import a spec, then AI verification, semantic links, and temporal awareness. See [the adoption strategy](../runi-planning-docs/addendums/002-adoption-positioning.md) for details.

---

## Tech Stack

| Component  | Technology                            |
| ---------- | ------------------------------------- |
| Runtime    | [Tauri](https://v2.tauri.app/) v2.9.x |
| Backend    | Rust 1.80+                            |
| Frontend   | React 19 + TypeScript 5.9             |
| Build      | Vite 7.x                              |
| Styling    | Tailwind CSS 4.x                      |
| Animation  | [Motion](https://motion.dev/) 12.x    |
| Routing    | React Router 7.x                      |
| State      | Zustand                               |
| Icons      | Lucide                                |
| Storage    | YAML/JSON files (no database)         |
| AI (local) | Ollama (optional)                     |
| AI (cloud) | Anthropic Claude API (optional)       |

**Bundle size:** <50MB  
**Startup time:** <3 seconds  
**Telemetry:** None. Zero. We don't even have the infrastructure to collect it.

---

## Roadmap

### Now

- [x] HTTP client core
- [x] Network history panel with filtering
- [x] Timing waterfall visualization
- [ ] Collections as YAML
- [ ] Import/export (Postman, Bruno, OpenAPI)
- [ ] Spec binding and drift detection
- [ ] Response validation

### Next

- [ ] AI verification against bound specs
- [ ] Temporal awareness (spec version history)
- [ ] Semantic links between specs
- [ ] [MCP](https://modelcontextprotocol.io/) server generation

### Later

- [ ] Spatial canvas view
- [ ] Collaborative features (local-first sync)
- [ ] Plugin system

See the full [roadmap](./docs/ROADMAP.md) for details.

---

## Migrating from Postman/Bruno

Import functionality is coming soon. Planned commands:

```bash
# From Postman
runi import postman ./your-collection.json

# From Bruno
runi import bruno ./your-bruno-folder

# From OpenAPI spec
runi import openapi ./openapi.yaml
```

Your existing workflows should just work. If they don't, [open an issue](https://github.com/paulbreuler/runi/issues).

---

## Philosophy

**Verification beats generation.**

While everyone builds tools to write more code, we're building the tool that lets you trust it.

- **Local-first**: Your data never leaves your machine unless you explicitly share it
- **Git-friendly**: Collections are YAML. Diff them. Review them. Version them.
- **Spec-bound**: The OpenAPI spec is the source of truth. Everything validates against it.
- **No account required**: We don't want your email. We don't want your data. We want you to be productive.
- **Progressive disclosure**: Features reveal based on user behavior, not menus
- **MCP-powered**: Support for [MCP 2025-11-25 spec](https://modelcontextprotocol.io/) (async ops, elicitation)

**The brand philosophy:** _"Collapse uncertainty into truth"_

Read the full [vision](../runi-planning-docs/VISION.md) and [design specification](../runi-planning-docs/runi-design-vision-v8.1.md).

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

```bash
# Development setup
git clone https://github.com/paulbreuler/runi.git
cd runi
just install      # First-time setup
just dev          # Start development server
just ci           # Run full CI pipeline (before pushing)
just pre-commit   # Fast checks (before committing)
```

**Essential Commands:**

- `just install` - Install all dependencies
- `just dev` - Start development server
- `just ci` - Full CI pipeline (format, lint, typecheck, test, E2E)
- `just pre-commit` - Fast checks before committing
- `just fmt` - Fix formatting
- `just test` - Run all tests
- `just generate-types` - Generate TypeScript types from Rust (ts-rs)

See `justfile` for the complete command list.

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/paulbreuler/runi/labels/good%20first%20issue).

---

## Community

- [Discord](https://discord.gg/MHzmdpw4TR) — Chat with the team and community
- [Twitter/X](https://twitter.com/basestate) — Updates and announcements
- [Blog](https://basestate.io/blog) — Deep dives and tutorials

---

## License

[MIT](./LICENSE) — Use it however you want.

---

## Acknowledgments

Named after **Kiki runi** — a German Shepherd who sniffs out what's hidden and guards the perimeter.

Built by [BaseState](https://basestate.io) in Fargo, North Dakota.

_"Collapse uncertainty into truth"_

---

<p align="center">
  <sub>If runi helps you, consider giving it a star ⭐</sub>
</p>
