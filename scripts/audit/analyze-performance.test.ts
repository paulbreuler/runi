/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Performance Pattern Analysis Tests
 * @description TDD tests for performance pattern analysis
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { analyzePerformance, analyzeAllPerformance } from './analyze-performance';
import type { PerformancePattern } from './types';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('performance-analysis', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should detect layout thrashing patterns (width/height/flex animation)', () => {
    it('should flag components animating width/height properties', async () => {
      // Create a test fixture with layout-thrashing code
      const testCode = `
        import { motion } from 'motion/react';
        export const BadComponent = () => (
          <motion.div animate={{ width: 100, height: 200 }} />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'layout-thrashing')).toBe(true);
      const issue = result.issues.find((i) => i.type === 'layout-thrashing');
      expect(issue?.severity).toBe('critical');
    });

    it('should not flag hardware-accelerated animations', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const GoodComponent = () => (
          <motion.div animate={{ x: 100, opacity: 0.5 }} />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.issues.filter((i) => i.type === 'layout-thrashing')).toHaveLength(0);
      expect(result.usesHardwareAcceleration).toBe(true);
    });
  });

  describe('should verify hardware-accelerated properties (transform, opacity)', () => {
    it('should detect when component uses hardware-accelerated properties', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const GoodComponent = () => (
          <motion.div
            animate={{ x: 100, y: 50, scale: 1.2, rotate: 45, opacity: 0.5 }}
          />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesHardwareAcceleration).toBe(true);
      expect(result.issues.filter((i) => i.type === 'non-hardware-accelerated')).toHaveLength(0);
    });

    it('should flag non-hardware-accelerated animations', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const BadComponent = () => (
          <motion.div animate={{ left: 100, top: 50, margin: 20 }} />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesHardwareAcceleration).toBe(false);
      expect(result.issues.some((i) => i.type === 'non-hardware-accelerated')).toBe(true);
    });
  });

  describe('should check MotionValues usage for continuous updates', () => {
    it('should detect MotionValues usage', async () => {
      const testCode = `
        import { motion, useMotionValue, useSpring } from 'motion/react';
        export const GoodComponent = () => {
          const x = useMotionValue(0);
          const smoothX = useSpring(x);
          return <motion.div style={{ x: smoothX }} />;
        };
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesMotionValues).toBe(true);
    });

    it('should flag components with continuous animations not using MotionValues', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        import { useState, useEffect } from 'react';
        export const BadComponent = () => {
          const [x, setX] = useState(0);
          useEffect(() => {
            const interval = setInterval(() => setX(prev => prev + 1), 16);
            return () => clearInterval(interval);
          }, []);
          return <motion.div animate={{ x }} />;
        };
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'missing-motion-values')).toBe(true);
    });
  });

  describe('should verify ResizeObserver or refs for caching', () => {
    it('should detect ResizeObserver usage', async () => {
      const testCode = `
        import { useEffect, useRef } from 'react';
        export const GoodComponent = () => {
          const ref = useRef<HTMLDivElement>(null);
          useEffect(() => {
            const observer = new ResizeObserver(() => {});
            if (ref.current) observer.observe(ref.current);
            return () => observer.disconnect();
          }, []);
          return <div ref={ref} />;
        };
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesResizeObserver).toBe(true);
    });

    it('should detect refs for dimension caching', async () => {
      const testCode = `
        import { useRef, useCallback } from 'react';
        export const GoodComponent = () => {
          const dimensionsRef = useRef({ width: 0, height: 0 });
          const handleResize = useCallback(() => {
            dimensionsRef.current = { width: window.innerWidth, height: window.innerHeight };
          }, []);
          return <div />;
        };
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesResizeObserver).toBe(true);
    });
  });

  describe('should check layout="position" vs full layout usage', () => {
    it('should detect layout="position" for position-only animations', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const GoodComponent = () => (
          <motion.div layout="position" />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesLayoutPosition).toBe(true);
    });

    it('should flag full layout animations when only position changes', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const MaybeNotOptimal = () => (
          <motion.div layout />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      // This is an info-level issue, not critical
      expect(result.issues.some((i) => i.type === 'full-layout-animation')).toBe(true);
      expect(result.issues.find((i) => i.type === 'full-layout-animation')?.severity).toBe('info');
    });
  });

  describe('should verify whileInView for scroll-triggered animations', () => {
    it('should detect whileInView usage', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const GoodComponent = () => (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.usesWhileInView).toBe(true);
    });

    it('should suggest whileInView for scroll-based animations using IntersectionObserver', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        import { useEffect, useState, useRef } from 'react';
        export const CouldBeImproved = () => {
          const [inView, setInView] = useState(false);
          const ref = useRef(null);
          useEffect(() => {
            const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
            if (ref.current) observer.observe(ref.current);
          }, []);
          return <motion.div ref={ref} animate={{ opacity: inView ? 1 : 0 }} />;
        };
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'missing-while-in-view')).toBe(true);
    });
  });

  describe('should flag performance anti-patterns', () => {
    it('should flag inline animation values instead of variants', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const BadComponent = () => (
          <motion.div
            whileHover={{ scale: 1.05, backgroundColor: '#f00' }}
            whileTap={{ scale: 0.95 }}
          />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      // Inline animation values are an info-level suggestion
      expect(result.issues.some((i) => i.type === 'inline-animation-values')).toBe(true);
    });

    it('should not flag components using variants', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        const variants = {
          hover: { scale: 1.05 },
          tap: { scale: 0.95 },
        };
        export const GoodComponent = () => (
          <motion.div variants={variants} whileHover="hover" whileTap="tap" />
        );
      `;

      const result = await analyzePerformance('test-component.tsx', testCode);

      expect(result.issues.filter((i) => i.type === 'inline-animation-values')).toHaveLength(0);
    });
  });

  describe('should generate performance-analysis.json', () => {
    it('should generate valid JSON output with all components analyzed', async () => {
      const results = await analyzeAllPerformance();

      const outputPath = join(outputDir, 'performance-analysis.json');
      writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as PerformancePattern[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Verify structure matches PerformancePattern interface
      parsed.forEach((pattern) => {
        expect(pattern).toHaveProperty('path');
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('usesHardwareAcceleration');
        expect(pattern).toHaveProperty('usesMotionValues');
        expect(pattern).toHaveProperty('usesResizeObserver');
        expect(pattern).toHaveProperty('usesLayoutPosition');
        expect(pattern).toHaveProperty('usesWhileInView');
        expect(pattern).toHaveProperty('issues');
        expect(pattern).toHaveProperty('score');
        expect(typeof pattern.score).toBe('number');
        expect(pattern.score).toBeGreaterThanOrEqual(0);
        expect(pattern.score).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('performance-scoring', () => {
  it('should calculate a high score for well-optimized components', async () => {
    const testCode = `
      import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
      const variants = { hover: { scale: 1.02 }, tap: { scale: 0.98 } };
      export const OptimizedComponent = () => {
        const x = useMotionValue(0);
        const springX = useSpring(x);
        const shouldReduceMotion = useReducedMotion();
        return (
          <motion.div
            variants={variants}
            whileHover="hover"
            whileTap="tap"
            style={{ x: springX }}
            whileInView={{ opacity: 1 }}
            initial={{ opacity: 0 }}
          />
        );
      };
    `;

    const result = await analyzePerformance('test-component.tsx', testCode);

    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('should calculate a low score for poorly optimized components', async () => {
    const testCode = `
      import { motion } from 'motion/react';
      import { useState, useEffect } from 'react';
      export const UnoptimizedComponent = () => {
        const [width, setWidth] = useState(100);
        useEffect(() => {
          const interval = setInterval(() => setWidth(w => w + 1), 16);
          return () => clearInterval(interval);
        }, []);
        return (
          <motion.div
            animate={{ width, height: width, left: 10 }}
            whileHover={{ backgroundColor: '#f00' }}
          />
        );
      };
    `;

    const result = await analyzePerformance('test-component.tsx', testCode);

    expect(result.score).toBeLessThan(50);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
