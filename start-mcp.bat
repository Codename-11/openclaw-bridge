@echo off
cd /d "%~dp0"
if not exist dist (
    npm run build
)
node dist\modules\mcp\index.js
