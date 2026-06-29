#!/bin/bash
# Clean up build artifacts and temporary files from the repository
# Usage: ./bin/clean.sh

set -e

echo "🧹 Cleaning up repository..."

# Jekyll build output
if [ -d "_site" ]; then
    rm -rf _site/
    echo "  ✓ Removed _site/"
fi

if [ -d ".jekyll-cache" ]; then
    rm -rf .jekyll-cache/
    echo "  ✓ Removed .jekyll-cache/"
fi

if [ -d ".sass-cache" ]; then
    rm -rf .sass-cache/
    echo "  ✓ Removed .sass-cache/"
fi

# MkDocs build output
if [ -d "pixinsight-workflow-src/pixinsight-workflow" ]; then
    rm -rf pixinsight-workflow-src/pixinsight-workflow/
    echo "  ✓ Removed pixinsight-workflow-src/pixinsight-workflow/"
fi

if [ -d "pixinsight-workflow-src/_site" ]; then
    rm -rf pixinsight-workflow-src/_site/
    echo "  ✓ Removed pixinsight-workflow-src/_site/"
fi

if [ -d "pixinsight-workflow-src/.jekyll-cache" ]; then
    rm -rf pixinsight-workflow-src/.jekyll-cache/
    echo "  ✓ Removed pixinsight-workflow-src/.jekyll-cache/"
fi

# MkDocs site directory (generated in repo root)
if [ -d "pixinsight-workflow" ] && [ ! -f "pixinsight-workflow/stylesheets/extra.css" ]; then
    rm -rf pixinsight-workflow/*
    echo "  ✓ Removed pixinsight-workflow/* (except stylesheets)"
fi

# Python cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
echo "  ✓ Removed Python cache files"

# Python virtual environments (if any)
if [ -d ".venv" ]; then
    rm -rf .venv/
    echo "  ✓ Removed .venv/"
fi

if [ -d "venv" ]; then
    rm -rf venv/
    echo "  ✓ Removed venv/"
fi

# Node modules (if any)
if [ -d "node_modules" ]; then
    rm -rf node_modules/
    echo "  ✓ Removed node_modules/"
fi

# Log files
find . -type f -name "*.log" -delete 2>/dev/null || true
echo "  ✓ Removed log files"

echo ""
echo "✨ Cleanup complete!"
