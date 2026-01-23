/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

export type SyntaxLanguage = 'json' | 'xml' | 'html' | 'css' | 'javascript' | 'yaml' | 'text';

export interface SyntaxDetectionInput {
  body: string;
  contentType?: string | null;
}

const contentTypeMap: Array<{ pattern: RegExp; language: SyntaxLanguage }> = [
  { pattern: /application\/json/i, language: 'json' },
  { pattern: /application\/xml/i, language: 'xml' },
  { pattern: /text\/xml/i, language: 'xml' },
  { pattern: /text\/html/i, language: 'html' },
  { pattern: /text\/css/i, language: 'css' },
  { pattern: /text\/javascript/i, language: 'javascript' },
  { pattern: /application\/javascript/i, language: 'javascript' },
  { pattern: /application\/yaml/i, language: 'yaml' },
  { pattern: /text\/yaml/i, language: 'yaml' },
];

const looksLikeJson = (body: string): boolean => {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
};

const looksLikeHtml = (body: string): boolean => /<!doctype html|<html[\s>]/i.test(body);

const looksLikeXml = (body: string): boolean => {
  if (!body.startsWith('<')) {
    return false;
  }
  return /<([a-z][\w-]*)[\s>][\s\S]*<\/\1>/i.test(body);
};

const looksLikeYaml = (body: string): boolean => /^---\s*$|^\s*[\w-]+\s*:\s*.+/m.test(body);

export const detectSyntaxLanguage = ({
  body,
  contentType,
}: SyntaxDetectionInput): SyntaxLanguage => {
  const normalizedContentType = contentType?.toLowerCase() ?? '';
  for (const { pattern, language } of contentTypeMap) {
    if (pattern.test(normalizedContentType)) {
      return language;
    }
  }

  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return 'text';
  }
  if (looksLikeJson(trimmed)) {
    return 'json';
  }
  if (looksLikeHtml(trimmed)) {
    return 'html';
  }
  if (looksLikeXml(trimmed)) {
    return 'xml';
  }
  if (looksLikeYaml(trimmed)) {
    return 'yaml';
  }
  return 'text';
};
