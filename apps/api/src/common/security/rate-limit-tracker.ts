import type { Identity } from './token-verifier';

export function rateLimitTracker(request: {
  identity?: Identity;
  ip?: string;
}): string {
  return request.identity
    ? `user:${request.identity.userId}`
    : `ip:${request.ip ?? 'unknown'}`;
}
