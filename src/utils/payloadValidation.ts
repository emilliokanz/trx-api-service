import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export async function validateDto<T>(
  dtoClass: new () => T,
  body: any,
  options = {
    whitelist: true,
    forbidNonWhitelisted: true,
  }
): Promise<{ errors: string[]; dto: T }> {
  const dto : any = plainToInstance(dtoClass, body);
  const validationErrors = await validate(dto, options);

  const errors = validationErrors.map(
    (err) => `${err.property} is invalid`
  );

  return { errors, dto };
}