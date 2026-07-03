#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building PixInsight workflow docs with MkDocs..."
python3 -m mkdocs build --config-file ./pixinsight-workflow-src/mkdocs.yml --site-dir "$PWD/pixinsight-workflow"

echo "Building Jekyll site..."
bundle exec jekyll build

echo "Starting interactive Jekyll server (Ctrl+C to stop)..."
bundle exec jekyll serve --watch