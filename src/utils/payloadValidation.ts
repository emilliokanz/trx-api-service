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
  console.log(validationErrors, "errors")


  const errors = validationErrors.map(
    (err) => { 
      const constraints = err.constraints || {}

      return`${constraints[Object.keys(constraints)[0]]}`
    }
  );

  return { errors, dto };
}