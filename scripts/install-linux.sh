#!/bin/bash
set -e

INSTALL_DIR="$HOME/.ai-resume-builder"
BIN_LINK="/usr/local/bin/ai-resume-builder"

echo "Installing AI Resume Builder..."

mkdir -p "$INSTALL_DIR"

cp index.html "$INSTALL_DIR/"
cp styles.css "$INSTALL_DIR/"
cp app.js "$INSTALL_DIR/"

cat > "$INSTALL_DIR/run.sh" << 'RUNEOF'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
open "$DIR/index.html"
RUNEOF

chmod +x "$INSTALL_DIR/run.sh"

ln -sf "$INSTALL_DIR/run.sh" "$BIN_LINK"

echo "Done. Run with: ai-resume-builder"
