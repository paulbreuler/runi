---
name: Discord Chat Integration
overview: Plan for integrating Discord chat functionality into runi using Discord Bot API (REST + Gateway WebSocket), enabling users to view and send messages from Discord servers directly within the application.
todos:
  - id: discord-rust-backend
    content: 'Implement Rust backend: Discord gateway connection manager, REST API client, and Tauri commands'
    status: pending
  - id: discord-types-store
    content: Create TypeScript types and Zustand store for Discord state management
    status: pending
  - id: discord-event-bus
    content: Integrate Discord events into event bus system
    status: pending
  - id: discord-ui-components
    content: Build React components for Discord chat UI (panel, guild list, channel list, message list, input)
    status: pending
  - id: discord-settings
    content: Add Discord settings UI for bot token configuration
    status: pending
  - id: discord-tests
    content: Write tests for Rust backend and frontend components
    status: pending
isProject: false
---

# Discord Chat Integration Plan

**Status:** Draft

**Date:** 2026-01-15

**Author:** Claude (Auto)

---

## Context

This plan outlines the integration of Discord chat functionality into runi, allowing users to connect to Discord servers and interact with channels directly within the application. This feature will leverage Discord's Bot API (REST API + Gateway WebSocket) to provide a native, integrated chat experience rather than using iframe embeds.

**Why Discord Integration:**

- Enable team collaboration around API development
- Provide real-time communication for API discussions
- Support community-driven API documentation and feedback
- Align with runi's "partner, not just a tool" philosophy

**Why Bot API over Embeds:**

