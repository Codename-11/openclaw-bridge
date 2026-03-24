#!/bin/bash
# openclaw-bridge installer for macOS/Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/Codename-11/openclaw-bridge/main/install.sh | bash
# Or: ./install.sh [install|update|uninstall|setup]

set -e

REPO_URL="https://github.com/Codename-11/openclaw-bridge.git"
INSTALL_DIR="$HOME/.openclaw-bridge/app"
BIN_DIR="$HOME/.openclaw-bridge/bin"
ACTION="${1:-install}"

step() { echo -e "\n\033[36m=> $1\033[0m"; }
ok() { echo -e "   \033[32m$1\033[0m"; }
warn() { echo -e "   \033[33m$1\033[0m"; }

install_bridge() {
    step "Installing openclaw-bridge..."

    mkdir -p "$INSTALL_DIR" "$BIN_DIR"

    if [ -d "$INSTALL_DIR/.git" ]; then
        ok "Updating existing installation..."
        cd "$INSTALL_DIR" && git pull --quiet
    else
        rm -rf "$INSTALL_DIR"
        git clone --quiet "$REPO_URL" "$INSTALL_DIR"
    fi

    # Create bin wrappers
    cat > "$BIN_DIR/openclaw-bridge-mcp" << EOF
#!/bin/bash
node "$INSTALL_DIR/dist/modules/mcp/index.js" "\$@"
EOF
    chmod +x "$BIN_DIR/openclaw-bridge-mcp"

    cat > "$BIN_DIR/openclaw-bridge" << EOF
#!/bin/bash
node -e "require('$INSTALL_DIR/dist/cli/start.js').runStart(process.argv.slice(1))" -- "\$@"
EOF
    chmod +x "$BIN_DIR/openclaw-bridge"

    cat > "$BIN_DIR/openclaw-bridge-setup" << EOF
#!/bin/bash
node -e "require('$INSTALL_DIR/dist/cli/setup.js').runSetup()"
EOF
    chmod +x "$BIN_DIR/openclaw-bridge-setup"

    # Add to PATH
    SHELL_RC=""
    if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
    fi

    if [ -n "$SHELL_RC" ] && ! grep -q "openclaw-bridge/bin" "$SHELL_RC" 2>/dev/null; then
        echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$SHELL_RC"
        ok "Added to PATH in $SHELL_RC"
        warn "Restart your terminal or: source $SHELL_RC"
    fi
    export PATH="$BIN_DIR:$PATH"

    ok "Installed to: $INSTALL_DIR"
    echo ""
    step "Run setup wizard:"
    echo "   openclaw-bridge-setup"
    echo ""
    step "Register MCP with Claude Code:"
    echo "   claude mcp add openclaw -- openclaw-bridge-mcp"
    echo ""
}

uninstall_bridge() {
    step "Uninstalling openclaw-bridge..."

    claude mcp remove openclaw 2>/dev/null || true
    ok "Removed MCP from Claude Code"

    rm -rf "$INSTALL_DIR" "$BIN_DIR"
    ok "Removed installation"

    read -p "   Remove config (~/.openclaw-bridge/config.json)? [y/N] " confirm
    if [ "$confirm" = "y" ]; then
        rm -rf "$HOME/.openclaw-bridge"
        ok "Removed config"
    else
        warn "Config preserved"
    fi

    # Clean PATH from shell rc
    for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
        if [ -f "$rc" ]; then
            sed -i.bak '/openclaw-bridge\/bin/d' "$rc" && rm -f "${rc}.bak"
        fi
    done
    ok "Cleaned PATH"
    ok "Uninstall complete"
}

update_bridge() {
    step "Updating openclaw-bridge..."
    if [ ! -d "$INSTALL_DIR/.git" ]; then
        warn "Not installed. Run install first."
        return
    fi
    cd "$INSTALL_DIR" && git pull --quiet
    ok "Updated to latest"
}

setup_bridge() {
    if [ ! -f "$INSTALL_DIR/dist/cli/setup.js" ]; then
        warn "Not installed. Installing first..."
        install_bridge
    fi
    node "$INSTALL_DIR/dist/cli/setup.js"
}

case "$ACTION" in
    install)   install_bridge ;;
    update)    update_bridge ;;
    uninstall) uninstall_bridge ;;
    setup)     setup_bridge ;;
    *)         install_bridge ;;
esac
