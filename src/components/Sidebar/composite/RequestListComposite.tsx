/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { CollectionRequest } from '@/types/collection';
import { RequestItemComposite } from './RequestItemComposite';

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
        <RequestItemComposite key={request.id} request={request} collectionId={collectionId} />
      ))}
    </div>
  );
};
