import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { installFrenchZodErrorMap } from '@sesur/shared';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

installFrenchZodErrorMap();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  // Les signatures (PNG en data URL) dépassent la limite JSON par défaut (100 Ko).
  app.useBodyParser('json', { limit: '5mb' });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('frontendUrl'),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (config.get<string>('nodeEnv') !== 'production') {
    const swaggerCfg = new DocumentBuilder()
      .setTitle('SESUR FLOW API')
      .setDescription('API interne pour la gestion des demandes d\'achat')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  console.log(`🚀 SESUR FLOW API running on http://localhost:${port}/api/v1`);
}

bootstrap();
