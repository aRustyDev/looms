# @arustydev/looms

[![Release](https://img.shields.io/github/v/release/aRustyDev/looms?style=flat-square)](https://github.com/aRustyDev/looms/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/aRustyDev/looms/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/aRustyDev/looms/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@arustydev/looms?style=flat-square)](https://www.npmjs.com/package/@arustydev/looms)
[![License](https://img.shields.io/github/license/aRustyDev/looms?style=flat-square)](LICENSE)

Unified dev tooling - weaving beads, gastown, git-bug, adrs, and more into a single interface.

## Features

- **Multi-interface**: WebUI, TUI, CLI, MCP, and API support (planned)
- **Multi-tool**: Integrates beads (issues), gastown (agent orchestration), git-bug, adrs, and more
- **Cross-repo analysis**: Analyze and manage issues across multiple repositories

## Installation

### npm / npx

```bash
# Install globally
npm install -g @arustydev/looms

# Or run directly with npx
npx @arustydev/looms
```

### From source

```bash
# Clone the repository
gh repo clone aRustyDev/looms
cd looms

# Install dependencies
bun install

# Run development server
bun run dev
```

### Using just (task runner)

```bash
# Install just if not already installed
brew install just

# See available commands
just --list

# Run development server
just dev

# Run tests
just test
```

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun run test:unit

# Run E2E tests
bun run test:e2e

# Type checking
bun run check

# Linting
bun run lint
```

## Release

Releases are automated via GitHub Actions. To create a new release:

```bash
# Using the release script
./scripts/release.sh

# Or using just
just release
```

See [RELEASING.md](RELEASING.md) for detailed release instructions.

## Verification

All releases are signed with [Sigstore](https://sigstore.dev/) and include npm provenance.

```bash
# Verify release artifact
cosign verify-blob \
  --signature looms-VERSION.tar.gz.sig \
  --certificate looms-VERSION.tar.gz.pem \
  --certificate-identity-regexp='https://github.com/aRustyDev/looms/.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  looms-VERSION.tar.gz

# Verify SHA256 checksum
sha256sum -c looms-VERSION.tar.gz.sha256
```

## License

[MIT](LICENSE)
