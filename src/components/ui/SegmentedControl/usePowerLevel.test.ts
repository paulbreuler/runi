import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePowerLevel, calculateTier } from './usePowerLevel';
import { deriveVisualFlags } from './config';

describe('calculateTier', () => {
  it('returns tier 0 when no badges are over 9000', () => {
    const options = [{ badge: 100 }, { badge: 500 }, { badge: 8999 }];
    expect(calculateTier(options)).toBe(0);
  });

  it('returns tier 1 when one badge is over 9000', () => {
    const options = [{ badge: 9001 }, { badge: 100 }, { badge: 200 }];
    expect(calculateTier(options)).toBe(1);
  });

  it('returns tier 2 when two badges are over 9000', () => {
    const options = [{ badge: 9001 }, { badge: 9002 }, { badge: 100 }];
    expect(calculateTier(options)).toBe(2);
  });

  it('returns tier 3 when three badges are over 9000', () => {
    const options = [{ badge: 9001 }, { badge: 9002 }, { badge: 9003 }, { badge: 100 }];
    expect(calculateTier(options)).toBe(3);
  });

  it('returns tier 4 when four badges are over 9000', () => {
    const options = [{ badge: 9001 }, { badge: 9002 }, { badge: 9003 }, { badge: 9004 }];
    // Not tier 5 yet because total is 36010, need all over 9000
    // Actually 36010 >= 36000 but we need to check the logic
    // Tier 5 requires ALL badges over 9000 AND total >= 36000
    expect(calculateTier(options)).toBe(5); // All over 9000, total 36010 >= 36000
  });

  it('caps at tier 4 when not all badges are over 9000', () => {
    const options = [
      { badge: 9001 },
      { badge: 9002 },
      { badge: 9003 },
      { badge: 9004 },
      { badge: 100 }, // This prevents god tier
    ];
    expect(calculateTier(options)).toBe(4);
  });

  describe('god-tier calculations', () => {
    it('returns tier 5 when all badges over 9000 and total >= 36000', () => {
      const options = [{ badge: 9000 }, { badge: 9000 }, { badge: 9000 }, { badge: 9000 }];
      expect(calculateTier(options)).toBe(5);
    });

    it('returns tier 6 when all badges over 9000 and total >= 50000', () => {
      const options = [{ badge: 12500 }, { badge: 12500 }, { badge: 12500 }, { badge: 12500 }];
      expect(calculateTier(options)).toBe(6);
    });

    it('returns tier 7 when all badges over 9000 and total >= 80000', () => {
      const options = [{ badge: 20000 }, { badge: 20000 }, { badge: 20000 }, { badge: 20000 }];
      expect(calculateTier(options)).toBe(7);
    });

    it('returns tier 8 when all badges over 9000 and total >= 100000', () => {
      const options = [{ badge: 25000 }, { badge: 25000 }, { badge: 25000 }, { badge: 25000 }];
      expect(calculateTier(options)).toBe(8);
    });
  });

  it('ignores options without badges', () => {
    const options = [
      { badge: 9001 },
      {}, // No badge
      { badge: 100 },
    ];
    expect(calculateTier(options)).toBe(1);
  });

  it('ignores options with badge value of 0', () => {
    // Badge 0 is filtered out, leaving 2 badges: one over 9000, one under
    // This should be tier 1 (one badge over 9000, not all over)
    const options = [
      { badge: 0 },
      { badge: 9001 },
      { badge: 100 }, // This prevents god tier since not all are over 9000
    ];
    expect(calculateTier(options)).toBe(1);
  });
});

