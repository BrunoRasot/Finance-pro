import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiRequest } from './request-id.middleware';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<ApiRequest>();
    const response = context.getResponse<Response>();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status < 500) {
        const body = exception.getResponse();
        if (typeof body === 'string') message = body;
        else if ('message' in body) {
          const detail: unknown = body.message;
          if (typeof detail === 'string') message = detail;
          else if (
            Array.isArray(detail) &&
            detail.every((item) => typeof item === 'string')
          ) {
            message = detail;
          }
        }
      }
    } else if (exception instanceof Error && 'status' in exception) {
      // Body parser errors are not Nest HttpExceptions. Never return their body.
      if (exception.status === 400) {
        status = 400;
        message = 'Invalid request body';
      } else if (exception.status === 413) {
        status = 413;
        message = 'Request body too large';
      } else if (exception.status === 415) {
        status = 415;
        message = 'Unsupported media type';
      }
    }

    if (status >= 500) {
      this.logger.error({
        event: 'request_failed',
        requestId: request.requestId,
        statusCode: status,
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
