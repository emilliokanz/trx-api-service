import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ApiUserDetail = createParamDecorator(
  async (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        username: request.username,
        signature: request.signature,
        body: request.httpRequestBody
    };
  },
);
