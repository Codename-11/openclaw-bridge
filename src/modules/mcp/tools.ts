import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join, resolve } from 'path'
import type { GatewayClient } from '../../core/gateway.js'

// Bailey's DM channel for notifications
const NOTIFY_CHANNEL = '1485447564965969972'

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  const dir = filePath.substring(0, filePath.lastIndexOf('/'))
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function buildToolHandlers(gateway: GatewayClient) {
  return {
    async ask_agent(args: Record<string, unknown>) {
      const agent = args?.agent as string
      const message = args?.message as string

      if (!agent || !message) {
        return {
          content: [{ type: 'text', text: "Error: 'agent' and 'message' are required." }],
          isError: true,
        }
      }

      try {
        const text = await gateway.askAgent(agent, message)
        return { content: [{ type: 'text', text }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async list_agents(_args: Record<string, unknown>) {
      try {
        const agents = await gateway.listAgents()

        if (agents.length === 0) {
          return { content: [{ type: 'text', text: 'No agents found.' }] }
        }

        const lines = agents.map((a) => `- ${a.name} (id: ${a.id})`)
        return {
          content: [
            {
              type: 'text',
              text: `Available OpenClaw agents:\n${lines.join('\n')}`,
            },
          ],
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async agent_status(args: Record<string, unknown>) {
      const agent = args?.agent as string

      if (!agent) {
        return {
          content: [{ type: 'text', text: "Error: 'agent' is required." }],
          isError: true,
        }
      }

      try {
        const agents = await gateway.listAgents()
        const match = agents.find(
          (a) =>
            a.id === agent ||
            a.id === `openclaw:${agent}` ||
            a.name.toLowerCase() === agent.toLowerCase()
        )

        if (!match) {
          return {
            content: [
              {
                type: 'text',
                text: `Agent '${agent}' not found. Run list_agents to see available agents.`,
              },
            ],
          }
        }

        const lastActivity = match.created
          ? new Date(match.created * 1000).toISOString()
          : 'unknown'

        return {
          content: [
            {
              type: 'text',
              text: [
                `Agent: ${match.name}`,
                `Model ID: ${match.id}`,
                `Owned by: ${match.ownedBy ?? 'unknown'}`,
                `Last activity: ${lastActivity}`,
                `Status: active`,
              ].join('\n'),
            },
          ],
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async discord_recent(args: Record<string, unknown>) {
      const channel = (args?.channel as string) || 'ai'
      const limit = typeof args?.limit === 'number' ? args.limit : 10

      try {
        const text = await gateway.askAgentForDiscord('daemon', channel, limit)
        return { content: [{ type: 'text', text }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async discord_send(args: Record<string, unknown>) {
      const channel = (args?.channel as string) || 'ai'
      const messageText = args?.message as string

      if (!messageText) {
        return {
          content: [{ type: 'text', text: "Error: 'message' is required." }],
          isError: true,
        }
      }

      try {
        const result = await gateway.askAgentToSendDiscord('daemon', channel, messageText)
        return { content: [{ type: 'text', text: result }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async notify(args: Record<string, unknown>) {
      const messageText = args?.message as string
      const urgent = Boolean(args?.urgent)

      if (!messageText) {
        return {
          content: [{ type: 'text', text: "Error: 'message' is required." }],
          isError: true,
        }
      }

      const prefix = urgent ? '🚨 [CC]' : '🔔 [CC]'
      const formatted = `${prefix} ${messageText}`

      try {
        const result = await gateway.askAgentToNotify('daemon', NOTIFY_CHANNEL, formatted)
        return { content: [{ type: 'text', text: `Notification sent: ${result}` }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async check_steering(_args: Record<string, unknown>) {
      const steeringPath = join(homedir(), '.openclaw-bridge', 'steering.json')

      try {
        const data = readJsonFile<{ messages?: Array<{ from: string; text: string; timestamp: string }> }>(steeringPath)

        if (!data || !data.messages || data.messages.length === 0) {
          return { content: [{ type: 'text', text: 'No pending steering messages.' }] }
        }

        const lines = data.messages.map(
          (m) => `[${m.timestamp}] ${m.from}: ${m.text}`
        )
        const output = `Pending steering messages:\n\n${lines.join('\n')}`

        // Clear after reading
        writeJsonFile(steeringPath, { messages: [] })

        return { content: [{ type: 'text', text: output }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async project_memory_read(args: Record<string, unknown>) {
      const key = args?.key as string | undefined
      const memoryPath = resolve(process.cwd(), '.openclaw-bridge', 'memory.json')

      try {
        const data = readJsonFile<Array<{ key: string; value: string; timestamp: string }>>(memoryPath)

        if (!data || data.length === 0) {
          return { content: [{ type: 'text', text: 'No project memory found.' }] }
        }

        const entries = key
          ? data.filter((e) => e.key === key)
          : data

        if (entries.length === 0) {
          return { content: [{ type: 'text', text: `No memory entries found for key: ${key}` }] }
        }

        const lines = entries.map((e) => `[${e.timestamp}] ${e.key}: ${e.value}`)
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async project_memory_write(args: Record<string, unknown>) {
      const key = args?.key as string
      const value = args?.value as string

      if (!key || !value) {
        return {
          content: [{ type: 'text', text: "Error: 'key' and 'value' are required." }],
          isError: true,
        }
      }

      const memoryPath = resolve(process.cwd(), '.openclaw-bridge', 'memory.json')

      try {
        const existing = readJsonFile<Array<{ key: string; value: string; timestamp: string }>>(memoryPath) ?? []
        const entry = { key, value, timestamp: new Date().toISOString() }
        existing.push(entry)
        writeJsonFile(memoryPath, existing)

        return { content: [{ type: 'text', text: `Memory written: ${key} = ${value}` }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },

    async announce(args: Record<string, unknown>) {
      const status = args?.status as string
      const channel = (args?.channel as string) || 'ai'

      if (!status) {
        return {
          content: [{ type: 'text', text: "Error: 'status' is required." }],
          isError: true,
        }
      }

      const formatted = `⚡ [Claude Code] ${status}`

      try {
        const result = await gateway.askAgentToSendDiscord('daemon', channel, formatted)
        return { content: [{ type: 'text', text: `Announced to #${channel}: ${result}` }] }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { content: [{ type: 'text', text: msg }], isError: true }
      }
    },
  }
}

export const TOOL_DEFINITIONS = [
  {
    name: 'ask_agent',
    description:
      "Send a message to an OpenClaw agent and get their response. Use agent names like 'daemon', 'soren', 'ash', 'mira', 'jace', 'pip'.",
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description: "The agent to message (e.g. 'daemon', 'soren', 'ash')",
        },
        message: {
          type: 'string',
          description: 'The message to send to the agent',
        },
      },
      required: ['agent', 'message'],
    },
  },
  {
    name: 'list_agents',
    description: 'List all available OpenClaw agents from the gateway.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'agent_status',
    description: 'Check the status of a specific OpenClaw agent session.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description: 'The agent name to check status for',
        },
      },
      required: ['agent'],
    },
  },
  {
    name: 'discord_recent',
    description:
      'Read recent messages from a Discord channel via the OpenClaw gateway. Returns formatted message list.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Discord channel name to read from (default: "ai")',
        },
        limit: {
          type: 'number',
          description: 'Number of recent messages to fetch (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'discord_send',
    description: 'Send a message to a Discord channel via the OpenClaw gateway.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Discord channel name to send to (default: "ai")',
        },
        message: {
          type: 'string',
          description: 'The message text to send',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'notify',
    description:
      "Send a notification to Bailey's Discord DMs. Prefixes with 🔔 [CC] or 🚨 [CC] if urgent.",
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The notification message to send',
        },
        urgent: {
          type: 'boolean',
          description: 'If true, uses 🚨 prefix instead of 🔔',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'check_steering',
    description:
      'Check for pending steering messages from Daemon (written to ~/.openclaw-bridge/steering.json). Clears messages after reading.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'project_memory_read',
    description:
      'Read shared project memory from .openclaw-bridge/memory.json in the current directory. Useful for decisions, context, and notes shared across Claude Code sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Specific key to read (omit to read all entries)',
        },
      },
      required: [],
    },
  },
  {
    name: 'project_memory_write',
    description:
      'Write a key/value entry to .openclaw-bridge/memory.json in the current directory. Appends with timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Memory key (e.g. "architecture_decision", "current_task")',
        },
        value: {
          type: 'string',
          description: 'Memory value to store',
        },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'announce',
    description:
      'Post a status announcement to a Discord channel formatted as "⚡ [Claude Code] {status}". Use for progress updates, completions, and errors.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Status message to announce',
        },
        channel: {
          type: 'string',
          description: 'Discord channel to post to (default: "ai")',
        },
      },
      required: ['status'],
    },
  },
]
