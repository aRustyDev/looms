---
number: 20
title: Release Workflow Strategy
status: accepted
date: 2026-02-24
tags:
  - release
  - ci-cd
  - security
  - npm
deciders:
  - Adam
---

# Release Workflow Strategy

## Context and Problem Statement

We need a release workflow that creates annotated tags, GitHub releases with build artifacts, publishes to npm, generates changelogs, and provides provenance/signing material. The workflow should be reliable, secure, and provide verification mechanisms for consumers.

## Decision Drivers

* Reproducible, verifiable releases
* Supply chain security (SLSA compliance)
* Automated changelog generation from conventional commits
* Support for both local and CI-driven releases
* npm provenance for package verification

## Considered Options

* **semantic-release**: Fully automated versioning based on commit analysis
* **changesets**: PR-based changelog with human review
* **Script-based + git-cliff**: Manual control with automated changelog generation

## Decision Outcome

Chosen option: **Script-based + git-cliff**, because it provides full control over when releases happen while automating the tedious parts (changelog generation, tag creation). This aligns with our preference for explicit human decisions on versioning.

### Consequences

* Good: Full control over release timing and version numbers
* Good: Human-readable changelogs from conventional commits
* Good: Simple to understand and modify
* Neutral: Requires running a script locally vs fully automated
* Bad: No automatic version bumping based on commit types

## Implementation

### Version Management

- Local release script (`scripts/release.sh`) handles:
  - Clean working directory validation
  - Test execution before release
  - Interactive version bump selection
  - Changelog generation via git-cliff
  - Annotated tag creation
  - Push to trigger CI workflow

### Changelog Generation

- **Tool**: git-cliff with conventional commit parsing
- **Configuration**: `cliff.toml` with grouped commits (Features, Bug Fixes, etc.)
- **Output**: CHANGELOG.md updated on each release

### NPM Publishing

- Published as full application with `bin` entry point
- **Provenance**: Enabled via `publishConfig.provenance: true` (SLSA Level 2)
- Links published package to source commit for verification

### Artifact Signing

- **Sigstore/cosign**: Keyless signing using GitHub OIDC
- Creates `.sig` and `.pem` files for each release artifact
- Transparent log entry in Rekor for public verification

### SBOM Generation

- **Tool**: @cyclonedx/cyclonedx-npm
- **Formats**: JSON and XML
- Included in GitHub release assets

## Verification

Consumers can verify releases:

```bash
# Verify npm package provenance
npm audit signatures

# Verify GitHub release artifacts
cosign verify-blob \
  --signature looms-VERSION.tar.gz.sig \
  --certificate looms-VERSION.tar.gz.pem \
  --certificate-identity-regexp='https://github.com/p-b-d-z/looms/.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  looms-VERSION.tar.gz
```

## Files

| File | Purpose |
|------|---------|
| `cliff.toml` | git-cliff changelog configuration |
| `bin/looms.js` | CLI entry point for npm package |
| `scripts/release.sh` | Interactive release script |
| `.github/workflows/release.yml` | Build, release, and npm publish |
| `.github/workflows/release-sign.yml` | Sigstore artifact signing |

## Links

- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Sigstore](https://www.sigstore.dev/)
- [SLSA Framework](https://slsa.dev/)
- [git-cliff](https://git-cliff.org/)
