#!/usr/bin/env bash
#
# Release script for projx-ui
#
# This script handles the local release workflow:
# 1. Validates clean working directory
# 2. Runs full test suite
# 3. Generates changelog via git-cliff
# 4. Prompts for version bump
# 5. Updates package.json version
# 6. Creates annotated tag
# 7. Pushes tag to trigger CI workflow
#
# Usage:
#   ./scripts/release.sh           # Interactive release
#   ./scripts/release.sh --dry-run # Preview without making changes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DRY_RUN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
    echo "No changes will be made to the repository."
    echo ""
fi

# Check for required tools
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        exit 1
    fi
}

check_tool git
check_tool git-cliff
check_tool jq
check_tool bun

# Validate clean working directory
echo -e "${BLUE}Checking working directory...${NC}"
if [[ -n "$(git status --porcelain)" ]]; then
    echo -e "${RED}Error: Working directory is not clean.${NC}"
    echo "Please commit or stash your changes before releasing."
    git status --short
    exit 1
fi
echo -e "${GREEN}Working directory is clean.${NC}"

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${YELLOW}Warning: Not on main branch (currently on '$CURRENT_BRANCH').${NC}"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Fetch latest tags
echo -e "${BLUE}Fetching latest tags...${NC}"
git fetch --tags

# Get current version
CURRENT_VERSION=$(jq -r '.version' package.json)
echo -e "${BLUE}Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Show unreleased changes
echo ""
echo -e "${BLUE}=== Unreleased Changes ===${NC}"
UNRELEASED_CHANGELOG=$(git cliff --unreleased --strip header 2>/dev/null || echo "No unreleased changes found.")
echo "$UNRELEASED_CHANGELOG"
echo ""

if [[ "$UNRELEASED_CHANGELOG" == "No unreleased changes found." ]]; then
    echo -e "${YELLOW}Warning: No conventional commits found since last release.${NC}"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Prompt for version bump type
echo -e "${BLUE}Select version bump type:${NC}"
echo "  1) patch ($CURRENT_VERSION -> $MAJOR.$MINOR.$((PATCH + 1)))"
echo "  2) minor ($CURRENT_VERSION -> $MAJOR.$((MINOR + 1)).0)"
echo "  3) major ($CURRENT_VERSION -> $((MAJOR + 1)).0.0)"
echo "  4) custom"
read -p "Choice [1-4]: " -n 1 -r BUMP_TYPE
echo ""

case $BUMP_TYPE in
    1)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
    2)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    3)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    4)
        read -p "Enter custom version (without 'v' prefix): " NEW_VERSION
        ;;
    *)
        echo -e "${RED}Invalid choice.${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}New version: ${GREEN}$NEW_VERSION${NC}"

# Run tests
echo ""
echo -e "${BLUE}Running tests...${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would run: bun run check && bun run test:unit${NC}"
else
    bun run check
    bun run test:unit
fi
echo -e "${GREEN}Tests passed.${NC}"

# Generate changelog for this release
echo ""
echo -e "${BLUE}Generating changelog...${NC}"
RELEASE_NOTES=$(git cliff --unreleased --tag "v$NEW_VERSION" --strip header 2>/dev/null || echo "Release v$NEW_VERSION")

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Release notes:${NC}"
    echo "$RELEASE_NOTES"
    echo ""
    echo -e "${YELLOW}[DRY RUN] Would update CHANGELOG.md${NC}"
else
    # Update CHANGELOG.md
    git cliff --tag "v$NEW_VERSION" -o CHANGELOG.md
    echo -e "${GREEN}CHANGELOG.md updated.${NC}"
fi

# Update package.json version
echo ""
echo -e "${BLUE}Updating package.json version...${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would update package.json version to $NEW_VERSION${NC}"
else
    # Use jq to update version
    tmp=$(mktemp)
    jq ".version = \"$NEW_VERSION\"" package.json > "$tmp" && mv "$tmp" package.json
    echo -e "${GREEN}package.json updated.${NC}"
fi

# Commit changes
echo ""
echo -e "${BLUE}Committing changes...${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would commit: chore(release): v$NEW_VERSION${NC}"
else
    git add package.json CHANGELOG.md
    git commit -m "chore(release): v$NEW_VERSION"
    echo -e "${GREEN}Changes committed.${NC}"
fi

# Create annotated tag
echo ""
echo -e "${BLUE}Creating annotated tag v$NEW_VERSION...${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would create tag: v$NEW_VERSION${NC}"
    echo -e "${YELLOW}Tag message:${NC}"
    echo "$RELEASE_NOTES" | head -50
else
    git tag -a "v$NEW_VERSION" -m "$RELEASE_NOTES"
    echo -e "${GREEN}Tag created.${NC}"
fi

# Push
echo ""
echo -e "${BLUE}Pushing to remote...${NC}"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}[DRY RUN] Would run: git push && git push --tags${NC}"
else
    read -p "Push commit and tag to origin? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        git push --tags
        echo -e "${GREEN}Pushed to origin.${NC}"
    else
        echo -e "${YELLOW}Skipped push. Run manually:${NC}"
        echo "  git push && git push --tags"
    fi
fi

echo ""
echo -e "${GREEN}=== Release Complete ===${NC}"
echo -e "Version: ${GREEN}v$NEW_VERSION${NC}"
echo ""
echo "The GitHub Actions workflow will now:"
echo "  1. Build the application"
echo "  2. Create a GitHub release with artifacts"
echo "  3. Publish to npm with provenance"
echo "  4. Sign artifacts with Sigstore"
echo ""
echo "Monitor progress at: https://github.com/p-b-d-z/projx-ui/actions"
