/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { IntelligenceInfo } from '@/types/history';
import { SignalDot } from './SignalDot';

interface IntelligenceSignalsProps {
  /** Intelligence info for the history entry (optional) */
  intelligence?: IntelligenceInfo;
}

/**
 * Renders intelligence signal dots based on entry state.
 * Order: verified, drift, ai, bound (highest to lowest priority for attention).
 */
export const IntelligenceSignals = ({
  intelligence,
}: IntelligenceSignalsProps): React.JSX.Element => {
  if (intelligence === undefined) {
    return <></>;
  }

  const { verified, drift, aiGenerated, boundToSpec, specOperation } = intelligence;

  // Collect signals in priority order
  const signals: React.JSX.Element[] = [];

  if (verified) {
    signals.push(<SignalDot key="verified" type="verified" tooltip="Verified against spec" />);
  }

  if (drift !== null) {
    signals.push(<SignalDot key="drift" type="drift" tooltip={`Drift: ${drift.message}`} />);
  }

  if (aiGenerated) {
    signals.push(<SignalDot key="ai" type="ai" tooltip="AI-generated request" />);
  }

  if (boundToSpec) {
    const tooltip =
      specOperation !== null && specOperation !== ''
        ? `Bound to spec: ${specOperation}`
        : 'Bound to spec';
    signals.push(<SignalDot key="bound" type="bound" tooltip={tooltip} />);
  }

  if (signals.length === 0) {
    return <></>;
  }

  return <span className="inline-flex items-center gap-1">{signals}</span>;
};
