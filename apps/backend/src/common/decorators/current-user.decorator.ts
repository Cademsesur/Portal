import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@sesur/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId: string | null;
  lastLoginAt: Date | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
