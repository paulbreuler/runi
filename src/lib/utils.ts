import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally join and merge Tailwind CSS class names.
 *
 * Accepts the same argument types as {@link clsx}, then passes the resulting
 * class string through {@link twMerge} to resolve Tailwind class conflicts.
 *
 * @param inputs - A list of class name values (strings, arrays, objects, etc.)
 * that will be combined and merged.
 * @returns A single space-separated string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
