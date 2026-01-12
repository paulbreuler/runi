# Ralph Run 3: Request Builder Tabs

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) and Run 2 (Layout UI) must be complete.

**This Run's Focus:** Build the tabbed request builder with headers, body, params, and auth using shadcn-svelte components.

## Component Library: shadcn-svelte (Continued from Run 2)

Build on the shadcn-svelte foundation established in Run 2. Key components for this run:

| Component                                                          | Use Case                                            | Reference                         |
| ------------------------------------------------------------------ | --------------------------------------------------- | --------------------------------- |
| [Tabs](https://www.shadcn-svelte.com/docs/components/tabs)         | Request builder sections (Params/Headers/Body/Auth) | Tab container and individual tabs |
| [Input](https://www.shadcn-svelte.com/docs/components/input)       | Key-value inputs, auth fields                       | Text input with validation        |
| [Textarea](https://www.shadcn-svelte.com/docs/components/textarea) | Body editor base                                    | Multi-line with auto-resize       |
| [Select](https://www.shadcn-svelte.com/docs/components/select)     | Content-type selector, auth type selector           | Dropdown with options             |
| [Checkbox](https://www.shadcn-svelte.com/docs/components/checkbox) | Enable/disable key-value pairs                      | Toggle individual rows            |
| [Button](https://www.shadcn-svelte.com/docs/components/button)     | Add/remove buttons, apply actions                   | Icon buttons for row operations   |

### Additional Dependencies

```bash
# Syntax highlighting for body editor
npm install @codemirror/lang-json @codemirror/theme-one-dark codemirror svelte-codemirror-editor

# Or use Shiki for read-only highlighting
npm install shiki
```

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### Tabs Interface

- [ ] Tabbed interface component using shadcn Tabs
- [ ] Tabs: Params | Headers | Body | Auth
- [ ] Active tab indicator with theme-aware styling
- [ ] Keyboard navigation between tabs (Arrow keys)

### Key-Value Editor Component (Reusable)

- [ ] Reusable key-value pair editor with shadcn Input
- [ ] Key-value pairs with add/remove buttons (lucide-svelte icons: Plus, Trash2)
- [ ] Checkbox to enable/disable individual pairs using shadcn Checkbox
- [ ] Auto-focus on new row when added
- [ ] Delete with keyboard (Backspace on empty row)

### Headers Tab

- [ ] Uses key-value editor component
- [ ] Auto-suggest for common header names (Content-Type, Accept, Authorization)
- [ ] Validation for header format

### Query Params Tab

- [ ] Uses key-value editor component
- [ ] URL preview showing query string being built
- [ ] URL encoding applied automatically

### Body Tab

- [ ] Content-type selector using shadcn Select:
  - none
  - JSON (`application/json`)
  - form-data (`multipart/form-data`)
  - form-urlencoded (`application/x-www-form-urlencoded`)
  - raw (plain text)
- [ ] JSON editor using CodeMirror with syntax highlighting
- [ ] JSON validation with error indicator
- [ ] Prettify button for JSON formatting
- [ ] Form-data editor using key-value component
- [ ] Form-urlencoded editor using key-value component

### Auth Tab

- [ ] Auth type selector using shadcn Select:
  - None
  - API Key
  - Bearer Token
  - Basic Auth
- [ ] API Key auth:
  - Key name input
  - Key value input
  - Placement selector (Header / Query Param)
- [ ] Bearer Token auth:
  - Token input with password masking toggle
- [ ] Basic Auth:
  - Username input
  - Password input with masking
  - Preview of Base64-encoded value

### Integration

- [ ] Request params integrated with `execute_request` command
- [ ] Auth applied to request headers automatically
- [ ] Body content-type header set automatically

### Storybook Stories (Required)

- [ ] `TabPanel.stories.svelte` - All tabs, keyboard navigation
- [ ] `KeyValueEditor.stories.svelte` - Empty, with rows, disabled rows
- [ ] `HeadersTab.stories.svelte` - Common headers, auto-suggest
- [ ] `ParamsTab.stories.svelte` - URL preview with params
- [ ] `BodyTab.stories.svelte` - JSON/form-data/raw modes
- [ ] `AuthTab.stories.svelte` - All auth types (None, API Key, Bearer, Basic)
- [ ] `JsonEditor.stories.svelte` - Valid/invalid JSON, prettify

### Quality Gates

- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `just storybook` runs without errors
- [ ] Component tests pass (`npm test`)
- [ ] All components use Svelte 5 runes
- [ ] `data-testid` attributes on ALL interactive elements

## Sample Code Reference

### TabPanel.svelte (Tabs Container)

```svelte
<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';

  let activeTab = $state('params');
</script>

<Tabs bind:value={activeTab} class="w-full">
  <TabsList class="grid w-full grid-cols-4">
    <TabsTrigger value="params" data-testid="tab-params">Params</TabsTrigger>
    <TabsTrigger value="headers" data-testid="tab-headers">Headers</TabsTrigger>
    <TabsTrigger value="body" data-testid="tab-body">Body</TabsTrigger>
    <TabsTrigger value="auth" data-testid="tab-auth">Auth</TabsTrigger>
  </TabsList>
  <TabsContent value="params">
    <ParamsTab />
  </TabsContent>
  <TabsContent value="headers">
    <HeadersTab />
  </TabsContent>
  <TabsContent value="body">
    <BodyTab />
  </TabsContent>
  <TabsContent value="auth">
    <AuthTab />
  </TabsContent>
</Tabs>
```

### KeyValueEditor.svelte (Reusable)

```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Plus, Trash2 } from 'lucide-svelte';

  interface KeyValuePair {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
  }

  interface Props {
    pairs: KeyValuePair[];
    keyPlaceholder?: string;
    valuePlaceholder?: string;
  }

  let {
    pairs = $bindable([]),
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value',
  }: Props = $props();

  function addPair(): void {
    pairs = [...pairs, { id: crypto.randomUUID(), key: '', value: '', enabled: true }];
  }

  function removePair(id: string): void {
    pairs = pairs.filter((p) => p.id !== id);
  }
</script>

<div class="space-y-2">
  {#each pairs as pair (pair.id)}
    <div class="flex items-center gap-2">
      <Checkbox bind:checked={pair.enabled} data-testid={`kv-enabled-${pair.id}`} />
      <Input
        bind:value={pair.key}
        placeholder={keyPlaceholder}
        class="flex-1"
        data-testid={`kv-key-${pair.id}`}
      />
      <Input
        bind:value={pair.value}
        placeholder={valuePlaceholder}
        class="flex-1"
        data-testid={`kv-value-${pair.id}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onclick={() => removePair(pair.id)}
        data-testid={`kv-remove-${pair.id}`}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  {/each}
  <Button variant="outline" size="sm" onclick={addPair} data-testid="kv-add">
    <Plus size={16} class="mr-1" /> Add
  </Button>
</div>
```

### AuthTab.svelte (Auth Configuration)

```svelte
<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  type AuthType = 'none' | 'api-key' | 'bearer' | 'basic';

  let authType = $state<AuthType>('none');
  let apiKeyName = $state('');
  let apiKeyValue = $state('');
  let apiKeyPlacement = $state<'header' | 'query'>('header');
  let bearerToken = $state('');
  let basicUsername = $state('');
  let basicPassword = $state('');

  let basicEncoded = $derived(
    authType === 'basic' && basicUsername && basicPassword
      ? btoa(`${basicUsername}:${basicPassword}`)
      : ''
  );
</script>

<div class="space-y-4 p-4">
  <div class="space-y-2">
    <Label>Auth Type</Label>
    <Select bind:value={authType}>
      <SelectTrigger data-testid="auth-type-select">
        <SelectValue placeholder="Select auth type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        <SelectItem value="api-key">API Key</SelectItem>
        <SelectItem value="bearer">Bearer Token</SelectItem>
        <SelectItem value="basic">Basic Auth</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {#if authType === 'api-key'}
    <div class="space-y-2">
      <Input
        bind:value={apiKeyName}
        placeholder="Key name (e.g., X-API-Key)"
        data-testid="api-key-name"
      />
      <Input
        bind:value={apiKeyValue}
        placeholder="Key value"
        type="password"
        data-testid="api-key-value"
      />
      <Select bind:value={apiKeyPlacement}>
        <SelectTrigger data-testid="api-key-placement">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="header">Header</SelectItem>
          <SelectItem value="query">Query Param</SelectItem>
        </SelectContent>
      </Select>
    </div>
  {:else if authType === 'bearer'}
    <Input
      bind:value={bearerToken}
      placeholder="Token"
      type="password"
      data-testid="bearer-token"
    />
  {:else if authType === 'basic'}
    <div class="space-y-2">
      <Input bind:value={basicUsername} placeholder="Username" data-testid="basic-username" />
      <Input
        bind:value={basicPassword}
        placeholder="Password"
        type="password"
        data-testid="basic-password"
      />
      {#if basicEncoded}
        <p class="text-xs text-muted-foreground font-mono">
          Authorization: Basic {basicEncoded}
        </p>
      {/if}
    </div>
  {/if}
</div>
```

### Sample Story: KeyValueEditor.stories.svelte

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KeyValueEditor from './KeyValueEditor.svelte';

  const { Story } = defineMeta({
    title: 'Request/KeyValueEditor',
    component: KeyValueEditor,
    tags: ['autodocs'],
  });
</script>

<Story name="Empty" args={{ pairs: [], keyPlaceholder: 'Key', valuePlaceholder: 'Value' }} />
<Story
  name="With Rows"
  args={{
    pairs: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'Authorization', value: 'Bearer token', enabled: true },
      { id: '3', key: 'X-Debug', value: 'true', enabled: false },
    ],
  }}
/>
<Story
  name="Headers"
  args={{
    pairs: [{ id: '1', key: 'Accept', value: 'application/json', enabled: true }],
    keyPlaceholder: 'Header name',
    valuePlaceholder: 'Header value',
  }}
/>
```

## Test Command

```bash
npm run check && npm run lint && just storybook-build && npm test
```

## Files to Create/Modify

### Install Additional Components

```bash
npx shadcn-svelte@latest add checkbox label
```

### Components (src/lib/components/)

- `Request/TabPanel.svelte` - Tab container using shadcn Tabs
- `Request/KeyValueEditor.svelte` - Reusable key-value pairs
- `Request/HeadersTab.svelte` - Headers configuration
- `Request/ParamsTab.svelte` - Query parameters
- `Request/BodyTab.svelte` - Body editor with type selector
- `Request/AuthTab.svelte` - Authentication configuration
- `Request/JsonEditor.svelte` - JSON body with CodeMirror highlighting

### Utils (src/lib/utils/)

- `auth.ts` - Base64 encoding, auth header formatting

### Types (src/lib/types/)

- `request.ts` - Tab state types, auth config types, key-value pair types

## Process

1. Install additional shadcn components (checkbox, label)
2. Create reusable KeyValueEditor component
3. Build TabPanel with shadcn Tabs
4. Implement HeadersTab using KeyValueEditor
5. Implement ParamsTab using KeyValueEditor
6. Implement BodyTab with content-type selector and CodeMirror
7. Implement AuthTab with type-specific fields
8. Wire tabs to request execution
9. Write component tests
10. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_3_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** work on intelligence features, persistence, suggestions, or security warnings. Stay focused on request builder tabs and auth helpers.
