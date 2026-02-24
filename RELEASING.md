# Releasing looms

This document describes how to create a new release of looms.

## Prerequisites

- Clean working directory (no uncommitted changes)
- On the `main` branch (or explicitly override)
- Required tools installed:
  - `git-cliff` - changelog generation
  - `jq` - JSON manipulation
  - `bun` - package manager and runtime

## Quick Start

```bash
# Preview a release (no changes made)
just release --dry-run

# Create a release
just release
```

## Release Process

### 1. Interactive Release Script

Run the release script:

```bash
./scripts/release.sh
# or
just release
```

The script will:

1. **Validate** clean working directory
2. **Show** unreleased changes from conventional commits
3. **Prompt** for version bump type (patch/minor/major/custom)
4. **Run** tests (type checks + unit tests)
5. **Update** CHANGELOG.md via git-cliff
6. **Update** package.json version
7. **Commit** changes with `chore(release): vX.Y.Z`
8. **Create** annotated tag with release notes
9. **Push** (with confirmation) to trigger CI

### 2. Automated CI Workflow

When a tag is pushed, GitHub Actions will:

1. **Build** the application
2. **Run** tests
3. **Generate** SBOM (CycloneDX)
4. **Create** GitHub release with:
   - Release notes from changelog
   - Build tarball
   - SBOM files (JSON + XML)
5. **Publish** to npm with provenance
6. **Sign** artifacts with Sigstore (on release publish)

## Dry Run

Preview what would happen without making changes:

```bash
just release --dry-run
```

This shows:

- Unreleased changes
- What version would be created
- Release notes preview

## Version Bumping

The script offers interactive version selection:

| Type   | Example       | When to use                     |
| ------ | ------------- | ------------------------------- |
| patch  | 1.0.0 → 1.0.1 | Bug fixes, documentation        |
| minor  | 1.0.0 → 1.1.0 | New features, enhancements      |
| major  | 1.0.0 → 2.0.0 | Breaking changes                |
| custom | Any           | Pre-releases, specific versions |

## Changelog

The changelog is automatically generated from conventional commits:

- `feat:` → Features
- `fix:` → Bug Fixes
- `docs:` → Documentation
- `perf:` → Performance
- `refactor:` → Refactor
- `test:` → Testing
- `chore:` → Miscellaneous

View unreleased changes:

```bash
just changelog
# or
git cliff --unreleased
```

## Verifying Releases

### npm Package

```bash
# Verify provenance of installed package
npm audit signatures
```

### GitHub Artifacts

```bash
# Download release files
gh release download v1.0.0

# Verify signature
cosign verify-blob \
  --signature looms-1.0.0.tar.gz.sig \
  --certificate looms-1.0.0.tar.gz.pem \
  --certificate-identity-regexp='https://github.com/p-b-d-z/looms/.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  looms-1.0.0.tar.gz
```

## Troubleshooting

### "Working directory is not clean"

Commit or stash your changes:

```bash
git stash
just release
git stash pop
```

### "No unreleased changes found"

This happens when there are no conventional commits since the last release. You can continue anyway or add commits first.

### Failed npm publish

Ensure `NPM_TOKEN` secret is set in GitHub repository settings with publish permissions.

### Failed signing

Signing happens automatically via GitHub OIDC. If it fails, check:

- Repository has `id-token: write` permission
- Sigstore services are available

## Rollback

If something goes wrong:

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Delete GitHub release (via UI or CLI)
gh release delete v1.0.0

# npm unpublish (within 72 hours)
npm unpublish looms@1.0.0
```

## Security

- **npm provenance**: SLSA Level 2 attestation linking package to source
- **Sigstore signing**: Keyless signatures with transparent log
- **SBOM**: Full dependency listing for vulnerability scanning

See [ADR-0020](docs/src/adrs/0020-release-workflow.md) for detailed security considerations.
