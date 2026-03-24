@echo off
cd /d "%~dp0"
if not exist dist (
    npm run build
)
node -e "require('./dist/cli/start.js').runStart(['mcp'])"
