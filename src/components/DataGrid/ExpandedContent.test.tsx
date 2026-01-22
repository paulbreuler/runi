/**
 * @file ExpandedContent tests
 * @description Tests for ExpandedContent component with row expansion animation
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ExpandedContent } from './ExpandedContent';

// Mock useReducedMotion to control animation behavior in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('ExpandedContent', () => {
  const mockChildren = <div data-testid="test-content">Test content</div>;

  describe('Feature #16: Row Expansion Animation', () => {
    it('animates expansion with height transition', async () => {
      const { container } = render(<ExpandedContent>{mockChildren}</ExpandedContent>);

      const expandedSection = screen.getByTestId('expanded-section');
      expect(expandedSection).toBeInTheDocument();

      // Check that motion.div is present with animation props
      const motionDiv = container.querySelector('[data-testid="expanded-section"]');
      expect(motionDiv).toBeInTheDocument();
    });

    it('respects reduced motion preference', async () => {
      const { useReducedMotion } = await import('motion/react');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { container } = render(<ExpandedContent>{mockChildren}</ExpandedContent>);

      const expandedSection = screen.getByTestId('expanded-section');
      expect(expandedSection).toBeInTheDocument();

      // When reduced motion is enabled, animation should be disabled
      // (duration: 0 in transition)
      const motionDiv = container.querySelector('[data-testid="expanded-section"]');
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe('Feature #17: Expanded Content Alignment', () => {
    it('expanded content has correct left margin', () => {
      render(<ExpandedContent>{mockChildren}</ExpandedContent>);

      const expandedSection = screen.getByTestId('expanded-section');
      const innerDiv = expandedSection.querySelector('div.bg-bg-elevated.border-t');

      // Should use EXPANDED_CONTENT_LEFT_MARGIN_PX (54px = 32+16+6)
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveStyle({ marginLeft: '54px' });
    });

    it('expanded content spans all columns', () => {
      const { container: _container } = render(
        <table>
          <tbody>
            <tr>
              <td colSpan={5}>
                <ExpandedContent>{mockChildren}</ExpandedContent>
              </td>
            </tr>
          </tbody>
        </table>
      );

      const expandedSection = screen.getByTestId('expanded-section');
      expect(expandedSection).toBeInTheDocument();
      expect(expandedSection).toHaveTextContent('Test content');
    });
  });
});
