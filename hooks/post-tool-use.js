#!/usr/bin/env node
/**
 * openclaw-bridge PostToolUse hook for Claude Code
 *
 * Formats output from openclaw-bridge MCP tools into a readable box.
 *
 * Claude Code hooks receive data via stdin as JSON:
 *   { "tool_name": "...", "tool_input": {...}, "tool_response": {...} }
 *
 * To register this hook, add to your project's .claude/settings.json:
 *   {
 *     "hooks": {
 *       "PostToolUse": [
 *         {
 *           "matcher": "mcp__openclaw__*",
 *           "hooks": [
 *             {
 *               "type": "command",
 *               "command": "node /path/to/openclaw-bridge/hooks/post-tool-use.js"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   }
 *
 * Or point to the installed package:
 *   "command": "node node_modules/openclaw-bridge/hooks/post-tool-use.js"
 */

const OUR_TOOLS = [
  'ask_agent',
  'list_agents',
  'agent_status',
  'discord_recent',
  'discord_send',
  'notify',
  'check_steering',
  'project_memory_read',
  'project_memory_write',
  'announce',
]

const TOOL_HEADERS = {
  ask_agent: '🤖 Agent Response',
  list_agents: '📋 Agent List',
  agent_status: '📊 Agent Status',
  discord_recent: '💬 Discord Messages',
  discord_send: '📤 Discord Send',
  notify: '🔔 Notification',
  check_steering: '🧭 Steering Check',
  project_memory_read: '🧠 Memory Read',
  project_memory_write: '🧠 Memory Write',
  announce: '⚡ Announce',
}

function getBaseName(toolName) {
  // Strip MCP server prefix (e.g. "mcp__openclaw__ask_agent" → "ask_agent")
  const parts = toolName.split('__')
  return parts[parts.length - 1]
}

function extractText(toolResponse) {
  if (!toolResponse) return '(no response)'
  if (typeof toolResponse === 'string') return toolResponse

  // MCP content array format
  if (toolResponse.content && Array.isArray(toolResponse.content)) {
    return toolResponse.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
  }

  // Fallback
  return JSON.stringify(toolResponse, null, 2)
}

function formatBox(header, body, isError) {
  const BOX_WIDTH = 52
  const INNER_WIDTH = BOX_WIDTH - 4 // │ content │

  const errorTag = isError ? ' ⚠' : ''
  const titleLine = `🔗 ${header}${errorTag}`
  const topPad = Math.max(0, BOX_WIDTH - 4 - titleLine.length)

  const lines = []
  lines.push(`┌─ ${titleLine} ${'─'.repeat(topPad)}┐`)

  const bodyLines = body.split('\n').slice(0, 25)
  for (const line of bodyLines) {
    // Wrap long lines
    if (line.length <= INNER_WIDTH) {
      lines.push(`│ ${line.padEnd(INNER_WIDTH)} │`)
    } else {
      for (let i = 0; i < line.length; i += INNER_WIDTH) {
        const chunk = line.slice(i, i + INNER_WIDTH)
        lines.push(`│ ${chunk.padEnd(INNER_WIDTH)} │`)
      }
    }
  }

  if (body.split('\n').length > 25) {
    lines.push(`│ ${'… (truncated)'.padEnd(INNER_WIDTH)} │`)
  }

  lines.push(`└${'─'.repeat(BOX_WIDTH - 2)}┘`)
  return lines.join('\n')
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) {
    input += chunk
  }

  if (!input.trim()) {
    process.exit(0)
  }

  let data
  try {
    data = JSON.parse(input)
  } catch {
    // Not JSON — pass through
    process.exit(0)
  }

  const toolName = data.tool_name || data.toolName || ''
  const baseName = getBaseName(toolName)

  if (!OUR_TOOLS.includes(baseName)) {
    process.exit(0)
  }

  const toolResponse = data.tool_response || data.toolResponse || data.response || {}
  const isError = Boolean(toolResponse.isError)
  const text = extractText(toolResponse)
  const header = TOOL_HEADERS[baseName] || `Tool: ${baseName}`

  const box = formatBox(header, text, isError)
  process.stdout.write('\n' + box + '\n\n')

  process.exit(0)
}

main().catch((err) => {
  process.stderr.write(`hook error: ${err.message}\n`)
  process.exit(0) // Don't block Claude Code on hook failure
})