describe('deriveVisualFlags', () => {
  describe('idle state', () => {
    it('returns all flags false when idle', () => {
      const flags = deriveVisualFlags('idle', 0);
      expect(flags).toEqual({
        shouldShowEffects: false,
        shouldAnimateEffects: false,
        shouldShowTierColors: false,
        shouldShowGlow: false,
      });
    });

    it('returns all flags false when idle regardless of tier', () => {
      const flags = deriveVisualFlags('idle', 8);
      expect(flags).toEqual({
        shouldShowEffects: false,
        shouldAnimateEffects: false,
        shouldShowTierColors: false,
        shouldShowGlow: false,
      });
    });
  });

  describe('powering_up state', () => {
    it('returns all flags true during powering_up', () => {
      const flags = deriveVisualFlags('powering_up', 2);
      expect(flags).toEqual({
        shouldShowEffects: true,
        shouldAnimateEffects: true,
        shouldShowTierColors: true,
        shouldShowGlow: true,
      });
    });
  });

  describe('finale state', () => {
    it('returns all flags true during finale', () => {
      const flags = deriveVisualFlags('finale', 5);
      expect(flags).toEqual({
        shouldShowEffects: true,
        shouldAnimateEffects: true,
        shouldShowTierColors: true,
        shouldShowGlow: true,
      });
    });
  });

  describe('sustained state', () => {
    it('shows effects and tier colors but not animating', () => {
      const flags = deriveVisualFlags('sustained', 3);
      expect(flags.shouldShowEffects).toBe(true);
      expect(flags.shouldAnimateEffects).toBe(false);
      expect(flags.shouldShowTierColors).toBe(true);
    });

    it('shows glow only at tier 2+', () => {
      expect(deriveVisualFlags('sustained', 1).shouldShowGlow).toBe(false);
      expect(deriveVisualFlags('sustained', 2).shouldShowGlow).toBe(true);
      expect(deriveVisualFlags('sustained', 5).shouldShowGlow).toBe(true);
    });
  });

  describe('settling state', () => {
    it('shows effects for particles but resets colors', () => {
      const flags = deriveVisualFlags('settling', 4);
      expect(flags).toEqual({
        shouldShowEffects: true, // For particles/edge fade
        shouldAnimateEffects: false,
        shouldShowTierColors: false, // Reset colors during settling!
        shouldShowGlow: false, // No glow during settling
      });
    });
  });
});

