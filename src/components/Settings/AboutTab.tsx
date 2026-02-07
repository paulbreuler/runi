/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement } from 'react';
import runiHeadIced from '../../../.github/assets/runi-head-iced.svg';

interface InfoItem {
  label: string;
  value: string;
}

const INFO_ITEMS: InfoItem[] = [
  { label: 'Telemetry', value: 'None' },
  { label: 'Cloud Sync', value: 'Never' },
  { label: 'Offline Mode', value: 'Full' },
];

export function AboutTab(): ReactElement {
  return (
    <div className="p-4 space-y-4" data-test-id="settings-about-tab">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-bg-raised border border-border-subtle mb-3">
          <img src={runiHeadIced} alt="runi" className="h-7 w-7" />
        </div>
        <h2 className="text-sm font-semibold text-fg-default">runi</h2>
        <p className="text-xs text-fg-muted mt-1" data-test-id="about-version">
          Version {__APP_VERSION__}
        </p>
        <p className="text-xs text-fg-muted mt-1 italic">See the truth about your APIs</p>
      </div>

      <div className="p-3 bg-bg-raised rounded-lg border border-border-subtle space-y-2">
        {INFO_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-xs text-fg-muted"
            data-test-id={`about-info-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="text-fg-default">{item.label}:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      <footer className="text-center pt-2 border-t border-border-subtle">
        <p className="text-xs text-fg-muted" data-test-id="about-footer">
          Made with care by BaseState LLC
        </p>
      </footer>
    </div>
  );
}
