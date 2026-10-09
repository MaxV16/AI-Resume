#!/bin/bash
set -e

INSTALL_DIR="/usr/local/lib/ai-resume-builder"
BIN_LINK="/usr/local/bin/ai-resume-builder"

echo "Uninstalling AI Resume Builder..."

rm -f "$BIN_LINK"
rm -rf "$INSTALL_DIR"

echo "Done."
