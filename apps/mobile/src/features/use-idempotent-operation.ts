import { useState } from 'react';
import { api, retryKey } from '@/lib/api';
import { IdempotentOperation } from '@/lib/idempotent-operation';

export function useIdempotentOperation() {
  const [operation] = useState(() => new IdempotentOperation(api, retryKey));
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  async function run(path: string, payload: Record<string, unknown>) {
    setPendingPath(path);
    try {
      return await operation.run(path, payload);
    } finally {
      setPendingPath(operation.pendingPath);
    }
  }
  return { run, pendingPath };
}
