import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { ApiRequest } from '../http/request-id.middleware';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const identity = context.switchToHttp().getRequest<ApiRequest>().identity;
    if (!identity) throw new UnauthorizedException();
    return identity.userId;
  },
);
