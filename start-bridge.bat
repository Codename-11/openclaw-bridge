@echo off
echo Starting openclaw-bridge...
cd /d "%~dp0"
if not exist node_modules\@anthropic-ai\claude-code (
    echo Installing Claude Code SDK...
    npm install @anthropic-ai/claude-code --no-optional 2>nul
)
if not exist dist (
    echo Building...
    npm run build
)
node dist\cli\start.js bridge
pause
