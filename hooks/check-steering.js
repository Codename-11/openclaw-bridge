#!/usr/bin/env node
/**
 * Claude Code UserPromptSubmit hook — auto-checks for steering messages
 * from OpenClaw agents (Daemon, etc.) before each prompt.
 * 
 * Reads ~/.openclaw-bridge/steering.json, displays messages, clears them.
 * 
 * Register in .claude/settings.json:
 * {
 *   "hooks": {
 *     "UserPromptSubmit": [{
 *       "matcher": "",
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node C:/Users/YOUR_USER/.openclaw-bridge/app/hooks/check-steering.js"
 *       }]
 *     }]
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const steeringPath = path.join(os.homedir(), '.openclaw-bridge', 'steering.json');

try {
  if (!fs.existsSync(steeringPath)) process.exit(0);
  
  const raw = fs.readFileSync(steeringPath, 'utf-8');
  const data = JSON.parse(raw);
  
  if (!data.messages || data.messages.length === 0) process.exit(0);
  
  // Display steering messages
  const width = 60;
  const border = '─'.repeat(width);
  
  console.error('');
  console.error(`┌─ 🎯 Steering from OpenClaw ${border.slice(28)}┐`);
  
  for (const msg of data.messages) {
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'now';
    const header = `  [${time}] ${msg.from || 'agent'}:`;
    console.error(`│${header.padEnd(width)}│`);
    
    // Word-wrap the message text
    const words = msg.text.split(' ');
    let line = '  ';
    for (const word of words) {
      if ((line + ' ' + word).length > width - 2) {
        console.error(`│${line.padEnd(width)}│`);
        line = '  ' + word;
      } else {
        line += (line === '  ' ? '' : ' ') + word;
      }
    }
    if (line.trim()) {
      console.error(`│${line.padEnd(width)}│`);
    }
    console.error(`│${''.padEnd(width)}│`);
  }
  
  console.error(`└${border}┘`);
  console.error('');
  
  // Clear the steering file after displaying
  fs.writeFileSync(steeringPath, JSON.stringify({ messages: [] }));
  
} catch (err) {
  // Silent fail — don't block CC
  process.exit(0);
}
