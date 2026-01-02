#!/bin/bash
# ============================================
# GenAI Python Course - Documentation Setup
# ============================================
# This script prepares the docs folder for MkDocs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/docs"

echo "🔧 Setting up documentation..."

# Create docs directory structure
mkdir -p "$DOCS_DIR"/{stylesheets,javascripts}

# Copy/Link Module folders to docs
for MODULE in Module-01 Module-02 Module-03 Module-04 Module-05 Module-06 Module-07 Module-08 Module-09 Module-10 Module-11 Module-12 Module-13 Module-14 Module-15 Module-16; do
    if [ -d "$SCRIPT_DIR/$MODULE" ]; then
        # Create symlink (or copy for Windows compatibility)
        if [ ! -e "$DOCS_DIR/$MODULE" ]; then
            ln -sf "../$MODULE" "$DOCS_DIR/$MODULE"
            echo "  ✓ Linked $MODULE"
        fi
    fi
done

# Check if MkDocs is installed
if ! command -v mkdocs &> /dev/null; then
    echo ""
    echo "📦 Installing MkDocs dependencies..."
    pip install -r "$SCRIPT_DIR/requirements-docs.txt"
fi

echo ""
echo "✅ Documentation setup complete!"
echo ""
echo "Commands:"
echo "  mkdocs serve     # Local preview at http://127.0.0.1:8000"
echo "  mkdocs build     # Build static site to ./site"
echo "  mkdocs gh-deploy # Deploy to GitHub Pages"
echo ""