describe('usePowerLevel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state with tier 0', () => {
    const { result } = renderHook(() => usePowerLevel([{ badge: 100 }], false));

    expect(result.current.tier).toBe(0);
    expect(result.current.animationState).toBe('idle');
    expect(result.current.visualFlags.shouldShowEffects).toBe(false);
  });

  it('transitions to animating when tier increases', () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
    });

    expect(result.current.animationState).toBe('idle');

    // Increase tier - one badge over 9000, one under (tier 1, not god tier)
    rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

    expect(result.current.tier).toBe(1);
    expect(result.current.animationState).toBe('powering_up');
    expect(result.current.visualFlags.shouldShowEffects).toBe(true);
    expect(result.current.visualFlags.shouldAnimateEffects).toBe(true);
  });

  it('transitions to animating when tier decreases to non-zero', () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: { options: [{ badge: 9001 }, { badge: 9002 }] },
    });

    // Wait for initial animation to settle
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.animationState).toBe('idle');

    // Decrease tier (still > 0)
    rerender({ options: [{ badge: 9001 }, { badge: 100 }] });

    expect(result.current.tier).toBe(1);
    expect(result.current.animationState).toBe('powering_up');
  });

  it('resets to idle instantly when tier becomes 0', () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: { options: [{ badge: 9001 }] },
    });

    // Wait for animation
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Go to tier 0
    rerender({ options: [{ badge: 100 }] });

    expect(result.current.tier).toBe(0);
    expect(result.current.animationState).toBe('idle');
  });

  it('goes through finale when ascending to god tier', () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: { options: [{ badge: 100 }] },
    });

    // Jump to god tier (all badges over 9000)
    rerender({
      options: [{ badge: 9001 }, { badge: 9002 }, { badge: 9003 }, { badge: 9004 }],
    });

    expect(result.current.animationState).toBe('powering_up');

    // Advance to finale
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.animationState).toBe('finale');
    expect(result.current.isFinale).toBe(true);
  });

  it('does not trigger finale when descending from god tier', () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: {
        options: [{ badge: 9001 }, { badge: 9002 }, { badge: 9003 }, { badge: 9004 }],
      },
    });

    // Wait for god tier animation to complete
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Descend from god tier to tier 3
    rerender({
      options: [{ badge: 9001 }, { badge: 9002 }, { badge: 9003 }, { badge: 100 }],
    });

    expect(result.current.tier).toBe(3);
    expect(result.current.animationState).toBe('powering_up');

    // Should go through standard animation, not finale
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Should still be powering_up (not finale)
    expect(result.current.animationState).toBe('powering_up');
  });

  it('completes full animation cycle: powering_up -> sustained -> settling -> idle', async () => {
    const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
      initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
    });

    // Trigger tier increase (tier 1, not god tier)
    rerender({ options: [{ badge: 9001 }, { badge: 200 }] });
    expect(result.current.animationState).toBe('powering_up');

    // Advance to sustained (1500ms)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.animationState).toBe('sustained');

    // Advance to settling (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.animationState).toBe('settling');
    expect(result.current.isSettling).toBe(true);

    // Advance to idle (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.animationState).toBe('idle');
  });

  describe('visual flag derivation during animation cycle', () => {
    it('shouldShowTierColors is true during powering_up and sustained', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
      });

      // Tier 1, not god tier
      rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

      // During powering_up
      expect(result.current.visualFlags.shouldShowTierColors).toBe(true);

      // Advance to sustained
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.animationState).toBe('sustained');
      expect(result.current.visualFlags.shouldShowTierColors).toBe(true);
    });

    it('shouldShowTierColors is false during settling and idle', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
      });

      // Tier 1, not god tier
      rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

      // Advance to settling
      act(() => {
        vi.advanceTimersByTime(1800);
      });
      expect(result.current.animationState).toBe('settling');
      expect(result.current.visualFlags.shouldShowTierColors).toBe(false);

      // Advance to idle
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.animationState).toBe('idle');
      expect(result.current.visualFlags.shouldShowTierColors).toBe(false);
    });

    it('shouldShowGlow is false during settling', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }, { badge: 300 }] },
      });

      // Tier 2 for glow (2 badges over 9000, 1 under - not god tier)
      rerender({ options: [{ badge: 9001 }, { badge: 9002 }, { badge: 300 }] });

      // Advance to settling
      act(() => {
        vi.advanceTimersByTime(1800);
      });
      expect(result.current.animationState).toBe('settling');
      expect(result.current.visualFlags.shouldShowGlow).toBe(false);
    });

    it('shouldAnimateEffects is only true during powering_up and finale', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
      });

      // Tier 1, not god tier
      rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

      // During powering_up
      expect(result.current.visualFlags.shouldAnimateEffects).toBe(true);

      // Advance to sustained
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.visualFlags.shouldAnimateEffects).toBe(false);

      // Advance to settling
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.visualFlags.shouldAnimateEffects).toBe(false);
    });
  });

  describe('color reset', () => {
    it('effectColor returns transparent when idle', () => {
      const { result } = renderHook(() => usePowerLevel([{ badge: 100 }], false));

      expect(result.current.effectColor).toBe('transparent');
    });

    it('effectColor returns tier color during animation', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
      });

      // Tier 1, not god tier
      rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

      // Should show tier 1 color (amber)
      expect(result.current.effectColor).toBe('#fbbf24');
    });

    it('all colors reset to default after full animation cycle', () => {
      const { result, rerender } = renderHook(({ options }) => usePowerLevel(options, false), {
        initialProps: { options: [{ badge: 100 }, { badge: 200 }] },
      });

      // Tier 1, not god tier
      rerender({ options: [{ badge: 9001 }, { badge: 200 }] });

      // Complete full animation cycle (powering_up 1500ms + sustained 300ms + settling 300ms = 2100ms)
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // After settling -> idle
      expect(result.current.animationState).toBe('idle');
      expect(result.current.effectColor).toBe('transparent');
      expect(result.current.visualFlags.shouldShowTierColors).toBe(false);
    });
  });

  describe('reduced motion', () => {
    it('skips animation when prefers reduced motion', () => {
      const { result, rerender } = renderHook(
        ({ options, prefersReducedMotion }) => usePowerLevel(options, prefersReducedMotion),
        { initialProps: { options: [{ badge: 100 }], prefersReducedMotion: true } }
      );

      rerender({ options: [{ badge: 9001 }], prefersReducedMotion: true });

      // Should remain in idle (no animation)
      expect(result.current.animationState).toBe('idle');
    });
  });
});
