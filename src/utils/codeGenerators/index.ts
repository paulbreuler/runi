/**
 * Code generators for converting network history entries to various programming languages.
 */

import type { NetworkHistoryEntry } from '@/types/history';
import { generateJavaScriptCode } from './javascript';
import { generatePythonCode } from './python';
import { generateGoCode } from './go';
import { generateRubyCode } from './ruby';
import { generateCurlCode } from './curl';

export {
  generateJavaScriptCode,
  generatePythonCode,
  generateGoCode,
  generateRubyCode,
  generateCurlCode,
};

/**
 * Supported code generation languages.
 */
export type CodeLanguage = 'javascript' | 'python' | 'go' | 'ruby' | 'curl';

/**
 * Language display names.
 */
export const LANGUAGE_NAMES: Record<CodeLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  go: 'Go',
  ruby: 'Ruby',
  curl: 'cURL',
};

/**
 * Language syntax highlighting identifiers.
 */
export const LANGUAGE_SYNTAX: Record<CodeLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  ruby: 'ruby',
  curl: 'bash',
};

/**
 * Generate code for a specific language.
 *
 * @param entry - The network history entry to convert
 * @param language - The target programming language
 * @returns Generated code string
 */
export function generateCode(entry: NetworkHistoryEntry, language: CodeLanguage): string {
  switch (language) {
    case 'javascript':
      return generateJavaScriptCode(entry);
    case 'python':
      return generatePythonCode(entry);
    case 'go':
      return generateGoCode(entry);
    case 'ruby':
      return generateRubyCode(entry);
    case 'curl':
      return generateCurlCode(entry);
    default: {
      const _exhaustive: never = language;
      throw new Error(`Unsupported language: ${String(_exhaustive)}`);
    }
  }
}
