import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Identity } from '../security/token-verifier';

export interface ApiRequest extends Request {
  identity?: Identity;
  requestId?: string;
}

export function requestIdMiddleware(
  request: ApiRequest,
  response: Response,
  next: NextFunction,
): void {
  // Generate locally instead of trusting arbitrary client-provided identifiers.
  request.requestId = randomUUID();
  response.setHeader('X-Request-Id', request.requestId);
  next();
}
