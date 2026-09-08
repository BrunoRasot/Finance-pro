import { Logger } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { ApiRequest } from './request-id.middleware';

const logger = new Logger('HTTP');

export function requestLogMiddleware(
  request: ApiRequest,
  response: Response,
  next: NextFunction,
): void {
  const started = performance.now();
  response.once('finish', () => {
    logger.log({
      event: 'request_completed',
      requestId: request.requestId,
      method: request.method,
      statusCode: response.statusCode,
      durationMs: Math.round(performance.now() - started),
    });
  });
  next();
}
