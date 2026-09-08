type Send = (path: string, init: RequestInit) => Promise<unknown>;

/** Keeps the exact request until the server confirms its outcome. */
export class IdempotentOperation {
  private pending: { path: string; body: string } | null = null;
  private busy = false;
  private readonly send: Send;
  private readonly createKey: () => string;

  constructor(send: Send, createKey: () => string) {
    this.send = send;
    this.createKey = createKey;
  }

  get pendingPath() {
    return this.pending?.path ?? null;
  }

  async run(path: string, payload: Record<string, unknown>) {
    if (this.busy) throw new Error('La operación todavía está en curso.');
    if (this.pending && this.pending.path !== path)
      throw new Error('Primero confirma la operación pendiente.');
    const wasUncertain = this.pending !== null;
    this.pending ??= {
      path,
      body: JSON.stringify({ ...payload, idempotencyKey: this.createKey() }),
    };
    this.busy = true;
    try {
      const result = await this.send(this.pending.path, {
        method: 'POST',
        body: this.pending.body,
      });
      this.pending = null;
      return result;
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? error.status
          : undefined;
      // An earlier lost response may already have committed the operation.
      if (
        !wasUncertain &&
        [400, 401, 403, 404, 422, 429].includes(Number(status))
      )
        this.pending = null;
      throw error;
    } finally {
      this.busy = false;
    }
  }
}
