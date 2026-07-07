#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building PixInsight workflow docs with MkDocs..."
python3 -m mkdocs build --config-file ./pixinsight-workflow-src/mkdocs.yml --site-dir "$PWD/pixinsight-workflow"

echo "Building Jekyll site..."
bundle exec jekyll build

echo "Starting interactive Jekyll server (Ctrl+C to stop)..."
HOST="${JEKYLL_HOST:-0.0.0.0}"
PORT="${JEKYLL_PORT:-4000}"
echo "Serving on http://${HOST}:${PORT}"
bundle exec jekyll serve --watch --host "$HOST" --port "$PORT"