/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { CollectionRequest } from '@/types/collection';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { RequestItemComposite } from './RequestItemComposite';

interface RequestListCompositeProps {
  requests: CollectionRequest[];
  collectionId: string;
}

export const RequestListComposite = ({
  requests,
  collectionId,
}: RequestListCompositeProps): React.JSX.Element => {
  const deleteRequest = useCollectionStore((state) => state.deleteRequest);
  const renameRequest = useCollectionStore((state) => state.renameRequest);
  const duplicateRequest = useCollectionStore((state) => state.duplicateRequest);
  const pendingRequestRenameId = useCollectionStore((state) => state.pendingRequestRenameId);
  const clearPendingRequestRename = useCollectionStore((state) => state.clearPendingRequestRename);

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
          startInRenameMode={pendingRequestRenameId === request.id}
          onRenameStarted={
            pendingRequestRenameId === request.id ? clearPendingRequestRename : undefined
          }
          onDelete={(colId, reqId) => void deleteRequest(colId, reqId)}
          onRename={(colId, reqId, newName) => void renameRequest(colId, reqId, newName)}
          onDuplicate={(colId, reqId) => void duplicateRequest(colId, reqId)}
        />
      ))}
    </div>
  );
};