- Full control over UI/UX (matches runi's design language)
- Better integration with runi's event bus and state management
- No third-party dependencies (WidgetBot, Titan Embeds)
- Consistent with runi's local-first, no-cloud philosophy (bot runs locally)

---

## Architecture Decisions

### Decision 1: Rust Library Choice

**Choice:** Use `twilight-rs` ecosystem (`twilight-gateway`, `twilight-http`, `twilight-model`)

**Rationale:**

- Modular architecture aligns with runi's hexagonal architecture patterns
- Fine-grained control over gateway intents and event filtering
- Better performance with `simd-json` support
- Lower overhead - only include what we need
- Better fit for Tauri desktop app (resource-conscious)

**Alternatives considered:**

- `serenity` - Rejected because it's more "batteries-included" and adds unnecessary dependencies for our use case
- Direct WebSocket implementation - Rejected because it requires implementing Discord's complex gateway protocol from scratch

### Decision 2: Gateway Connection Management

**Choice:** Single persistent WebSocket connection managed in Rust backend, exposed via Tauri commands

**Rationale:**

- Gateway connection lives in Rust (better for long-lived connections)
- Frontend communicates via Tauri commands (REST-like) and listens to events
- Matches existing architecture pattern (HTTP requests handled in Rust, exposed via commands)
- Single connection per bot token (simpler than multi-shard for desktop app)

**Alternatives considered:**

- WebSocket directly in frontend - Rejected because bot tokens shouldn't be exposed to frontend
- Multiple shards - Rejected because desktop app won't need sharding (single user, limited servers)

### Decision 3: Message Content Intent

**Choice:** Require `MESSAGE_CONTENT` privileged intent, document setup requirements

**Rationale:**

- Required to read actual message content (not just metadata)
- Users must enable in Discord Developer Portal
- For bots in 100+ servers, Discord approval required (documented but not blocking)

**Alternatives considered:**

- Work without message content - Rejected because chat UI needs message text
- OAuth user tokens instead of bot tokens - Rejected because user tokens have different rate limits and security concerns

### Decision 4: State Management

**Choice:** Zustand store (`useDiscordStore`) + Event Bus for real-time updates

**Rationale:**

- Follows existing pattern (`useHistoryStore`, `useRequestStore`)
- Event bus for loose coupling (messages arrive via events)
- Store manages connection state, channels, messages
- Matches architectural patterns in `.cursorrules`

**Alternatives considered:**

- React Context - Rejected because Zustand is already established pattern
- Direct Tauri event listeners - Rejected because event bus provides better decoupling

### Decision 5: UI Integration

**Choice:** New dockable panel (similar to history panel) for Discord chat

**Rationale:**

- Reuses existing `DockablePanel` component
- Can be positioned bottom/left/right/floating (existing panel system)
- Consistent with runi's UI patterns
- Can be toggled via settings/store

**Alternatives considered:**

- Sidebar integration - Rejected because sidebar is for navigation, not content
- Separate window - Rejected because dockable panel provides better integration

---

## Implementation Plan

### Phase 1: Rust Backend - Discord Gateway Connection

**Files to create:**

- `src-tauri/src/infrastructure/discord/mod.rs` - Discord module entry
- `src-tauri/src/infrastructure/discord/gateway.rs` - WebSocket gateway connection manager
- `src-tauri/src/infrastructure/discord/rest.rs` - REST API client for sending messages
- `src-tauri/src/infrastructure/discord/models.rs` - Discord data models (messages, channels, guilds)
- `src-tauri/src/domain/discord.rs` - Domain types for Discord (exposed to frontend)

**Files to modify:**

- `src-tauri/Cargo.toml` - Add `twilight-gateway`, `twilight-http`, `twilight-model`, `twilight-cache-inmemory`
- `src-tauri/src/infrastructure/mod.rs` - Add `discord` module
- `src-tauri/src/infrastructure/commands.rs` - Add Discord command handlers
- `src-tauri/src/main.rs` - Register Discord commands and manage gateway lifecycle

**Key Components:**

1. **Gateway Manager** (`gateway.rs`):
   - Manages WebSocket connection to Discord Gateway
   - Handles reconnection logic
   - Filters events (only `MESSAGE_CREATE`, `MESSAGE_UPDATE`, `MESSAGE_DELETE`, `READY`)
   - Emits events to Tauri frontend via `tauri::Window::emit`

2. **REST Client** (`rest.rs`):
   - Sends messages via Discord REST API
   - Fetches channel history
   - Gets guild/channel list
   - Uses `twilight-http` with bot token

3. **Tauri Commands**:
   - `discord_connect(token: String)` - Connect to gateway
   - `discord_disconnect()` - Disconnect from gateway
   - `discord_get_guilds()` - Get list of guilds (servers)
   - `discord_get_channels(guild_id: String)` - Get channels for a guild
   - `discord_send_message(channel_id: String, content: String)` - Send a message
   - `discord_get_messages(channel_id: String, limit: Option<u64>)` - Get message history

### Phase 2: TypeScript Types

**Files to create:**

- `src/types/discord.ts` - TypeScript types for Discord entities

**Types needed:**

- `DiscordGuild` - Server information
- `DiscordChannel` - Channel information (text channels)
- `DiscordMessage` - Message with author, content, timestamp
- `DiscordConnectionState` - Connected, disconnected, connecting, error

**Note:** Types will be manually defined (not generated from Rust) since Discord models are complex and we'll use simplified versions.

### Phase 3: Frontend Store

**Files to create:**

- `src/stores/useDiscordStore.ts` - Zustand store for Discord state

**Store structure:**

```typescript
interface DiscordState {
  // Connection
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  botToken: string | null; // Stored securely (encrypted in settings)

  // Data
  guilds: DiscordGuild[];
  selectedGuildId: string | null;
  channels: DiscordChannel[];
  selectedChannelId: string | null;
  messages: Record<string, DiscordMessage[]>; // channelId -> messages

  // Actions
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  selectGuild: (guildId: string) => Promise<void>;
  selectChannel: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  loadMessages: (channelId: string, limit?: number) => Promise<void>;
}
```

**Files to modify:**

- `src/stores/useSettingsStore.ts` - Add Discord settings (bot token storage, panel visibility)

### Phase 4: Event Bus Integration

**Files to modify:**

- `src/events/bus.ts` - Add Discord event types

**New event types:**

- `discord.connected`
- `discord.disconnected`
- `discord.message-received`
- `discord.message-updated`
- `discord.message-deleted`
- `discord.error`

**Event flow:**

1. Rust gateway receives Discord event → emits Tauri event
2. Frontend Tauri event listener → emits to event bus
3. Components subscribe to event bus → update UI

### Phase 5: UI Components

**Files to create:**

- `src/components/Discord/DiscordPanel.tsx` - Main Discord chat panel
- `src/components/Discord/DiscordGuildList.tsx` - Server list sidebar
- `src/components/Discord/DiscordChannelList.tsx` - Channel list
- `src/components/Discord/DiscordMessageList.tsx` - Message list/chat view
- `src/components/Discord/DiscordMessageInput.tsx` - Message input field
- `src/components/Discord/DiscordConnectionStatus.tsx` - Connection status indicator

**Files to modify:**

- `src/components/Layout/MainLayout.tsx` - Add Discord panel option
- `src/routes/index.tsx` - Integrate Discord panel into layout

**Component structure:**

```
DiscordPanel (container)
├── DiscordConnectionStatus
├── DiscordGuildList (if connected)
├── DiscordChannelList (if guild selected)
├── DiscordMessageList (if channel selected)
└── DiscordMessageInput (if channel selected)
```

### Phase 6: Settings & Configuration

**Files to create:**

- `src/components/Settings/DiscordSettings.tsx` - Settings UI for bot token

**Files to modify:**

- `src/stores/useSettingsStore.ts` - Add `discordBotToken` (encrypted storage)
- Settings UI route/page - Add Discord settings section

**Security considerations:**

- Bot token stored in encrypted format (Tauri secure storage or encrypted file)
- Token never exposed to frontend JavaScript (only passed to Rust commands)
- Clear token option in settings

---

## Technical Details

### Rust Dependencies

Add to `Cargo.toml`:

```toml
[dependencies]
twilight-gateway = { version = "0.18", features = ["zlib-stock"] }
twilight-http = "0.20"
twilight-model = "0.20"
twilight-cache-inmemory = "0.21"
```

### Gateway Intents Required

```rust
use twilight_gateway::Intents;

let intents = Intents::GUILDS
    | Intents::GUILD_MESSAGES
    | Intents::MESSAGE_CONTENT; // Privileged intent
```

### Tauri Event Emission

In Rust gateway handler:

```rust
use tauri::Manager;

// When message received
window.emit("discord:message", message_data)?;
```

In frontend:

```typescript
import { listen } from '@tauri-apps/api/event';

listen('discord:message', (event) => {
  globalEventBus.emit('discord.message-received', event.payload);
});
```

### Error Handling

- Gateway reconnection handled automatically by `twilight-gateway`
- REST API errors returned as `Result<T, String>` in Tauri commands
- Frontend displays errors via store `error` state
- Connection failures show in `DiscordConnectionStatus` component

---

## File Structure

```
src-tauri/src/
├── infrastructure/
│   ├── discord/
│   │   ├── mod.rs
│   │   ├── gateway.rs      # WebSocket gateway manager
│   │   ├── rest.rs         # REST API client
│   │   └── models.rs       # Internal Discord models
│   └── commands.rs         # Add Discord commands
├── domain/
│   └── discord.rs          # Domain types (exposed to frontend)
└── main.rs                 # Register commands, manage gateway

src/
├── components/
│   └── Discord/
│       ├── DiscordPanel.tsx
│       ├── DiscordGuildList.tsx
│       ├── DiscordChannelList.tsx
│       ├── DiscordMessageList.tsx
│       ├── DiscordMessageInput.tsx
│       └── DiscordConnectionStatus.tsx
├── stores/
│   └── useDiscordStore.ts
├── types/
│   └── discord.ts
└── events/
    └── bus.ts              # Add Discord event types
```

---

## Testing Strategy

### Rust Tests

**Files to create:**

- `src-tauri/src/infrastructure/discord/gateway_test.rs` - Gateway connection tests
- `src-tauri/src/infrastructure/discord/rest_test.rs` - REST API tests

**Test approach:**

- Mock Discord Gateway responses (test gateway event handling)
- Mock REST API responses (test message sending, channel fetching)
- Integration tests with test Discord server (optional, requires test bot)

### Frontend Tests

**Files to create:**

- `src/stores/useDiscordStore.test.ts` - Store tests
- `src/components/Discord/DiscordPanel.test.tsx` - Component tests

**Test approach:**

- Mock Tauri commands
- Test store state transitions
- Test event bus integration
- Snapshot tests for UI components

---

## Security Considerations

1. **Bot Token Storage:**
   - Use Tauri's secure storage or encrypt token file
   - Never log token in console/logs
   - Clear token option in settings

2. **Token Validation:**
   - Validate token format before connection attempt
   - Handle invalid token errors gracefully

3. **Rate Limiting:**
   - Respect Discord's rate limits (handled by `twilight-http`)
   - Show rate limit errors in UI

4. **Permissions:**
   - Document required bot permissions (Read Messages, Send Messages, View Channels)
   - Validate bot has required permissions before operations

---

## Open Questions

- [ ] Should we support multiple bot tokens (multiple Discord accounts)?
- [ ] Should we cache messages locally (for offline viewing)?
- [ ] Should we support voice channels (future enhancement)?
- [ ] Should we support DMs (direct messages) in addition to guild channels?
- [ ] How should we handle message reactions/embeds (simplified view or full support)?

---

## References

- [Discord API Documentation](https://discord.com/developers/docs/intro)
- [Twilight.rs Documentation](https://twilight.rs/)
- [Discord Gateway Intents](https://discord.com/developers/docs/topics/gateway#gateway-intents)
- [Message Content Intent Policy](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Priviliged-Intent-FAQ)

---

## Implementation Phases

1. **Phase 1:** Rust backend - Gateway connection and REST client (Week 1)
2. **Phase 2:** TypeScript types and store (Week 1)
3. **Phase 3:** Event bus integration (Week 1)
4. **Phase 4:** Basic UI components (Week 2)
5. **Phase 5:** Settings and configuration (Week 2)
6. **Phase 6:** Testing and polish (Week 3)

**Total estimated time:** 3 weeks for MVP, additional time for polish and edge cases.
