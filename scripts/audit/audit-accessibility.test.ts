/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Accessibility Audit Tests
 * @description TDD tests for accessibility auditing
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { auditAccessibility, auditAllAccessibility } from './audit-accessibility';
import type { AccessibilityAudit } from './types';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('accessibility-audit', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should detect missing ARIA attributes', () => {
    it('should flag icon buttons without aria-label', async () => {
      const testCode = `
        import { X } from 'lucide-react';
        export const BadButton = () => (
          <button><X /></button>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'icon-button-no-label')).toBe(true);
      expect(result.hasAriaAttributes).toBe(false);
    });

    it('should not flag buttons with aria-label', async () => {
      const testCode = `
        import { X } from 'lucide-react';
        export const GoodButton = () => (
          <button aria-label="Close"><X /></button>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.filter((i) => i.type === 'icon-button-no-label')).toHaveLength(0);
      expect(result.hasAriaAttributes).toBe(true);
    });

    it('should detect various ARIA attributes', async () => {
      const testCode = `
        export const AccessibleComponent = () => (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="title"
            aria-describedby="description"
          >
            <h2 id="title">Dialog Title</h2>
            <p id="description">Dialog description</p>
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.hasAriaAttributes).toBe(true);
    });
  });

  describe('should verify semantic HTML usage (nav, main, aside)', () => {
    it('should detect semantic HTML elements', async () => {
      const testCode = `
        export const SemanticComponent = () => (
          <main>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
              </ul>
            </nav>
            <article>
              <header>Title</header>
              <section>Content</section>
              <footer>Footer</footer>
            </article>
            <aside>Sidebar</aside>
          </main>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.usesSemanticHtml).toBe(true);
    });

    it('should flag div-soup without semantic elements', async () => {
      const testCode = `
        export const DivSoupComponent = () => (
          <div>
            <div className="nav">
              <div className="nav-item">Link</div>
            </div>
            <div className="content">
              <div className="header">Title</div>
              <div className="body">Content</div>
            </div>
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.usesSemanticHtml).toBe(false);
      expect(result.issues.some((i) => i.type === 'missing-semantic-element')).toBe(true);
    });
  });

  describe('should check focus management with tabIndex', () => {
    it('should detect proper tabIndex usage', async () => {
      const testCode = `
        export const FocusableComponent = () => (
          <div>
            <button>Click me</button>
            <input type="text" />
            <div tabIndex={0} role="button">Custom focusable</div>
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.hasFocusManagement).toBe(true);
    });

    it('should detect focus-visible styling', async () => {
      const testCode = `
        export const FocusVisibleComponent = () => (
          <button className="focus-visible:ring-2 focus-visible:ring-accent-blue">
            Click me
          </button>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.hasFocusManagement).toBe(true);
    });

    it('should flag interactive elements without focus indication', async () => {
      const testCode = `
        export const NoFocusIndicator = () => (
          <div onClick={() => {}} className="cursor-pointer">
            Clickable but not focusable
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'missing-tabindex')).toBe(true);
    });
  });

  describe('should verify keyboard navigation support', () => {
    it('should detect keyboard event handlers', async () => {
      const testCode = `
        export const KeyboardComponent = () => {
          const handleKeyDown = (e) => {
            if (e.key === 'Enter') doSomething();
            if (e.key === ' ') doSomething();
          };
          return <div onKeyDown={handleKeyDown} tabIndex={0}>Interactive</div>;
        };
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.supportsKeyboardNav).toBe(true);
    });

    it('should flag click handlers without keyboard equivalents', async () => {
      const testCode = `
        export const ClickOnlyComponent = () => (
          <div onClick={() => doSomething()}>Click only</div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'missing-keyboard-handler')).toBe(true);
    });

    it('should not flag native interactive elements', async () => {
      const testCode = `
        export const NativeComponent = () => (
          <button onClick={() => doSomething()}>Button</button>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.filter((i) => i.type === 'missing-keyboard-handler')).toHaveLength(0);
      expect(result.supportsKeyboardNav).toBe(true);
    });
  });

  describe('should check screen reader compatibility', () => {
    it('should detect aria-live regions', async () => {
      const testCode = `
        export const LiveRegionComponent = () => (
          <div>
            <div aria-live="polite" role="status">Status updates here</div>
            <div aria-live="assertive" role="alert">Alert!</div>
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.isScreenReaderCompatible).toBe(true);
    });

    it('should detect proper label associations', async () => {
      const testCode = `
        export const FormComponent = () => (
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </form>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.isScreenReaderCompatible).toBe(true);
    });

    it('should flag inputs without labels', async () => {
      const testCode = `
        export const BadFormComponent = () => (
          <form>
            <input type="email" placeholder="Email" />
          </form>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.some((i) => i.type === 'missing-htmlFor')).toBe(true);
    });
  });

  describe('should verify useReducedMotion() hook usage', () => {
    it('should detect useReducedMotion usage', async () => {
      const testCode = `
        import { motion, useReducedMotion } from 'motion/react';
        export const MotionComponent = () => {
          const prefersReducedMotion = useReducedMotion();
          return (
            <motion.div animate={prefersReducedMotion ? {} : { scale: 1.1 }} />
          );
        };
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.respectsReducedMotion).toBe(true);
    });

    it('should flag motion components without reduced motion check', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const AnimatedComponent = () => (
          <motion.div animate={{ x: 100, scale: 1.2, rotate: 360 }} />
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.respectsReducedMotion).toBe(false);
      expect(result.issues.some((i) => i.type === 'missing-reduced-motion')).toBe(true);
    });
  });

  describe('should flag accessibility violations', () => {
    it('should aggregate multiple violations', async () => {
      const testCode = `
        import { motion } from 'motion/react';
        export const BadComponent = () => (
          <div>
            <button><img src="icon.png" /></button>
            <div onClick={() => {}}>Not keyboard accessible</div>
            <input placeholder="No label" />
            <motion.div animate={{ x: 100 }} />
          </div>
        );
      `;

      const result = await auditAccessibility('test-component.tsx', testCode);

      expect(result.issues.length).toBeGreaterThanOrEqual(3);
      expect(result.score).toBeLessThan(70);
    });
  });

  describe('should generate accessibility-report.json', () => {
    it('should generate valid JSON output with all components audited', async () => {
      const results = await auditAllAccessibility();

      const outputPath = join(outputDir, 'accessibility-report.json');
      writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as AccessibilityAudit[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Verify structure matches AccessibilityAudit interface
      parsed.forEach((audit) => {
        expect(audit).toHaveProperty('path');
        expect(audit).toHaveProperty('name');
        expect(audit).toHaveProperty('hasAriaAttributes');
        expect(audit).toHaveProperty('usesSemanticHtml');
        expect(audit).toHaveProperty('supportsKeyboardNav');
        expect(audit).toHaveProperty('hasFocusManagement');
        expect(audit).toHaveProperty('isScreenReaderCompatible');
        expect(audit).toHaveProperty('respectsReducedMotion');
        expect(audit).toHaveProperty('issues');
        expect(audit).toHaveProperty('score');
        expect(typeof audit.score).toBe('number');
        expect(audit.score).toBeGreaterThanOrEqual(0);
        expect(audit.score).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('accessibility-scoring', () => {
  it('should calculate a high score for accessible components', async () => {
    const testCode = `
      import { motion, useReducedMotion } from 'motion/react';
      export const AccessibleComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        const handleKeyDown = (e) => {
          if (e.key === 'Enter') doSomething();
        };
        return (
          <main>
            <nav aria-label="Main">
              <button onClick={doSomething} aria-label="Menu">
                <span aria-hidden="true">☰</span>
              </button>
            </nav>
            <section>
              <label htmlFor="search">Search</label>
              <input id="search" type="search" className="focus-visible:ring-2" />
            </section>
            <motion.div
              animate={prefersReducedMotion ? {} : { opacity: 1 }}
              aria-live="polite"
            />
          </main>
        );
      };
    `;

    const result = await auditAccessibility('test-component.tsx', testCode);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.issues.length).toBeLessThanOrEqual(2);
  });

  it('should calculate a low score for inaccessible components', async () => {
    const testCode = `
      import { motion } from 'motion/react';
      export const InaccessibleComponent = () => (
        <div>
          <div className="nav">
            <div onClick={() => {}}>Menu</div>
          </div>
          <div className="content">
            <input placeholder="Type here" />
            <div onClick={() => alert('clicked')}>
              <img src="icon.png" />
            </div>
          </div>
          <motion.div animate={{ x: 100, rotate: 360 }} />
        </div>
      );
    `;

    const result = await auditAccessibility('test-component.tsx', testCode);

    expect(result.score).toBeLessThan(50);
    expect(result.issues.length).toBeGreaterThan(3);
  });
});
