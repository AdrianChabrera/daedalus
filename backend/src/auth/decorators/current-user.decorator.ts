import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SignInData } from '../interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SignInData => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { user: SignInData }).user;
  },
);
