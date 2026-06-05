import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { buildSwaggerConfig } from '../config/swagger';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  const outputPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec generado en: ${outputPath}`);
  await app.close();
}

generateOpenApi();
