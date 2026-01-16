/**
 * Command registry for extensible command system.
 *
 * Inspired by VS Code's command system, this registry allows
 * components and plugins to register and execute commands.
 *
 * Commands are identified by string IDs (e.g., 'sidebar.toggle')
 * and can have keyboard shortcuts associated with them.
 */

import type { KeyboardShortcut } from '@/utils/keyboard';

/**
 * Command definition.
 */
export interface Command {
  /** Unique command identifier (e.g., 'sidebar.toggle') */
  id: string;
  /** Human-readable command title */
  title: string;
  /** Command handler function */
  handler: (args?: unknown) => void | Promise<void>;
  /** Optional keyboard shortcut */
  shortcut?: KeyboardShortcut;
  /** Optional command category for organization */
  category?: string;
  /** Optional description for help/accessibility */
  description?: string;
}

/**
 * Command registry for managing and executing commands.
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry();
 *
 * registry.register({
 *   id: 'sidebar.toggle',
 *   title: 'Toggle Sidebar',
 *   handler: () => toggleSidebar(),
 *   shortcut: { key: 'b', modifier: 'meta' }
 * });
 *
 * await registry.execute('sidebar.toggle');
 * ```
 */
export class CommandRegistry {
  private commands = new Map<string, Command>();

  /**
   * Registers a command.
   *
   * @param command - The command to register
   * @throws Error if command ID already exists
   */
  public register(command: Command): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command '${command.id}' is already registered`);
    }
    this.commands.set(command.id, command);
  }

  /**
   * Unregisters a command.
   *
   * @param id - The command ID to unregister
   */
  public unregister(id: string): void {
    this.commands.delete(id);
  }

  /**
   * Executes a command by ID.
   *
   * @param id - The command ID to execute
   * @param args - Optional arguments to pass to the handler
   * @throws Error if command is not found
   */
  public async execute(id: string, args?: unknown): Promise<void> {
    const command = this.commands.get(id);
    if (command === undefined) {
      throw new Error(`Command '${id}' not found`);
    }
    await command.handler(args);
  }

  /**
   * Gets a command by ID.
   *
   * @param id - The command ID
   * @returns The command, or undefined if not found
   */
  public get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Gets all registered commands.
   *
   * @returns Array of all commands
   */
  public getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Gets commands by category.
   *
   * @param category - The category to filter by
   * @returns Array of commands in the category
   */
  public getByCategory(category: string): Command[] {
    return this.getAll().filter((cmd) => cmd.category === category);
  }

  /**
   * Gets the keyboard shortcut for a command.
   *
   * @param id - The command ID
   * @returns The keyboard shortcut, or undefined if not found
   */
  public getShortcut(id: string): KeyboardShortcut | undefined {
    return this.commands.get(id)?.shortcut;
  }

  /**
   * Checks if a command is registered.
   *
   * @param id - The command ID
   * @returns True if the command is registered
   */
  public has(id: string): boolean {
    return this.commands.has(id);
  }
}

/**
 * Global command registry instance.
 * Can be used as a singleton or provided via context.
 */
export const globalCommandRegistry = new CommandRegistry();
