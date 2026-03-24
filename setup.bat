@echo off
echo Setting up openclaw-bridge...
cd /d "%~dp0"
call npm install
call npm install @anthropic-ai/claude-code
call npm run build
echo.
echo Setup complete. Running setup wizard...
node dist\cli\setup.js
pause
