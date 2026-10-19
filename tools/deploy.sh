#!/bin/bash
# Deploy: build from the current main commit and publish site/ to the gh-pages branch with a normal push (never force).
# GitHub Actions is turned off on this account, so Pages serves the gh-pages branch.
set -e
cd "$(dirname "$0")/.."
test -z "$(git status --porcelain)" || { echo "Commit your changes first"; exit 1; }
SHA=$(git rev-parse HEAD)
node tools/checkdecks.js && node tests/emdash.js && node tests/unit.js
COMMIT=$SHA node build.js
rm -rf /tmp/lsa-pages && git fetch -q origin gh-pages 2>/dev/null || true
if git rev-parse -q --verify origin/gh-pages >/dev/null; then git worktree add -q -B gh-pages /tmp/lsa-pages origin/gh-pages; else git worktree add -q --orphan -b gh-pages /tmp/lsa-pages; fi
find /tmp/lsa-pages -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r site/. /tmp/lsa-pages/
(cd /tmp/lsa-pages && git add -A && git commit -qm "Deploy build of ${SHA:0:7}" && git push -q origin gh-pages)
git worktree remove --force /tmp/lsa-pages
echo "Deployed $(node -p "require('./site/version.json').label")"
