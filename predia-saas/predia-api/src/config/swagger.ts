import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Predia API')
    .setDescription('API del sistema Predia para inmobiliarias SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
}
