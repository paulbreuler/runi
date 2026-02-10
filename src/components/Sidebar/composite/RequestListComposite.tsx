/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Check } from 'lucide-react';
import { globalEventBus } from '@/events/bus';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated } from '@/types/collection';
import { RequestItemComposite } from './RequestItemComposite';

interface AcceptActionProps {
  collectionId: string;
  requestId: string;
}

const AcceptAction = ({ collectionId, requestId }: AcceptActionProps): React.JSX.Element => (
  <button
    type="button"
    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-signal-success/10 text-signal-success border border-signal-success/20 hover:bg-signal-success/20 transition-colors text-[10px] font-semibold"
    data-test-id={`request-accept-${requestId}`}
    aria-label="Accept AI-generated request"
    onClick={(e): void => {
      e.stopPropagation();
      globalEventBus.emit('request.accept-ai', { collectionId, requestId });
    }}
    title="Accept — mark as verified"
  >
    <Check size={10} />
    Accept
  </button>
);

/** Resolve the signal-appropriate action for a request. */
function resolveAction(
  request: CollectionRequest,
  collectionId: string
): React.ReactNode | undefined {
  const isGhostNode = isAiGenerated(request) && request.intelligence.verified !== true;
  if (isGhostNode) {
    return <AcceptAction collectionId={collectionId} requestId={request.id} />;
  }
  return undefined;
}

interface RequestListCompositeProps {
  requests: CollectionRequest[];
  collectionId: string;
}

export const RequestListComposite = ({
  requests,
  collectionId,
}: RequestListCompositeProps): React.JSX.Element => {
  if (requests.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-text-muted" data-test-id="collection-empty-requests">
        No requests yet
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {requests.map((request) => (
        <RequestItemComposite
          key={request.id}
          request={request}
          collectionId={collectionId}
          action={resolveAction(request, collectionId)}
        />
      ))}
    </div>
  );
};
